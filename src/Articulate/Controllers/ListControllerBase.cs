#nullable enable
using System.Text;
using Microsoft.AspNetCore.Http;
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
    /// Base controller providing common functionality for listing pages.
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
        /// Gets a paged list view for a given posts by author/tags/categories model.
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

            // Always advertise variant normalization header for CDN cache-keying
            Response.Headers.Append("Vary", "X-Content-Variant");

            // Content negotiation for LLMs/agents on list pages
            ContentNegotiation.TextFormat preferred = ContentNegotiation.GetPreferredTextFormat(Request);
            if (preferred == ContentNegotiation.TextFormat.Markdown)
            {
                Response.Headers["X-Content-Variant"] = "md";
                Response.Headers.CacheControl = "public, max-age=0, s-maxage=60";
                var md = BuildListMarkdown(listModel);
                return Content(md, "text/markdown; charset=utf-8");
            }

            if (preferred == ContentNegotiation.TextFormat.PlainText)
            {
                Response.Headers["X-Content-Variant"] = "txt";
                Response.Headers.CacheControl = "public, max-age=0, s-maxage=60";
                var txt = BuildListPlain(listModel);
                return Content(txt, "text/plain; charset=utf-8");
            }

            // Default HTML
            Response.Headers["X-Content-Variant"] = "html";
            Response.Headers.CacheControl = "public, max-age=0, s-maxage=60";
            return View("List", listModel);
        }

        protected bool GetPagerModel(IMasterModel masterModel, long totalPosts, int? p, out PagerModel? pager)
        {
            var pageNumber = p is > 0 ? p.Value : 1;

            var pageSize = masterModel.PageSize;
            if (pageSize <= 0)
            {
                pageSize = 10;
            }

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
                    _ = queryStrings.Append($"&{key}={v}");
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

        private static string BuildListMarkdown(ListModel listModel)
        {
            var sb = new StringBuilder();
            _ = sb.Append("# ").AppendLine(listModel.Name);
            _ = sb.AppendLine();
            foreach (PostModel item in listModel.Posts)
            {
                var url = item.Url();
                var date = item.PublishedDate.ToString("yyyy-MM-dd");
                var excerpt = (item.Excerpt ?? string.Empty).NewLinesToSpaces();
                if (!string.IsNullOrWhiteSpace(excerpt))
                {
                    _ = sb.Append("- [").Append(item.Name).Append("](").Append(url).Append(") — ")
                        .Append(date).Append(" — ").AppendLine(excerpt);
                }
                else
                {
                    _ = sb.Append("- [").Append(item.Name).Append("](").Append(url).Append(") — ")
                        .AppendLine(date);
                }
            }

            return sb.ToString();
        }

        private static string BuildListPlain(ListModel listModel)
        {
            var sb = new StringBuilder();
            _ = sb.AppendLine(listModel.Name);
            foreach (PostModel item in listModel.Posts)
            {
                var url = item.Url();
                var date = item.PublishedDate.ToString("yyyy-MM-dd");
                var excerpt = (item.Excerpt ?? string.Empty).NewLinesToSpaces();
                if (!string.IsNullOrWhiteSpace(excerpt))
                {
                    _ = sb.Append("- ").Append(item.Name).Append(" — ")
                        .Append(date).Append(" — ").Append(excerpt)
                        .Append(' ').AppendLine(url);
                }
                else
                {
                    _ = sb.Append("- ").Append(item.Name).Append(" — ")
                        .Append(date).Append(' ').AppendLine(url);
                }
            }

            return sb.ToString();
        }
    }
}
