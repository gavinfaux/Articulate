using Articulate.Api.Management.Controllers;
using Articulate.Api.Management.Extensions;
using Articulate.Api.Management.Options;
using Articulate.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
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
        IOptions<ArticulateOpenIdClientOptions> artClientOptions)
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

            ArticulateOpenIdClientOptions openIdClientOptions = artClientOptions.Value;
            string clientId = openIdClientOptions.ClientId ?? string.Empty;
            if (!Uri.TryCreate(editorUrl, UriKind.Absolute, out Uri? editorAbsoluteUri))
            {
                throw new InvalidOperationException($"The editor URL '{editorUrl}' is not a valid absolute URI.");
            }

            string? postLogoutRedirect = GetSafeRedirect(openIdClientOptions.PostLogoutRedirectUris, editorAbsoluteUri);
            string umbracoPath = GetUmbracoPathFromManagementApiUrl(editorAbsoluteUri);

            string defaultAuthorizeUrl = BuildAbsoluteUrl(editorAbsoluteUri, $"{umbracoPath}/management/api/v1/security/back-office/authorize");
            string defaultTokenUrl = BuildAbsoluteUrl(editorAbsoluteUri, $"{umbracoPath}/management/api/v1/security/back-office/token");
            string defaultEndSessionUrl = BuildAbsoluteUrl(editorAbsoluteUri, $"{umbracoPath}/management/api/v1/security/back-office/signout");
            string defaultRevocationUrl = BuildAbsoluteUrl(editorAbsoluteUri, $"{umbracoPath}/management/api/v1/security/back-office/revoke");
            string defaultCurrentUserUrl = BuildAbsoluteUrl(editorAbsoluteUri, $"{umbracoPath}/management/api/v1/user/current");
            string defaultLoginLogoUrl = BuildAbsoluteUrl(editorAbsoluteUri, $"{umbracoPath}/management/api/v1/security/back-office/graphics/login-logo-alternative");

            if (CurrentPage.Id <= 0)
            {
                throw new InvalidOperationException($"Invalid Articulate node id '{CurrentPage.Id}' for Markdown editor initialization.");
            }

            static string UseConfiguredOrDefault(string? value, string fallback) =>
                string.IsNullOrWhiteSpace(value) ? fallback : value;

            var vm = new MarkdownEditorInitModel
            {
                ArticulateBlogNode = CurrentPage.Id,
                EditorPostUrl = editorUrl,
                BackOfficeClientId = clientId,
                PostLogoutRedirectUrl = postLogoutRedirect,
                AuthorizeUrl = UseConfiguredOrDefault(openIdClientOptions.AuthorizeUrl, defaultAuthorizeUrl),
                CurrentUserUrl = UseConfiguredOrDefault(openIdClientOptions.CurrentUserUrl, defaultCurrentUserUrl),
                EndSessionUrl = UseConfiguredOrDefault(openIdClientOptions.EndSessionUrl, defaultEndSessionUrl),
                TokenUrl = UseConfiguredOrDefault(openIdClientOptions.TokenUrl, defaultTokenUrl),
                RevocationUrl = UseConfiguredOrDefault(openIdClientOptions.RevocationUrl, defaultRevocationUrl),
                LoginLogoUrl = UseConfiguredOrDefault(openIdClientOptions.LoginLogoUrl, defaultLoginLogoUrl),
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

            static string? GetSafeRedirect(IEnumerable<string>? candidates, Uri? allowedHost)
            {
                if (candidates is null || allowedHost is null)
                {
                    return null;
                }

                foreach (string candidate in candidates)
                {
                    if (!Uri.TryCreate(candidate, UriKind.Absolute, out Uri? candidateUri))
                    {
                        continue;
                    }

                    if (string.Equals(candidateUri.Scheme, allowedHost.Scheme, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(candidateUri.Host, allowedHost.Host, StringComparison.OrdinalIgnoreCase)
                        && candidateUri.Port == allowedHost.Port)
                    {
                        return candidateUri.ToString();
                    }
                }

                return null;
            }

            static string BuildAbsoluteUrl(Uri baseUri, string path)
            {
                if (!path.StartsWith('/'))
                {
                    path = "/" + path;
                }

                var builder = new UriBuilder(baseUri)
                {
                    Path = path,
                    Query = string.Empty,
                    Fragment = string.Empty,
                };
                return builder.Uri.ToString();
            }

            static string GetUmbracoPathFromManagementApiUrl(Uri managementApiUri)
            {
                const string defaultUmbracoPath = Constants.System.DefaultUmbracoPath;

                string path = managementApiUri.AbsolutePath;

                const string marker = "/management/api/";
                int markerIndex = path.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
                if (markerIndex <= 0)
                {
                    return defaultUmbracoPath;
                }

                string prefix = path[..markerIndex];
                if (string.IsNullOrWhiteSpace(prefix))
                {
                    return defaultUmbracoPath;
                }

                if (!prefix.StartsWith('/'))
                {
                    prefix = "/" + prefix;
                }

                prefix = prefix.TrimEnd('/');
                return string.IsNullOrWhiteSpace(prefix) ? defaultUmbracoPath : prefix;
            }
        }
    }
}
