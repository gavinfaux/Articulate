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
        /// <param name="indexName">
        /// The searcher name (optional)
        /// </param>
        /// <param name="p"></param>
        /// <returns></returns>
        public IActionResult Search(string? term, string? indexName = null, int? p = null)
        {
            // Security: Restrict search to block internal system indexes to prevent index disclosure/probing.
            // We allow any other index (e.g. custom indexes) but explicitly block known sensitive ones.
            if (!string.IsNullOrWhiteSpace(indexName) &&
                (indexName.Equals(
                     Umbraco.Cms.Core.Constants.UmbracoIndexes.InternalIndexName,
                     StringComparison.OrdinalIgnoreCase) ||
                 indexName.Equals(
                     Umbraco.Cms.Core.Constants.UmbracoIndexes.MembersIndexName,
                     StringComparison.OrdinalIgnoreCase)))
            {
                logger.LogWarning(
                    "ArticulateSearchController.Search: Blocked access to sensitive index '{IndexName}'",
                    indexName);
                indexName = Umbraco.Cms.Core.Constants.UmbracoIndexes.ExternalIndexName;
            }

            if (CurrentPage is null)
            {
                logger.LogWarning("ArticulateSearchController.Search: CurrentPage is null, returning 404");
                return NotFound();
            }

            // create a master model
            var masterModel = new MasterModel(CurrentPage, PublishedValueFallback);

            if (masterModel.BlogArchiveNode is null)
            {
                throw new InvalidOperationException(
                    "An ArticulateArchive document must exist under the root Articulate document");
            }

            if (term is null)
            {
                // nothing to search, just render the view
                var emptyList = new ListModel(
                    CurrentPage,
                    new PagerModel(masterModel.PageSize, 0, 0),
                    [],
                    PublishedValueFallback);

                return View("List", emptyList);
            }

            if (p is 1)
            {
                var url = CurrentPage.Url(PublishedUrlProvider);
                if (!string.IsNullOrWhiteSpace(term))
                {
                    url = Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString(url, "term", term);
                }

                if (!string.IsNullOrWhiteSpace(indexName))
                {
                    url = Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString(url, "indexName", indexName);
                }

                return Redirect(url);
            }

            if (p is not > 0)
            {
                p = 1;
            }

            IEnumerable<IPublishedContent>? searchResult = articulateSearcher.Search(
                term,
                indexName,
                masterModel.BlogArchiveNode.Id,
                masterModel.PageSize,
                p.Value - 1,
                out var totalPosts);

            return GetPagedListView(masterModel, CurrentPage, searchResult ?? [], totalPosts, p);
        }
    }
}
