#nullable enable
using Articulate.Options;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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

        // Resolved on access so the constructor stays compatible with subclasses written before the comments feature.
        protected ArticulateCommentsOptions CommentsOptions =>
            HttpContext?.RequestServices.GetRequiredService<IOptions<ArticulateCommentsOptions>>().Value
            ?? new ArticulateCommentsOptions();

        protected PagerModel CreateRequestedPager(IMasterModel masterModel, int? p)
            => new(
                PagingHelper.NormalizePageSize(masterModel.PageSize),
                PagingHelper.NormalizePageNumber(p) - 1,
                1);

        /// <summary>
        /// Gets a paged list view for a given posts by author/tags/categories model.
        /// </summary>
        protected IActionResult GetPagedListView(
            IMasterModel masterModel,
            IPublishedContent pageNode,
            IEnumerable<IPublishedContent> listItems,
            long totalPosts,
            int? p)
        {
            ArgumentNullException.ThrowIfNull(masterModel);
            ArgumentNullException.ThrowIfNull(pageNode);
            ArgumentNullException.ThrowIfNull(listItems);
            if (!GetPagerModel(masterModel, totalPosts, p, out PagerModel? pager) || pager is null)
            {
                return new RedirectToUmbracoPageResult(
                    masterModel.RootBlogNode,
                    PublishedUrlProvider,
                    UmbracoContextAccessor);
            }

            var listModel = new ListModel(pageNode, pager, listItems, PublishedValueFallback, CommentsOptions);

            return View("List", listModel);
        }

        protected bool GetPagerModel(IMasterModel masterModel, long totalPosts, int? p, out PagerModel? pager)
            => PagingHelper.TryCreatePager(masterModel.Url(), Request.Query, masterModel.PageSize, totalPosts, p, out pager);
    }
}
