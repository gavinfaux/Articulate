using Articulate.Services;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Web.Common;
using PublishedContentExtensions = Articulate.Models.PublishedContentExtensions;

// TODO: #nullable enable
namespace Articulate
{
    /// <summary>
    /// Extension methods for <see cref="UmbracoHelper"/>.
    /// </summary>
    public static class UmbracoHelperExtensions
    {
        /// <summary>
        /// Gets the total number of posts.
        /// </summary>
        public static int GetPostCount(this UmbracoHelper helper, params int[] articulateArchiveIds)
        {
            var totalPosts = articulateArchiveIds
                .Select(helper.Content)
                .WhereNotNull()
                .SelectMany(x => x.Descendants())
                .Count();

            return totalPosts;
        }

        /// <summary>
        /// Gets the total number of posts for a specific author.
        /// </summary>
        public static int GetPostCount(this UmbracoHelper helper, string authorName, params int[] articulateArchiveIds)
        {
            var totalPosts = articulateArchiveIds
                .Select(helper.Content)
                .WhereNotNull()
                .SelectMany(x => x.Descendants().Where(d => d.Value<string>("author") == authorName))
                .Count();

            return totalPosts;
        }

        /// <summary>
        /// Gets posts sorted by published date.
        /// </summary>
        public static IEnumerable<IPublishedContent> GetPostsSortedByPublishedDate(
            this UmbracoHelper helper,
            PagerModel pager,
            Func<IPublishedContent, bool> filter,
            params int[] articulateArchiveIds)
        {
            IEnumerable<IPublishedContent> posts = articulateArchiveIds
                .Select(helper.Content)
                .WhereNotNull()
                .SelectMany(x => x.Descendants());

            // apply a filter if there is one
            if (filter is not null)
            {
                posts = posts.Where(filter);
            }

            // now do the ordering
            posts = posts.OrderByDescending(x => x.Value<DateTime>("publishedDate"))
                .Skip(pager.CurrentPageIndex * pager.PageSize)
                .Take(pager.PageSize);

            return posts;
        }

        /// <summary>
        /// Gets a collection of tags for the blog.
        /// </summary>
        // Not used internally or by default themes, but exposed for custom themes
        public static PostTagCollection GetPostTagCollection(
            this UmbracoHelper helper,
            IMasterModel masterModel,
            ITagQuery tagQuery,
            ArticulateTagService articulateTagService)
        {
            var tagsBaseUrl = masterModel.RootBlogNode.Value<string>("tagsUrlName") ?? "tags";

            IEnumerable<PostsByTagModel> contentByTags = articulateTagService.GetContentByTags(
                helper,
                tagQuery,
                masterModel,
                ArticulateConstants.DataType.ArticulateTags,
                tagsBaseUrl);

            return new PostTagCollection(contentByTags);
        }

        /// <summary>
        /// Gets a list of the most recent posts.
        /// </summary>
        // Not used internally or by default themes, but exposed for custom themes
        public static IEnumerable<PostModel> GetRecentPosts(
            this UmbracoHelper helper,
            IMasterModel masterModel,
            int count,
            IPublishedValueFallback publishedValueFallback)
        {
            IPublishedContent[] listNodes = PublishedContentExtensions.GetListNodes(masterModel);

            var listNodeIds = listNodes.Select(x => x.Id).ToArray();

            var pager = new PagerModel(count, 0, 1);

            IEnumerable<IPublishedContent> listItems =
                helper.GetPostsSortedByPublishedDate(pager, null, listNodeIds);

            var rootPageModel = new ListModel(listNodes[0], pager, listItems, publishedValueFallback);
            return rootPageModel.Posts;
        }

        /// <summary>
        /// Returns a list of the most recent posts
        /// </summary>
        /// <param name="helper"></param>
        /// <param name="masterModel"></param>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <param name="publishedValueFallback"></param>
        /// <returns></returns>
        public static IEnumerable<PostModel> GetRecentPosts(
            this UmbracoHelper helper,
            IMasterModel masterModel,
            int page,
            int pageSize,
            IPublishedValueFallback publishedValueFallback)
        {
            IPublishedContent[] listNodes = PublishedContentExtensions.GetListNodes(masterModel);

            var listNodeIds = listNodes.Select(x => x.Id).ToArray();

            var pager = new PagerModel(pageSize, page - 1, 1);

            IEnumerable<IPublishedContent> listItems =
                helper.GetPostsSortedByPublishedDate(pager, null, listNodeIds);

            var rootPageModel = new ListModel(listNodes[0], pager, listItems, publishedValueFallback);
            return rootPageModel.Posts;
        }

        /// <summary>
        /// Returns a list of the most recent posts by archive
        /// </summary>
        /// <param name="helper"></param>
        /// <param name="masterModel"></param>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <param name="publishedValueFallback"></param>
        /// <returns></returns>
        public static IEnumerable<PostModel> GetRecentPostsByArchive(
            this UmbracoHelper helper,
            IMasterModel masterModel,
            int page,
            int pageSize,
            IPublishedValueFallback publishedValueFallback)
        {
            var pager = new PagerModel(pageSize, page - 1, 1);

            IEnumerable<IPublishedContent> listItems =
                helper.GetPostsSortedByPublishedDate(pager, null, masterModel.Id);

            var rootPageModel = new ListModel(masterModel, pager, listItems, publishedValueFallback);
            return rootPageModel.Posts;
        }

        internal static IEnumerable<IPublishedContent> GetContentByAuthor(
            this UmbracoHelper helper,
            IPublishedContent[] listNodes,
            string authorName,
            PagerModel pager,
            IPublishedValueFallback publishedValueFallback)
        {
            var listNodeIds = listNodes.Select(x => x.Id).ToArray();

            IEnumerable<IPublishedContent> postWithAuthor = helper.GetPostsSortedByPublishedDate(
                pager,
                x => string.Equals(
                    x.Value<string>("author"),
                    authorName.Replace('-', ' '),
                    StringComparison.InvariantCultureIgnoreCase),
                listNodeIds);

            var rootPageModel = new ListModel(listNodes[0], pager, postWithAuthor, publishedValueFallback);
            return rootPageModel.Posts;
        }
    }
}
