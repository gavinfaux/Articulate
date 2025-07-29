#nullable enable
using System.ServiceModel.Syndication;
using Articulate.Attributes;
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
        private readonly UmbracoHelper _umbracoHelper;
        private readonly ArticulateTagService _articulateTagService;
        private readonly ILogger<ArticulateRssController> _logger;

        public ArticulateRssController(
            ILogger<ArticulateRssController> logger,
            ICompositeViewEngine compositeViewEngine,
            IUmbracoContextAccessor umbracoContextAccessor,
            IRssFeedGenerator feedGenerator,
            IPublishedValueFallback publishedValueFallback,
            UmbracoHelper umbracoHelper,
            ArticulateTagService articulateTagService)
            : base(logger, compositeViewEngine, umbracoContextAccessor)
        {
            _feedGenerator = feedGenerator;
            _publishedValueFallback = publishedValueFallback;
            _umbracoHelper = umbracoHelper;
            _articulateTagService = articulateTagService;
            _logger = logger;
        }

        //NonAction so it is not routed since we want to use an overload below
        [NonAction]
        public override IActionResult Index() => Index(0);

        public IActionResult Index(int? maxItems)
        {
            if (CurrentPage is null)
            {
                _logger.LogWarning("ArticulateRssController.Index: CurrentPage is null, returning 404");
                return NotFound();
            }

            maxItems ??= 25;

            IPublishedContent[] listNodes = CurrentPage.Children()
                .Where(x => x.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateArchive))
                .ToArray();
            if (listNodes.Length == 0)
            {
                throw new InvalidOperationException("An ArticulateArchive document must exist under the root Articulate document");
            }

            var pager = new PagerModel(maxItems.Value, 0, 1);

            var listNodeIds = listNodes.Select(x => x.Id).ToArray();

            IEnumerable<IPublishedContent> listItems = _umbracoHelper.GetPostsSortedByPublishedDate(pager, null, listNodeIds) ?? [];

            var rootPageModel = new ListModel(
                listNodes[0],
                pager,
                listItems,
                _publishedValueFallback);

            /*
              TODO: Raise issue / debug Umbraco Core - This returns null, when it should be two with the default content installed

              var feed = _feedGenerator.GetFeed(rootPageModel, rootPageModel.Children<PostModel>());

              where .Children<PostModel>() calls this:

              public static IEnumerable<T>? Children<T>(this IPublishedContent content, string? culture = null)
                 where T : class, IPublishedContent
                    => content.Children<T>(GetNavigationQueryService(content), GetPublishedStatusFilteringService(content), culture);
            */

            // Work around for above issue
            IEnumerable<PostModel> posts = _umbracoHelper.GetPostsSortedByPublishedDate(
                    pager, null, rootPageModel.Id)
                .Select(x => new PostModel(x, _publishedValueFallback));

            SyndicationFeed feed = _feedGenerator.GetFeed(rootPageModel, posts);

            return new RssResult(feed, rootPageModel);
        }

        public IActionResult Author(int authorId, int? maxItems)
        {
            IPublishedContent? author = _umbracoHelper.Content(authorId);
            if (author is null)
            {
                throw new ArgumentNullException(nameof(author));
            }

            maxItems ??= 25;

            //create a master model
            var masterModel = new MasterModel(author, _publishedValueFallback);

            IPublishedContent[]? listNodes = masterModel.RootBlogNode.ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.ToArray();
            if (listNodes is null || listNodes.Length == 0)
            {
                throw new InvalidOperationException("An ArticulateArchive document must exist under the root Articulate document");
            }

            IEnumerable<IPublishedContent> authorContent = _umbracoHelper.GetContentByAuthor(
                listNodes,
                author.Name,
                new PagerModel(maxItems.Value, 0, 1),
                _publishedValueFallback);

            SyndicationFeed feed = _feedGenerator.GetFeed(masterModel, authorContent.Select(x => new PostModel(x, _publishedValueFallback)));

            return new RssResult(feed, masterModel);
        }

        public IActionResult Categories(string tag, int? maxItems)
        {
            if (tag is null)
            {
                throw new ArgumentNullException(nameof(tag));
            }

            maxItems ??= 25;

            return RenderTagsOrCategoriesRss(ArticulateConstants.DataType.ArticulateCategories, "categories", maxItems.Value, tag);
        }

        public IActionResult Tags(string tag, int? maxItems)
        {
            if (tag is null)
            {
                throw new ArgumentNullException(nameof(tag));
            }

            maxItems ??= 25;

            return RenderTagsOrCategoriesRss(ArticulateConstants.DataType.ArticulateTags, "tags", maxItems.Value, tag);
        }

        public IActionResult RenderTagsOrCategoriesRss(string tagGroup, string baseUrl, int maxItems, string tag)
        {
            //create a blog model of the main page
            var rootPageModel = new MasterModel(CurrentPage, _publishedValueFallback);

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
            if (contentByTag.PostCount == 0 && tag.Contains('-'))
            {
                contentByTag = _articulateTagService.GetContentByTag(
                    _umbracoHelper,
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

            SyndicationFeed feed = _feedGenerator.GetFeed(rootPageModel, contentByTag.Posts.Take(maxItems));

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
