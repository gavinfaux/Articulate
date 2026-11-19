#nullable enable
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Routing;
using Umbraco.Cms.Web.Website.Routing;
using Umbraco.Extensions;

namespace Articulate.Routing
{
    internal sealed class ArticulateEndpointDataSource(
        ArticulateRouter router,
        IActionInvokerFactory actionInvokerFactory,
        IArticulateRouteRefreshState routeRefreshState,
        TimeProvider timeProvider,
        ILogger<ArticulateEndpointDataSource> logger) : EndpointDataSource, IDisposable
    {
        // Lower wins: Umbraco's catch-all takes the MVC conventional-route sequence, which starts at 1.
        internal const int EndpointOrder = 0;

        // Bounded: a configuration error fails every time.
        internal const int MaxBuildRetries = 5;

        private static readonly TimeSpan _firstRetryDelay = TimeSpan.FromSeconds(10);

        private readonly Lock _lock = new();
        private IReadOnlyList<Endpoint> _endpoints = [];
        private long _builtVersion;
        private int _timedRetries;
        private ITimer? _retry;
        private int _retryVersion;

        public override IReadOnlyList<Endpoint> Endpoints
        {
            get
            {
                lock (_lock)
                {
                    long currentVersion = routeRefreshState.CurrentVersion;
                    if (_builtVersion != currentVersion)
                    {
                        try
                        {
                            _endpoints = BuildEndpoints();
                            _timedRetries = 0;
                            _retry?.Dispose();
                            _retry = null;
                            logger.LogInformation("Built {Count} Articulate endpoints (route version {Version}).", _endpoints.Count, currentVersion);
                        }
                        catch (Exception ex)
                        {
                            // Throwing here would break routing for the whole site.
                            OnBuildFailed(ex);
                        }

                        _builtVersion = currentVersion;
                    }

                    return _endpoints;
                }
            }
        }

        public override IChangeToken GetChangeToken() => routeRefreshState.GetChangeToken();

        /// <summary>Cancels a pending build retry, so it can't fire after the host is torn down.</summary>
        public void Dispose()
        {
            lock (_lock)
            {
                _retry?.Dispose();
                _retry = null;
                _retryVersion++;
            }
        }

        // ASP.NET only reads Endpoints again when the change token fires, so a retry has to mark the routes dirty.
        // Only timed attempts count: a route change failing during backoff leaves the pending retry as it is.
        private void OnBuildFailed(Exception ex)
        {
            if (_retry is not null)
            {
                logger.LogError(ex, "Failed to build Articulate endpoints; keeping the previous {Count}, a retry is already scheduled.", _endpoints.Count);
                return;
            }

            if (_timedRetries >= MaxBuildRetries)
            {
                logger.LogError(ex, "Failed to build Articulate endpoints; keeping the previous {Count} until the next route change.", _endpoints.Count);
                return;
            }

            TimeSpan delay = _firstRetryDelay * Math.Pow(2, _timedRetries++);
            logger.LogError(ex, "Failed to build Articulate endpoints; keeping the previous {Count} and retrying in {Delay}.", _endpoints.Count, delay);
            int version = ++_retryVersion;
            _retry = timeProvider.CreateTimer(_ => Retry(version), null, delay, Timeout.InfiniteTimeSpan);
        }

        private void Retry(int version)
        {
            lock (_lock)
            {
                // A disposed timer's callback can still run; only the retry still scheduled may act.
                if (_retry is null || version != _retryVersion)
                {
                    return;
                }

                _retry.Dispose();
                _retry = null;
            }

            // On a thread-pool timer an exception from a change-token callback would end the process.
            try
            {
                routeRefreshState.MarkDirty();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Retrying the Articulate endpoint build failed.");
            }
        }

        private List<Endpoint> BuildEndpoints() =>
            [.. router.BuildRouteTable().Select(route => CreateEndpoint(route.Template, route.Roots))];

        private RouteEndpoint CreateEndpoint(string template, ArticulateRouteRoots roots)
        {
            ControllerActionDescriptor action = roots.ControllerActionDescriptor;
            List<object> metadata = [.. action.EndpointMetadata, action, roots];
            RoutePattern parsed = RoutePatternFactory.Parse(template, new { controller = action.ControllerName, action = action.ActionName }, parameterPolicies: null);

            return new RouteEndpoint(
                InvokeActionAsync,
                // Without RawText: with TryMatchingEndpointsForAllPages on, Umbraco treats any path matching a RawText as
                // reserved, ignoring the host, so one site's route would hide another site's page. It skipped the old dynamic route.
                RoutePatternFactory.Pattern(parsed.Defaults, parameterPolicies: null, parsed.PathSegments),
                EndpointOrder,
                new EndpointMetadataCollection(metadata),
                $"articulate:{action.ControllerName}.{action.ActionName}:{template}");
        }

        /// <summary>
        /// Sets Umbraco's route values for a selected Articulate endpoint, as Umbraco's own transformer does while routing.
        /// </summary>
        /// <remarks>
        /// Runs straight after routing, so authorization, output caching and request localization (which takes the
        /// culture from the route values) see the root and its domain. Setting them in the endpoint would be too late
        /// for those; RenderController reads them before any action filter, so Umbraco's virtual page filter would be too.
        /// </remarks>
        internal static async Task SetRouteValuesAsync(HttpContext context, RequestDelegate next)
        {
            if (context.GetEndpoint()?.Metadata.GetMetadata<ArticulateRouteRoots>() is { } roots)
            {
                IServiceProvider services = context.RequestServices;
                IUmbracoContext umbracoContext = services.GetRequiredService<IUmbracoContextAccessor>().GetRequiredUmbracoContext();
                if (roots.FindContent(umbracoContext) is { } content)
                {
                    await services.GetRequiredService<IUmbracoVirtualPageRoute>()
                        .SetRouteValues(context, content, roots.ControllerActionDescriptor);

                    // Umbraco only checks public access for content it routes itself.
                    UmbracoRouteValues routeValues = context.Features.Get<UmbracoRouteValues>()!;
                    UmbracoRouteValues? checkedValues = await services.GetRequiredService<IPublicAccessRequestHandler>()
                        .RewriteForPublishedContentAccessAsync(context, routeValues);
                    if (checkedValues is not null && checkedValues != routeValues)
                    {
                        context.Features.Set(checkedValues);
                        umbracoContext.PublishedRequest = checkedValues.PublishedRequest;
                    }
                }
            }

            await next(context);
        }

        private async Task InvokeActionAsync(HttpContext context)
        {
            if (context.Features.Get<UmbracoRouteValues>() is not { PublishedRequest.PublishedContent: not null } routeValues)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            // The public access check can switch the request to the login or error page's controller.
            ControllerActionDescriptor action = routeValues.ControllerActionDescriptor;
            var routeData = new RouteData(context.Request.RouteValues);
            routeData.Values["controller"] = action.ControllerName;
            routeData.Values["action"] = action.ActionName;
            var actionContext = new ActionContext(context, routeData, action);
            await actionInvokerFactory.CreateInvoker(actionContext)!.InvokeAsync();
        }
    }
}
