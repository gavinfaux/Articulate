using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.ServiceModel.Syndication;
using System.Text.RegularExpressions;
using Articulate.Models;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Articulate.Syndication
{
    public class RssFeedGenerator : IRssFeedGenerator
    {
        private readonly ILogger<RssFeedGenerator> _logger;
        private readonly IHostingEnvironment _hostingEnvironment;

        public RssFeedGenerator(ILogger<RssFeedGenerator> logger, IHostingEnvironment hostingEnvironment)
        {
            _logger = logger;
            _hostingEnvironment = hostingEnvironment;
        }

        private readonly Regex _relativeMediaSrc = new Regex(" src=(?:\"|')(/media/.*?)(?:\"|')", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private readonly Regex _relativeMediaHref = new Regex(" href=(?:\"|')(/media/.*?)(?:\"|')", RegexOptions.Compiled | RegexOptions.IgnoreCase);

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

            //TODO: attempting to add media:thumbnail...
            //feed.AttributeExtensions.Add(new XmlQualifiedName("media", "http://www.w3.org/2000/xmlns/"), "http://search.yahoo.com/mrss/");

            return feed;
        }

        protected virtual string GetPostContent(PostModel model)
        {
            return model.Body.ToHtmlString();
        }

        protected virtual SyndicationItem GetFeedItem(IMasterModel model, PostModel post, string rootUrl)
        {
            var posturl = post.Url(mode: UrlMode.Absolute);

            //Cannot continue if the url cannot be resolved - probably has publishing issues
            if (posturl.StartsWith("#"))
            {
                return null;
            }

            var appPath = _hostingEnvironment.ApplicationVirtualPath;
            var rootUri = new Uri(rootUrl);
            var mediaRoot = rootUri.GetLeftPart(UriPartial.Authority) + appPath.EnsureStartsWith('/').TrimEnd('/');

            var content = _relativeMediaHref.Replace(GetPostContent(post), match =>
            {
                if (match.Groups.Count == 2)
                {
                    return $" href=\"{rootUrl.TrimEnd('/')}{match.Groups[1].Value.EnsureStartsWith('/')}\"";
                }

                return null;
            });
            content = _relativeMediaSrc.Replace(content, match =>
            {
                if (match.Groups.Count == 2)
                {
                    return $" src=\"{mediaRoot}{match.Groups[1].Value.EnsureStartsWith('/')}\"";
                }

                return null;
            });            

            var item = new SyndicationItem(
                post.Name,
                new TextSyndicationContent(content, TextSyndicationContentKind.Html),
                new Uri(posturl),
                post.Id.ToString(CultureInfo.InvariantCulture),
                post.PublishedDate)
            {
                PublishDate = post.PublishedDate,

                //don't include this as it will override the main content bits
                //Summary = new TextSyndicationContent(post.Excerpt)
            };

            //TODO: attempting to add media:thumbnail...
            //item.ElementExtensions.Add(new SyndicationElementExtension("thumbnail", "http://search.yahoo.com/mrss/", "This is a test!"));

            foreach (var c in post.Categories)
            {
                item.Categories.Add(new SyndicationCategory(c));
            }

            return item;
        }

        private IEnumerable<SyndicationItem> GetFeedItems(IMasterModel model, IEnumerable<PostModel> posts)
        {
            var rootUrl = model.RootBlogNode.Url(mode: UrlMode.Absolute);
            return posts.Select(post => GetFeedItem(model, post, rootUrl)).WhereNotNull().ToList();
        }

        protected virtual Uri GetBlogImage(IMasterModel rootPageModel)
        {
            Uri logoUri = null;
            try
            {
                logoUri = rootPageModel.BlogLogo.IsNullOrWhiteSpace()
                    ? null
                    : new Uri(rootPageModel.BlogLogo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not convert the blog logo path to a Uri");
            }

            return logoUri;
        }

        
    }
}
