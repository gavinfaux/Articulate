#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models
{
    public interface IMasterModel : IPublishedContent
    {
        /// <summary>
        /// Gets the current theme
        /// </summary>
        public string Theme { get; }

        public IPublishedContent RootBlogNode { get; }

        public IPublishedContent BlogArchiveNode { get; }

        public IPublishedContent BlogAuthorsNode { get; }

        public string BlogTitle { get; }

        public string BlogDescription { get; }

        public string BlogLogo { get; }

        /// <summary>
        /// Gets the blog logo URL with CSS escaping for safe use in inline style attributes
        /// </summary>
        public string? BlogLogoCss { get; }

        public string BlogBanner { get; }

        /// <summary>
        /// Gets the blog banner URL with CSS escaping for safe use in inline style attributes
        /// </summary>
        public string? BlogBannerCss { get; }

        public int PageSize { get; }

        public string DisqusShortName { get; }

        /// <summary>
        /// Gets whether Disqus comments are enabled and configured with a valid shortname
        /// </summary>
        public bool IsDisqusEnabled { get; }

        public string CustomRssFeed { get; }

        public string PageTitle { get; }

        public string PageDescription { get; }

        public string PageTags { get; }
    }
}
