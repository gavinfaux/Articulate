using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace Articulate.Routing
{
    /// <summary>
    /// At the end of a request, we'll check if there is a flag in the request indicating to rebuild the routes
    /// </summary>
    /// <remarks>
    /// In some cases many articulate roots might be published at one time but we only want to rebuild the routes once so we'll do it once
    /// at the end of the request.
    /// </remarks>
    internal class RouteCacheRefresherFilter : IActionFilter
    {

        private readonly IPublishedContentTypeCache _publishedContentTypeCache;
        private readonly IDocumentCacheService _documentCacheService;

        public RouteCacheRefresherFilter(IPublishedContentTypeCache publishedContentTypeCache, IDocumentCacheService documentCacheService)
        {
            _documentCacheService = documentCacheService;
            _publishedContentTypeCache = publishedContentTypeCache;
        }
        public void OnActionExecuted(ActionExecutedContext context) => PerformRefresh(context.HttpContext);

        public void OnActionExecuting(ActionExecutingContext context)
        {
        }

        private void PerformRefresh(HttpContext context)
        {
            AppCaches appCaches = context.RequestServices.GetRequiredService<AppCaches>();

            if (appCaches.RequestCache.GetCacheItem<bool?>(ArticulateConstants.RefreshRoutesToken) == true)
            {
                IUmbracoContextFactory umbracoContextFactory = context.RequestServices.GetRequiredService<IUmbracoContextFactory>();
                ArticulateRouter articulateRouter = context.RequestServices.GetRequiredService<ArticulateRouter>();

                using (UmbracoContextReference umbracoContextReference = umbracoContextFactory.EnsureUmbracoContext())
                {
                    IUmbracoContext umbCtx = umbracoContextReference.UmbracoContext;

                    // Regenerate the generated routes
                    articulateRouter.MapRoutes(context, umbCtx, _publishedContentTypeCache, _documentCacheService);
                }
            }
        }
    }
}
