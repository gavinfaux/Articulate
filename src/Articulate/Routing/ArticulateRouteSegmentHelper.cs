#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Routing
{
    internal static class ArticulateRouteSegmentHelper
    {
        public const string Rss = "rss";
        public const string Author = "author";
        public const string NewPost = "a-new";
        public const string OpenSearch = "opensearch";
        public const string MetaWeblog = "metaweblog";
        public const string WlwManifest = "wlwmanifest";
        public const string Rsd = "rsd";

        /// <summary>The fixed segments every root routes, so a configured segment can't take them.</summary>
        public static readonly IReadOnlySet<string> Reserved =
            new HashSet<string>([Rss, Author, NewPost, OpenSearch, MetaWeblog, WlwManifest, Rsd], StringComparer.OrdinalIgnoreCase);

        private static string Normalize(string? routeSegment) => routeSegment?.Trim().Trim('/') ?? string.Empty;

        public static string? NormalizeOrNull(string? routeSegment)
        {
            string normalizedRouteSegment = Normalize(routeSegment);
            return normalizedRouteSegment.Length == 0 ? null : normalizedRouteSegment;
        }

        public static string? GetConfiguredSegment(IPublishedContent content, string propertyAlias) =>
            NormalizeOrNull(content.Value<string>(propertyAlias));

        public static string? CombineRoutePath(string rootNodePath, string? routeSegment)
        {
            string? normalizedRouteSegment = NormalizeOrNull(routeSegment);
            return normalizedRouteSegment is null ? null : $"{rootNodePath}{normalizedRouteSegment}";
        }
    }
}
