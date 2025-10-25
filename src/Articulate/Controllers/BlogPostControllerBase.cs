#nullable enable
using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Microsoft.Net.Http.Headers;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;

namespace Articulate.Controllers
{
    public abstract class BlogPostControllerBase(
        ILogger<BlogPostControllerBase> logger,
        ICompositeViewEngine compositeViewEngine,
        IUmbracoContextAccessor umbracoContextAccessor,
        IPublishedValueFallback publishedValueFallback)
        : RenderController(logger, compositeViewEngine, umbracoContextAccessor)
    {
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
            var preferred = GetPreferredTextFormat(Request);
            if (preferred == TextFormat.Markdown)
            {
                // Use original markdown when available; otherwise fall back to plain text rendering
                var markdown = CurrentPage.Value<string>("markdown");
                if (!string.IsNullOrWhiteSpace(markdown))
                {
                    Response.Headers["X-Content-Variant"] = "md";
                    Response.Headers["Cache-Control"] = "public, max-age=0, s-maxage=120";
                    var mdOut = FormatMarkdown(post, markdown);
                    return Content(mdOut, "text/markdown; charset=utf-8");
                }

                // Downgrade if markdown not available
                preferred = TextFormat.PlainText;
            }

            if (preferred == TextFormat.PlainText)
            {
                Response.Headers["X-Content-Variant"] = "txt";
                Response.Headers["Cache-Control"] = "public, max-age=0, s-maxage=120";
                var html = post.Body?.ToString() ?? string.Empty;
                var plain = html.DetectIsJson() ? html : html.StripHtml().DecodeHtml().Trim();
                var txtOut = FormatPlain(post, plain);
                return Content(txtOut, "text/plain; charset=utf-8");
            }

            // Default HTML
            Response.Headers["X-Content-Variant"] = "html";
            Response.Headers["Cache-Control"] = "public, max-age=0, s-maxage=120";
            return View("Post", post);
        }

        private enum TextFormat
        {
            None,
            Markdown,
            PlainText
        }

        private static TextFormat GetPreferredTextFormat(HttpRequest request)
        {
            var accepts = request.GetTypedHeaders().Accept;
            if (accepts is null || accepts.Count == 0)
            {
                return TextFormat.None;
            }

            static bool IsMarkdown(MediaTypeHeaderValue mt)
            {
                var type = mt.Type.Value;
                var sub = mt.SubType.Value;
                if (type is null || sub is null) return false;
                return type.Equals("text", StringComparison.OrdinalIgnoreCase)
                    && (sub.Equals("markdown", StringComparison.OrdinalIgnoreCase)
                        || sub.Equals("x-markdown", StringComparison.OrdinalIgnoreCase)
                        || sub.EndsWith("+markdown", StringComparison.OrdinalIgnoreCase));
            }

            static bool IsPlain(MediaTypeHeaderValue mt)
            {
                var type = mt.Type.Value;
                var sub = mt.SubType.Value;
                if (type is null || sub is null) return false;
                return type.Equals("text", StringComparison.OrdinalIgnoreCase)
                       && (sub.Equals("plain", StringComparison.OrdinalIgnoreCase)
                           || sub.Equals("*", StringComparison.Ordinal));
            }

            double qMarkdown = 0, qPlain = 0;
            foreach (var mt in accepts)
            {
                var q = mt.Quality.HasValue ? (double)mt.Quality.Value : 1.0;
                if (IsMarkdown(mt)) qMarkdown = Math.Max(qMarkdown, q);
                if (IsPlain(mt)) qPlain = Math.Max(qPlain, q);
            }

            if (qMarkdown <= 0 && qPlain <= 0)
            {
                return TextFormat.None;
            }

            // Prefer higher quality; tie-breaker prefers markdown
            return qMarkdown >= qPlain ? TextFormat.Markdown : TextFormat.PlainText;
        }

        private static string FormatMarkdown(PostModel post, string markdown)
        {
            var sb = new StringBuilder();
            sb.Append("# ").AppendLine(post.Name);
            sb.AppendLine();
            var url = post.Url();
            if (!string.IsNullOrWhiteSpace(url))
            {
                sb.Append("<").Append(url).AppendLine(">");
            }
            sb.Append("Published: ")
                .AppendLine(post.PublishedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            if (!string.IsNullOrWhiteSpace(post.Author?.Name))
            {
                sb.Append("Author: ").AppendLine(post.Author.Name);
            }
            var tags = post.Tags?.ToArray() ?? Array.Empty<string>();
            if (tags.Length > 0)
            {
                sb.Append("Tags: ").AppendLine(string.Join(", ", tags));
            }
            sb.AppendLine().AppendLine(markdown.Trim());
            return sb.ToString();
        }

        private static string FormatPlain(PostModel post, string bodyText)
        {
            var sb = new StringBuilder();
            sb.AppendLine(post.Name);
            var url = post.Url();
            if (!string.IsNullOrWhiteSpace(url))
            {
                sb.AppendLine(url);
            }
            sb.Append("Published: ")
                .AppendLine(post.PublishedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
            if (!string.IsNullOrWhiteSpace(post.Author?.Name))
            {
                sb.Append("Author: ").AppendLine(post.Author.Name);
            }
            var tags = post.Tags?.ToArray() ?? Array.Empty<string>();
            if (tags.Length > 0)
            {
                sb.Append("Tags: ").AppendLine(string.Join(", ", tags));
            }
            if (!string.IsNullOrWhiteSpace(bodyText))
            {
                sb.AppendLine().AppendLine(bodyText.Trim());
            }
            return sb.ToString();
        }
    }
}
