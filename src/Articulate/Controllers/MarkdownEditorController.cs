#nullable enable
using Articulate.Attributes;
using Articulate.Controllers.Api;
using Articulate.Options;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    /// <summary>
    /// Controller for the Articulate Markdown editor.
    /// </summary>
    [ArticulateDynamicRoute]
    public class MarkdownEditorController(
        ILogger<MarkdownEditorController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IApiDescriptionGroupCollectionProvider apiDescriptionProvider,
        IOptions<ArticulateOpenIdClientOptions> artClientOptions,
        IOptions<WebRoutingSettings> webRoutingSettings)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        /// <summary>
        /// Renders the view for creating a new post using the Markdown editor.
        /// </summary>
        /// <returns>The action result yielding the editor view.</returns>
        [HttpGet]
        public IActionResult NewPost()
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("MarkdownEditorController.NewPost: CurrentPage is null, returning 404");
                return NotFound();
            }

            IReadOnlyDictionary<string, string>? managementApiUrls = apiDescriptionProvider.ManagementApiUrlMap([
                ArticulateConstants.ManagementApi.MarkdownEditor
            ]);

            string key = GetKey<MarkdownEditorApiController>(nameof(MarkdownEditorApiController.CreatePost));
            string? editorUrl = null;

            if (managementApiUrls?.TryGetValue(key, out var urlFromMap) == true)
            {
                editorUrl = urlFromMap;
            }

            if (string.IsNullOrWhiteSpace(editorUrl))
            {
                throw new InvalidOperationException(
                    $"Could not find the Management API URL for '{key}'. " +
                    "Check if the Articulate API routes are registered correctly at startup.");
            }

            Uri baseUri = GetAndValidateBaseUrl();
            editorUrl = new Uri(baseUri, editorUrl).ToString();

            if (!Uri.TryCreate(editorUrl, UriKind.Absolute, out Uri? editorAbsoluteUri))
            {
                throw new InvalidOperationException($"The editor URL '{editorUrl}' is not a valid absolute URI.");
            }

            if (CurrentPage.Id <= 0)
            {
                throw new InvalidOperationException(
                    $"Invalid Articulate node id '{CurrentPage.Id}' for Markdown editor initialization.");
            }

            ArticulateOpenIdClientOptions openIdClientOptions = artClientOptions.Value;
            OAuthUrls oauthUrls = BuildOAuthUrls(editorAbsoluteUri, openIdClientOptions);

            var vm = new MarkdownEditorInitModel
            {
                ArticulateBlogNode = CurrentPage.Id,
                EditorPostUrl = editorUrl,
                BackOfficeClientId = openIdClientOptions.ClientId ?? string.Empty,
                PostLogoutRedirectUrl = oauthUrls.PostLogoutRedirect,
                AuthorizeUrl = oauthUrls.AuthorizeUrl,
                CurrentUserUrl = oauthUrls.CurrentUserUrl,
                EndSessionUrl = oauthUrls.EndSessionUrl,
                TokenUrl = oauthUrls.TokenUrl,
                RevocationUrl = oauthUrls.RevocationUrl,
                LoginLogoUrl = oauthUrls.LoginLogoUrl,
            };

            SetSecurityHeaders();
            return View("MarkdownEditor", vm);

            static string GetKey<T>(string actionName) => $"{typeof(T).Name}.{actionName}";
        }

        private Uri GetAndValidateBaseUrl()
        {
            bool isConfiguredUrl = !string.IsNullOrWhiteSpace(webRoutingSettings.Value.UmbracoApplicationUrl);
            string baseUrl = isConfiguredUrl
                ? webRoutingSettings.Value.UmbracoApplicationUrl
                : UriHelper.BuildAbsolute(Request.Scheme, Request.Host, Request.PathBase);

            if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out Uri? baseUri))
            {
                logger.LogError(
                    "Invalid base URL configuration. Source: {Source}, Value: {BaseUrl}",
                    isConfiguredUrl ? "UmbracoApplicationUrl" : "Request-derived",
                    baseUrl);
                throw new InvalidOperationException(
                    $"The Umbraco application base URL '{baseUrl}' is not a valid absolute URI. " +
                    "Configure 'Umbraco:CMS:WebRouting:UmbracoApplicationUrl' in appsettings.json.");
            }

            if (baseUri.Scheme != Uri.UriSchemeHttp && baseUri.Scheme != Uri.UriSchemeHttps)
            {
                logger.LogError(
                    "Invalid base URL scheme. Expected http/https, got {Scheme} for URL: {BaseUrl}",
                    baseUri.Scheme,
                    baseUrl);
                throw new InvalidOperationException(
                    $"The base URL must use http or https scheme, got '{baseUri.Scheme}': {baseUrl}");
            }

            if (!isConfiguredUrl)
            {
                logger.LogWarning(
                    "UmbracoApplicationUrl not configured, using Request-derived base URL. " +
                    "Host: {Host}, Scheme: {Scheme}. Configure 'Umbraco:CMS:WebRouting:UmbracoApplicationUrl' " +
                    "in appsettings.json to avoid relying on request headers.",
                    Request.Host,
                    Request.Scheme);
            }

            return baseUri;
        }

        private OAuthUrls BuildOAuthUrls(Uri editorAbsoluteUri, ArticulateOpenIdClientOptions options)
        {
            string? postLogoutRedirect = GetSafeRedirect(options.PostLogoutRedirectUris, editorAbsoluteUri);
            string umbracoPath = GetUmbracoPathFromManagementApiUrl(editorAbsoluteUri);

            string defaultAuthorizeUrl = BuildAbsoluteUrl(
                editorAbsoluteUri,
                $"{umbracoPath}/management/api/v1/security/back-office/authorize");
            string defaultTokenUrl = BuildAbsoluteUrl(
                editorAbsoluteUri,
                $"{umbracoPath}/management/api/v1/security/back-office/token");
            string defaultEndSessionUrl = BuildAbsoluteUrl(
                editorAbsoluteUri,
                $"{umbracoPath}/management/api/v1/security/back-office/signout");
            string defaultRevocationUrl = BuildAbsoluteUrl(
                editorAbsoluteUri,
                $"{umbracoPath}/management/api/v1/security/back-office/revoke");
            string defaultCurrentUserUrl =
                BuildAbsoluteUrl(editorAbsoluteUri, $"{umbracoPath}/management/api/v1/user/current");
            string defaultLoginLogoUrl = BuildAbsoluteUrl(
                editorAbsoluteUri,
                $"{umbracoPath}/management/api/v1/security/back-office/graphics/login-logo-alternative");

            static string UseConfiguredOrDefault(string? value, string fallback) =>
                string.IsNullOrWhiteSpace(value) ? fallback : value;

            return new OAuthUrls(
                PostLogoutRedirect: postLogoutRedirect,
                AuthorizeUrl: UseConfiguredOrDefault(options.AuthorizeUrl, defaultAuthorizeUrl),
                TokenUrl: UseConfiguredOrDefault(options.TokenUrl, defaultTokenUrl),
                EndSessionUrl: UseConfiguredOrDefault(options.EndSessionUrl, defaultEndSessionUrl),
                RevocationUrl: UseConfiguredOrDefault(options.RevocationUrl, defaultRevocationUrl),
                CurrentUserUrl: UseConfiguredOrDefault(options.CurrentUserUrl, defaultCurrentUserUrl),
                LoginLogoUrl: UseConfiguredOrDefault(options.LoginLogoUrl, defaultLoginLogoUrl));

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

                var builder = new UriBuilder(baseUri) { Path = path, Query = string.Empty, Fragment = string.Empty, };
                return builder.Uri.ToString();
            }

            static string GetUmbracoPathFromManagementApiUrl(Uri managementApiUri)
            {
                const string defaultUmbracoPath = Constants.System.DefaultUmbracoPath;
                string defaultNormalized = Normalize(defaultUmbracoPath);

                string path = managementApiUri.AbsolutePath;

                const string marker = "/management/api/";
                int markerIndex = path.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
                if (markerIndex <= 0)
                {
                    return defaultNormalized;
                }

                string prefix = path[..markerIndex];
                prefix = string.IsNullOrWhiteSpace(prefix) ? defaultUmbracoPath : prefix;

                prefix = Normalize(prefix);
                return string.IsNullOrWhiteSpace(prefix) ? defaultNormalized : prefix;

                static string Normalize(string value)
                {
                    string normalized = value;
                    normalized = normalized.TrimStart('~');
                    normalized = normalized.EnsureStartsWith('/');
                    normalized = normalized.TrimEnd('/');
                    return normalized;
                }
            }
        }

        private void SetSecurityHeaders()
        {
            Response.Headers["Permissions-Policy"] = "camera=(self)";
            Response.Headers["Content-Security-Policy"] = string.Join(
                ";",
                new[]
                {
                    "default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data: blob:",
                    "font-src 'self'", "connect-src 'self'", "frame-ancestors 'self'", "base-uri 'self'",
                    "object-src 'none'"
                });
        }

        private record OAuthUrls(
            string? PostLogoutRedirect,
            string AuthorizeUrl,
            string TokenUrl,
            string EndSessionUrl,
            string RevocationUrl,
            string CurrentUserUrl,
            string LoginLogoUrl);
    }
}
