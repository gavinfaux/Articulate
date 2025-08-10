#nullable enable
using System.Globalization;
using System.ServiceModel.Syndication;
using Articulate.Models;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Syndication
{
    internal class RssFeedGenerator(ILogger<RssFeedGenerator> logger, IHostingEnvironment hostingEnvironment)
        : IRssFeedGenerator
    {
        public SyndicationFeed GetFeed(IMasterModel rootPageModel, IEnumerable<PostModel> posts)
        {
            var feed = new SyndicationFeed(
              rootPageModel.BlogTitle,
              rootPageModel.BlogDescription,
              new Uri(rootPageModel.RootBlogNode.Url(mode: UrlMode.Absolute)),
              GetFeedItems(rootPageModel, posts))
            {
                Generator = "Articulate, blogging built on Umbraco",
                ImageUrl = GetBlogImage(rootPageModel)
            };

            // TODO: attempting to add media:thumbnail...
            // feed.AttributeExtensions.Add(new XmlQualifiedName("media", "http://www.w3.org/2000/xmlns/"), "http://search.yahoo.com/mrss/");
            return feed;
        }

        protected virtual string GetPostContent(PostModel model) => model.Body.ToHtmlString();

        protected virtual SyndicationItem? GetFeedItem(PostModel post, string rootUrl)
        {
            var posturl = post.Url(mode: UrlMode.Absolute);

            // Cannot continue if the url cannot be resolved - probably has publishing issues
            if (posturl is ['#', ..])
            {
                return null;
            }

            var appPath = hostingEnvironment.ApplicationVirtualPath;
            var rootUri = new Uri(rootUrl);
            var mediaRoot = rootUri.GetLeftPart(UriPartial.Authority) + appPath.EnsureStartsWith('/').TrimEnd('/');

            var content = RssFeedGeneratorRegexes.RelativeMediaHrefRegex().Replace(GetPostContent(post), match => match.Groups.Count == 2 ? $" href=\"{rootUrl.TrimEnd('/')}{match.Groups[1].Value.EnsureStartsWith('/')}\"" : string.Empty);
            content = RssFeedGeneratorRegexes.RelativeMediaSrcRegex().Replace(content, match => match.Groups.Count == 2 ? $" src=\"{mediaRoot}{match.Groups[1].Value.EnsureStartsWith('/')}\"" : string.Empty);

            var item = new SyndicationItem(
                post.Name,
                new TextSyndicationContent(content, TextSyndicationContentKind.Html),
                new Uri(posturl),
                post.Id.ToString(CultureInfo.InvariantCulture),
                post.PublishedDate)
            {
                PublishDate = post.PublishedDate

                // don't include this as it will override the main content bits
                // Summary = new TextSyndicationContent(post.Excerpt)
            };

            // TODO: attempting to add media:thumbnail...
            // item.ElementExtensions.Add(new SyndicationElementExtension("thumbnail", "http://search.yahoo.com/mrss/", "This is a test!"));
            foreach (var c in post.Categories)
            {
                item.Categories.Add(new SyndicationCategory(c));
            }

            return item;
        }

        protected virtual Uri? GetBlogImage(IMasterModel rootPageModel)
        {
            Uri? logoUri = null;
            try
            {
                logoUri = rootPageModel.BlogLogo.IsNullOrWhiteSpace()
                    ? null
                    : new Uri(rootPageModel.BlogLogo, UriKind.RelativeOrAbsolute);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Could not convert the blog logo path to a Uri");
            }

            return logoUri;
        }

        private List<SyndicationItem> GetFeedItems(IMasterModel model, IEnumerable<PostModel> posts)
        {
            var rootUrl = model.RootBlogNode.Url(mode: UrlMode.Absolute);
            return !posts.Any() ? [] : posts.Select(post => GetFeedItem(post, rootUrl)).WhereNotNull().ToList();
        }
    }
}
