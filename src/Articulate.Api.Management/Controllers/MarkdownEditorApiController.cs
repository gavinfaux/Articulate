#nullable enable
using System.Text.Json;
using System.Text.RegularExpressions;
using Articulate.Api.Management.Attributes;
using Articulate.Api.Management.Models;
using Articulate.Extensions;
using Articulate.Services;
using Articulate.Validators;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Web.Common.Authorization;

namespace Articulate.Api.Management.Controllers
{
    // NOTE: ManagementApiControllerBase [ApiController] attribute will automatically validate the model
    // [ApiController] attribute also infers [FromBody] for model binding

    /* TODO: Review security
     * 1) Stored XSS via Markdown
       Risk: An attacker saving a post with malicious markdown (e.g., <script>alert('pwned')</script> or [click me](javascript:alert('pwned'))).
       Mitigation: Only authorized back office users may post and must log in first. Once logged in, any XSS concerns must be handled by the backend. The backend, before ever rendering this content as HTML on the public-facing blog, must process it through a robust HTML sanitization library. This library should strip all dangerous tags (<script>, <iframe>) and attributes (onclick, onerror).
       Actions: Review if an HTML sanitization library should be used, or if Umbraco provides appropriate mitigations. MarkdownHelper could be adapted to provide this, or DI services (Markdown parser, HTML sanitizer) could be added.

       2) File Upload Security
       Risk: An attacker could upload a malicious file (e.g., a file named my-image.jpg that is actually an HTML file containing scripts).
       Mitigation: As before, only authorized back office users may post and must log in first.
       Actions: Review file validation, e.g. [FileSignatures](https://github.com/neilharvey/FileSignatures/) could be used to inspect the file's actual content (magic bytes), trusting the Content-Type header sent by the browser or file extension is not sufficient.

       3) Token Storage (localStorage):
       Risk: We store the JWT in localStorage. If an XSS vulnerability were to be found on the site, an attacker could steal this token.
       Mitigation & Context: This is a well-known and widely accepted trade-off for SPAs. The primary mitigation is a strong XSS defense (implemented by CSP). The alternative, storing tokens in memory, would require a re-login on every page refresh, which is a poor user experience. Given the context, this is a reasonable and standard approach, but it highlights the absolute importance of the backend sanitization mentioned in point #1.
       */

    /// <summary>
    ///     Controller for handling the a-new markdown editor endpoint for creating blog posts.
    /// </summary>
    [ManagementApi(Constants.ManagementApi.MarkdownEditor)]
    [ApiVersion("1.0")]
    [Authorize(AuthorizationPolicies.BackOfficeAccess)]
    [MapToApi(Constants.ManagementApi.Name)]
    [ManagementApiRoute("editors/markdown")]
    public class MarkdownEditorApiController : ManagementApiControllerBase
    {
        private readonly Lazy<IMedia> _articulateRootMediaFolder;
        private readonly IContentService _contentService;
        private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;
        private readonly IContentTypeService _contentTypeService;
        private readonly IDataTypeService _dataTypeService;
        private readonly IJsonSerializer _jsonSerializer;
        private readonly ILanguageService _languageService;
        private readonly ILogger<MarkdownEditorApiController> _logger;
        private readonly MediaFileManager _mediaFileManager;
        private readonly IMediaService _mediaService;
        private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
        private readonly PropertyEditorCollection _propertyEditors;
        private readonly IShortStringHelper _shortStringHelper;
        private readonly UmbracoHelper _umbracoHelper;
        private readonly BackOfficeAuthService _backOfficeAuthService;
        private readonly IAbsoluteUrlBuilder _absoluteUrlBuilder;
        private readonly IArticulateImageService _imageService;
        private const long MaxMarkdownImageBytes = 10 * 1024 * 1024;

        public MarkdownEditorApiController(
            BackOfficeAuthService backOfficeAuthService,
            UmbracoHelper umbracoHelper,
            MediaFileManager mediaFileManager,
            PropertyEditorCollection propertyEditors,
            IJsonSerializer jsonSerializer,
            IMediaService mediaService,
            MediaUrlGeneratorCollection mediaUrlGenerators,
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
            IShortStringHelper shortStringHelper,
            ILanguageService languageService,
            IContentService contentService,
            IContentTypeService contentTypeService,
            IDataTypeService dataTypeService,
            ILogger<MarkdownEditorApiController> logger,
            IAbsoluteUrlBuilder absoluteUrlBuilder,
            IArticulateImageService imageService)
        {
            _backOfficeAuthService = backOfficeAuthService;
            _umbracoHelper = umbracoHelper;
            _mediaFileManager = mediaFileManager;
            _propertyEditors = propertyEditors;
            _jsonSerializer = jsonSerializer;
            _mediaService = mediaService;
            _mediaUrlGenerators = mediaUrlGenerators;
            _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
            _shortStringHelper = shortStringHelper;
            _languageService = languageService;
            _contentService = contentService;
            _contentTypeService = contentTypeService;
            _dataTypeService = dataTypeService;
            _logger = logger;
            _absoluteUrlBuilder = absoluteUrlBuilder;
            _imageService = imageService;
            _articulateRootMediaFolder = new Lazy<IMedia>(() =>
            {
                IMedia? root = _mediaService.GetRootMedia().FirstOrDefault(x =>
                    x.Name == "Articulate" &&
                    x.ContentType.Alias.InvariantEquals(Umbraco.Cms.Core.Constants.Conventions.MediaTypes.Folder));
                return root ?? _mediaService.CreateMediaWithIdentity(
                    "Articulate",
                    Umbraco.Cms.Core.Constants.System.Root,
                    Umbraco.Cms.Core.Constants.Conventions.MediaTypes.Folder);
            });
        }

        /// <summary>
        ///     Creates a new post under the specified Articulate node.
        /// </summary>
        /// <param name="jsonModel">
        ///     The JSON model containing the post data: Title, Body, Slug, Excerpt, Tags, Categories,
        ///     ArticulateBlogNode, and whether the first image should be extracted as a dedicated property.
        /// </param>
        /// <returns>A <see cref="CreatePostResponse" /> containing the URL of the newly created post.</returns>
        [HttpPost("post")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(CreatePostResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status422UnprocessableEntity)]
        public async Task<ActionResult<CreatePostResponse>> CreatePost(
            [FromForm(Name = "json")] string jsonModel)
        {
            if (string.IsNullOrWhiteSpace(jsonModel))
            {
                return Problem("The 'json' form part is missing or empty.", statusCode: StatusCodes.Status400BadRequest);
            }

            MarkdownEditorModel? model;
            try
            {
                var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                model = JsonSerializer.Deserialize<MarkdownEditorModel>(jsonModel, jsonOptions);
                if (model is null)
                {
                    return Problem("The provided JSON model is invalid.", statusCode: StatusCodes.Status400BadRequest);
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning("JSON deserialization failed: {Message}", ex.Message);
                return Problem(
                    $"JSON deserialization failed: {ex.Message}",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            /* Duplicates implicit validation from [ApiController] */
            /*
            if (model.ArticulateBlogNode == 0 || string.IsNullOrWhiteSpace(model.Title))
            {
                if (model.ArticulateBlogNode == 0)
                {
                 ModelState.AddModelError(nameof(model.ArticulateBlogNode), "The ArticulateBlogNode field is required.");
                }

                if (string.IsNullOrWhiteSpace(model.Title))
                {
                    ModelState.AddModelError(nameof(model.Title), "The Title field is required.");
                }

                return ValidationProblem(ModelState);
            }
            */

            IContent? articulateNode = _contentService.GetById(model.ArticulateBlogNode);
            if (articulateNode is null)
            {
                return Problem(
                    $"No Articulate node found with the specified id: {model.ArticulateBlogNode}",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var extractFirstImageAsProperty = articulateNode.HasProperty("extractFirstImage")
                                              && articulateNode.GetValue<bool>("extractFirstImage");

            IContent? archive = _contentService.GetPagedChildren(model.ArticulateBlogNode, 0, 1, out _)
                .FirstOrDefault(x =>
                    x.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateArchive));
            if (archive is null)
            {
                return Problem(
                    "No Articulate Archive node found for the specified id.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            IUser? currentUser = _backOfficeAuthService.GetCurrentUser();
            if (currentUser is null)
            {
                // This shouldn't happen due to the [Authorize] attribute, but it's a good safeguard.
                return Unauthorized();
            }

            var requiredPermissions = new[] { ActionNew.ActionLetter, ActionPublish.ActionLetter };
            if (!_backOfficeAuthService.HasPermissions(currentUser, archive, requiredPermissions))
            {
                return Forbid();
            }

            ParseImageResponse parsedImageResponse;
            try
            {
                parsedImageResponse =
                    await ParseImages(model.Body, Request.Form.Files, extractFirstImageAsProperty).ConfigureAwait(false);
            }
            catch (InvalidDataException)
            {
                return Problem(
                    title: "File Too Large",
                    detail: $"Markdown image uploads must not exceed {MaxMarkdownImageBytes / (1024d * 1024d):F1} MB.",
                    statusCode: StatusCodes.Status413PayloadTooLarge);
            }

            model.Body = parsedImageResponse.BodyText;

            IContentType? contentType = _contentTypeService.Get("ArticulateMarkdown");
            if (contentType is null)
            {
                _logger.LogError("Server configuration error: The 'ArticulateMarkdown' content type was not found.");
                return Problem(
                    "Server configuration error: The 'ArticulateMarkdown' content type was not found.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            IContent? content = _contentService.CreateWithInvariantOrDefaultCultureName(
                model.Title,
                archive,
                contentType,
                _languageService,
                currentUser.Id);

            if (content is null)
            {
                _logger.LogError("Content could not be created.");
                return Problem(
                    "Content could not be created.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            PopulateContentProperties(content, contentType, model, parsedImageResponse.FirstImage, currentUser);

            ActionResult? saveAndPublishResult = SaveAndPublishContent(content, currentUser.Id);
            if (saveAndPublishResult is not null)
            {
                return saveAndPublishResult;
            }

            IPublishedContent? published = _umbracoHelper.Content(content.Id);
            return Ok(new CreatePostResponse { Url = published?.Url() ?? string.Empty });
        }

        private async Task<ParseImageResponse> ParseImages(string? body, IFormFileCollection formFiles, bool extractFirstImageAsProperty)
        {
            if (body is null)
            {
                return new ParseImageResponse();
            }

            var firstImage = string.Empty;
            var bodyText = body;
            var replacementMap = new Dictionary<string, string>();
            var firstImageCaptured = false;

            MatchCollection matches = ArticulateMarkdownEditorRegexes.ImageTagPlaceholderRegex().Matches(body);

            foreach (Match match in matches)
            {
                ImageProcessResult result = await ProcessImageMatchAsync(
                    match,
                    formFiles,
                    extractFirstImageAsProperty && !firstImageCaptured).ConfigureAwait(false);

                if (result.IsFirstImage && !string.IsNullOrEmpty(result.FirstImageUdi))
                {
                    firstImage = result.FirstImageUdi;
                    firstImageCaptured = true;
                }

                replacementMap[match.Value] = result.ReplacementMarkdown;
            }

            // STEP 3: Apply markdown replacements
            if (replacementMap.Count > 0)
            {
                bodyText = ArticulateMarkdownEditorRegexes.ImageTagPlaceholderRegex().Replace(
                    body,
                    m => replacementMap.TryGetValue(m.Value, out var replacement) ? replacement : m.Value);
            }

            return new ParseImageResponse { BodyText = bodyText, FirstImage = firstImage };
        }

        private async Task<ImageProcessResult> ProcessImageMatchAsync(
            Match match,
            IFormFileCollection formFiles,
            bool saveAsFirstImage)
        {
            var userLabel = match.Groups[1].Value;
            var tempUrl = match.Groups[2].Value;

            IFormFile? file = formFiles.FirstOrDefault(f => f.Name == tempUrl);
            if (file is null)
            {
                _logger.LogWarning("Markdown image placeholder for {TempUrl} found, but no corresponding file was uploaded.", tempUrl);
                return ImageProcessResult.Removed();
            }

            // Validate the uploaded file
            ImageValidationResult validationResult = await ValidateAndPrepareImageAsync(file, userLabel).ConfigureAwait(false);
            if (!validationResult.IsValid)
            {
                return ImageProcessResult.Removed();
            }

            // Save to media library or file system
            if (saveAsFirstImage)
            {
                return await SaveImageToMediaLibraryAsync(
                    validationResult.Stream!,
                    validationResult.AltText!,
                    validationResult.SafeFileName!).ConfigureAwait(false);
            }

            return SaveImageToFileSystem(
                validationResult.Stream!,
                validationResult.AltText!,
                validationResult.SafeFileName!);
        }

        private async Task<ImageValidationResult> ValidateAndPrepareImageAsync(IFormFile file, string userLabel)
        {
            var originalFileName = Path.GetFileName(file.FileName);
            var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

            // Size pre-check
            if (file.Length <= 0 || file.Length > MaxMarkdownImageBytes)
            {
                _logger.LogWarning("Markdown image {FileName} rejected: invalid size {Size} (max {Max})", originalFileName, file.Length, MaxMarkdownImageBytes);
                return ImageValidationResult.Invalid();
            }

            // Copy to memory stream with size limit enforcement
            var stream = new MemoryStream(capacity: (int)Math.Min(file.Length, Math.Min(MaxMarkdownImageBytes, int.MaxValue)));
            await using Stream uploadStream = file.OpenReadStream();
            try
            {
                await uploadStream.CopyWithLimitAsync(stream, MaxMarkdownImageBytes, HttpContext.RequestAborted).ConfigureAwait(false);
            }
            catch (InvalidDataException ex)
            {
                _logger.LogWarning(ex, "Markdown image {FileName} exceeded size during copy", originalFileName);
                await stream.DisposeAsync().ConfigureAwait(false);
                return ImageValidationResult.Invalid();
            }

            stream.Position = 0;

            // Use shared service for validation (extension, size, magic bytes, content matching)
            Articulate.Services.ImageValidationResult validationResult = await _imageService.ValidateImageAsync(
                stream,
                extension,
                MaxMarkdownImageBytes).ConfigureAwait(false);

            if (!validationResult.IsValid)
            {
                _logger.LogWarning("Markdown image {FileName} rejected: {ErrorMessage}", originalFileName, validationResult.ErrorMessage);
                await stream.DisposeAsync().ConfigureAwait(false);
                return ImageValidationResult.Invalid();
            }

            // Sanitize alt text for markdown
            var safeAltFallback = string.Join('_', originalFileName.Split(Path.GetInvalidFileNameChars()));
            if (safeAltFallback.Length > 100)
            {
                safeAltFallback = safeAltFallback[..100];
            }
            var altText = AltTextSanitizer.Sanitize(userLabel, safeAltFallback);

            // Create safe filename using validated extension
            var rndId = Guid.NewGuid().ToString("N");
            var safeFileName = $"{rndId}{validationResult.CorrectExtension}".ToSafeFileName(_shortStringHelper);

            validationResult.ValidatedStream!.Position = 0;
            return ImageValidationResult.Valid(validationResult.ValidatedStream, altText, safeFileName);
        }

        private Task<ImageProcessResult> SaveImageToMediaLibraryAsync(Stream stream, string altText, string safeFileName)
        {
            IMedia mediaItem = _mediaService.CreateMedia(altText, _articulateRootMediaFolder.Value, Umbraco.Cms.Core.Constants.Conventions.MediaTypes.Image);
            mediaItem.SetValue(
                _mediaFileManager,
                _mediaUrlGenerators,
                _shortStringHelper,
                _contentTypeBaseServiceProvider,
                Umbraco.Cms.Core.Constants.Conventions.Media.File,
                safeFileName,
                stream);

            Attempt<OperationResult?> saveResult = _mediaService.Save(mediaItem);
            if (saveResult.Success == false)
            {
                _logger.LogWarning("Failed to save media item for first image: {MediaName}", mediaItem.Name);
                return Task.FromResult(ImageProcessResult.Removed());
            }

            IPublishedContent? media = _umbracoHelper.Media(mediaItem.Key);
            if (media is null)
            {
                _logger.LogWarning("Failed to retrieve published media for first image: {MediaKey}", mediaItem.Key);
                return Task.FromResult(ImageProcessResult.Removed());
            }

            var mediaUrl = media.Url();
            if (string.IsNullOrEmpty(mediaUrl))
            {
                _logger.LogWarning("Media URL is empty for first image: {MediaKey}", mediaItem.Key);
                return Task.FromResult(ImageProcessResult.Removed());
            }

            var absoluteMediaUrl = _absoluteUrlBuilder.ToAbsoluteUrl(mediaUrl).ToString();
            var udi = Udi.Create(Umbraco.Cms.Core.Constants.UdiEntityType.Media, media.Key).ToString();

            // KEEP first image in markdown with absolute URL (consistent with MetaWeblog behavior)
            return Task.FromResult(ImageProcessResult.FirstImage(udi, $"![{altText}]({absoluteMediaUrl})"));
        }

        private ImageProcessResult SaveImageToFileSystem(Stream stream, string altText, string safeFileName)
        {
            var rndId = Guid.NewGuid().ToString("N");
            var fileUrl = $"articulate/{rndId}/{safeFileName}";
            _mediaFileManager.FileSystem.AddFile(fileUrl, stream);
            var fileSystemUrl = _mediaFileManager.FileSystem.GetUrl(fileUrl);
            var absoluteUrl = _absoluteUrlBuilder.ToAbsoluteUrl(fileSystemUrl).ToString();

            return ImageProcessResult.RegularImage($"![{altText}]({absoluteUrl})");
        }

        private class ImageValidationResult
        {
            public bool IsValid { get; init; }
            public Stream? Stream { get; init; }
            public string? AltText { get; init; }
            public string? SafeFileName { get; init; }

            public static ImageValidationResult Valid(Stream stream, string altText, string safeFileName) =>
                new() { IsValid = true, Stream = stream, AltText = altText, SafeFileName = safeFileName };

            public static ImageValidationResult Invalid() =>
                new() { IsValid = false };
        }

        private class ImageProcessResult
        {
            public bool IsFirstImage { get; init; }
            public string? FirstImageUdi { get; init; }
            public string ReplacementMarkdown { get; init; } = string.Empty;

            public static ImageProcessResult FirstImage(string udi, string markdown) =>
                new() { IsFirstImage = true, FirstImageUdi = udi, ReplacementMarkdown = markdown };

            public static ImageProcessResult RegularImage(string markdown) =>
                new() { IsFirstImage = false, ReplacementMarkdown = markdown };

            public static ImageProcessResult Removed() =>
                new() { IsFirstImage = false, ReplacementMarkdown = string.Empty };
        }

        private class ParseImageResponse
        {
            public string BodyText { get; init; } = string.Empty;

            public string FirstImage { get; init; } = string.Empty;
        }

        private void PopulateContentProperties(
            IContent content,
            IContentType contentType,
            MarkdownEditorModel model,
            string? firstImageUdi,
            IUser currentUser)
        {
            content.SetInvariantOrDefaultCultureValue("markdown", model.Body, contentType, _languageService);

            if (!string.IsNullOrEmpty(firstImageUdi))
            {
                content.SetInvariantOrDefaultCultureValue("postImage", firstImageUdi, contentType, _languageService);
            }

            if (!model.Excerpt.IsNullOrWhiteSpace())
            {
                content.SetInvariantOrDefaultCultureValue("excerpt", model.Excerpt, contentType, _languageService);
            }

            if (!model.Tags.IsNullOrWhiteSpace())
            {
                IEnumerable<string> tags = model.Tags.Split([','], StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim());
                content.AssignInvariantOrDefaultCultureTags(
                    "tags",
                    tags,
                    contentType,
                    _languageService,
                    _dataTypeService,
                    _propertyEditors,
                    _jsonSerializer);
            }

            if (!model.Categories.IsNullOrWhiteSpace())
            {
                IEnumerable<string> cats = model.Categories.Split([','], StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim());
                content.AssignInvariantOrDefaultCultureTags(
                    "categories",
                    cats,
                    contentType,
                    _languageService,
                    _dataTypeService,
                    _propertyEditors,
                    _jsonSerializer);
            }

            if (!model.Slug.IsNullOrWhiteSpace())
            {
                content.SetInvariantOrDefaultCultureValue(
                    Umbraco.Cms.Core.Constants.Conventions.Content.UrlName,
                    model.Slug,
                    contentType,
                    _languageService);
            }

            content.SetInvariantOrDefaultCultureValue(
                "author",
                currentUser.Name ?? "Unknown",
                contentType,
                _languageService);
        }

        private ActionResult? SaveAndPublishContent(IContent content, int authorId)
        {
            OperationResult saveStatus = _contentService.Save(content, authorId);
            if (!saveStatus.Success)
            {
                ModelState.AddModelError("SaveOperation", "Content failed to save. Please check logs for details.");
                return ValidationProblem(ModelState);
            }

            PublishResult publishStatus = _contentService.Publish(content, ["*"], authorId);
            if (!publishStatus.Success)
            {
                ModelState.AddModelError("SaveOperation", "Content failed to publish. Please check logs for details.");
                return ValidationProblem(ModelState);
            }

            return null; // Success - no error result
        }
    }
}





