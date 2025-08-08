#nullable enable
using System.Text;
using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Cms.Web.Website.ActionResults;

namespace Articulate.Controllers
{
    /// <summary>
    /// Base controller providing common functionality for listing pages
    /// </summary>
    public abstract class ListControllerBase(
        ILogger<ListControllerBase> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedUrlProvider publishedUrlProvider,
        IPublishedValueFallback publishedValueFallback)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        protected IUmbracoContextAccessor UmbracoContextAccessor { get; } = umbracoContextAccessor;

        protected IPublishedUrlProvider PublishedUrlProvider { get; } = publishedUrlProvider;

        protected IPublishedValueFallback PublishedValueFallback { get; } = publishedValueFallback;

        /// <summary>
        /// Gets a paged list view for a given posts by author/tags/categories model
        /// </summary>
        protected IActionResult GetPagedListView(IMasterModel masterModel, IPublishedContent pageNode, IEnumerable<IPublishedContent> listItems, long totalPosts, int? p)
        {
            ArgumentNullException.ThrowIfNull(masterModel, nameof(masterModel));
            ArgumentNullException.ThrowIfNull(pageNode, nameof(pageNode));
            ArgumentNullException.ThrowIfNull(listItems, nameof(listItems));

            if (!GetPagerModel(masterModel, totalPosts, p, out PagerModel? pager) || pager is null)
            {
                return new RedirectToUmbracoPageResult(
                    masterModel.RootBlogNode,
                    PublishedUrlProvider,
                    UmbracoContextAccessor);
            }

            var listModel = new ListModel(pageNode, pager, listItems, PublishedValueFallback);

            return View("List", listModel);
        }

        protected bool GetPagerModel(IMasterModel masterModel, long totalPosts, int? p, out PagerModel? pager)
        {
            var pageNumber = p is > 0 ? p.Value : 1;

            var pageSize = masterModel.PageSize;
            var totalPages = totalPosts == 0 ? 1 : Convert.ToInt32(Math.Ceiling((double)totalPosts / pageSize));

            // Invalid page, redirect without pages
            if (totalPages < pageNumber)
            {
                pager = null;
                return false;
            }

            // maintain query strings
            var queryStrings = new StringBuilder();
            foreach (var key in Request.Query.Keys)
            {
                if (key == "p")
                {
                    continue;
                }

                if (!Request.Query.TryGetValue(key, out StringValues val))
                {
                    continue;
                }

                foreach (var v in val)
                {
                    queryStrings.Append($"&{key}={v}");
                }
            }

            pager = new PagerModel(
                pageSize,
                pageNumber - 1,
                totalPages,
                totalPages > pageNumber ? GetPagedUrl(masterModel.Url(), pageNumber + 1, queryStrings.ToString()) : string.Empty,
                pageNumber > 2 ? GetPagedUrl(masterModel.Url(), pageNumber - 1, queryStrings.ToString()) : pageNumber > 1 ? GetPagedUrl(masterModel.Url(), null, queryStrings.ToString()) : string.Empty);

            return true;
        }

        private static string GetPagedUrl(string? baseUrl, int? page, string queryStrings)
            => page.HasValue
                ? $"{baseUrl?.EnsureEndsWith('?')}p={page}{queryStrings}"
                : $"{baseUrl?.EnsureEndsWith('?')}{queryStrings.TrimStart('&')}";
    }
}
