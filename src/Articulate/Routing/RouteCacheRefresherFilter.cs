#nullable enable
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Web;

namespace Articulate.Routing
{
    /// <summary>
    /// At the end of a request, we'll check if there is a flag in the request indicating to rebuild the routes
    /// </summary>
    /// <remarks>
    /// In some cases many articulate roots might be published at one time, but we only want to rebuild the routes once so we'll do it once
    /// at the end of the request.
    /// </remarks>
    internal class RouteCacheRefresherFilter(
        IPublishedContentTypeCache publishedContentTypeCache,
        IDocumentCacheService documentCacheService)
        : IActionFilter
    {
        /// <inheritdoc/>
        public void OnActionExecuted(ActionExecutedContext context) => PerformRefresh(context.HttpContext);

        /// <inheritdoc/>
        public void OnActionExecuting(ActionExecutingContext context)
        {
        }

        private void PerformRefresh(HttpContext context)
        {
            AppCaches appCaches = context.RequestServices.GetRequiredService<AppCaches>();

            if (appCaches.RequestCache.GetCacheItem<bool?>(ArticulateConstants.RefreshRoutesToken) != true)
            {
                return;
            }

            IUmbracoContextFactory umbracoContextFactory = context.RequestServices.GetRequiredService<IUmbracoContextFactory>();
            ArticulateRouter articulateRouter = context.RequestServices.GetRequiredService<ArticulateRouter>();

            using UmbracoContextReference umbracoContextReference = umbracoContextFactory.EnsureUmbracoContext();
            IUmbracoContext umbCtx = umbracoContextReference.UmbracoContext;

            // Regenerate the generated routes
            articulateRouter.MapRoutes(context, umbCtx, publishedContentTypeCache, documentCacheService);
        }
    }
}
