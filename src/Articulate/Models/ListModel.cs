#nullable enable
using Umbraco.Cms.Core.Media;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models
{
    /// <summary>
    /// Represents a page that displays a list of blog posts
    /// </summary>
    public class ListModel : MasterModel
    {
        private readonly IEnumerable<IPublishedContent>? _listItems;
        private readonly Lazy<PostModel[]> _posts;

        /// <summary>
        /// Accepts an explicit list of child items
        /// </summary>
        /// <param name="content"></param>
        /// <param name="listItems"></param>
        /// <param name="pager"></param>
        /// <param name="publishedValueFallback"></param>
        /// <remarks>
        /// Default sorting by published date will be disabled for this list model, it is assumed that the list items will
        /// already be sorted.
        /// </remarks>
        public ListModel(
            IPublishedContent? content,
            PagerModel? pager,
            IEnumerable<IPublishedContent>? listItems,
            IPublishedValueFallback publishedValueFallback)
            : base(content, publishedValueFallback)
        {
            ArgumentNullException.ThrowIfNull(content);

            Pages = pager ?? throw new ArgumentNullException(nameof(pager));
            _listItems = listItems ?? throw new ArgumentNullException(nameof(listItems));
            if (content.ContentType.Alias.Equals(ArticulateConstants.ContentType.ArticulateArchive))
            {
                PageTitle = BlogTitle + " - " + BlogDescription;
            }
            else
            {
                PageTags = Name;
            }

            _posts = new Lazy<PostModel[]>(BuildPosts, LazyThreadSafetyMode.ExecutionAndPublication);
        }

        [Obsolete("Use ListModel(IPublishedContent? content, PagerModel? pager, IEnumerable<IPublishedContent>? listItems, IPublishedValueFallback publishedValueFallback)")]
        public ListModel(
            IPublishedContent? content,
            PagerModel? pager,
            IEnumerable<IPublishedContent>? listItems,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor)
            : this(content, pager, listItems, publishedValueFallback)
        {
        }

        [Obsolete("Prefer ListModel(IPublishedContent? content, PagerModel? pager, IEnumerable<IPublishedContent>? listItems, IPublishedValueFallback publishedValueFallback). This overload falls back to content children which are obsolete in Umbraco v16+.", false)]
        public ListModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback)
            : base(content, publishedValueFallback)
        {
            ArgumentNullException.ThrowIfNull(content);
            _posts = new Lazy<PostModel[]>(BuildPosts, LazyThreadSafetyMode.ExecutionAndPublication);
        }

        [Obsolete("Use ListModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback)")]
        public ListModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback, IVariationContextAccessor variationContextAccessor) : this(content, publishedValueFallback)
        {
        }

        [Obsolete("No longer used or supported", true)]
        public IImageUrlGenerator? ImageUrlGenerator => null;

        /// <summary>
        /// Gets the pager model
        /// </summary>
        public PagerModel? Pages { get; }

        /// <summary>
        /// Gets a strongly typed access to the list of blog posts
        /// </summary>
        public IEnumerable<PostModel> Posts => _posts.Value;

        /// <summary>
        /// Gets the list of blog posts
        /// </summary>
        [Obsolete("Please use TryGetChildrenKeys() on IDocumentNavigationQueryService or IMediaNavigationQueryService instead. Scheduled for removal in V16.", false)]
        public override IEnumerable<IPublishedContent> Children => Posts;

        [Obsolete("PublishedContentWrapped.Children' is obsolete: 'Please use TryGetChildrenKeys() on IDocumentNavigationQueryService or IMediaNavigationQueryService instead. Scheduled for removal in V16.'")]
        public IEnumerable<IPublishedContent> ChildrenForAllCultures => base.Children;

        private PostModel[] BuildPosts()
        {
            if (_listItems is null)
            {
                // TODO: PublishedContentWrapped.Children' is obsolete: 'Please use TryGetChildrenKeys() on IDocumentNavigationQueryService or IMediaNavigationQueryService instead. Scheduled for removal in V16.'
                return base.Children.Select(x => new PostModel(x, PublishedValueFallback)).ToArray();
            }

            IEnumerable<IPublishedContent> items = _listItems;
            if (Pages is not null)
            {
                // Apply page size limit to the pre-filtered list items
                items = items.Take(Pages.PageSize);
            }

            return items
                .Select(x => new PostModel(x, PublishedValueFallback))
                .ToArray();
        }
    }
}
