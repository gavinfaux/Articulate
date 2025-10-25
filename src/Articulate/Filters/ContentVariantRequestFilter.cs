#nullable enable
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Net.Http.Headers;

namespace Articulate.Filters
{
    /// <summary>
    /// Ensures a normalized X-Content-Variant request header exists based on Accept,
    /// so server-side output caching can vary on a stable header instead of raw Accept.
    /// </summary>
    internal sealed class ContentVariantRequestFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            var headers = context.HttpContext.Request.Headers;
            if (headers.ContainsKey("X-Content-Variant"))
            {
                return;
            }

            var typed = context.HttpContext.Request.GetTypedHeaders();
            var accepts = typed.Accept;

            // Default HTML if no Accept provided
            var variant = "html";
            if (accepts is not null && accepts.Count > 0)
            {
                double qMarkdown = 0, qPlain = 0;
                foreach (var mt in accepts)
                {
                    var q = mt.Quality.HasValue ? (double)mt.Quality.Value : 1.0;
                    var type = mt.Type.Value;
                    var sub = mt.SubType.Value;
                    if (type is null || sub is null) continue;

                    var isMarkdown = type.Equals("text", StringComparison.OrdinalIgnoreCase)
                                     && (sub.Equals("markdown", StringComparison.OrdinalIgnoreCase)
                                         || sub.Equals("x-markdown", StringComparison.OrdinalIgnoreCase)
                                         || sub.EndsWith("+markdown", StringComparison.OrdinalIgnoreCase));
                    if (isMarkdown) qMarkdown = Math.Max(qMarkdown, q);

                    var isPlain = type.Equals("text", StringComparison.OrdinalIgnoreCase)
                                  && (sub.Equals("plain", StringComparison.OrdinalIgnoreCase)
                                      || sub.Equals("*", StringComparison.Ordinal));
                    if (isPlain) qPlain = Math.Max(qPlain, q);
                }

                if (qMarkdown > 0 || qPlain > 0)
                {
                    variant = qMarkdown >= qPlain ? "md" : "txt";
                }
            }

            headers["X-Content-Variant"] = variant;
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }
    }
}
