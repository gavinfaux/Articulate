using Articulate.Attributes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Matching;
using Umbraco.Cms.Web.Common.Routing;

#nullable enable
namespace Articulate.Routing
{
    /// <summary>
    /// Used when there is ambiguous route candidates due to multiple dynamic routes being assigned.
    /// </summary>
    /// <remarks>
    /// Ambiguous dynamic routes can occur if Umbraco detects a 404 and assigns a route, but sometimes it's not
    /// actually a 404 because the articulate router occurs after the Umbraco router which handles 404 eagerly.
    /// This causes 2x candidates to be resolved and the first (umbraco) is chosen.
    /// If we detect that Articulate actually performed the routing, then we use that candidate instead.
    /// TODO: Ideally - Umbraco would dynamically route the 404 in a much later state which could be done,
    /// by a dynamic router that has a much larger Order so it occurs later in the pipeline instead of eagerly.
    /// </remarks>
    internal class ArticulateDynamicRouteSelectorPolicy : MatcherPolicy, IEndpointSelectorPolicy
    {
        /// <inheritdoc/>
        public override int Order => 100;

        /// <inheritdoc/>
        public bool AppliesToEndpoints(IReadOnlyList<Endpoint> endpoints) =>
            // Only apply to groups of dynamic endpoints (i.e. generated via MapDynamicControllerRoute),
            // and only where the Articulate dynamic endpoint is present.
            endpoints.All(x => x.Metadata.GetMetadata<IDynamicEndpointMetadata>() is not null)
            && endpoints.Any(x => x.Metadata.GetMetadata<ArticulateDynamicRouteAttribute>() is not null);

        /// <inheritdoc/>
        public Task ApplyAsync(HttpContext httpContext, CandidateSet candidates)
        {
            UmbracoRouteValues? umbracoRouteValues = httpContext.Features.Get<UmbracoRouteValues>();

            // Only intervene when Articulate successfully routed to an Articulate controller.
            if (umbracoRouteValues?.ControllerActionDescriptor?.ControllerTypeInfo is null)
            {
                return Task.CompletedTask;
            }

            bool isArticulateController =
                umbracoRouteValues.ControllerActionDescriptor.ControllerTypeInfo
                    .IsDefined(typeof(ArticulateDynamicRouteAttribute), inherit: true);

            if (!isArticulateController)
            {
                return Task.CompletedTask;
            }

            // The request has been dynamically routed by Articulate to an Articulate controller.
            for (var i = 0; i < candidates.Count; i++)
            {
                if (!candidates.IsValidCandidate(i))
                {
                    continue;
                }

                Endpoint endpoint = candidates[i].Endpoint;
                candidates.SetValidity(
                    i,
                    endpoint.Metadata.GetMetadata<ArticulateDynamicRouteAttribute>() is not null);
            }

            return Task.CompletedTask;
        }
    }
}
