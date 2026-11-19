#nullable enable
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Matching;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Security;
using Umbraco.Extensions;

namespace Articulate.Routing
{
    /// <summary>
    /// Keeps an Articulate endpoint only where one of its roots serves the request's domain.
    /// </summary>
    /// <remarks>
    /// Articulate endpoints sort ahead of Umbraco's catch-all. Without the domain check, a root bound to one site
    /// would take paths such as <c>/rss</c> from every other site. When Articulate does serve the request, the
    /// catch-all is dropped so Umbraco doesn't route content it would throw away (its eager policy skips that
    /// for render controllers). Only a candidate that also accepts the request method counts: ASP.NET checks methods
    /// later, and a rejected Articulate candidate would otherwise leave nothing to route the request, not even
    /// Umbraco's 404 page. A surface controller form submission (a valid <c>ufprt</c>, posted or in the query string for
    /// GET forms) is left to the catch-all, which dispatches it.
    /// </remarks>
    internal sealed class ArticulateEndpointSelectorPolicy(
        IUmbracoContextAccessor umbracoContextAccessor,
        IDataProtectionProvider dataProtectionProvider)
        : MatcherPolicy, IEndpointSelectorPolicy
    {
        /// <inheritdoc/>
        /// <remarks>Before ASP.NET resolves dynamic routes (<c>int.MinValue + 100</c>), so the catch-all never runs.</remarks>
        public override int Order => int.MinValue + 50;

        /// <inheritdoc/>
        public bool AppliesToEndpoints(IReadOnlyList<Endpoint> endpoints) =>
            endpoints.Any(x => x.Metadata.GetMetadata<ArticulateRouteRoots>() is not null);

        /// <inheritdoc/>
        public Task ApplyAsync(HttpContext httpContext, CandidateSet candidates)
        {
            int catchAll = IndexOfUmbracoCatchAll(candidates);

            // note: the surface controller's CurrentPage is Umbraco's 404 request, not the Articulate root, as Articulate's
            // controllers aren't IVirtualPageControllers; redirecting handlers work, CurrentUmbracoPage() doesn't.
            bool formPost = catchAll >= 0 && IsSurfaceFormSubmission(httpContext.Request);
            umbracoContextAccessor.TryGetUmbracoContext(out IUmbracoContext? umbracoContext);
            var served = false;

            for (var i = 0; i < candidates.Count; i++)
            {
                if (candidates.IsValidCandidate(i) &&
                    candidates[i].Endpoint.Metadata.GetMetadata<ArticulateRouteRoots>() is { } roots)
                {
                    bool serves = !formPost && umbracoContext is not null && roots.GetContentId(umbracoContext) != 0;
                    candidates.SetValidity(i, serves);
                    served |= serves && AcceptsMethod(candidates[i].Endpoint, httpContext.Request.Method);
                }
            }

            if (served && catchAll >= 0)
            {
                candidates.SetValidity(catchAll, false);
            }

            return Task.CompletedTask;
        }

        // Identified as Umbraco's own EagerMatcherPolicy does, so other dynamic routes stay eligible.
        private static int IndexOfUmbracoCatchAll(CandidateSet candidates)
        {
            for (var i = 0; i < candidates.Count; i++)
            {
                if (candidates.IsValidCandidate(i) &&
                    candidates[i].Endpoint is RouteEndpoint { DisplayName: Constants.Web.Routing.DynamicRoutePattern } endpoint &&
                    endpoint.Metadata.GetMetadata<IDynamicEndpointMetadata>() is not null)
                {
                    return i;
                }
            }

            return -1;
        }

        // Validated as Umbraco's transformer does: it routes an invalid token as content, which 404s an Articulate URL.
        private bool IsSurfaceFormSubmission(HttpRequest request) =>
            request.GetUfprt() is { Length: > 0 } ufprt &&
            EncryptionHelper.DecryptAndValidateEncryptedRouteString(dataProtectionProvider, ufprt, out _);

        private static bool AcceptsMethod(Endpoint endpoint, string method) =>
            endpoint.Metadata.GetMetadata<IHttpMethodMetadata>() is not { HttpMethods.Count: > 0 } metadata ||
            metadata.HttpMethods.Any(x => HttpMethods.Equals(x, method));
    }
}
