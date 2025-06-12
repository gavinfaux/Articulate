//TODO: Broken, not returning anything see comments in Index method


using System;
using System.Linq;
using Articulate.Models;
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
using Umbraco.Extensions;

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
    public class ArticulateRssController : RenderController
    {
        private readonly IRssFeedGenerator _feedGenerator;
        private readonly IPublishedValueFallback _publishedValueFallback;
        private readonly IVariationContextAccessor _variationContextAccessor;
        private readonly UmbracoHelper _umbracoHelper;
        private readonly ArticulateTagService _articulateTagService;

        public ArticulateRssController(
            ILogger<RenderController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IRssFeedGenerator feedGenerator,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor,
            UmbracoHelper umbracoHelper,
            ArticulateTagService articulateTagService)
            : base(logger, compositeViewEngine, umbracoContextAccessor)
        {
            _feedGenerator = feedGenerator;
            _publishedValueFallback = publishedValueFallback;
            _variationContextAccessor = variationContextAccessor;
            _umbracoHelper = umbracoHelper;
            _articulateTagService = articulateTagService;
        }

        //NonAction so it is not routed since we want to use an overload below
        [NonAction]
        public override IActionResult Index() => Index(0);

        public IActionResult Index(int? maxItems)
        {
            if (!maxItems.HasValue)
                maxItems = 25;

            var listNodes = CurrentPage.Children
                .Where(x => x.ContentType.Alias.InvariantEquals(ArticulateConstants.ArticulateArchiveContentTypeAlias))
                .ToArray();
            if (listNodes.Length == 0)
            {
                throw new InvalidOperationException("An ArticulateArchive document must exist under the root Articulate document");
            }

            var pager = new PagerModel(maxItems.Value, 0, 1);

            var listNodeIds = listNodes.Select(x => x.Id).ToArray();

            var listItems = _umbracoHelper.GetPostsSortedByPublishedDate(pager, null, listNodeIds);

            var rootPageModel = new ListModel(
                listNodes[0],
                pager,
                listItems,
                _publishedValueFallback,
                _variationContextAccessor);

            //TODO: This returns null, when it should be two with the default content installed
            //TODO: This calls Umbraco.Web.Common.Extensions.FriendlyPublishedContentExtensions as below

            /*     public static IEnumerable<T>? Children<T>(this IPublishedContent content, string? culture = null)
            *         where T : class, IPublishedContent
            *         => content.Children<T>(GetNavigationQueryService(content), GetPublishedStatusFilteringService(content), culture);
            */

            var x = rootPageModel.Children<PostModel>().ToList();

            var feed = _feedGenerator.GetFeed(rootPageModel, rootPageModel.Children<PostModel>());

            return new RssResult(feed, rootPageModel);
        }

        public IActionResult Author(int authorId, int? maxItems)
        {
            var author = _umbracoHelper.Content(authorId);
            if (author == null)
                throw new ArgumentNullException(nameof(author));

            if (!maxItems.HasValue)
                maxItems = 25;

            //create a master model
            var masterModel = new MasterModel(author, _publishedValueFallback, _variationContextAccessor);

            var listNodes = masterModel.RootBlogNode.ChildrenOfType(ArticulateConstants.ArticulateArchiveContentTypeAlias).ToArray();

            var authorContenet = _umbracoHelper.GetContentByAuthor(
                listNodes,
                author.Name,
                new PagerModel(maxItems.Value, 0, 1),
                _publishedValueFallback,
                _variationContextAccessor);

            var feed = _feedGenerator.GetFeed(masterModel, authorContenet.Select(x => new PostModel(x, _publishedValueFallback, _variationContextAccessor)));

            return new RssResult(feed, masterModel);
        }

        public IActionResult Categories(string tag, int? maxItems)
        {
            if (tag == null)
                throw new ArgumentNullException(nameof(tag));

            if (!maxItems.HasValue)
                maxItems = 25;

            return RenderTagsOrCategoriesRss("ArticulateCategories", "categories", maxItems.Value, tag);
        }

        public IActionResult Tags(string tag, int? maxItems)
        {
            if (tag == null)
                throw new ArgumentNullException(nameof(tag));

            if (!maxItems.HasValue)
                maxItems = 25;

            return RenderTagsOrCategoriesRss("ArticulateTags", "tags", maxItems.Value, tag);
        }

        public IActionResult RenderTagsOrCategoriesRss(string tagGroup, string baseUrl, int maxItems, string tag)
        {
            //create a blog model of the main page
            var rootPageModel = new MasterModel(CurrentPage, _publishedValueFallback, _variationContextAccessor);

            PostsByTagModel contentByTag = _articulateTagService.GetContentByTag(
                _umbracoHelper,
                rootPageModel,
                tag,
                tagGroup,
                baseUrl,
                1,
                maxItems);

            //super hack - but this is because we are replacing '.' with '-' in StringExtensions.EncodePath method
            // so if we get nothing, we'll retry with replacing back
            if ((contentByTag == null || contentByTag.PostCount == 0) && tag.Contains('-'))
            {
                contentByTag = _articulateTagService.GetContentByTag(
                    _umbracoHelper,
                    rootPageModel,
                    tag.Replace('-', '.'),
                    tagGroup,
                    baseUrl,
                    1, maxItems);
            }

            if (contentByTag == null || contentByTag.PostCount == 0)
            {
                return NotFound();
            }

            var feed = _feedGenerator.GetFeed(rootPageModel, contentByTag.Posts.Take(maxItems));

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
