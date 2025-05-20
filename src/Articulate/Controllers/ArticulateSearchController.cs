using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
#if NET9_0_OR_GREATER
using Umbraco.Cms.Core.Services.Navigation;
#endif
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Cms.Web.Common.Routing;
using Umbraco.Cms.Web.Website.ActionResults;

namespace Articulate.Controllers
{
    /// <summary>
    /// Renders search results
    /// </summary>
    [ArticulateDynamicRoute]
    public class ArticulateSearchController : ListControllerBase
    {
        private readonly IArticulateSearcher _articulateSearcher;

#if NET9_0_OR_GREATER
        public ArticulateSearchController(
            ILogger<RenderController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IPublishedUrlProvider publishedUrlProvider,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor,
            IArticulateSearcher articulateSearcher, INavigationQueryService navigationQueryService, IPublishedContentStatusFilteringService publishedContentStatusFilteringService)
            : base(logger, compositeViewEngine, umbracoContextAccessor, publishedUrlProvider, publishedValueFallback, variationContextAccessor, navigationQueryService, publishedContentStatusFilteringService)
        {
            _articulateSearcher = articulateSearcher;
        }
#else
        public ArticulateSearchController(
            ILogger<RenderController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IPublishedUrlProvider publishedUrlProvider,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor,
            IArticulateSearcher articulateSearcher)
            : base(logger, compositeViewEngine, umbracoContextAccessor, publishedUrlProvider, publishedValueFallback, variationContextAccessor)
        {
            _articulateSearcher = articulateSearcher;
        }
#endif
        protected override UmbracoRouteValues UmbracoRouteValues => base.UmbracoRouteValues;

        public override IActionResult Index() => base.Index();

        /// <summary>
        /// Used to render the search result listing (virtual node)
        /// </summary>
        /// <param name="term">
        /// The search term
        /// </param>
        /// <param name="provider">
        /// The searcher name (optional)
        /// </param>
        /// <param name="p"></param>
        /// <returns></returns>
        public IActionResult Search(string term, string provider = null, int? p = null)
        {
            //create a master model
            var masterModel = new MasterModel(CurrentPage, PublishedValueFallback, VariationContextAccessor);

            if (term == null)
            {
#if NET9_0_OR_GREATER
                //nothing to search, just render the view
                var emptyList = new ListModel(
                    CurrentPage,
                    new PagerModel(masterModel.PageSize, 0, 0),
                    Enumerable.Empty<IPublishedContent>(),
                    PublishedValueFallback,
                    VariationContextAccessor,
                    base.NavigationQueryService,
                    base.PublishedContentStatusFilteringService
                    );
#else
                //nothing to search, just render the view
                var emptyList = new ListModel(
                    CurrentPage,
                    new PagerModel(masterModel.PageSize, 0, 0),
                    Enumerable.Empty<IPublishedContent>(),
                    PublishedValueFallback,
                    VariationContextAccessor);
#endif
                return View(PathHelper.GetThemeViewPath(emptyList, "List"), emptyList);
            }

            if (p != null && p.Value == 1)
            {
                return new RedirectToUmbracoPageResult(
                    CurrentPage,
                    PublishedUrlProvider,
                    UmbracoContextAccessor);
            }

            if (p == null || p.Value <= 0)
            {
                p = 1;
            }

            var searchResult = _articulateSearcher.Search(term, provider, masterModel.BlogArchiveNode.Id, masterModel.PageSize, p.Value - 1, out var totalPosts);

            return GetPagedListView(masterModel, CurrentPage, searchResult, totalPosts, p);
        }
    }
}
