#nullable enable
using System.Text.RegularExpressions;

namespace Articulate.Api.Management.Controllers
{
    internal static partial class ArticulateMarkdownEditorRegexes
    {
        // regex finds the image placeholder markdown tag and captures the users label and temporary URL.
        [GeneratedRegex(@"!\[(.*?)\]\((tmp:.*?)\)", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        public static partial Regex ImageTagPlaceholderRegex();
    }
}
