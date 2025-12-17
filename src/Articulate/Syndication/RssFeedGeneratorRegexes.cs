#nullable enable
using System.Text.RegularExpressions;

namespace Articulate.Syndication
{
    internal static partial class RssFeedGeneratorRegexes
    {
        [GeneratedRegex(" src=(?:\"|')(/media/.*?)(?:\"|')", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        public static partial Regex RelativeMediaSrcRegex();

        [GeneratedRegex(" href=(?:\"|')(/media/.*?)(?:\"|')", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled)]
        public static partial Regex RelativeMediaHrefRegex();
    }
}
