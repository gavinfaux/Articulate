#nullable enable
using System.Globalization;
using System.Text;
using System.Xml.Linq;
using Argotic.Syndication.Specialized;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;

namespace Articulate.ImportExport
{
    // ReSharper disable once ClassNeverInstantiated.Global
    public class DisqusXmlExporter(
        IPublishedUrlProvider publishedUrlProvider,
        ILogger<DisqusXmlExporter> logger)
    {
        private const string DisqusGmtDateFormat = "yyyy-MM-dd HH:mm:ss";

        public XDocument Export(IEnumerable<IContent> posts, BlogMLDocument document)
        {
            var nsContent = XNamespace.Get("http://purl.org/rss/1.0/modules/content/");
            var nsDsq = XNamespace.Get("http://www.disqus.com/");
            var nsDc = XNamespace.Get("http://purl.org/dc/elements/1.1/");
            var nsWp = XNamespace.Get("http://wordpress.org/export/1.0/");

            var xChannel = new XElement("channel");

            var xDoc = new XDocument(
                new XElement(
                    "rss",
                    new XAttribute("version", "2.0"),
                    new XAttribute(XNamespace.Xmlns + "content", nsContent),
                    new XAttribute(XNamespace.Xmlns + "dsq", nsDsq),
                    new XAttribute(XNamespace.Xmlns + "dc", nsDc),
                    new XAttribute(XNamespace.Xmlns + "wp", nsWp),
                    xChannel));

            foreach (IContent post in posts)
            {
                BlogMLPost? blogMlPost = document.Posts?.FirstOrDefault(x => x.Title.Content == post.Name);

                if (blogMlPost is null)
                {
                    logger.LogWarning("Cannot find blog ml post XML element with post name {PostName}", post.Name);
                    continue;
                }

                // no comments to import
                if (blogMlPost.Comments.Count == 0)
                {
                    continue;
                }

                var body = post.GetValue<string>("richText");
                if (body.IsNullOrWhiteSpace())
                {
                    body = MarkdownHelper.ToHtml(post.GetValue<string>("markdown"));
                }

                var publishedDate = post.GetValue<DateTime>("publishedDate");
                if (publishedDate == default)
                {
                    publishedDate = post.CreateDate;
                }

                var xItem = new XElement(
                    "item",
                    new XElement("title", post.Name),
                    new XElement("link", publishedUrlProvider.GetUrl(post.Id, UrlMode.Absolute)),
                    new XElement(nsContent + "encoded", new XCData(body)),
                    new XElement(nsDsq + "thread_identifier", post.Key.ToString()),
                    new XElement(nsWp + "post_date_gmt", FormatAsDisqusDate(publishedDate)),
                    new XElement(nsWp + "comment_status", "open"));

                foreach (BlogMLComment comment in blogMlPost.Comments)
                {
                    var commentText = comment.Content?.Content ?? string.Empty;

                    if (comment.Content?.ContentType == BlogMLContentType.Base64)
                    {
                        commentText = Encoding.UTF8.GetString(Convert.FromBase64String(comment.Content.Content));
                    }

                    var xComment = new XElement(
                        nsWp + "comment",
                        new XElement(nsWp + "comment_id", comment.Id),
                        new XElement(nsWp + "comment_author", comment.UserName ?? string.Empty),
                        new XElement(nsWp + "comment_author_email", comment.UserEmailAddress ?? string.Empty),
                        new XElement(nsWp + "comment_author_url", comment.UserUrl is null ? string.Empty : comment.UserUrl.ToString()),
                        // BlogML has no notion of IPs or threading; emit the required Disqus nodes with empty defaults.
                        new XElement(nsWp + "comment_author_IP", string.Empty),
                        new XElement(nsWp + "comment_date_gmt", FormatAsDisqusDate(comment.CreatedOn)),
                        new XElement(nsWp + "comment_content", new XCData(commentText)),
                        new XElement(nsWp + "comment_approved", comment.ApprovalStatus == BlogMLApprovalStatus.Approved ? 1 : 0),
                        new XElement(nsWp + "comment_parent", "0"));

                    xItem.Add(xComment);
                }

                xChannel.Add(xItem);
            }

            return xDoc;
        }
        private static string FormatAsDisqusDate(DateTime date) =>
            date.ToUniversalTime().ToString(DisqusGmtDateFormat, CultureInfo.InvariantCulture);
    }
}
