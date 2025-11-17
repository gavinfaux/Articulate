#nullable enable
using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    /// <inheritdoc/>
    public abstract class BlogPostControllerBase(
        ILogger<BlogPostControllerBase> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedValueFallback publishedValueFallback)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
        /// <inheritdoc/>
        public override IActionResult Index()
        {
            if (CurrentPage is null)
            {
                logger.LogWarning("BlogPostControllerBase.Index: CurrentPage is null, returning 404");
                return NotFound();
            }

            var post = new PostModel(CurrentPage, publishedValueFallback);

            // Always advertise variant normalization header for CDN cache-keying
            Response.Headers.Append("Vary", "X-Content-Variant");

            // Content negotiation for LLMs/agents: serve markdown or plain text when requested
            ContentNegotiation.TextFormat preferred = ContentNegotiation.GetPreferredTextFormat(Request);
            if (preferred == ContentNegotiation.TextFormat.Markdown)
            {
                // Use original markdown when available; otherwise fall back to plain text rendering
                var markdown = CurrentPage.Value<string>("markdown");
                if (!string.IsNullOrWhiteSpace(markdown))
                {
                    Response.Headers["X-Content-Variant"] = "md";
                    Response.Headers.CacheControl = "public, max-age=0, s-maxage=120";
                    var mdOut = FormatMarkdown(post, markdown);
                    return Content(mdOut, "text/markdown; charset=utf-8");
                }

                // Downgrade if markdown not available
                preferred = ContentNegotiation.TextFormat.PlainText;
            }

            if (preferred == ContentNegotiation.TextFormat.PlainText)
            {
                Response.Headers["X-Content-Variant"] = "txt";
                Response.Headers.CacheControl = "public, max-age=0, s-maxage=120";
                var html = post.Body?.ToString() ?? string.Empty;
                var plain = html.DetectIsJson() ? html : html.StripHtml().DecodeHtml().Trim();
                var txtOut = FormatPlain(post, plain);
                return Content(txtOut, "text/plain; charset=utf-8");
            }

            // Default HTML
            Response.Headers["X-Content-Variant"] = "html";
            Response.Headers.CacheControl = "public, max-age=0, s-maxage=120";
            return View("Post", post);
        }

        private static string FormatMarkdown(PostModel post, string markdown)
        {
            var sb = new StringBuilder();
            _ = sb.Append("# ").AppendLine(post.Name);
            _ = sb.AppendLine();
            var url = post.Url();
            if (!string.IsNullOrWhiteSpace(url))
            {
                _ = sb.Append('<').Append(url).AppendLine(">");
            }

            _ = sb.Append("Published: ")
                .AppendLine(post.PublishedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            if (!string.IsNullOrWhiteSpace(post.Author?.Name))
            {
                _ = sb.Append("Author: ").AppendLine(post.Author.Name);
            }

            var tags = post.Tags?.ToArray() ?? [];
            if (tags.Length > 0)
            {
                _ = sb.Append("Tags: ").AppendLine(string.Join(", ", tags));
            }

            _ = sb.AppendLine().AppendLine(markdown.Trim());
            return sb.ToString();
        }

        private static string FormatPlain(PostModel post, string bodyText)
        {
            var sb = new StringBuilder();
            _ = sb.AppendLine(post.Name);
            var url = post.Url();
            if (!string.IsNullOrWhiteSpace(url))
            {
                _ = sb.AppendLine(url);
            }

            _ = sb.Append("Published: ")
                .AppendLine(post.PublishedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            if (!string.IsNullOrWhiteSpace(post.Author?.Name))
            {
                _ = sb.Append("Author: ").AppendLine(post.Author.Name);
            }

            var tags = post.Tags?.ToArray() ?? [];
            if (tags.Length > 0)
            {
                _ = sb.Append("Tags: ").AppendLine(string.Join(", ", tags));
            }

            if (!string.IsNullOrWhiteSpace(bodyText))
            {
                _ = sb.AppendLine().AppendLine(bodyText.Trim());
            }

            return sb.ToString();
        }
    }
}
