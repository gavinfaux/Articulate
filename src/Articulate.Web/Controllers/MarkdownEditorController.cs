using Articulate.Api.Management.Controllers;
using Articulate.Api.Management.Extensions;
using Articulate.Attributes;
using Articulate.Services;
using Articulate.Web.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Web.Controllers
{
    [ArticulateDynamicRoute]
    public class MarkdownEditorController(
        ILogger<MarkdownEditorController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IApiDescriptionGroupCollectionProvider apiDescriptionProvider,
        BackOfficeAuthService backOfficeAuthService,
        IContentService contentService,
        IUserService userService,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        [HttpGet]
        public IActionResult NewPost()
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("MarkdownEditorController.NewPost: CurrentPage is null, returning 404");
                return NotFound();
            }

            // Enforce back-office authentication for the editor route itself.
            // Future: consider redirecting to the back-office authorize endpoint or using Challenge() to initiate auth.
            var isBackOfficeLoggedIn =
                backOfficeAuthService.IsBackOfficeLoggedIn(HttpContext, Constants.Security.BackOfficeAuthenticationType);
            if (!isBackOfficeLoggedIn)
            {
                // For browsers requesting HTML, return the plugin-scoped themed 401 view.
                var accept = Request.Headers.Accept.ToString();
                if (!string.IsNullOrEmpty(accept) && accept.Contains("text/html", StringComparison.OrdinalIgnoreCase))
                {
                    Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return View("401");
                }

                // Default API-friendly response
                return Unauthorized();
            }

            // Fetch the underlying IContent item for the current page and locate the archive node.
            IContent? articulateNode = contentService.GetById(CurrentPage.Id);
            if (articulateNode is null)
            {
                return NotFound();
            }

            IContent? archive = contentService
                .GetPagedChildren(CurrentPage.Id, 0, 1, out _)
                .FirstOrDefault(x => x.ContentType.Alias.Equals(ArticulateConstants.ContentType.ArticulateArchive, StringComparison.OrdinalIgnoreCase));

            if (archive is null)
            {
                return NotFound();
            }

            // Verify the current back-office user has permissions to create and publish under the archive.
            IUser? currentUser = backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser;
            if (currentUser is null)
            {
                return Unauthorized();
            }

            var requiredPermissions = new[] { ActionNew.ActionLetter, ActionPublish.ActionLetter };
            IEnumerable<string> granted = currentUser.GetPermissions(archive.Path, userService);
            if (!requiredPermissions.All(p => granted.Contains(p)))
            {
                return Forbid();
            }

            IReadOnlyDictionary<string, string>? managementApiUrls = apiDescriptionProvider.ManagementApiUrlMap([
                Api.Management.Constants.ManagementApi.MarkdownEditor
            ]);

            var key = GetKey<MarkdownEditorApiController>(nameof(MarkdownEditorApiController.CreatePost));

            string? editorUrl = null;

            if (managementApiUrls?.TryGetValue(key, out var urlFromMap) == true)
            {
                editorUrl = urlFromMap;
            }

            if (string.IsNullOrEmpty(editorUrl))
            {
                throw new InvalidOperationException(
                    $"Could not find the Management API URL for '{key}'. " +
                    "Check if the Articulate API routes are registered correctly at startup.");
            }

            var vm = new MarkdownEditorInitModel
            {
                ArticulateNodeId = CurrentPage.Id,
                EditorPostUrl = editorUrl,
                IsBackOfficeLoggedIn = backOfficeAuthService.IsBackOfficeLoggedIn(HttpContext, Constants.Security.BackOfficeAuthenticationType),
            };

            // TODO: CSP
            Response.Headers["Permissions-Policy"] = "camera=(self)";

            return View("MarkdownEditor", vm);

            static string GetKey<T>(string actionName) => $"{typeof(T).Name}.{actionName}";
        }
    }
}
