#nullable enable

using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Routing;
using Umbraco.Cms.Web.Website.Routing;
using static Umbraco.Cms.Core.Constants.Web.Routing;

namespace Articulate.Routing
{
    // TODO: We're going to need to do this for all dynamic routes so no more building routes
    // This is because there is no more RouteTable that you can write too so we sort of have to
    // re-create that here.
    internal class ArticulateRouteValueTransformer(
        IRuntimeState runtime,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedRouter publishedRouter,
        IRoutableDocumentFilter routableDocumentFilter,
        ArticulateRouter articulateRouteBuilder,
        UmbracoRouteValueTransformer umbracoRouteValueTransformer,
        IPublishedContentTypeCache publishedContentTypeCache,
        IDocumentCacheService documentCacheService)
        : DynamicRouteValueTransformer, IDisposable
    {
        private bool _hasCache;
        private bool _disposedValue;
        private readonly ReaderWriterLockSlim _lock = new();

        public override async ValueTask<RouteValueDictionary> TransformAsync(HttpContext httpContext,
            RouteValueDictionary values)
        {
            // check if Umbraco has already matched content, we don't want to execute if things
            // are already matching.
            if (!ShouldCheck(httpContext, out var umbracoContext,
                    out var umbracoRouteValues))
            {
                return null;
            }

            if (umbracoRouteValues == null)
            {
                // This can occur in Umbraco Cloud since some plugin that is used there prevents the UmbracoRouteValues from
                // being set the normal way. In this case, we'll need to force route it.
                var routeValues = await umbracoRouteValueTransformer.TransformAsync(httpContext, values);

                umbracoRouteValues = httpContext.Features.Get<UmbracoRouteValues>();
                if (umbracoRouteValues == null)
                {
                    // Most likely will be null
                    return routeValues;
                }
            }

            var newValues = new RouteValueDictionary();

            var routeResult =
                await TryRoute(umbracoContext, umbracoRouteValues, httpContext, newValues);
            if (!routeResult.hasCache)
            {
                // we don't have a cache yet
                _lock.EnterWriteLock();
                try
                {
                    articulateRouteBuilder.MapRoutes(httpContext, umbracoContext, publishedContentTypeCache,
                        documentCacheService);
                    _hasCache = true;
                }
                finally
                {
                    _lock.ExitWriteLock();
                }

                routeResult = await TryRoute(umbracoContext, umbracoRouteValues, httpContext, newValues);
            }

            return routeResult.routeSuccess ? newValues : null;
        }

        private async Task<(bool hasCache, bool routeSuccess)> TryRoute(IUmbracoContext umbracoContext,
            UmbracoRouteValues umbracoRouteValues, HttpContext httpContext, RouteValueDictionary values)
        {
            _lock.EnterReadLock();
            try
            {
                if (_hasCache)
                {
                    if (articulateRouteBuilder.TryMatch(httpContext.Request.Path, values,
                            out var dynamicRouteValues))
                    {
                        await WriteRouteValues(umbracoContext, httpContext, dynamicRouteValues, umbracoRouteValues,
                            values);
                        return (true, true);
                    }

                    return (true, false);
                }
            }
            finally
            {
                _lock.ExitReadLock();
            }

            return (false, false);
        }

        private async Task WriteRouteValues(IUmbracoContext umbracoContext, HttpContext httpContext,
            ArticulateRootNodeCache dynamicRouteValues, UmbracoRouteValues umbracoRouteValues,
            RouteValueDictionary values)
        {
            // Since we are executing after Umbraco's dynamic transformer, it means Umbraco has already
            // gone ahead and matched a domain (if any). So we will use this to match our document.
            var assignedDomain = umbracoRouteValues.PublishedRequest?.Domain;
            var contentId = dynamicRouteValues.GetContentId(assignedDomain);

            var publishedContent = umbracoContext.Content.GetById(contentId)
                                   ?? throw new InvalidOperationException(
                                       "Could not resolve content by id " + contentId);

            // instantiate, prepare and process the published content request
            // important to use CleanedUmbracoUrl - lowercase path-only version of the current url
            var requestBuilder = await publishedRouter.CreateRequestAsync(umbracoContext.CleanedUmbracoUrl);

            // re-assign the domain if there was one.
            if (assignedDomain != null)
            {
                requestBuilder.SetDomain(assignedDomain);
            }

            requestBuilder.SetPublishedContent(publishedContent);

            var publishedRequest = requestBuilder.Build();

            umbracoRouteValues = new UmbracoRouteValues(
                publishedRequest,
                dynamicRouteValues.ControllerActionDescriptor);

            // Store the route values as a httpcontext feature
            httpContext.Features.Set(umbracoRouteValues);

            umbracoContext.PublishedRequest = publishedRequest;

            values[ControllerToken] = dynamicRouteValues.ControllerActionDescriptor.ControllerName;
            if (string.IsNullOrWhiteSpace(dynamicRouteValues.ControllerActionDescriptor.ActionName) == false)
            {
                values[ActionToken] = dynamicRouteValues.ControllerActionDescriptor.ActionName;
            }
        }

        private bool ShouldCheck(
            HttpContext httpContext,
            out IUmbracoContext umbracoContext,
            out UmbracoRouteValues umbracoRouteValues)
        {
            umbracoRouteValues = httpContext.Features.Get<UmbracoRouteValues>();

            umbracoContext = null;

            // If we aren't running, then we have nothing to route
            if (runtime.Level != RuntimeLevel.Run)
            {
                return false;
            }

            // will be null for any client side requests like JS, etc...
            if (!umbracoContextAccessor.TryGetUmbracoContext(out umbracoContext))
            {
                return false;
            }

            // If route values have already been assigned, then Umbraco has matched content, we will not proceed.
            // A 404 can be matched by Umbraco too which will occur for Articulate dynamic routes, so we need to
            // proceed to see if it is actually a 404.
            if (umbracoRouteValues?.PublishedRequest?.PublishedContent != null
                && umbracoRouteValues?.PublishedRequest?.ResponseStatusCode != 404)
            {
                return false;
            }

            if (!routableDocumentFilter.IsDocumentRequest(httpContext.Request.Path))
            {
                return false;
            }

            return true;
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposedValue)
            {
                if (disposing)
                {
                    _lock.Dispose();
                }

                _disposedValue = true;
            }
        }

        public void Dispose() => Dispose(true);
    }
}
