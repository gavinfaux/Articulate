#nullable enable
using System.ServiceModel.Syndication;
using Articulate.Attributes;
using Articulate.Services;
using Articulate.Syndication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    /// <summary>
    /// Rss controller
    /// </summary>
    /// <remarks>
    /// Cached for one minute
    /// </remarks>
    [OutputCache(PolicyName = "Articulate300")]
    [ArticulateDynamicRoute]
    public class ArticulateRssController(
        ILogger<ArticulateRssController> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IRssFeedGenerator feedGenerator,
        IPublishedValueFallback publishedValueFallback,
        UmbracoHelper umbracoHelper,
        ArticulateTagService articulateTagService)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        // NonAction so it is not routed since we want to use an overload below
        /// <inheritdoc/>
        [NonAction]
        public override IActionResult Index() => Index(0);

        /// <summary>
        /// Renders the main RSS feed.
        /// </summary>
        public IActionResult Index(int? maxItems)
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("ArticulateRssController.Index: CurrentPage is null, returning 404");
                return NotFound();
            }

            maxItems ??= 25;

            IPublishedContent[] listNodes =
            [
                .. CurrentPage.Children().Where(x =>
                    x.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateArchive))
            ];
            if (listNodes.Length == 0)
            {
                throw new InvalidOperationException(
                    "An ArticulateArchive document must exist under the root Articulate document");
            }

            var pager = new PagerModel(maxItems.Value, 0, 1);

            var listNodeIds = listNodes.Select(x => x.Id).ToArray();

            IEnumerable<IPublishedContent> listItems =
                umbracoHelper.GetPostsSortedByPublishedDate(pager, null, listNodeIds) ?? [];

            var rootPageModel = new ListModel(
                listNodes[0],
                pager,
                listItems,
                publishedValueFallback);

            /*
              TODO: Raise issue / debug Umbraco Core - This returns null, when it should be two with the default content installed

              var feed = _feedGenerator.GetFeed(rootPageModel, rootPageModel.Children<PostModel>());

              where .Children<PostModel>() calls this:

              public static IEnumerable<T>? Children<T>(this IPublishedContent content, string? culture = null)
                 where T : class, IPublishedContent
                    => content.Children<T>(GetNavigationQueryService(content), GetPublishedStatusFilteringService(content), culture);
            */

            // Work around for above issue
            IEnumerable<PostModel> posts = umbracoHelper.GetPostsSortedByPublishedDate(
                    pager, null, rootPageModel.Id)
                .Select(x => new PostModel(x, publishedValueFallback));

            SyndicationFeed feed = feedGenerator.GetFeed(rootPageModel, posts);

            return new RssResult(feed, rootPageModel);
        }

        /// <summary>
        /// Renders the RSS feed for a specific author.
        /// </summary>
        public IActionResult Author(int authorId, int? maxItems)
        {
            IPublishedContent? author = umbracoHelper.Content(authorId);

            ArgumentNullException.ThrowIfNull(author);

            maxItems ??= 25;

            // create a master model
            var masterModel = new MasterModel(author, publishedValueFallback);

            IPublishedContent[]? listNodes = masterModel.RootBlogNode
                .ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.ToArray();
            if (listNodes is null || listNodes.Length == 0)
            {
                throw new InvalidOperationException(
                    "An ArticulateArchive document must exist under the root Articulate document");
            }

            IEnumerable<IPublishedContent> authorContent = umbracoHelper.GetContentByAuthor(
                listNodes,
                author.Name,
                new PagerModel(maxItems.Value, 0, 1),
                publishedValueFallback);

            SyndicationFeed feed = feedGenerator.GetFeed(
                masterModel,
                authorContent.Select(x => new PostModel(x, publishedValueFallback)));

            return new RssResult(feed, masterModel);
        }

        /// <summary>
        /// Renders the RSS feed for a specific category.
        /// </summary>
        public IActionResult Categories(
            string tag,
            int? maxItems)
        {
            ArgumentNullException.ThrowIfNull(tag);

            maxItems ??= 25;

            return RenderTagsOrCategoriesRss(
                ArticulateConstants.DataType.ArticulateCategories,
                "categories",
                maxItems.Value,
                tag);
        }

        /// <summary>
        /// Renders the RSS feed for a specific tag.
        /// </summary>
        public IActionResult Tags(
            string tag,
            int? maxItems)
        {
            ArgumentNullException.ThrowIfNull(tag);

            maxItems ??= 25;

            return RenderTagsOrCategoriesRss(
                ArticulateConstants.DataType.ArticulateTags,
                "tags",
                maxItems.Value,
                tag);
        }

        /// <summary>
        /// Renders an RSS feed for a tag group (categories or tags).
        /// </summary>
        public IActionResult RenderTagsOrCategoriesRss(string tagGroup, string baseUrl, int maxItems, string tag)
        {
            if (CurrentPage is null)
            {
                logger.LogWarning(
                    "ArticulateRssController.RenderTagsOrCategoriesRss: CurrentPage is null, returning 404");
                return NotFound();
            }

            // create a blog model of the main page
            var rootPageModel = new MasterModel(CurrentPage, publishedValueFallback);
            PostsByTagModel contentByTag = articulateTagService.GetContentByTag(
                umbracoHelper,
                rootPageModel,
                tag,
                tagGroup,
                baseUrl,
                1,
                maxItems);

            // super hack - but this is because we are replacing '.' with '-' in StringExtensions.EncodePath method
            // so if we get nothing, we'll retry with replacing back
            if (contentByTag.PostCount == 0 && tag.Contains('-'))
            {
                contentByTag = articulateTagService.GetContentByTag(
                    umbracoHelper,
                    rootPageModel,
                    tag.Replace('-', '.'),
                    tagGroup,
                    baseUrl,
                    1,
                    maxItems);
            }

            if (contentByTag.PostCount == 0 || contentByTag.Posts is null)
            {
                return NotFound();
            }

            SyndicationFeed feed = feedGenerator.GetFeed(rootPageModel, contentByTag.Posts.Take(maxItems));

            return new RssResult(feed, rootPageModel);
        }

        /// <summary>
        /// Returns the XSLT to render the RSS nicely in a browser
        /// </summary>
        /// <returns></returns>
        public IActionResult FeedXslt()
        {
            var result = Resources.FeedXslt;
            return Content(result, "text/xml");
        }
    }
}
