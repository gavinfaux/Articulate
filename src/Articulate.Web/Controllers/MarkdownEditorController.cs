using Articulate.Api.Management.Controllers;
using Articulate.Api.Management.Extensions;
using Articulate.Api.Management.Options;
using Articulate.Attributes;
using Articulate.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
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
        IContentService contentService,
        IOptions<ArticulateOpenIdClientOptions> artClientOptions,
        BackOfficeAuthService backOfficeAuthService)
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

            IContent? articulateNode = contentService.GetById(CurrentPage.Id);
            if (articulateNode is null)
            {
                return NotFound();
            }

            IContent? archive = contentService
                .GetPagedChildren(CurrentPage.Id, 0, 128, out _)
                .FirstOrDefault(x => x.ContentType.Alias.Equals(ArticulateConstants.ContentType.ArticulateArchive, StringComparison.OrdinalIgnoreCase));

            if (archive is null)
            {
                return NotFound();
            }

            IUser? currentUser = backOfficeAuthService.GetCurrentUser();
            bool isBackOfficeLoggedIn = currentUser is not null;
            bool hasRequiredPermissions = false;

            if (currentUser is not null)
            {
                string[] requiredPermissions = [ActionNew.ActionLetter, ActionPublish.ActionLetter];
                hasRequiredPermissions = backOfficeAuthService.HasPermissions(currentUser, archive, requiredPermissions);

                if (!hasRequiredPermissions)
                {
                    return Forbid();
                }
            }

            IReadOnlyDictionary<string, string>? managementApiUrls = apiDescriptionProvider.ManagementApiUrlMap([
                Api.Management.Constants.ManagementApi.MarkdownEditor
            ]);

            string key = GetKey<MarkdownEditorApiController>(nameof(MarkdownEditorApiController.CreatePost));
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

            ArticulateOpenIdClientOptions openIdClientOptions = artClientOptions.Value;
            string clientId = openIdClientOptions.ClientId ?? string.Empty;
            if (string.IsNullOrWhiteSpace(clientId))
            {
                logger.LogWarning("MarkdownEditor requires an OAuth client id; ensure Articulate:ManagementApi:OpenIddict:Client is configured.");
                clientId = string.Empty;
            }

            string? postLogoutRedirect = openIdClientOptions.PostLogoutRedirectUris
                .FirstOrDefault(uri => Uri.TryCreate(uri, UriKind.Absolute, out _));
            if (postLogoutRedirect is null && openIdClientOptions.PostLogoutRedirectUris.Count > 0)
            {
                logger.LogWarning("Configured post-logout redirect URIs for Articulate are not absolute. The Markdown editor will fall back to the site origin after sign-out.");
            }

            var vm = new MarkdownEditorInitModel
            {
                ArticulateBlogNode = CurrentPage.Id,
                EditorPostUrl = editorUrl,
                BackOfficeClientId = clientId,
                IsBackOfficeLoggedIn = isBackOfficeLoggedIn,
                BackOfficeUserName = currentUser?.Name,
                BackOfficeUserId = currentUser?.Id,
                HasRequiredPermissions = hasRequiredPermissions,
                PostLogoutRedirectUrl = postLogoutRedirect,
            };

            return RenderView(vm);

            IActionResult RenderView(MarkdownEditorInitModel model)
            {
                // We restrict camera access to the same origin (self) for security.
                // If the editor is hosted on a CDN or different origin, this policy may need to be adjusted (e.g. 'camera=*' or specific origins).
                Response.Headers["Permissions-Policy"] = "camera=(self)";
                return View("MarkdownEditor", model);
            }

            static string GetKey<T>(string actionName) => $"{typeof(T).Name}.{actionName}";
        }
    }
}
