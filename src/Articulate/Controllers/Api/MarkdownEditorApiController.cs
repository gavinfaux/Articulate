using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using Articulate.Attributes;
using Articulate.Models.Api;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace Articulate.Controllers.Api
{
    // NOTE: ManagementApiControllerBase [ApiController] attribute will automatically validate the model
    // [ApiController] attribute also infers [FromBody] for model binding

    /// <summary>
    /// Controller for handling the a-new markdown editor endpoint for creating blog posts
    /// </summary>
    [ManagementApi(ArticulateEnum.ManagementApi.MarkdownEditor)]
    [ApiVersion("1.0")]
    [Authorize(AuthorizationPolicies.ContentPermissionByResource)]
    [Authorize(AuthorizationPolicies.MediaPermissionByResource)]
    [MapToApi(ArticulateConstants.ManagementApi.Name)]
    [VersionedApiBackOfficeRoute("articulate/editors/markdown")]
    // [UseArticulateCookieAuth]
    public class MarkdownEditorApiController : ManagementApiControllerBase
    {
        private readonly ServiceContext _services;
        private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;
        private readonly UmbracoHelper _umbracoHelper;
        private readonly MediaFileManager _mediaFileManager;
        private readonly PropertyEditorCollection _propertyEditors;
        private readonly IJsonSerializer _jsonSerializer;
        private readonly GlobalSettings _globalSettings;
        private readonly IHostingEnvironment _hostingEnvironment;
        private readonly IMediaService _mediaService;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly Lazy<IMedia> _articulateRootMediaFolder;
        private readonly ILogger<MarkdownEditorApiController> _logger;

        public MarkdownEditorApiController(
            ServiceContext services,
            IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
            UmbracoHelper umbracoHelper,
            MediaFileManager mediaFileManager,
            PropertyEditorCollection propertyEditors,
            IJsonSerializer jsonSerializer,
            IOptions<GlobalSettings> globalSettings,
            IHostingEnvironment hostingEnvironment, IMediaService mediaService,
            MediaUrlGeneratorCollection mediaUrlGenerators,
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider, IShortStringHelper shortStringHelper,
            ILogger<MarkdownEditorApiController> logger)
        {
            _services = services;
            _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
            _umbracoHelper = umbracoHelper;
            _mediaFileManager = mediaFileManager;
            _propertyEditors = propertyEditors;
            _jsonSerializer = jsonSerializer;
            _globalSettings = globalSettings.Value;
            _hostingEnvironment = hostingEnvironment;
            _mediaService = mediaService;
            _mediaUrlGenerators = mediaUrlGenerators;
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _shortStringHelper = shortStringHelper;
            _logger = logger;
            _articulateRootMediaFolder = new Lazy<IMedia>(() =>
            {
                var root = _mediaService.GetRootMedia().FirstOrDefault(x =>
                    x.Name == "Articulate" &&
                    x.ContentType.Alias.InvariantEquals(Constants.Conventions.MediaTypes.Folder));
                return root ?? _mediaService.CreateMediaWithIdentity("Articulate", Constants.System.Root,
                    Constants.Conventions.MediaTypes.Folder);
            });
        }

        public class ParseImageResponse
        {
            public string BodyText { get; set; }
            public string FirstImage { get; set; }
        }

        [HttpPost("post")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(CreatePostResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status422UnprocessableEntity)]
        public ActionResult<CreatePostResponse> CreatePost(
            [FromForm(Name = "json")] string jsonModel,
            IFormFileCollection files)
        {
            if (string.IsNullOrWhiteSpace(jsonModel))
            {
                return Problem("The 'json' form part is missing or empty.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            MardownEditorModel model;
            try
            {
                model = JsonSerializer.Deserialize<MardownEditorModel>(jsonModel);
                if (model is null)
                {
                    return Problem("The provided JSON model is invalid.", statusCode: StatusCodes.Status400BadRequest);
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning("JSON deserialization failed: {Message}", ex.Message);
                return Problem($"JSON deserialization failed: {ex.Message}",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            if (model.ArticulateNodeId is null)
            {
                ModelState.AddModelError(nameof(model.ArticulateNodeId), "The ArticulateNodeId field is required.");
                return ValidationProblem(ModelState);
            }

            var articulateNode = _services.ContentService.GetById(model.ArticulateNodeId.Value);
            if (articulateNode == null)
            {
                return Problem($"No Articulate node found with the specified id: {model.ArticulateNodeId.Value}",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var extractFirstImageAsProperty = articulateNode.HasProperty("extractFirstImage")
                                              && articulateNode.GetValue<bool>("extractFirstImage");

            var archive = _services.ContentService.GetPagedChildren(model.ArticulateNodeId.Value, 0, 1, out _)
                .FirstOrDefault(x =>
                    x.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateArchive));
            if (archive == null)
            {
                return Problem("No Articulate Archive node found for the specified id.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var currentUser = _backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser;
            if (currentUser == null)
            {
                // This shouldn't happen due to the [Authorize] attribute, but it's a good safeguard.
                return Unauthorized();
            }

            var requiredPermissions = new[] { ActionNew.ActionLetter, ActionPublish.ActionLetter };
            if (!CheckPermissions(currentUser, archive, requiredPermissions, _services.UserService))
            {
                return Forbid();
            }

            var parsedImageResponse = ParseImages(model.Body, files, extractFirstImageAsProperty);

            model.Body = parsedImageResponse.BodyText;

            var contentType = _services.ContentTypeService.Get("ArticulateMarkdown");
            if (contentType == null)
            {
                _logger.LogError("Server configuration error: The 'ArticulateMarkdown' content type was not found.");
                return Problem("Server configuration error: The 'ArticulateMarkdown' content type was not found.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            var content = _services.ContentService.CreateWithInvariantOrDefaultCultureName(
                model.Title,
                archive,
                contentType,
                _services.LocalizationService,
                currentUser.Id);

            if (content == null)
            {
                _logger.LogError("Content could not be created.");
                return Problem("Content could not be created.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            content.SetInvariantOrDefaultCultureValue("markdown", model.Body, contentType,
                _services.LocalizationService);

            if (!string.IsNullOrEmpty(parsedImageResponse.FirstImage))
            {
                content.SetInvariantOrDefaultCultureValue("postImage", parsedImageResponse.FirstImage, contentType,
                    _services.LocalizationService);
            }

            if (model.Excerpt.IsNullOrWhiteSpace() == false)
            {
                content.SetInvariantOrDefaultCultureValue("excerpt", model.Excerpt, contentType,
                    _services.LocalizationService);
            }

            if (model.Tags.IsNullOrWhiteSpace() == false)
            {
                var tags = model.Tags.Split([','], StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim());
                content.AssignInvariantOrDefaultCultureTags("tags", tags, contentType, _services.LocalizationService,
                    _services.DataTypeService, _propertyEditors, _jsonSerializer);
            }

            if (model.Categories.IsNullOrWhiteSpace() == false)
            {
                var cats = model.Categories.Split([','], StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim());
                content.AssignInvariantOrDefaultCultureTags("categories", cats, contentType,
                    _services.LocalizationService, _services.DataTypeService, _propertyEditors, _jsonSerializer);
            }

            if (model.Slug.IsNullOrWhiteSpace() == false)
            {
                content.SetInvariantOrDefaultCultureValue(Constants.Conventions.Content.UrlName, model.Slug,
                    contentType, _services.LocalizationService);
            }

            //author is required
            content.SetInvariantOrDefaultCultureValue("author",
                _backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser.Name ?? "Unknown", contentType,
                _services.LocalizationService);

            var status =
                _services.ContentService.Save(content, _backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser.Id);
            if (status.Success == false)
            {
                ModelState.AddModelError("SaveOperation", "Content failed to save. Please check logs for details.");
                return ValidationProblem(ModelState);
            }

            var published = _umbracoHelper.Content(content.Id);
            return Ok(new CreatePostResponse { Url = published?.Url() ?? "#" });
        }

        private ParseImageResponse ParseImages(string body, IFormFileCollection formFiles,
            bool extractFirstImageAsProperty)
        {
            // security validation list
            var reservedNames = new HashSet<string>
            {
                "con",
                "prn",
                "aux",
                "nul",
                "com1",
                "lpt1"
            };
            var firstImage = string.Empty;

            var bodyText = ArticulateMardownEditorRegexes.ImageTagPlaceholderRegex().Replace(body, m =>
            {
                // Get the full temporary URL from the match (e.g., "tmp:0:my-cat.jpg").
                var tempUrl = m.Groups[1].Value;

                // Find the uploaded file by its name, which the frontend set to our temporary URL.
                var file = formFiles.FirstOrDefault(f => f.Name == tempUrl);

                if (file == null)
                {
                    // The file referenced in the markdown was not found in the form upload.
                    _logger.LogWarning(
                        "Markdown image placeholder for {TempUrl} found, but no corresponding file was uploaded.",
                        tempUrl);
                    return m.Value; // Return the original markdown tag so it's not lost?
                }

                // To get the index for 'extractFirstImageAsProperty' logic, we parse the tempUrl.
                int? imageIndex = null;
                var parts = tempUrl.Split([':'], 3);
                if (parts.Length == 3 && int.TryParse(parts[1], out var parsedIndex))
                {
                    imageIndex = parsedIndex;
                }

                // security and filename validation, original filename uploaded by user.
                var untrustedFileName = Path.GetFullPath(file.FileName);
                if (untrustedFileName.StartsWith("..") || untrustedFileName.Contains("/.."))
                {
                    return string.Empty; // Path traversal attempt
                }

                var filename = Path.GetFileName(file.FileName);
                var fileExtension = Path.GetExtension(filename).ToLowerInvariant();

                var cleanFileName = string.Join("_", filename.Split(Path.GetInvalidFileNameChars()));
                if (cleanFileName.IsNullOrWhiteSpace() || cleanFileName.Length > 100 ||
                    reservedNames.Contains(cleanFileName.ToLowerInvariant()))
                {
                    return string.Empty;
                }

                // We use the cleaned filename going forward.
                var safeFileNameWithExt = cleanFileName;

                // Check if the 'extractFirstImage' feature should be used.
                if (extractFirstImageAsProperty && imageIndex.HasValue && imageIndex.Value == 0)
                {
                    // logic for creating a proper Umbraco Media Item for the first image.
                    using var stream = new MemoryStream();
                    file.CopyTo(stream);
                    if (stream.Length is 0 or > 10 * 1024 * 1024)
                    {
                        return string.Empty; // 10MB limit
                    }

                    var mediaItem = _mediaService.CreateMedia(safeFileNameWithExt, _articulateRootMediaFolder.Value,
                        Constants.Conventions.MediaTypes.Image);
                    mediaItem.SetValue(_mediaFileManager, _mediaUrlGenerators, _shortStringHelper,
                        _contentTypeBaseServiceProvider, Constants.Conventions.Media.File, safeFileNameWithExt, stream);
                    _ = _mediaService.Save(mediaItem);

                    var media = _umbracoHelper.Media(mediaItem.Key);
                    if (media == null)
                    {
                        return string.Empty;
                    }

                    if (string.IsNullOrEmpty(firstImage))
                    {
                        firstImage = Udi.Create(Constants.UdiEntityType.Media, media.Key).ToString();
                        // We've extracted it as a property, so remove it from the body text.
                        return string.Empty;
                    }

                    // If for some reason it's not the first, fallback to inserting it.
                    return $"![{media.Name}]({media.Url()})";
                }
                else
                {
                    // logic for saving other images to the custom 'articulate/' folder.
                    var rndId = Guid.NewGuid().ToString("N");
                    using var stream = new MemoryStream();
                    file.CopyTo(stream);

                    var fileUrl = $"articulate/{rndId}/{safeFileNameWithExt}";
                    _mediaFileManager.FileSystem.AddFile(fileUrl, stream);

                    var mediaRootPath = _hostingEnvironment.ToAbsolute(_globalSettings.UmbracoMediaPath);
                    var mediaFilePath = $"{mediaRootPath.TrimEnd('/')}/{fileUrl}";

                    return $"![{safeFileNameWithExt}]({mediaFilePath})";
                }
            });

            return new ParseImageResponse { BodyText = bodyText, FirstImage = firstImage };
        }

        private static bool CheckPermissions(IUser user, IContent contentItem, IEnumerable<string> permissionsToCheck,
            IUserService userService)
        {
            var permissions = user.GetPermissions(contentItem.Path, userService);
            return permissionsToCheck.All(p => permissions.Contains(p));
        }
    }

    internal static partial class ArticulateMardownEditorRegexes
    {
        // regex finds the image placeholder markdown tag and captures the temporary URL.
        [GeneratedRegex(@"!\[.*?\]\((tmp:[^)]+)\)", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        public static partial Regex ImageTagPlaceholderRegex();
    }
}
