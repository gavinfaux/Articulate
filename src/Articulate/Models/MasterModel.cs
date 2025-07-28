using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Articulate.Models
{
    /// <summary>
    /// The basic model for all articulate objects
    /// </summary>
    public class MasterModel : PublishedContentWrapped, IMasterModel
    {
        public MasterModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback)
            : base(content, publishedValueFallback)
        {
            PublishedValueFallback = publishedValueFallback;
        }

        /// <summary>
        /// Returns the current theme
        /// </summary>
        public string Theme
        {
            get => _theme ??= Unwrap().Value<string>("theme", fallback: Fallback.ToAncestors);
            protected set => _theme = value;
        }

        public IPublishedContent RootBlogNode
        {
            get
            {
                IPublishedContent root = Unwrap().AncestorOrSelf(ArticulateConstants.ContentType.Articulate);
                _rootBlogNode = root ?? throw new InvalidOperationException("Could not find the Articulate root document for the current rendered page");
                return _rootBlogNode;
            }
            protected set => _rootBlogNode = value;
        }

        private IPublishedContent _rootBlogNode;
        private string _theme;
        private IPublishedContent _blogListNode;
        private IPublishedContent _blogAuthorsNode;
        private int? _pageSize;
        private string _blogTitle;
        private string _blogDescription;
        private string _blogBanner;
        private string _blogLogo;
        private string _disqusShortName;
        private string _customRssFeed;

        private string _pageTitle;
        private string _pageDescription;

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
                IPublishedContent list = RootBlogNode.ChildrenOfType(ArticulateConstants.ContentType.ArticulateArchive).FirstOrDefault();
                _blogListNode = list ?? throw new InvalidOperationException("Could not find the ArticulateArchive document for the current rendered page");
                return _blogListNode;
            }
            protected set => _blogListNode = value;
        }

        /// <summary>
        /// This will return the first archive node found under the blog root
        /// </summary>
        public IPublishedContent BlogAuthorsNode
        {
            get
            {
                IPublishedContent authors = RootBlogNode.ChildrenOfType(ArticulateConstants.ContentType.ArticulateAuthors).FirstOrDefault();
                _blogAuthorsNode = authors ?? throw new InvalidOperationException("Could not find the ArticulateAuthors document for the current rendered page");
                return _blogAuthorsNode;
            }
            protected set => _blogListNode = value;
        }

        public string DisqusShortName
        {
            get => _disqusShortName ??= Unwrap().Value<string>("disqusShortname", fallback: Fallback.ToAncestors);
            protected set => _disqusShortName = value;
        }

        public string CustomRssFeed
        {
            get => _customRssFeed ??= RootBlogNode.Value<string>("customRssFeedUrl");
            protected set => _customRssFeed = value;
        }

        public string BlogLogo
        {
            get => _blogLogo ??= RootBlogNode.GetCroppedImageUrl("blogLogo", "square");
            protected set => _blogLogo = value;
        }

        public string BlogBanner
        {
            get => _blogBanner ??= RootBlogNode.GetCroppedImageUrl("blogBanner", "wide");
            protected set => _blogBanner = value;
        }

        public string BlogTitle
        {
            get => _blogTitle ??= Unwrap().Value<string>("blogTitle", fallback: Fallback.ToAncestors);
            protected set => _blogTitle = value;
        }

        public string BlogDescription
        {
            get => _blogDescription ??= Unwrap().Value<string>("blogDescription", fallback: Fallback.ToAncestors);
            protected set => _blogDescription = value;
        }

        public int PageSize
        {
            get
            {
                if (_pageSize.HasValue == false)
                {
                    _pageSize = Unwrap().Value("pageSize", fallback: Fallback.To(Fallback.Ancestors, Fallback.DefaultValue), defaultValue: 10);
                }

                return _pageSize.Value;
            }
            protected set => _pageSize = value;
        }

        public string PageTitle
        {
            get => _pageTitle ??= Name + " - " + BlogTitle;
            protected set => _pageTitle = value;
        }

        public string PageDescription
        {
            get => _pageDescription ??= BlogDescription;
            protected set => _pageDescription = value;
        }

        public string PageTags { get; protected set; }
        public IPublishedValueFallback PublishedValueFallback { get; }
    }
}
