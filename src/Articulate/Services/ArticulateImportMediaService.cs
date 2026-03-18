#nullable enable
using System.Collections.Frozen;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace Articulate.Services
{
    /// <summary>
    /// Service for importing media into Articulate.
    /// </summary>
    public sealed class ArticulateImportMediaService : IArticulateImportMediaService
    {
        private static readonly FrozenSet<string> _allowedExtensions =
            FrozenSet.ToFrozenSet([".png", ".jpg", ".jpeg", ".gif"]);

        private readonly ILogger<ArticulateImportMediaService> _logger;
        private readonly IMediaService _mediaService;
        private readonly MediaFileManager _mediaFileManager;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly IAbsoluteUrlBuilder _absoluteUrlBuilder;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly Lazy<IMedia> _articulateMediaFolder;

        public ArticulateImportMediaService(
            ILogger<ArticulateImportMediaService> logger,
            IMediaService mediaService,
            MediaFileManager mediaFileManager,
            IShortStringHelper shortStringHelper,
            MediaUrlGeneratorCollection mediaUrlGenerators,
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
            IAbsoluteUrlBuilder absoluteUrlBuilder,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _mediaService = mediaService;
            _mediaFileManager = mediaFileManager;
            _shortStringHelper = shortStringHelper;
            _mediaUrlGenerators = mediaUrlGenerators;
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _absoluteUrlBuilder = absoluteUrlBuilder;
            _httpClientFactory = httpClientFactory;

            _articulateMediaFolder = new Lazy<IMedia>(() =>
            {
                IMedia? root = _mediaService.GetRootMedia().FirstOrDefault(x =>
                    x.Name == ArticulateConstants.Convention.ArticulateMediaFolder &&
                    x.ContentType.Alias.InvariantEquals(Constants.Conventions.MediaTypes.Folder));
                return root ?? _mediaService.CreateMediaWithIdentity(
                    ArticulateConstants.Convention.ArticulateMediaFolder,
                    Constants.System.Root,
                    Constants.Conventions.MediaTypes.Folder);
            });
        }

        /// <inheritdoc/>
        public IMedia GetOrCreateArticulateMediaFolder() => _articulateMediaFolder.Value;

        /// <inheritdoc/>
        public ValueTask<ImportMediaValidationResult> ValidateImageAsync(Stream stream, string originalExtension)
        {
            var extension = originalExtension.ToLowerInvariant();
            if (!extension.StartsWith('.'))
            {
                extension = $".{extension}";
            }

            if (!_allowedExtensions.Contains(extension))
            {
                return ValueTask.FromResult(ImportMediaValidationResult.Failure(
                    $"Extension '{extension}' not allowed. Supported: {string.Join(", ", _allowedExtensions)}"));
            }

            var mimeType = extension.GetImageMimeType();
            stream.Position = 0;
            return ValueTask.FromResult(ImportMediaValidationResult.Success(stream, extension, mimeType));
        }

        /// <inheritdoc/>
        public async Task<ImportMediaValidationResult> DecodeAndValidateBase64ImageAsync(
            string base64Content,
            string originalFileName)
        {
            if (string.IsNullOrWhiteSpace(base64Content))
            {
                return ImportMediaValidationResult.Failure("Base64 content is empty");
            }

            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(base64Content);
            }
            catch (FormatException)
            {
                return ImportMediaValidationResult.Failure("Invalid base64 content");
            }

            var stream = new MemoryStream(bytes);
            string extension = Path.GetExtension(originalFileName).ToLowerInvariant();

            return await ValidateImageAsync(stream, extension);
        }

        // TODO: SECURITY - Harden external image downloads used by BlogML import.
        // Current behavior accepts arbitrary HTTP(S) URLs and buffers the full response in memory.
        // Future PR: reject private/link-local/loopback targets before connect and after redirects.
        // - 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (RFC 1918)
        // - 169.254.0.0/16 (link-local, including cloud metadata at 169.254.169.254)
        // - 127.0.0.0/8 (localhost), ::1, fc00::/7 (IPv6 equivalents)
        // Also add a max download size and either disable automatic redirects or re-validate each hop.
        /// <inheritdoc/>
        public async Task<ImportMediaValidationResult> DownloadAndValidateImageAsync(
            Uri imageUrl,
            CancellationToken cancellationToken = default)
        {
            if (!IsValidImageUrl(imageUrl))
            {
                return ImportMediaValidationResult.Failure("Invalid or non-HTTP image URL");
            }

            try
            {
                using HttpClient client = _httpClientFactory.CreateClient();
                using HttpResponseMessage response = await client.GetAsync(
                    imageUrl,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    return ImportMediaValidationResult.Failure($"HTTP error: {response.StatusCode}");
                }

                var memoryStream = new MemoryStream();
                await using Stream httpStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                await httpStream.CopyToAsync(memoryStream, cancellationToken);

                memoryStream.Position = 0;
                string extension = Path.GetExtension(imageUrl.AbsolutePath).ToLowerInvariant();
                ImportMediaValidationResult result = await ValidateImageAsync(memoryStream, extension);

                if (!result.IsValid)
                {
                    await memoryStream.DisposeAsync();
                    return result;
                }

                memoryStream.Position = 0;
                return ImportMediaValidationResult.Success(memoryStream, result.CorrectExtension!, result.MimeType!);
            }
            catch (HttpRequestException ex)
            {
                return ImportMediaValidationResult.Failure($"Failed to download image: {ex.Message}");
            }
            catch (TaskCanceledException)
            {
                return ImportMediaValidationResult.Failure("Image download timed out");
            }
        }

        private static bool IsValidImageUrl(Uri imageUrl) =>
            imageUrl.IsAbsoluteUri &&
            (imageUrl.Scheme == Uri.UriSchemeHttp || imageUrl.Scheme == Uri.UriSchemeHttps);

        /// <inheritdoc/>
        public ImportMediaSaveResult SaveToMediaLibrary(
            Stream imageStream,
            string mediaName,
            string extension,
            IMedia? parentFolder = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(mediaName))
                {
                    throw new ArgumentException(@"Media name cannot be empty", nameof(mediaName));
                }

                // Strip extension to avoid doubling up (e.g., image.png -> image-png.png)
                var cleanMediaName = Path.GetFileNameWithoutExtension(mediaName);
                if (string.IsNullOrWhiteSpace(cleanMediaName))
                {
                    cleanMediaName = "image";
                }

                var safeFileName = $"{cleanMediaName.ToSafeFileName(_shortStringHelper)}{extension}";

                // Display name for backoffice - ToFriendlyName strips extensions and applies Title Case
                var displayName = safeFileName.ToFriendlyName();
                if (string.IsNullOrWhiteSpace(displayName))
                {
                    displayName = "Image";
                }

                if (displayName.Length > 100)
                {
                    displayName = displayName[..100];
                }

                var parentId = parentFolder?.Id ?? Constants.System.Root;

                IMedia media = _mediaService.CreateMedia(displayName, parentId, Constants.Conventions.MediaTypes.Image);
                media.SetValue(
                    _mediaFileManager,
                    _mediaUrlGenerators,
                    _shortStringHelper,
                    _contentTypeBaseServiceProvider,
                    Constants.Conventions.Media.File,
                    safeFileName,
                    imageStream);

                Attempt<OperationResult?> saveResult = _mediaService.Save(media);
                if (!saveResult.Success)
                {
                    return ImportMediaSaveResult.Failed($"Failed to save media item: {displayName}");
                }

                var udi = Udi.Create(Constants.UdiEntityType.Media, media.Key).ToString();
                return ImportMediaSaveResult.Succeeded(media, udi);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving image to media library");
                return ImportMediaSaveResult.Failed($"Unexpected error: {ex.Message}");
            }
        }

        /// <inheritdoc/>
        public string SaveToFileSystem(Stream imageStream, string extension, string? originalFileName = null)
        {
            try
            {
                // 8-char GUID folder for file isolation
                var uniqueFolder = Guid.NewGuid().ToString("N")[..8];
                string safeFileName;

                if (!string.IsNullOrWhiteSpace(originalFileName))
                {
                    var fileNameWithoutExt = Path.GetFileNameWithoutExtension(originalFileName);
                    var sanitized = fileNameWithoutExt.ToSafeFileName(_shortStringHelper);
                    safeFileName = $"{sanitized}{extension}";
                }
                else
                {
                    safeFileName = $"{Guid.NewGuid():N}{extension}".ToSafeFileName(_shortStringHelper);
                }

                var fileUrl = $"articulate/{uniqueFolder}/{safeFileName}";

                imageStream.Position = 0;
                _mediaFileManager.FileSystem.AddFile(fileUrl, imageStream);

                var fileSystemUrl = _mediaFileManager.FileSystem.GetUrl(fileUrl);
                return _absoluteUrlBuilder.ToAbsoluteUrl(fileSystemUrl).ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving image to file system");
                return string.Empty;
            }
        }
    }
}
