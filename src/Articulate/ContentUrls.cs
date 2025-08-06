#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;

namespace Articulate
{
    public class ContentUrls
    {
        private readonly IPublishedUrlProvider _publishedUrlProvider;

        public ContentUrls(
            IUmbracoContextAccessor umbracoContextAccessor,
            IPublishedUrlProvider publishedUrlProvider)
        {
            _publishedUrlProvider = publishedUrlProvider;
        }

        /// <summary>
        /// Returns the content item URLs taking into account any domains assigned
        /// </summary>
        /// <param name="publishedContent"></param>
        /// <returns></returns>
        internal HashSet<string> GetContentUrls(IPublishedContent publishedContent)
        {
            HashSet<string> allUrls;
            UrlInfo[] other = _publishedUrlProvider.GetOtherUrls(publishedContent.Id).ToArray();
            if (other.Length > 0)
            {
                IEnumerable<string> urls = other.Where(x => x.IsUrl && string.IsNullOrEmpty(x.Text) == false).Select(x => x.Text);

                //this means there are domains assigned
                allUrls = new HashSet<string>(urls)
                {
                    _publishedUrlProvider.GetUrl(publishedContent.Id, UrlMode.Absolute)
                };
            }
            else
            {
                allUrls = new HashSet<string>
                {
                    publishedContent.Url()
                };
            }

            return allUrls;
        }
    }
}
