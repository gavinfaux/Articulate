#nullable enable
using Articulate.Attributes;
using Articulate.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common;

namespace Articulate.Controllers
{
    /// <summary>
    /// Renders the blog post archive by tags/categories and also the tag/category blog listing.
    /// </summary>
    /// <remarks>
    /// Cached for one minute.
    /// </remarks>
    [OutputCache(PolicyName = "Articulate60")]
    [ArticulateDynamicRoute]
    public class ArticulateTagsController(
        ILogger<ArticulateTagsController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedUrlProvider publishedUrlProvider,
        IPublishedValueFallback publishedValueFallback,
        UmbracoHelper umbracoHelper,
        ArticulateTagService articulateTagService,
        ITagQuery tagQuery)
        : ListControllerBase(logger, compositeViewEngine, umbracoContextAccessor, publishedUrlProvider,
            publishedValueFallback)
    {
        /// <summary>
        /// Used to render the category listing (virtual node).
        /// </summary>
        /// <param name="tag">The category to display if supplied.</param>
        /// <param name="p"></param>
        /// <returns></returns>
        public IActionResult Categories(string tag, int? p)
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("ArticulateTagsController.Categories: CurrentPage is null, returning 404");
                return NotFound();
            }

            var categoriesUrlName = CurrentPage.Value<string>("categoriesUrlName") ?? "categories";

            return tag.IsNullOrWhiteSpace()
                ? RenderTagsOrCategories(ArticulateConstants.DataType.ArticulateCategories, categoriesUrlName)
                : RenderByTagOrCategory(tag, p, ArticulateConstants.DataType.ArticulateCategories, categoriesUrlName);
        }

        /// <summary>
        /// Used to render the tag listing (virtual node).
        /// </summary>
        /// <param name="tag">The tag to display if supplied.</param>
        /// <param name="p"></param>
        /// <returns></returns>
        public IActionResult Tags(string tag, int? p)
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("ArticulateTagsController.Tags: CurrentPage is null, returning 404");
                return NotFound();
            }

            var tagUrlName = CurrentPage.Value<string>("tagsUrlName") ?? "tags";

            return tag.IsNullOrWhiteSpace()
                ? RenderTagsOrCategories(ArticulateConstants.DataType.ArticulateTags, tagUrlName)
                : RenderByTagOrCategory(tag, p, ArticulateConstants.DataType.ArticulateTags, tagUrlName);
        }

        private IActionResult RenderTagsOrCategories(string tagGroup, string baseUrl)
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("ArticulateTagsController.RenderTagsOrCategories: CurrentPage is null, returning 404");
                return NotFound();
            }

            // create a blog model of the main page
            var rootPageModel = new MasterModel(CurrentPage, PublishedValueFallback);

            IEnumerable<PostsByTagModel> contentByTags = articulateTagService.GetContentByTags(
                umbracoHelper,
                tagQuery,
                rootPageModel,
                tagGroup,
                baseUrl);

            var tagListModel = new TagListModel(
                rootPageModel,
                CurrentPage.Name,
                rootPageModel.PageSize,
                new PostTagCollection(contentByTags),
                PublishedValueFallback);

            // Content negotiation for AI agents on tag/category list pages
            Response.Headers.Append("Vary", "X-Content-Variant");
            ContentNegotiation.TextFormat preferred = ContentNegotiation.GetPreferredTextFormat(Request);
            if (preferred == ContentNegotiation.TextFormat.Markdown)
            {
                Response.Headers["X-Content-Variant"] = "md";
                Response.Headers.CacheControl = "public, max-age=0, s-maxage=60";
                var md = BuildTagsMarkdown(tagListModel);
                return Content(md, "text/markdown; charset=utf-8");
            }

            if (preferred == ContentNegotiation.TextFormat.PlainText)
            {
                Response.Headers["X-Content-Variant"] = "txt";
                Response.Headers.CacheControl = "public, max-age=0, s-maxage=60";
                var txt = BuildTagsPlain(tagListModel);
                return Content(txt, "text/plain; charset=utf-8");
            }

            Response.Headers["X-Content-Variant"] = "html";
            Response.Headers.CacheControl = "public, max-age=0, s-maxage=60";
            return View("Tags", tagListModel);
        }

        private IActionResult RenderByTagOrCategory(string tag, int? p, string tagGroup, string baseUrl)
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("ArticulateTagsController.RenderByTagOrCategory: CurrentPage is null, returning 404");
                return NotFound();
            }

            // create a master model
            var masterModel = new MasterModel(CurrentPage, PublishedValueFallback);

            PostsByTagModel contentByTag = articulateTagService.GetContentByTag(
                umbracoHelper,
                masterModel,
                tag,
                tagGroup,
                baseUrl,
                p ?? 1,
                masterModel.PageSize);

            // this is a special case in the event that a tag contains a '.', when this happens we change it to a '-'
            // when generating the URL. So if the above doesn't return any tags and the tag contains a '-', then we
            // will replace them with '.' and do the lookup again
            if (contentByTag.PostCount == 0 && tag.Contains('-'))
            {
                contentByTag = articulateTagService.GetContentByTag(
                    umbracoHelper,
                    masterModel,
                    tag.Replace('-', '.'),
                    tagGroup,
                    baseUrl,
                    p ?? 1,
                    masterModel.PageSize);
            }

            return contentByTag is not { Posts: not null } ? NotFound() : GetPagedListView(masterModel, CurrentPage, contentByTag.Posts, contentByTag.PostCount, p);
        }

        private static string BuildTagsMarkdown(TagListModel model)
        {
            var sb = new System.Text.StringBuilder();
            _ = sb.Append("# ").AppendLine(model.Name);
            _ = sb.AppendLine();
            foreach (PostsByTagModel tag in model.Tags)
            {
                _ = sb.Append("- [").Append(tag.TagName).Append("](").Append(tag.TagUrl).Append(") — ")
                    .Append(tag.PostCount).AppendLine(tag.PostCount == 1 ? " post" : " posts");
            }

            return sb.ToString();
        }

        private static string BuildTagsPlain(TagListModel model)
        {
            var sb = new System.Text.StringBuilder();
            _ = sb.AppendLine(model.Name);
            foreach (PostsByTagModel tag in model.Tags)
            {
                _ = sb.Append("- ").Append(tag.TagName).Append(" — ")
                    .Append(tag.PostCount).Append(tag.PostCount == 1 ? " post " : " posts ")
                    .AppendLine(tag.TagUrl);
            }

            return sb.ToString();
        }
    }
}
