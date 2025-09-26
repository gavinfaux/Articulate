#nullable enable
using System.Text.Json;
using System.Text.RegularExpressions;
using Articulate.Api.Management.Attributes;
using Articulate.Api.Management.Models;
using Articulate.Services;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Org.BouncyCastle.Asn1.Ocsp;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Hosting;
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
       Enforce Limits: Enforce file size limits.
       Sanitize Filename: Avoid using the user-provided filename for storage on the server. Generate a new, random, and safe filename.

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
        private readonly GlobalSettings _globalSettings;
        private readonly IHostingEnvironment _hostingEnvironment;
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

        public MarkdownEditorApiController(
            BackOfficeAuthService backOfficeAuthService,
            UmbracoHelper umbracoHelper,
            MediaFileManager mediaFileManager,
            PropertyEditorCollection propertyEditors,
            IJsonSerializer jsonSerializer,
            IOptions<GlobalSettings> globalSettings,
            IHostingEnvironment hostingEnvironment,
            IMediaService mediaService,
            MediaUrlGeneratorCollection mediaUrlGenerators,
            IContentTypeBaseServiceProvider contentTypeBaseServiceProvider,
            IShortStringHelper shortStringHelper,
            ILanguageService languageService,
            IContentService contentService,
            IContentTypeService contentTypeService,
            IDataTypeService dataTypeService,
            ILogger<MarkdownEditorApiController> logger)
        {
            _backOfficeAuthService = backOfficeAuthService;
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
            _languageService = languageService;
            _contentService = contentService;
            _contentTypeService = contentTypeService;
            _dataTypeService = dataTypeService;
            _logger = logger;
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

        // TODO: Review along with ParseImages
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

            ParseImageResponse parsedImageResponse =
                await ParseImages(model.Body, Request.Form.Files, extractFirstImageAsProperty).ConfigureAwait(false);

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

            content.SetInvariantOrDefaultCultureValue("markdown", model.Body, contentType, _languageService);

            if (!string.IsNullOrEmpty(parsedImageResponse.FirstImage))
            {
                content.SetInvariantOrDefaultCultureValue("postImage", parsedImageResponse.FirstImage, contentType, _languageService);
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
                content.SetInvariantOrDefaultCultureValue(Umbraco.Cms.Core.Constants.Conventions.Content.UrlName, model.Slug, contentType, _languageService);
            }

            string authorName = currentUser.Name ?? "Unknown";
            int authorId = currentUser.Id;

            // author is required
            content.SetInvariantOrDefaultCultureValue(
                "author",
                authorName,
                contentType,
                _languageService);

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

            IPublishedContent? published = _umbracoHelper.Content(publishStatus.Content.Id);
            return Ok(new CreatePostResponse { Url = published?.Url() ?? string.Empty });
        }

        // TODO: Review
        private async Task<ParseImageResponse> ParseImages(string? body, IFormFileCollection formFiles, bool extractFirstImageAsProperty)
        {
            // TODO: Validate the ![alt] user label used for the media name/markdown replacement.
            // TODO: Generate a safe filename instead of relying on user supplied filename
            // TODO: Better file validation file sizes, mimetypes, file signatures etc, extract to use elsewhere (MetaWeblog, BlogML import), plus return validation results for UX
            // TODO: UX Validation results (invalid or missing files etc), extract to reuse elsewhere.
            if (body is null)
            {
                return new ParseImageResponse();
            }

            var reservedNames = new HashSet<string>
            {
                "con",
                "prn",
                "aux",
                "nul",
                "com1",
                "lpt1",
            };
            var firstImage = string.Empty;
            var bodyText = body; // Start with the original body text

            // Key: The original markdown tag, e.g., "![alt](tmp:0:image.png)"
            // Value: The final URL or an empty string to remove it.
            var replacementMap = new Dictionary<string, string>();
            var firstImageCaptured = false;

            // STEP 1: Find all potential image tags and gather the info needed for processing. ---
            MatchCollection matches = ArticulateMarkdownEditorRegexes.ImageTagPlaceholderRegex().Matches(body);

            foreach (Match match in matches)
            {
                var userLabel = match.Groups[1].Value;
                var tempUrl = match.Groups[2].Value;

                IFormFile? file = formFiles.FirstOrDefault(f => f.Name == tempUrl);

                // STEP 2: For each match, VALIDATE and PROCESS it asynchronously.
                if (file is null)
                {
                    _logger.LogWarning(
                        "Markdown image placeholder for {TempUrl} found, but no corresponding file was uploaded.",
                        tempUrl);

                    // The file is missing. We will replace its tag with nothing.
                    replacementMap[match.Value] = string.Empty;
                    continue; // Move to the next match
                }

                var untrustedFileName = Path.GetFullPath(file.FileName);
                if (untrustedFileName.StartsWith("..") || untrustedFileName.Contains("/.."))
                {
                    // Path traversal attempt. Strip from markdown.
                    replacementMap[match.Value] = string.Empty;
                    continue;
                }

                var filename = Path.GetFileName(file.FileName);
                var cleanFileName = string.Join('_', filename.Split(Path.GetInvalidFileNameChars()));
                if (cleanFileName.IsNullOrWhiteSpace() || cleanFileName.Length > 100 ||
                    reservedNames.Contains(cleanFileName.ToLowerInvariant()))
                {
                    // Invalid filename. Strip from markdown.
                    replacementMap[match.Value] = string.Empty;
                    continue;
                }

                // validation passed, save the file
                var altText = !string.IsNullOrWhiteSpace(userLabel) ? userLabel : cleanFileName;

                using var stream = new MemoryStream();
                await file.CopyToAsync(stream).ConfigureAwait(false);
                stream.Position = 0;

                var shouldExtractFirstImage = extractFirstImageAsProperty && !firstImageCaptured;

                if (shouldExtractFirstImage)
                {
                    IMedia mediaItem = _mediaService.CreateMedia(altText, _articulateRootMediaFolder.Value, Umbraco.Cms.Core.Constants.Conventions.MediaTypes.Image);
                    mediaItem.SetValue(
                        _mediaFileManager,
                        _mediaUrlGenerators,
                        _shortStringHelper,
                        _contentTypeBaseServiceProvider,
                        Umbraco.Cms.Core.Constants.Conventions.Media.File,
                        cleanFileName,
                        stream);
                    _mediaService.Save(mediaItem);
                    IPublishedContent? media = _umbracoHelper.Media(mediaItem.Key);

                    if (media is null)
                    {
                        continue;
                    }

                    firstImage = Udi.Create(Umbraco.Cms.Core.Constants.UdiEntityType.Media, media.Key).ToString();
                    firstImageCaptured = true;

                    // The first image was extracted. Strip its tag from the body.
                    replacementMap[match.Value] = string.Empty;
                    continue;
                }

                stream.Position = 0;
                var rndId = Guid.NewGuid().ToString("N");
                var fileUrl = $"articulate/{rndId}/{cleanFileName}";
                _mediaFileManager.FileSystem.AddFile(fileUrl, stream);
                var mediaRootPath = _hostingEnvironment.ToAbsolute(_globalSettings.UmbracoMediaPath);
                var mediaFilePath = $"{mediaRootPath.TrimEnd('/')}/{fileUrl}";

                // Replace its tag with the final URL.
                replacementMap[match.Value] = $"![{altText}]({mediaFilePath})";
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

        private class ParseImageResponse
        {
            public string BodyText { get; init; } = string.Empty;

            public string FirstImage { get; init; } = string.Empty;
        }
    }
}





