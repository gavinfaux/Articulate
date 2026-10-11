#nullable enable
using Articulate.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;

namespace Articulate.Controllers
{
    /// <summary>
    /// Renders search results
    /// </summary>
    [ArticulateDynamicRoute]
    public class ArticulateSearchController(
        ILogger<ArticulateSearchController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedUrlProvider publishedUrlProvider,
        IPublishedValueFallback publishedValueFallback,
        IArticulateSearcher articulateSearcher)
        : ListControllerBase(logger, compositeViewEngine, umbracoContextAccessor, publishedUrlProvider,
            publishedValueFallback)
    {
        /// <summary>
        /// Used to render the search result listing (virtual node)
        /// </summary>
        /// <param name="term">
        /// The search term
        /// </param>
        /// <param name="p"></param>
        /// <returns></returns>
        public async Task<IActionResult> Search(string? term, int? p = null)
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("ArticulateSearchController.Search: CurrentPage is null, returning 404");
                return NotFound();
            }

            IPublishedContent currentPage = CurrentPage;
            var masterModel = new MasterModel(currentPage, PublishedValueFallback);

            if (term is null)
            {
                return View("List", CreateEmptyListModel(currentPage, masterModel));
            }

            if (p is 1)
            {
                return Redirect(BuildSearchUrl(currentPage, term));
            }

            var pageNumber = p is > 0 ? p.Value : 1;

            (IEnumerable<IPublishedContent> searchResult, long totalPosts) = await articulateSearcher.SearchAsync(
                term,
                masterModel.BlogArchiveNode.Id,
                masterModel.PageSize,
                pageNumber - 1);

            return GetPagedListView(masterModel, currentPage, searchResult, totalPosts, pageNumber);
        }

        private ListModel CreateEmptyListModel(IPublishedContent currentPage, MasterModel masterModel) =>
            new(
                currentPage,
                new PagerModel(masterModel.PageSize, 0, 0),
                [],
                PublishedValueFallback);

        private string BuildSearchUrl(IPublishedContent currentPage, string term)
        {
            var url = currentPage.Url(PublishedUrlProvider);

            if (!string.IsNullOrWhiteSpace(term))
            {
                url = Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString(url, "term", term);
            }

            return url;
        }
    }
}
