using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Extensions;

namespace Articulate
{
    public class ContentUrls(IPublishedUrlProvider publishedUrlProvider)
    {
        /// <summary>
        /// Returns the content item URLs taking into account any domains assigned
        /// </summary>
        /// <param name="publishedContent"></param>
        /// <returns></returns>
        internal HashSet<string> GetContentUrls(IPublishedContent publishedContent)
        {
            HashSet<string> allUrls;
            var other = publishedUrlProvider.GetOtherUrls(publishedContent.Id).ToArray();
            if (other.Length > 0)
            {
                var urls = other.Where(x => x.IsUrl && string.IsNullOrEmpty(x.Text) == false).Select(x => x.Text);

                //this means there are domains assigned
                allUrls = [.. urls, publishedUrlProvider.GetUrl(publishedContent.Id, UrlMode.Absolute)];
            }
            else
            {
                allUrls = [publishedContent.Url()];
            }

            return allUrls;
        }
    }
}
