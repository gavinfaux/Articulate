#nullable enable

using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;

namespace Articulate
{
    public static class ContentNegotiation
    {
        public static TextFormat GetPreferredTextFormat(HttpRequest request)
        {
            IList<MediaTypeHeaderValue>? accepts = request.GetTypedHeaders().Accept;
            if (accepts is null || accepts.Count == 0)
            {
                return TextFormat.None;
            }

            static bool IsMarkdown(MediaTypeHeaderValue mt)
            {
                var type = mt.Type.Value;
                var sub = mt.SubType.Value;
                if (type is null || sub is null)
                {
                    return false;
                }

                return type.Equals("text", StringComparison.OrdinalIgnoreCase)
                       && (sub.Equals("markdown", StringComparison.OrdinalIgnoreCase)
                           || sub.Equals("x-markdown", StringComparison.OrdinalIgnoreCase)
                           || sub.EndsWith("+markdown", StringComparison.OrdinalIgnoreCase));
            }

            static bool IsPlain(MediaTypeHeaderValue mt)
            {
                var type = mt.Type.Value;
                var sub = mt.SubType.Value;
                if (type is null || sub is null)
                {
                    return false;
                }

                return type.Equals("text", StringComparison.OrdinalIgnoreCase)
                       && (sub.Equals("plain", StringComparison.OrdinalIgnoreCase)
                           || sub.Equals("*", StringComparison.Ordinal));
            }

            double qMarkdown = 0, qPlain = 0;
            foreach (MediaTypeHeaderValue mt in accepts)
            {
                var q = mt.Quality.HasValue ? (double)mt.Quality.Value : 1.0;
                if (IsMarkdown(mt))
                {
                    qMarkdown = Math.Max(qMarkdown, q);
                }

                if (IsPlain(mt))
                {
                    qPlain = Math.Max(qPlain, q);
                }
            }

            if (qMarkdown <= 0 && qPlain <= 0)
            {
                return TextFormat.None;
            }

            return qMarkdown >= qPlain ? TextFormat.Markdown : TextFormat.PlainText;
        }

        public enum TextFormat
        {
            None,
            Markdown,
            PlainText,
        }
    }
}
