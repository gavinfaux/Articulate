#nullable enable
using Articulate.Attributes;
using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
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
        private readonly ILogger<ArticulateSearchController> _logger;

        public ArticulateSearchController(
            ILogger<ArticulateSearchController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IPublishedUrlProvider publishedUrlProvider,
            IPublishedValueFallback publishedValueFallback,
            IArticulateSearcher articulateSearcher)
            : base(logger, compositeViewEngine, umbracoContextAccessor, publishedUrlProvider, publishedValueFallback)
        {
            _articulateSearcher = articulateSearcher;
            _logger = logger;
        }

        /// <summary>
        /// Used to render the search result listing (virtual node)
        /// </summary>
        /// <param name="term">
        /// The search term
        /// </param>
        /// <param name="indexName">
        /// The searcher name (optional)
        /// </param>
        /// <param name="p"></param>
        /// <returns></returns>
        public IActionResult Search(string? term, string? indexName = null, int? p = null)
        {
            if (CurrentPage is null)
            {
                _logger.LogWarning("ArticulateSearchController.Search: CurrentPage is null, returning 404");
                return NotFound();
            }

            //create a master model
            var masterModel = new MasterModel(CurrentPage, PublishedValueFallback);

            if (masterModel.BlogArchiveNode is null)
            {
                throw new InvalidOperationException("An ArticulateArchive document must exist under the root Articulate document");
            }

            if (term is null)
            {
                //nothing to search, just render the view
                var emptyList = new ListModel(
                    CurrentPage,
                    new PagerModel(masterModel.PageSize, 0, 0),
                    [],
                    PublishedValueFallback);

                return View("List", emptyList);
            }

            if (p is 1)
            {
                return new RedirectToUmbracoPageResult(
                    CurrentPage,
                    PublishedUrlProvider,
                    UmbracoContextAccessor);
            }

            if (p is not > 0)
            {
                p = 1;
            }

            IEnumerable<IPublishedContent>? searchResult = _articulateSearcher.Search(term, indexName, masterModel.BlogArchiveNode.Id, masterModel.PageSize, p.Value - 1, out var totalPosts);

            return GetPagedListView(masterModel, CurrentPage, searchResult ?? [], totalPosts, p);
        }
    }
}
