#nullable enable

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Articulate.Controllers.ManagementApi;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Web.Common;
using Umbraco.Extensions;

namespace Articulate.Services
{
    public class ParseImageResponse
    {
        public string BodyText { get; set; } = string.Empty;
        public string? FirstImage { get; set; }
    }

    public interface IMarkdownImageProcessor
    {
        public Task<ParseImageResponse> ProcessAndUploadImagesAsync(string body, IFormFileCollection formFiles,
            bool extractFirstImageAsProperty);
    }

    public class MarkdownImageProcessor : IMarkdownImageProcessor
    {
        private readonly ILogger<MarkdownImageProcessor> _logger;
        private readonly IMediaService _mediaService;
        private readonly MediaFileManager _mediaFileManager;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly UmbracoHelper _umbracoHelper;
        private readonly IHostingEnvironment _hostingEnvironment;
        private readonly GlobalSettings _globalSettings;
        private readonly Lazy<IMedia> _articulateRootMediaFolder;

        public MarkdownImageProcessor(
            ILogger<MarkdownImageProcessor> logger,
            IMediaService mediaService,
            MediaFileManager mediaFileManager,
            MediaUrlGeneratorCollection mediaUrlGenerators,
            IShortStringHelper shortStringHelper,
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
            UmbracoHelper umbracoHelper,
            IHostingEnvironment hostingEnvironment,
            IOptions<GlobalSettings> globalSettings)
        {
            _logger = logger;
            _mediaService = mediaService;
            _mediaFileManager = mediaFileManager;
            _mediaUrlGenerators = mediaUrlGenerators;
            _shortStringHelper = shortStringHelper;
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _umbracoHelper = umbracoHelper;
            _hostingEnvironment = hostingEnvironment;
            _globalSettings = globalSettings.Value;

            _articulateRootMediaFolder = new Lazy<IMedia>(() =>
            {
                var root = _mediaService.GetRootMedia().FirstOrDefault(x =>
                    x.Name == "Articulate" &&
                    x.ContentType.Alias.InvariantEquals(Constants.Conventions.MediaTypes.Folder));
                return root ?? _mediaService.CreateMediaWithIdentity("Articulate", Constants.System.Root,
                    Constants.Conventions.MediaTypes.Folder);
            });
        }

        public async Task<ParseImageResponse> ProcessAndUploadImagesAsync(string body, IFormFileCollection formFiles,
            bool extractFirstImageAsProperty)
        {
            var firstImage = string.Empty;

            var matches = ArticulateMardownEditorRegexes.ImageTagPlaceholderRegex().Matches(body);
            var replacements = new Dictionary<string, string>();

            foreach (var match in matches.Cast<System.Text.RegularExpressions.Match>())
            {
                var replacement = await ProcessMatchAsync(match, formFiles, extractFirstImageAsProperty,
                    (img) => firstImage = img);
                replacements[match.Value] = replacement;
            }

            var bodyText = replacements.Aggregate(body,
                (current, replacement) => current.Replace(replacement.Key, replacement.Value));

            return new ParseImageResponse { BodyText = bodyText, FirstImage = firstImage };
        }

        private async Task<string> ProcessMatchAsync(System.Text.RegularExpressions.Match m,
            IFormFileCollection formFiles, bool extractFirstImageAsProperty, Action<string> setFirstImage)
        {
            var reservedNames = new HashSet<string>
            {
                "con",
                "prn",
                "aux",
                "nul",
                "com1",
                "lpt1"
            };
            var tempUrl = m.Groups[1].Value;
            var file = formFiles.FirstOrDefault(f => f.Name == tempUrl);

            if (file == null)
            {
                _logger.LogWarning(
                    "Markdown image placeholder for {TempUrl} found, but no corresponding file was uploaded.", tempUrl);
                return m.Value;
            }

            int? imageIndex = null;
            var parts = tempUrl.Split(':', 3);
            if (parts.Length == 3 && int.TryParse(parts[1], out var parsedIndex))
            {
                imageIndex = parsedIndex;
            }

            var untrustedFileName = Path.GetFullPath(file.FileName);
            if (untrustedFileName.StartsWith("..") || untrustedFileName.Contains("/.."))
            {
                return string.Empty; // Path traversal attempt
            }

            var filename = Path.GetFileName(file.FileName);
            var cleanFileName = string.Join('_', filename.Split(Path.GetInvalidFileNameChars()));
            if (cleanFileName.IsNullOrWhiteSpace() || cleanFileName.Length > 100 ||
                reservedNames.Contains(cleanFileName.ToLowerInvariant()))
            {
                return string.Empty;
            }

            if (extractFirstImageAsProperty && imageIndex is 0)
            {
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                if (stream.Length is 0 or > 10 * 1024 * 1024)
                {
                    return string.Empty; // 10MB limit
                }

                var mediaItem = _mediaService.CreateMedia(cleanFileName, _articulateRootMediaFolder.Value,
                    Constants.Conventions.MediaTypes.Image);
                mediaItem.SetValue(_mediaFileManager, _mediaUrlGenerators, _shortStringHelper,
                    _contentTypeBaseServiceProvider, Constants.Conventions.Media.File, cleanFileName, stream);
                _ = _mediaService.Save(mediaItem);

                var media = _umbracoHelper.Media(mediaItem.Key);
                if (media == null)
                {
                    return string.Empty;
                }

                setFirstImage(Udi.Create(Constants.UdiEntityType.Media, media.Key).ToString());
                return string.Empty;
            }
            else
            {
                var rndId = Guid.NewGuid().ToString("N");
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);

                var fileUrl = $"articulate/{rndId}/{cleanFileName}";
                _mediaFileManager.FileSystem.AddFile(fileUrl, stream);

                var mediaRootPath = _hostingEnvironment.ToAbsolute(_globalSettings.UmbracoMediaPath);
                var mediaFilePath = $"{mediaRootPath.TrimEnd('/')}/{fileUrl}";

                return $"![{cleanFileName}]({mediaFilePath})";
            }
        }
    }
}
