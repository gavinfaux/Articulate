using Articulate.Api.Management.Controllers;
using Articulate.Api.Management.Extensions;
using Articulate.Api.Management.Options;
using Articulate.Attributes;
using Articulate.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;
using ManagementConstants = Articulate.Api.Management.Constants;

namespace Articulate.Web.Controllers
{
    [ArticulateDynamicRoute]
    public class MarkdownEditorController(
        ILogger<MarkdownEditorController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IApiDescriptionGroupCollectionProvider apiDescriptionProvider,
        IConfiguration configuration,
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

            bool isBackOfficeLoggedIn = backOfficeAuthService.GetCurrentUser() is not null;

            IReadOnlyDictionary<string, string>? managementApiUrls = apiDescriptionProvider.ManagementApiUrlMap([
                ManagementConstants.ManagementApi.MarkdownEditor
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

            // External OAuth clients use the same authentication flow for all Umbraco versions
            // (Authorization Code + PKCE ? Bearer tokens, not cookies)
            ArticulateOpenIdClientOptions openIdClientOptions = artClientOptions.Value;
            string clientId = openIdClientOptions.ClientId ?? string.Empty;
            string? postLogoutRedirect = openIdClientOptions.PostLogoutRedirectUris
                .FirstOrDefault(uri => Uri.TryCreate(uri, UriKind.Absolute, out _));

            var vm = new MarkdownEditorInitModel
            {
                ArticulateBlogNode = CurrentPage.Id,
                EditorPostUrl = editorUrl,
                BackOfficeClientId = clientId,
                IsBackOfficeLoggedIn = isBackOfficeLoggedIn,
                PostLogoutRedirectUrl = postLogoutRedirect,
            };

            Response.Headers["Permissions-Policy"] = "camera=(self)";
            Response.Headers["Content-Security-Policy"] = string.Join(";", new[]
            {
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self'",
                "img-src 'self' data: blob:",
                "font-src 'self'",
                "connect-src 'self'",
                "frame-ancestors 'self'",
                "base-uri 'self'",
                "object-src 'none'"
            });

            return View("MarkdownEditor", vm);

            static string GetKey<T>(string actionName) => $"{typeof(T).Name}.{actionName}";
        }
    }
}
