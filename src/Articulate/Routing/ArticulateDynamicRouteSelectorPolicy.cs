#nullable enable

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Articulate.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Matching;
using Umbraco.Cms.Web.Common.Routing;

namespace Articulate.Routing
{
    /// <summary>
    /// Used when their is ambiguous route candidates due to multiple dynamic routes being assigned.
    /// </summary>
    /// <remarks>
    /// Ambiguous dynamic routes can occur if Umbraco detects a 404 and assigns a route, but sometimes its not
    /// actually a 404 because the articulate router occurs after the Umbraco router which handles 404 eagerly.
    /// This causes 2x candidates to be resolved and the first (umbraco) is chosen.
    /// If we detect that Articulate actually performed the routing, then we use that candidate instead.
    /// TODO: Ideally - Umbraco would dynamically route the 404 in a much later state which could be done,
    /// by a dynamic router that has a much larger Order so it occurs later in the pipeline instead of eagerly.
    /// </remarks>
    internal class ArticulateDynamicRouteSelectorPolicy : MatcherPolicy, IEndpointSelectorPolicy
    {
        public override int Order => 100;

        public bool AppliesToEndpoints(IReadOnlyList<Endpoint> endpoints)
        {
            // Don't apply this filter to any endpoint group that is a controller route
            // i.e. only dynamic routes.
            foreach (Endpoint endpoint in endpoints)
            {
                ControllerAttribute? controller = endpoint.Metadata.GetMetadata<ControllerAttribute>();
                if (controller != null)
                {
                    return false;
                }
            }

            // then ensure this is only applied if all endpoints are IDynamicEndpointMetadata
            return endpoints.All(x => x.Metadata.GetMetadata<IDynamicEndpointMetadata>() != null);
        }

        public Task ApplyAsync(HttpContext httpContext, CandidateSet candidates)
        {
            var umbracoRouteValues = httpContext.Features.Get<UmbracoRouteValues>();

            // If the request has been dynamically routed by articulate to an
            // Articulate controller
            if (umbracoRouteValues != null
                && umbracoRouteValues.ControllerActionDescriptor.EndpointMetadata.Any(x => x is ArticulateDynamicRouteAttribute))
            {
                for (var i = 0; i < candidates.Count; i++)
                {
                    // If the candidate is an Articulate dynamic controller, set valid
                    if (candidates[i].Endpoint?.Metadata?.GetMetadata<ArticulateDynamicRouteAttribute>() is not null)
                    {
                        candidates.SetValidity(i, true);
                    }
                    else
                    {
                        // else it is invalid
                        candidates.SetValidity(i, false);
                    }
                }
            }

            return Task.CompletedTask;
        }
    }
}
