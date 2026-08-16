#nullable enable
using System.Text.Json;
using System.Text.RegularExpressions;
using Articulate.Attributes;
using Articulate.Models.Api;
using Articulate.Services;
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
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Web.Common.Authorization;

namespace Articulate.Controllers.Api
{
    /// <summary>
    ///     Controller for handling the a-new markdown editor endpoint for creating blog posts.
    /// </summary>
    [ManagementApi(ArticulateConstants.ManagementApi.MarkdownEditor)]
    [ApiVersion("1.0")]
    [Authorize(AuthorizationPolicies.BackOfficeAccess)]
    [MapToApi(ArticulateConstants.ManagementApi.Name)]
    [ManagementApiRoute("editors/markdown")]
    public class MarkdownEditorApiController(
        BackOfficeAuthService backOfficeAuthService,
        UmbracoHelper umbracoHelper,
        PropertyEditorCollection propertyEditors,
        IJsonSerializer jsonSerializer,
        ILanguageService languageService,
        IContentService contentService,
        IContentTypeService contentTypeService,
        IDataTypeService dataTypeService,
        ILogger<MarkdownEditorApiController> logger,
        IAbsoluteUrlBuilder absoluteUrlBuilder,
        IArticulateImportMediaService service,
        IMediaService mediaService,
        ArticulateContentAuthorizationService authorizationService
#if UMBRACO_18_OR_GREATER
        , IIdKeyMap idKeyMap
#endif
    )
        : ManagementApiControllerBase
    {
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
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status422UnprocessableEntity)]
        public async Task<ActionResult<CreatePostResponse>> CreatePost(
            [FromForm(Name = "json")] string jsonModel)
        {
            if (ValidateAndDeserializeModel(jsonModel, out MarkdownEditorModel? model) is { } validationError)
            {
                return validationError;
            }

            if (GetArticulateRoot(model!, out IContent? articulateNode) is { } nodeError)
            {
                return nodeError;
            }

            IUser? currentUser = backOfficeAuthService.GetCurrentUser();
            (ActionResult? permissionError, IContent? archive) = await CheckPermissionsAsync(articulateNode!, currentUser);
            if (permissionError is not null)
            {
                return permissionError;
            }

            bool extractFirstImageAsProperty = articulateNode!.HasProperty("extractFirstImage")
                                               && articulateNode.GetValue<bool>("extractFirstImage");

            ParseImageResponse parsedImageResponse;
            try
            {
                parsedImageResponse = await ParseImages(
                    model!.Body,
                    Request.Form.Files,
                    extractFirstImageAsProperty,
                    currentUser!);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }

            model.Body = parsedImageResponse.BodyText;

            return await CreateAndSaveContentAsync(model, archive!, parsedImageResponse, currentUser!);
        }

        private ActionResult? ValidateAndDeserializeModel(string jsonModel, out MarkdownEditorModel? model)
        {
            model = null;
            if (string.IsNullOrWhiteSpace(jsonModel))
            {
                return Problem(
                    "The 'json' form part is missing or empty.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            try
            {
                var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                model = JsonSerializer.Deserialize<MarkdownEditorModel>(jsonModel, jsonOptions);
                if (model is null)
                {
                    return Problem("The provided JSON model is invalid.", statusCode: StatusCodes.Status400BadRequest);
                }

                return null;
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "JSON deserialization failed for markdown editor create post request.");
                return Problem(
                    "The provided JSON model could not be parsed.",
                    statusCode: StatusCodes.Status400BadRequest);
            }
        }

        private ActionResult? GetArticulateRoot(
            MarkdownEditorModel model,
            out IContent? articulateNode)
        {
            articulateNode = contentService.GetById(model.ArticulateBlogNode);

            if (articulateNode is null)
            {
                return Problem(
                    $"No Articulate node found with the specified id: {model.ArticulateBlogNode}",
                    statusCode: StatusCodes.Status404NotFound);
            }

            if (!authorizationService.IsArticulateRoot(articulateNode))
            {
                return Problem(
                    $"The specified id is not an Articulate root: {model.ArticulateBlogNode}",
                    statusCode: StatusCodes.Status404NotFound);
            }

            return null;
        }

        private IEnumerable<IContent> EnumerateRootChildren(int rootId)
        {
            var pageIndex = 0;
            const int pageSize = 500;
            while (true)
            {
                IContent[] page = contentService.EnumeratePagedChildren(
                    rootId,
                    pageIndex++,
                    pageSize,
                    out _).ToArray();
                foreach (IContent child in page)
                {
                    yield return child;
                }

                if (page.Length < pageSize)
                {
                    yield break;
                }
            }
        }

        private async Task<(ActionResult? Error, IContent? Archive)> CheckPermissionsAsync(
            IContent root,
            IUser? currentUser)
        {
            if (currentUser is null)
            {
                return (Unauthorized(), null);
            }

            try
            {
                await authorizationService.EnsureContentAccessAsync(
                    currentUser,
                    [root],
                    [ActionBrowse.ActionLetter]);
            }
            catch (UnauthorizedAccessException)
            {
                return (Forbid(), null);
            }

            IContent[] archives = authorizationService.FindArchives(EnumerateRootChildren(root.Id)).ToArray();
            if (archives.Length == 0)
            {
                return (Problem(
                    "No Articulate Archive node found for the specified id.",
                    statusCode: StatusCodes.Status404NotFound), null);
            }

            foreach (IContent archive in archives)
            {
                try
                {
                    await authorizationService.EnsureContentAccessAsync(
                        currentUser,
                        [archive],
                        [ActionNew.ActionLetter, ActionPublish.ActionLetter]);
                    return (null, archive);
                }
                catch (UnauthorizedAccessException)
                {
                    // Scoped authors may only write to one archive.
                }
            }

            return (Forbid(), null);
        }

        private async Task<ActionResult<CreatePostResponse>> CreateAndSaveContentAsync(
            MarkdownEditorModel model,
            IContent archive,
            ParseImageResponse parsedImageResponse,
            IUser currentUser)
        {
            IContentType? contentType = contentTypeService.Get("ArticulateMarkdown");
            if (contentType is null)
            {
                logger.LogError("Server configuration error: The 'ArticulateMarkdown' content type was not found.");
                return Problem(
                    "Server configuration error: The 'ArticulateMarkdown' content type was not found.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            IContent content = await contentService.CreateWithInvariantOrDefaultCultureNameAsync(
                model.Title,
                archive,
                contentType,
                languageService,
                logger,
                currentUser.Id);

            await PopulateContentPropertiesAsync(
                content,
                contentType,
                model,
                parsedImageResponse.FirstImage,
                currentUser);

            ActionResult? saveAndPublishResult = SaveAndPublishContent(content, currentUser.Id);
            if (saveAndPublishResult is not null)
            {
                return saveAndPublishResult;
            }

            IPublishedContent? published = umbracoHelper.Content(content.Id);
            return Ok(new CreatePostResponse { Url = published?.Url() ?? string.Empty });
        }

        private async Task<ParseImageResponse> ParseImages(
            string? body,
            IFormFileCollection formFiles,
            bool extractFirstImageAsProperty,
            IUser currentUser)
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
                    extractFirstImageAsProperty && !firstImageCaptured,
                    currentUser);

                if (result.IsFirstImage && !string.IsNullOrEmpty(result.FirstImageUdi))
                {
                    firstImage = result.FirstImageUdi;
                    firstImageCaptured = true;
                }

                replacementMap[match.Value] =
                    result.IsFirstImage && !string.IsNullOrEmpty(result.FirstImageUdi)
                        ? string.Empty
                        : result.ReplacementMarkdown;
            }

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
            bool saveAsFirstImage,
            IUser currentUser)
        {
            var userLabel = match.Groups[1].Value;
            var tempUrl = match.Groups[2].Value;

            IFormFile? file = formFiles.FirstOrDefault(f => f.Name == tempUrl);
            if (file is null)
            {
                logger.LogWarning(
                    "Markdown image placeholder for {TempUrl} found, but no corresponding file was uploaded.", tempUrl);
                return ImageProcessResult.Removed();
            }

            var originalFileName = Path.GetFileName(file.FileName);
            var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

            await using Stream uploadStream = file.OpenReadStream();
            ImportMediaValidationResult validationResult = await service.ValidateImageAsync(
                uploadStream,
                extension);

            if (!validationResult.IsValid)
            {
                logger.LogWarning(
                    "Markdown image {FileName} rejected: {ErrorMessage}",
                    originalFileName,
                    validationResult.ErrorMessage);
                return ImageProcessResult.Removed();
            }

            // Maintain user-provided label for alt text, falling back to original filename
            var altText = string.IsNullOrWhiteSpace(userLabel) ? originalFileName : userLabel.Trim();

            if (saveAsFirstImage)
            {
                return await SaveImageToMediaLibraryAsync(
                    validationResult.ValidatedStream!,
                    altText,
                    validationResult.CorrectExtension!,
                    currentUser);
            }

            var absoluteUrl = service.SaveToFileSystem(
                validationResult.ValidatedStream!,
                validationResult.CorrectExtension!);

            if (string.IsNullOrEmpty(absoluteUrl))
            {
                logger.LogWarning(
                    "Failed to save markdown image {FileName} to filesystem - returned empty URL",
                    Path.GetFileName(file.FileName));
                return ImageProcessResult.Removed();
            }

            return ImageProcessResult.RegularImage($"![{altText}]({absoluteUrl})");
        }

        private async Task<ImageProcessResult> SaveImageToMediaLibraryAsync(
            Stream stream,
            string altText,
            string extension,
            IUser currentUser)
        {
            IMedia mediaFolder = ArticulateMediaFolderResolver.Resolve(
                currentUser,
                mediaService,
                service.GetOrCreateArticulateMediaFolder)
                ?? throw new UnauthorizedAccessException("The requested media operation is not available");

            await authorizationService.EnsureMediaWriteAccessAsync(currentUser, mediaFolder.Key);
            ImportMediaSaveResult saveResult = service.SaveToMediaLibrary(
                stream,
                altText,
                extension,
                mediaFolder);

            if (!saveResult.Success || saveResult.Media is null)
            {
                logger.LogWarning(
                    "Failed to save media item for first image: {ErrorMessage}",
                    saveResult.ErrorMessage);
                return ImageProcessResult.Removed();
            }

            IPublishedContent? media = umbracoHelper.Media(saveResult.Media.Key);
            if (media is null)
            {
                logger.LogWarning(
                    "Failed to retrieve published media for first image: {MediaKey}",
                    saveResult.Media.Key);
                return ImageProcessResult.Removed();
            }

            var mediaUrl = media.Url();
            if (string.IsNullOrEmpty(mediaUrl))
            {
                logger.LogWarning("Media URL is empty for first image: {MediaKey}", saveResult.Media.Key);
                return ImageProcessResult.Removed();
            }

            var absoluteMediaUrl = absoluteUrlBuilder.ToAbsoluteUrl(mediaUrl).ToString();

            return ImageProcessResult.FirstImage(saveResult.MediaUdi!, $"![{altText}]({absoluteMediaUrl})");
        }

        private class ImageProcessResult
        {
            public bool IsFirstImage { get; private init; }
            public string? FirstImageUdi { get; private init; }
            public string ReplacementMarkdown { get; private init; } = string.Empty;

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

        private async Task PopulateContentPropertiesAsync(
            IContent content,
            IContentType contentType,
            MarkdownEditorModel model,
            string? firstImageUdi,
            IUser currentUser)
        {
            await content.SetInvariantOrDefaultCultureValueAsync(
                "markdown",
                model.Body,
                contentType,
                languageService,
                logger);

            if (!string.IsNullOrEmpty(firstImageUdi))
            {
                await content
                    .SetInvariantOrDefaultCultureValueAsync(
                        "postImage",
                        firstImageUdi,
                        contentType,
                        languageService,
                        logger);
            }

            if (!model.Excerpt.IsNullOrWhiteSpace())
            {
                await content
                    .SetInvariantOrDefaultCultureValueAsync(
                        "excerpt",
                        model.Excerpt,
                        contentType,
                        languageService,
                        logger);
            }

            if (!model.Tags.IsNullOrWhiteSpace())
            {
                IEnumerable<string> tags = model.Tags.Split([','], StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim());
                await content.AssignInvariantOrDefaultCultureTagsAsync(
                    "tags",
                    tags,
                    contentType,
                    languageService,
                    dataTypeService,
                    propertyEditors,
                    jsonSerializer,
#if UMBRACO_18_OR_GREATER
                    idKeyMap,
#endif
                    logger);
            }

            if (!model.Categories.IsNullOrWhiteSpace())
            {
                IEnumerable<string> cats = model.Categories.Split([','], StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim());
                await content.AssignInvariantOrDefaultCultureTagsAsync(
                    "categories",
                    cats,
                    contentType,
                    languageService,
                    dataTypeService,
                    propertyEditors,
                    jsonSerializer,
#if UMBRACO_18_OR_GREATER
                    idKeyMap,
#endif
                    logger);
            }

            if (!model.Slug.IsNullOrWhiteSpace())
            {
                await content.SetInvariantOrDefaultCultureValueAsync(
                    Constants.Conventions.Content.UrlName,
                    model.Slug,
                    contentType,
                    languageService,
                    logger);
            }

            await content.SetInvariantOrDefaultCultureValueAsync(
                "enableComments",
                true,
                contentType,
                languageService,
                logger);

            await content.SetInvariantOrDefaultCultureValueAsync(
                "author",
                currentUser.Name ?? "Unknown",
                contentType,
                languageService,
                logger);
        }

        private ActionResult? SaveAndPublishContent(IContent content, int authorId)
        {
            OperationResult saveStatus = contentService.Save(content, authorId);
            if (!saveStatus.Success)
            {
                ModelState.AddModelError("SaveOperation", "Content failed to save. Please check logs for details.");
                return ValidationProblem(ModelState);
            }

            PublishResult publishStatus = contentService.Publish(content, ["*"], authorId);
            if (!publishStatus.Success)
            {
                ModelState.AddModelError("SaveOperation", "Content failed to publish. Please check logs for details.");
                return ValidationProblem(ModelState);
            }

            return null;
        }
    }
}
