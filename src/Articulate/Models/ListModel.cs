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
            ArgumentNullException.ThrowIfNull(content, nameof(content));

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

        public ListModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback)
            : base(content, publishedValueFallback)
        {
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
        public IEnumerable<PostModel> Posts
        {
            get
            {
                if (field is not null)
                {
                    return field;
                }

                if (_listItems is null)
                {
                    field = ChildrenForAllCultures.Select(x => new PostModel(x, PublishedValueFallback)).ToArray();
                    return field;
                }

                if (_listItems is not null && Pages is not null)
                {
                    field = _listItems

                        // Skip will already be done in this case, but we'll take again anyways just to be safe
                        .Take(Pages.PageSize)
                        .Select(x => new PostModel(x, PublishedValueFallback))
                        .ToArray();
                }
                else
                {
                    field = [];
                }

                return field;
            }

            private set;
        }

        /// <summary>
        /// Gets the list of blog posts
        /// </summary>
        [Obsolete("Please use TryGetChildrenKeys() on IDocumentNavigationQueryService or IMediaNavigationQueryService instead. Scheduled for removal in V16.", false)]
        public override IEnumerable<IPublishedContent> Children => Posts;

        public IEnumerable<IPublishedContent> ChildrenForAllCultures => Posts;
    }
}
