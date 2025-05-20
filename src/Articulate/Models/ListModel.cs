using Umbraco.Cms.Core.Media;
using Umbraco.Cms.Core.Models.PublishedContent;
#if NET9_0_OR_GREATER
using Umbraco.Cms.Core.Services.Navigation;
#endif
using Umbraco.Extensions;

namespace Articulate.Models
{
    /// <summary>
    /// Represents a page that displays a list of blog posts
    /// </summary>
    public class ListModel : MasterModel
    {
        private readonly IEnumerable<IPublishedContent> _listItems;
        private IEnumerable<PostModel> _resolvedList;
#if NET9_0_OR_GREATER
        private readonly INavigationQueryService _navigationQueryService;
        private readonly IPublishedContentStatusFilteringService _publishedContentStatusFilteringService;
#endif

        /// <summary>
        /// Constructor accepting an explicit list of child items
        /// </summary>
        /// <param name="content"></param>
        /// <param name="listItems"></param>
        /// <param name="pager"></param>
        /// <remarks>
        /// Default sorting by published date will be disabled for this list model, it is assumed that the list items will
        /// already be sorted.
        /// </remarks>
#if NET9_0_OR_GREATER
        public ListModel(
            IPublishedContent content,
            PagerModel pager,
            IEnumerable<IPublishedContent> listItems,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor,
            INavigationQueryService navigationQueryService,
            IPublishedContentStatusFilteringService publishedContentStatusFilteringService)
            : base(content, publishedValueFallback, variationContextAccessor)
        {
            
            if (content == null) throw new ArgumentNullException(nameof(content));
            if (listItems == null) throw new ArgumentNullException(nameof(listItems));
            if (pager == null) throw new ArgumentNullException(nameof(pager));

            _navigationQueryService = navigationQueryService;
            _publishedContentStatusFilteringService = publishedContentStatusFilteringService;

            Pages = pager;
            _listItems = listItems;
            if (content.ContentType.Alias.Equals(ArticulateConstants.ArticulateArchiveContentTypeAlias))
                PageTitle = BlogTitle + " - " + BlogDescription;
            else
                PageTags = Name;
        }
#else
        public ListModel(
            IPublishedContent content,
            PagerModel pager,
            IEnumerable<IPublishedContent> listItems,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor)
            : base(content, publishedValueFallback, variationContextAccessor)
        {
            
            if (content == null) throw new ArgumentNullException(nameof(content));
            if (listItems == null) throw new ArgumentNullException(nameof(listItems));
            if (pager == null) throw new ArgumentNullException(nameof(pager));

            Pages = pager;
            _listItems = listItems;
            if (content.ContentType.Alias.Equals(ArticulateConstants.ArticulateArchiveContentTypeAlias))
                PageTitle = BlogTitle + " - " + BlogDescription;
            else
                PageTags = Name;
        }        
#endif
        public ListModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback, IVariationContextAccessor variationContextAccessor)
            : base(content, publishedValueFallback, variationContextAccessor)
        {
        }

        public IImageUrlGenerator ImageUrlGenerator { get; }

        /// <summary>
        /// The pager model
        /// </summary>
        public PagerModel Pages { get; }

        /// <summary>
        /// Strongly typed access to the list of blog posts
        /// </summary>
        public IEnumerable<PostModel> Posts
        {
            get
            {

                if (_resolvedList != null)
                    return _resolvedList;

                if (_listItems == null)
                {
#if NET9_0_OR_GREATER
                    _resolvedList = base.Unwrap()
                        .Children(_navigationQueryService, _publishedContentStatusFilteringService, culture: "*")
                        .Select(x => new PostModel(x, PublishedValueFallback, VariationContextAccessor))
                        .ToArray();
                    return _resolvedList;
#else
                    _resolvedList = base.Unwrap()
                        .Children()
                        .Select(x => new PostModel(x, PublishedValueFallback, VariationContextAccessor))
                        .ToArray();
                    return _resolvedList;
#endif
                }

                if (_listItems != null && Pages != null)
                {
                    _resolvedList = _listItems
                    //Skip will already be done in this case, but we'll take again anyways just to be safe                    
                        .Take(Pages.PageSize)
                        .Select(x => new PostModel(x, PublishedValueFallback, VariationContextAccessor))
                        .ToArray();
                }
                else
                {
                    _resolvedList = Enumerable.Empty<PostModel>();
                }

                return _resolvedList;
            }
        }

        /// <summary>
        /// The list of blog posts
        /// </summary>
        [Obsolete]
        public override IEnumerable<IPublishedContent> Children => Posts;

    }
}
