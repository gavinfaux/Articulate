using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Articulate.Attributes;
using Articulate.Models.ManagementApi;
using Articulate.Services;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace Articulate.Controllers.ManagementApi
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
    [VersionedApiBackOfficeRoute("articulate/editors/markdown")]
    public class MarkdownEditorController(
        ServiceContext services,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        UmbracoHelper umbracoHelper,
        PropertyEditorCollection propertyEditors,
        IJsonSerializer jsonSerializer,
        IMarkdownImageProcessor markdownImageProcessor,
        ILogger<MarkdownEditorController> logger)
        : ManagementApiControllerBase
    {
        //        [ValidateAntiForgeryToken]
        [HttpPost("post")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(CreatePostResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status422UnprocessableEntity)]
        public async Task<ActionResult<CreatePostResponse>> CreatePost(
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
                logger.LogWarning("JSON deserialization failed: {Message}", ex.Message);
                return Problem($"JSON deserialization failed: {ex.Message}",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            if (model.ArticulateNodeId is null)
            {
                ModelState.AddModelError(nameof(model.ArticulateNodeId), "The ArticulateNodeId field is required.");
                return ValidationProblem(ModelState);
            }

            var articulateNode = services.ContentService.GetById(model.ArticulateNodeId.Value);
            if (articulateNode == null)
            {
                return Problem($"No Articulate node found with the specified id: {model.ArticulateNodeId.Value}",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var extractFirstImageAsProperty = articulateNode.HasProperty("extractFirstImage")
                                              && articulateNode.GetValue<bool>("extractFirstImage");

            var archive = services.ContentService.GetPagedChildren(model.ArticulateNodeId.Value, 0, 1, out _)
                .FirstOrDefault(x =>
                    x.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateArchive));
            if (archive == null)
            {
                return Problem("No Articulate Archive node found for the specified id.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var currentUser = backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser;
            if (currentUser == null)
            {
                // This shouldn't happen due to the [Authorize] attribute, but it's a good safeguard.
                return Unauthorized();
            }

            var requiredPermissions = new[] { ActionNew.ActionLetter, ActionPublish.ActionLetter };
            if (!CheckPermissions(currentUser, archive, requiredPermissions, services.UserService))
            {
                return Forbid();
            }

            var parsedImageResponse =
                await markdownImageProcessor.ProcessAndUploadImagesAsync(model.Body, files,
                    extractFirstImageAsProperty);

            model.Body = parsedImageResponse.BodyText;

            var contentType = services.ContentTypeService.Get("ArticulateMarkdown");
            if (contentType == null)
            {
                logger.LogError("Server configuration error: The 'ArticulateMarkdown' content type was not found.");
                return Problem("Server configuration error: The 'ArticulateMarkdown' content type was not found.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            var content = services.ContentService.CreateWithInvariantOrDefaultCultureName(
                model.Title,
                archive,
                contentType,
                services.LocalizationService,
                currentUser.Id);

            if (content == null)
            {
                logger.LogError("Content could not be created.");
                return Problem("Content could not be created.",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            content.SetInvariantOrDefaultCultureValue("markdown", model.Body, contentType,
                services.LocalizationService);

            if (!string.IsNullOrEmpty(parsedImageResponse.FirstImage))
            {
                content.SetInvariantOrDefaultCultureValue("postImage", parsedImageResponse.FirstImage, contentType,
                    services.LocalizationService);
            }

            if (model.Excerpt.IsNullOrWhiteSpace() == false)
            {
                content.SetInvariantOrDefaultCultureValue("excerpt", model.Excerpt, contentType,
                    services.LocalizationService);
            }

            if (model.Tags.IsNullOrWhiteSpace() == false)
            {
                var tags = model.Tags.Split([','], StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim());
                content.AssignInvariantOrDefaultCultureTags("tags", tags, contentType, services.LocalizationService,
                    services.DataTypeService, propertyEditors, jsonSerializer);
            }

            if (model.Categories.IsNullOrWhiteSpace() == false)
            {
                var cats = model.Categories.Split([','], StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim());
                content.AssignInvariantOrDefaultCultureTags("categories", cats, contentType,
                    services.LocalizationService, services.DataTypeService, propertyEditors, jsonSerializer);
            }

            if (model.Slug.IsNullOrWhiteSpace() == false)
            {
                content.SetInvariantOrDefaultCultureValue(Constants.Conventions.Content.UrlName, model.Slug,
                    contentType, services.LocalizationService);
            }

            //author is required
            content.SetInvariantOrDefaultCultureValue("author",
                backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser.Name ?? "Unknown", contentType,
                services.LocalizationService);

            var status =
                services.ContentService.Save(content, backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser.Id);
            if (status.Success == false)
            {
                ModelState.AddModelError("SaveOperation", "Content failed to save. Please check logs for details.");
                return ValidationProblem(ModelState);
            }

            var published = umbracoHelper.Content(content.Id);
            return Ok(new CreatePostResponse { Url = published?.Url() ?? "#" });
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
        [GeneratedRegex(@"!\[.*?\]\((tmp:[^)]+)\)")]
        public static partial Regex ImageTagPlaceholderRegex();
    }
}
