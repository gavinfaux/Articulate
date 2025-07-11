using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models
{
    public interface IMasterModel : IPublishedContent
    {
        /// <summary>
        /// Returns the current theme
        /// </summary>
        public string Theme { get; }

        public IPublishedContent RootBlogNode { get; }
        public IPublishedContent BlogArchiveNode { get; }
        public IPublishedContent BlogAuthorsNode { get; }
        public string BlogTitle { get; }
        public string BlogDescription { get; }
        public string BlogLogo { get; }
        public string BlogBanner { get; }
        public int PageSize { get; }
        public string DisqusShortName { get; }
        public string CustomRssFeed { get; }

        public string PageTitle { get; }
        public string PageDescription { get; }
        public string PageTags { get; }
    }
}
