#nullable enable
namespace Articulate
{
    internal static class PathHelper
    {
        // Join content-root-relative path segments using forward slashes (e.g., "wwwroot/App_Plugins/...").
        public static string JoinContentRoot(params string[] parts)
        {
            if (parts is null || parts.Length == 0)
            {
                return string.Empty;
            }

            static string Clean(string? s) => (s ?? string.Empty).Trim().Trim('/', '\\');

            IEnumerable<string> cleaned = parts.Select(Clean).Where(s => !string.IsNullOrEmpty(s));
            return string.Join('/', cleaned);
        }

        // Join virtual path segments using forward slashes. Preserves leading "~/" when present.
        public static string JoinVirtual(params string[] parts)
        {
            if (parts is null || parts.Length == 0)
            {
                return string.Empty;
            }

            var first = parts[0] ?? string.Empty;
            var hasTilde = first.StartsWith("~");
            if (hasTilde)
            {
                first = first.TrimStart('~');
            }

            static string Clean(string? s) => (s ?? string.Empty).Trim().Trim('/', '\\');

            IEnumerable<string> cleaned = new[] { Clean(first) }
                .Concat(parts.Skip(1).Select(Clean))
                .Where(s => !string.IsNullOrEmpty(s));

            var joined = string.Join('/', cleaned);
            return hasTilde ? "~/" + joined : joined;
        }
    }
}
