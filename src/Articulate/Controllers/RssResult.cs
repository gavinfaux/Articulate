#nullable enable
using System.ServiceModel.Syndication;
using System.Text;
using System.Xml;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Controllers
{
    internal class RssResult(SyndicationFeed feed, IMasterModel model) : ActionResult
    {
        /// <inheritdoc/>
        public override async Task ExecuteResultAsync(ActionContext context)
        {
            context.HttpContext.Response.ContentType = "application/xml";

            await using var txtWriter = new Utf8StringWriter();
            await using var xmlWriter = XmlWriter.Create(
                txtWriter,
                new XmlWriterSettings { Encoding = Encoding.UTF8, Indent = true, OmitXmlDeclaration = false, Async = true });

            // Write the Processing Instruction node.
            var xsltHeader =
                $"type=\"text/xsl\" href=\"{model.RootBlogNode.Url(mode: UrlMode.Absolute).EnsureEndsWith('/') + "rss/xslt"}\"";
            await xmlWriter.WriteProcessingInstructionAsync("xml-stylesheet", xsltHeader).ConfigureAwait(false);

            Rss20FeedFormatter formatter = feed.GetRss20Formatter();
            formatter.WriteTo(xmlWriter);

            await xmlWriter.FlushAsync().ConfigureAwait(false);

            await context.HttpContext.Response.WriteAsync(txtWriter.ToString()).ConfigureAwait(false);
        }

        private sealed class Utf8StringWriter : StringWriter
        {
            public override Encoding Encoding => Encoding.UTF8;
        }
    }
}
