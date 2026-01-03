#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Web;

namespace Articulate.Models
{
    /// <summary>
    /// Represents a page that displays a list of blog posts
    /// </summary>
    public class ListModel : MasterModel
    {
        private readonly IEnumerable<IPublishedContent>? _listItems;
        private readonly Lazy<PostModel[]> _posts;
        private readonly IDocumentNavigationQueryService? _navigationQueryService;
        private readonly IPublishedContentCache? _publishedContentCache;
        private readonly IUmbracoContextAccessor? _umbracoContextAccessor;

        /// <summary>
        /// Accepts an explicit list of child items
        /// </summary>
        /// <param name="content"></param>
        /// <param name="listItems"></param>
        /// <param name="pager"></param>
        /// <param name="publishedValueFallback"></param>
        /// <param name="navigationQueryService">Optional navigation service for loading children when listItems is null</param>
        /// <param name="publishedContentCache">Optional content cache for loading children when listItems is null</param>
        /// <param name="umbracoContextAccessor">Optional Umbraco context accessor for loading children when listItems is null</param>
        /// <remarks>
        /// Default sorting by published date will be disabled for this list model, it is assumed that the list items will
        /// already be sorted.
        /// </remarks>
        public ListModel(
            IPublishedContent? content,
            PagerModel? pager,
            IEnumerable<IPublishedContent>? listItems,
            IPublishedValueFallback publishedValueFallback,
            IDocumentNavigationQueryService? navigationQueryService = null,
            IPublishedContentCache? publishedContentCache = null,
            IUmbracoContextAccessor? umbracoContextAccessor = null)
            : base(content, publishedValueFallback)
        {
            ArgumentNullException.ThrowIfNull(content);

            Pages = pager ?? throw new ArgumentNullException(nameof(pager));
            _listItems = listItems ?? throw new ArgumentNullException(nameof(listItems));
            _navigationQueryService = navigationQueryService;
            _publishedContentCache = publishedContentCache;
            _umbracoContextAccessor = umbracoContextAccessor;

            var contentName = content.Name;
            if (content.ContentType.Alias.Equals(ArticulateConstants.ContentType.ArticulateArchive))
            {
                PageTitle = BlogTitle + " - " + BlogDescription;
            }
            else
            {
                PageTags = contentName;
            }

            _posts = new Lazy<PostModel[]>(BuildPosts, LazyThreadSafetyMode.ExecutionAndPublication);
        }

        /// <summary>
        /// Gets the pager model
        /// </summary>
        public PagerModel? Pages { get; }

        /// <summary>
        /// Gets a strongly typed access to the list of blog posts
        /// </summary>
        public IEnumerable<PostModel> Posts => _posts.Value;

        private PostModel[] BuildPosts()
        {
            if (_listItems is null)
            {
                // Use navigation service to get children
                if (_navigationQueryService is null || _publishedContentCache is null ||
                    _umbracoContextAccessor is null)
                {
                    throw new InvalidOperationException(
                        "Cannot build posts from children without IDocumentNavigationQueryService, IPublishedContentCache, and IUmbracoContextAccessor. " +
                        "Use the constructor that accepts these dependencies or provide explicit listItems.");
                }

                if (!_umbracoContextAccessor.TryGetUmbracoContext(out IUmbracoContext? umbracoContext) ||
                    !_navigationQueryService.TryGetChildrenKeys(Unwrap().Key, out IEnumerable<Guid> childKeys))
                {
                    return [];
                }

                return childKeys
                    .Select(key => _publishedContentCache.GetById(umbracoContext.InPreviewMode, key))
                    .Where(x => x is not null)
                    .Select(x => new PostModel(x!, PublishedValueFallback))
                    .ToArray();
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
