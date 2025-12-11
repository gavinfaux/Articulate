using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;

// TODO: #nullable enable
namespace Articulate.Models
{
    /// <summary>
    /// The basic model for all articulate objects
    /// </summary>
    public class MasterModel : PublishedContentWrapped, IMasterModel
    {
        private IPublishedContent _blogAuthorsNode;
        private int? _pageSize;

        /// <summary>
        /// The basic model for all articulate objects
        /// </summary>
        public MasterModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback) : base(content, publishedValueFallback) => PublishedValueFallback = publishedValueFallback;

        [Obsolete("Use MasterModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback)")]
        protected MasterModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback, IVariationContextAccessor variationContextAccessor)
            : this(content, publishedValueFallback)
        {
        }

        /// <summary>
        /// Returns the current theme
        /// </summary>
        public string Theme
        {
            get => field ??= Unwrap().Value<string>("theme", fallback: Fallback.ToAncestors);
            protected set;
        }

        /// <inheritdoc/>
        public IPublishedContent RootBlogNode
        {
            get
            {
                IPublishedContent root = Unwrap().AncestorOrSelf(ArticulateConstants.ContentType.Articulate);
                field = root ?? throw new InvalidOperationException("Could not find the Articulate root document for the current rendered page");
                return field;
            }
            protected set;
        }

        /// <summary>
        /// This will return the first archive node found under the blog root
        /// </summary>
        /// <remarks>
        /// We can support multiple archive nodes - TODO: Should we change this method to return an array of archive nodes?
        /// </remarks>
        public IPublishedContent BlogArchiveNode
        {
            get
            {
                IPublishedContent list = RootBlogNode.ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive)?.FirstOrDefault();
                field = list ?? throw new InvalidOperationException("Could not find the ArticulateArchive document for the current rendered page");

                return field;
            }
            protected set;
        }

        /// <summary>
        /// This will return the first archive node found under the blog root
        /// </summary>
        public IPublishedContent BlogAuthorsNode
        {
            get
            {
                IPublishedContent authors = RootBlogNode.ChildrenOfType(ArticulateConstants.ContentType.ArticulateAuthors)?.FirstOrDefault();
                _blogAuthorsNode = authors ?? throw new InvalidOperationException("Could not find the ArticulateAuthors document for the current rendered page");
                return _blogAuthorsNode;
            }
            protected set => BlogArchiveNode = value;
        }

        /// <inheritdoc/>
        public string DisqusShortName
        {
            get => field ??= Unwrap().Value<string>("disqusShortname", fallback: Fallback.ToAncestors);
            protected set;
        }

        /// <inheritdoc/>
        public string CustomRssFeed
        {
            get => field ??= RootBlogNode.Value<string>("customRssFeedUrl");
            protected set;
        }

        /// <inheritdoc/>
        public string BlogLogo
        {
            get => field ??= RootBlogNode.Value<MediaWithCrops>("blogLogo")?.GetCropUrl("square") ?? string.Empty;
            protected set;
        }

        /// <inheritdoc/>
        public string BlogBanner
        {
            get => field ??= RootBlogNode.Value<MediaWithCrops>("blogBanner")?.GetCropUrl("wide") ?? string.Empty;
            protected set;
        }

        /// <inheritdoc/>
        public string BlogTitle
        {
            get => field ??= Unwrap().Value<string>("blogTitle", fallback: Fallback.ToAncestors);
            protected set;
        }

        /// <inheritdoc/>
        public string BlogDescription
        {
            get => field ??= Unwrap().Value<string>("blogDescription", fallback: Fallback.ToAncestors);
            protected set;
        }

        /// <inheritdoc/>
        public int PageSize
        {
            get
            {
                if (!_pageSize.HasValue)
                {
                    _pageSize = Unwrap().Value("pageSize", fallback: Fallback.To(Fallback.Ancestors, Fallback.DefaultValue), defaultValue: 10);
                }

                return _pageSize.Value;
            }
            protected set => _pageSize = value;
        }

        /// <inheritdoc/>
        public string PageTitle
        {
            get => field ??= Name + " - " + BlogTitle;
            protected set;
        }

        /// <inheritdoc/>
        public string PageDescription
        {
            get => field ??= BlogDescription;
            protected set;
        }

        /// <inheritdoc/>
        public string PageTags { get; protected set; }

        [Obsolete("No longer used or supported", true)]
        public IVariationContextAccessor VariationContextAccessor => null;

        protected IPublishedValueFallback PublishedValueFallback { get; }
    }
}
