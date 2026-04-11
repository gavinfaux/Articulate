#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;

namespace Articulate.Routing
{
    internal static class ArticulateRouteValidator
    {
        private static readonly HashSet<string> _reservedRouteSegments = new(StringComparer.OrdinalIgnoreCase)
        {
            "a-new",
            "author",
            "metaweblog",
            "opensearch",
            "rss",
            "rsd",
            "wlwmanifest"
        };

        internal static List<Domain> DomainsForContent(IPublishedContent content, IReadOnlyList<Domain> domains)
        {
            HashSet<int> nodePaths = [];

            foreach (string pathSegment in content.Path.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!int.TryParse(pathSegment, out int pathId))
                {
                    throw new InvalidOperationException(
                        $"Articulate root '{content.Name}' (id: {content.Id}) has invalid path '{content.Path}'.");
                }

                nodePaths.Add(pathId);
            }

            return [.. domains.Where(domain => nodePaths.Contains(domain.ContentId))];
        }

        internal static void ValidateConfiguredRouteSegments(IPublishedContent articulateRootNode)
        {
            var configuredSegments = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

#pragma warning disable CS0618 // IPublishedContent.Children is used here to avoid navigation-service requirements during validation.
            foreach (IPublishedContent child in articulateRootNode.Children)
#pragma warning restore CS0618
            {
                string? childRouteSegment = ArticulateRouteSegmentHelper.NormalizeOrNull(child.UrlSegment);
                if (childRouteSegment is not null)
                {
                    string childDescription = $"child content '{child.Name}'";
                    if (configuredSegments.TryGetValue(childRouteSegment, out string? existingRouteSource))
                    {
                        throw new InvalidOperationException(
                            $"Articulate root '{articulateRootNode.Name}' (id: {articulateRootNode.Id}) uses the same route segment " +
                            $"'{childRouteSegment}' for both '{existingRouteSource}' and '{childDescription}'.");
                    }

                    configuredSegments[childRouteSegment] = childDescription;
                }
            }

            ValidateConfiguredRouteSegment(
                articulateRootNode,
                "searchUrlName",
                articulateRootNode.Value<string>("searchUrlName"),
                configuredSegments);
            ValidateConfiguredRouteSegment(
                articulateRootNode,
                "categoriesUrlName",
                articulateRootNode.Value<string>("categoriesUrlName"),
                configuredSegments);
            ValidateConfiguredRouteSegment(
                articulateRootNode,
                "tagsUrlName",
                articulateRootNode.Value<string>("tagsUrlName"),
                configuredSegments);
        }

        internal static void ValidateRootPathMappings(
            string rootNodePath,
            IReadOnlyList<IPublishedContent> articulateRoots,
            IReadOnlyList<Domain> domains,
            Uri currentUri)
        {
            var rootsWithDomains = articulateRoots
                .Select(root => (Root: root, Domains: DomainsForContent(root, domains)))
                .ToList();

            for (var i = 0; i < rootsWithDomains.Count; i++)
            {
                for (var j = i + 1; j < rootsWithDomains.Count; j++)
                {
                    (IPublishedContent leftRoot, List<Domain> leftDomains) = rootsWithDomains[i];
                    (IPublishedContent rightRoot, List<Domain> rightDomains) = rootsWithDomains[j];

                    List<string> overlappingDomains =
                    [
                        .. leftDomains
                            .Where(leftDomain => rightDomains.Any(rightDomain => ArticulateDomainMatcher.Matches(leftDomain, rightDomain, currentUri)))
                            .Select(leftDomain => leftDomain.Name)
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                    ];

                    if ((leftDomains.Count == 0 && rightDomains.Count == 0) || overlappingDomains.Count > 0)
                    {
                        var overlapDescription = overlappingDomains.Count > 0
                            ? $"overlapping domains: {string.Join(", ", overlappingDomains)}"
                            : "no domain assignments";

                        throw new InvalidOperationException(
                            $"Ambiguous Articulate root routing detected for path '{rootNodePath}' between " +
                            $"'{DescribeRoot(leftRoot)}' and '{DescribeRoot(rightRoot)}' ({overlapDescription}). " +
                            "Use distinct paths or non-overlapping domain assignments.");
                    }
                }
            }
        }

        private static void ValidateConfiguredRouteSegment(
            IPublishedContent articulateRootNode,
            string propertyAlias,
            string? routeSegment,
            IDictionary<string, string> configuredSegments)
        {
            string? normalizedRouteSegment = ArticulateRouteSegmentHelper.NormalizeOrNull(routeSegment);
            if (normalizedRouteSegment is null)
            {
                if (!string.IsNullOrEmpty(routeSegment))
                {
                    throw new InvalidOperationException(
                        $"Articulate root '{articulateRootNode.Name}' (id: {articulateRootNode.Id}) has an invalid value '{routeSegment}' " +
                        $"for '{propertyAlias}'. Route segments must contain at least one non-slash character.");
                }

                return;
            }

            if (normalizedRouteSegment.Any(char.IsWhiteSpace) ||
                normalizedRouteSegment.IndexOfAny(['/', '\\', '{', '}', '?', '#']) >= 0)
            {
                throw new InvalidOperationException(
                    $"Articulate root '{articulateRootNode.Name}' (id: {articulateRootNode.Id}) has an invalid value '{routeSegment}' " +
                    $"for '{propertyAlias}'. Route segments must be a single URL segment.");
            }

            if (_reservedRouteSegments.Contains(normalizedRouteSegment))
            {
                throw new InvalidOperationException(
                    $"Articulate root '{articulateRootNode.Name}' (id: {articulateRootNode.Id}) cannot use reserved route segment " +
                    $"'{normalizedRouteSegment}' for '{propertyAlias}'.");
            }

            if (configuredSegments.TryGetValue(normalizedRouteSegment, out string? existingPropertyAlias))
            {
                throw new InvalidOperationException(
                    $"Articulate root '{articulateRootNode.Name}' (id: {articulateRootNode.Id}) uses the same route segment " +
                    $"'{normalizedRouteSegment}' for both '{existingPropertyAlias}' and '{propertyAlias}'.");
            }

            configuredSegments[normalizedRouteSegment] = propertyAlias;
        }

        private static string DescribeRoot(IPublishedContent articulateRootNode) =>
            $"{articulateRootNode.Name} (id: {articulateRootNode.Id})";
    }
}
