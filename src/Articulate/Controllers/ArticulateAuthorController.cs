using Articulate.Factories;
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
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Cms.Web.Website.ActionResults;
using Umbraco.Extensions;

namespace Articulate.Controllers
{
    public class ArticulateAuthorController : ListControllerBase
    {
        private readonly UmbracoHelper _umbracoHelper;
#if NET9_0_OR_GREATER
        private readonly IPublishedContentStatusFilteringService _publishedContentStatusFilteringService;
        private readonly INavigationQueryService _navigationQueryService;

        public ArticulateAuthorController(
            ILogger<RenderController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IPublishedUrlProvider publishedUrlProvider,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor,
            UmbracoHelper umbracoHelper,
            IListModelFactory listModelFactory,
            INavigationQueryService navigationQueryService,
            IPublishedContentStatusFilteringService publishedContentStatusFilteringService)
            : base(logger, compositeViewEngine, umbracoContextAccessor, publishedUrlProvider, publishedValueFallback, variationContextAccessor, listModelFactory)
        {
            _umbracoHelper = umbracoHelper;
#if NET9_0_OR_GREATER
            _navigationQueryService = navigationQueryService;
            _publishedContentStatusFilteringService = publishedContentStatusFilteringService;
#endif
        }
#else
        public ArticulateAuthorController(
            ILogger<RenderController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IPublishedUrlProvider publishedUrlProvider,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor,
            UmbracoHelper umbracoHelper,
            IListModelFactory listModelFactory)
            : base(logger, compositeViewEngine, umbracoContextAccessor, publishedUrlProvider, publishedValueFallback, variationContextAccessor, listModelFactory)
        {
            _umbracoHelper = umbracoHelper;
        }
#endif

        /// <summary>
        /// Override and declare a NonAction so that we get routed to the Index action with the optional page route
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [NonAction]
        public override IActionResult Index() => Index(0);

        public IActionResult Index(int? p)
        {
            //create a master model
            var masterModel = new MasterModel(CurrentPage, PublishedValueFallback, VariationContextAccessor);

            var listNodes = masterModel.RootBlogNode.ChildrenOfType(ArticulateConstants.ArticulateArchiveContentTypeAlias).ToArray();
            if (listNodes.Length == 0)
            {
                throw new InvalidOperationException("An ArticulateArchive document must exist under the root Articulate document");
            }

            var totalPosts = _umbracoHelper.GetPostCount(CurrentPage.Name, listNodes.Select(x => x.Id).ToArray());

            if (!GetPagerModel(masterModel, totalPosts, p, out var pager))
            {
                return new RedirectToUmbracoPageResult(
                    CurrentPage.Parent,
                    PublishedUrlProvider,                    
                    UmbracoContextAccessor);
            }

            IEnumerable<IPublishedContent> authorPosts = _umbracoHelper.GetContentByAuthor(
                listNodes,
                CurrentPage.Name,
                pager,
                PublishedValueFallback,
                VariationContextAccessor,
                base.ListModelFactory);

#if NET9_0_OR_GREATER
            var author = new AuthorModel(
                CurrentPage,
                authorPosts,
                pager,
                totalPosts,
                PublishedValueFallback,
                VariationContextAccessor, _navigationQueryService, _publishedContentStatusFilteringService);

#else
            var author = new AuthorModel(
                CurrentPage,
                authorPosts,
                pager,
                totalPosts,
                PublishedValueFallback,
                VariationContextAccessor);
#endif

            return View(PathHelper.GetThemeViewPath(author, "Author"), author);
        }

        
    }
}
