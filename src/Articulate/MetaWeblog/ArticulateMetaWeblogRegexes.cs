using System.Text.RegularExpressions;

namespace Articulate.MetaWeblog
{
    internal static partial class ArticulateMetaWeblogRegexes
    {
        // regex finds the image placeholder markdown tag and captures the temporary URL.
        [GeneratedRegex(" src=(?:\"|')(?:http|https)://(?:[\\w\\d:/-]+?)(articulate/.*?)(?:\"|')", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        public static partial Regex MediaSourceRegex();

        [GeneratedRegex(" href=(?:\"|')(?:http|https)://(?:[\\w\\d:/-]+?)(articulate/.*?)(?:\"|')", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        public static partial Regex MediaHrefRegex();
    }
}
