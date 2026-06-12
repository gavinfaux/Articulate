#nullable enable
using System.Globalization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;

namespace Articulate.Routing
{
    /// <summary>
    /// Content finder that handles date-formatted URLs for Articulate blog posts (e.g., /YYYY/MM/DD/post-name/).
    /// </summary>
#if NET10_0_OR_GREATER && UMBRACO_18_OR_GREATER
    public class DateFormattedPostContentFinder : ContentFinderByUrl
#else
    public class DateFormattedPostContentFinder : ContentFinderByUrlNew
#endif
    {
        private readonly IDocumentUrlService _documentUrlService;
        private readonly IPublishedContentCache _publishedContentCache;

        /// <summary>
        /// Initializes a new instance of the <see cref="DateFormattedPostContentFinder"/> class.
        /// </summary>
        public DateFormattedPostContentFinder(
#if NET10_0_OR_GREATER && UMBRACO_18_OR_GREATER
            ILogger<ContentFinderByUrl> logger,
#else
            ILogger<ContentFinderByUrlNew> logger,
#endif
            IUmbracoContextAccessor umbracoContextAccessor,
            IDocumentUrlService documentUrlService,
            IPublishedContentCache publishedContentCache,
            IOptionsMonitor<WebRoutingSettings> webRoutingSettings)
#if NET10_0_OR_GREATER && UMBRACO_18_OR_GREATER
            : base(logger, umbracoContextAccessor, documentUrlService, publishedContentCache, webRoutingSettings)
#else
            : base(logger, umbracoContextAccessor, documentUrlService, publishedContentCache, webRoutingSettings)
#endif
        {
            _documentUrlService = documentUrlService;
            _publishedContentCache = publishedContentCache;
        }

        /// <inheritdoc/>
        public override async Task<bool> TryFindContent(IPublishedRequestBuilder contentRequest)
        {
            await Task.CompletedTask;

            var segmentLength = contentRequest.Uri.Segments.Length;
            if (segmentLength <= 4)
            {
                return false;
            }

            if (!TryParseDateFromSegments(contentRequest.Uri.Segments, segmentLength, out DateTime postDate))
            {
                return false;
            }

            var newRoute = BuildRouteWithoutDateSegments(contentRequest, segmentLength);
            IPublishedContent? node = FindContentByRoute(contentRequest, newRoute);

            if (!ValidateArticulatePost(node, postDate))
            {
                return false;
            }

            _ = contentRequest.SetPublishedContent(node!);
            return true;
        }

        /// <summary>
        /// Finds content by route without the date segments.
        /// </summary>
        private IPublishedContent? FindContentByRoute(IPublishedRequestBuilder contentRequest, string route)
        {
            if (!UmbracoContextAccessor.TryGetUmbracoContext(out IUmbracoContext? umbracoContext))
            {
                return null;
            }

            // Extract the route path (without domain ID prefix if present)
            var routePath = route;
            if (contentRequest.Domain is not null && route.Contains('/'))
            {
                var pos = route.IndexOf('/', StringComparison.Ordinal);
                routePath = route[pos..];
            }

            // Use IDocumentUrlService to find the document key by route
            Guid? documentKey = _documentUrlService.GetDocumentKeyByRoute(
                routePath,
                contentRequest.Culture,
                contentRequest.Domain?.ContentId,
                umbracoContext.InPreviewMode);

            if (!documentKey.HasValue)
            {
                return null;
            }

            // Retrieve the published content by key
            IPublishedContent? node = _publishedContentCache.GetById(umbracoContext.InPreviewMode, documentKey.Value);
            if (node is not null)
            {
                contentRequest.SetPublishedContent(node);
            }

            return node;
        }

        private static bool TryParseDateFromSegments(string[] segments, int segmentLength, out DateTime postDate)
        {
            var stringDate = segments[segmentLength - 4] + segments[segmentLength - 3] +
                             segments[segmentLength - 2].TrimEnd('/');
            try
            {
                postDate = DateTime.ParseExact(stringDate, "yyyy/MM/dd", CultureInfo.InvariantCulture);
                return true;
            }
            catch (FormatException)
            {
                postDate = default;
                return false;
            }
        }

        private static string BuildRouteWithoutDateSegments(IPublishedRequestBuilder contentRequest, int segmentLength)
        {
            var newRoute = string.Empty;
            for (var i = 0; i < segmentLength; i++)
            {
                if (i < segmentLength - 4 || i > segmentLength - 2)
                {
                    newRoute += contentRequest.Uri.Segments[i].ToLowerInvariant();
                }
            }

            // if there's a domain attached we need to look up the content with the domain ID
            // and the domain's path stripped from the start
            if (contentRequest.HasDomain() && contentRequest.Domain?.Uri is not null)
            {
                DomainAndUri domain = contentRequest.Domain;
                Uri uri = domain.Uri;
                newRoute = domain.ContentId + DomainUtilities.PathRelativeToDomain(uri, newRoute);
            }

            return newRoute;
        }

        private static bool ValidateArticulatePost(IPublishedContent? node, DateTime postDate)
        {
            if (node is null)
            {
                return false;
            }

            if (node.ContentType.Alias != ArticulateConstants.ContentType.ArticulateRichText
                && node.ContentType.Alias != ArticulateConstants.ContentType.ArticulateMarkdown)
            {
                return false;
            }

            bool? useDateFormat = node.Parent()?.Parent()?.Value<bool?>("useDateFormatForUrl");
            if (useDateFormat != true)
            {
                return false;
            }

            return node.Value<DateTime>("publishedDate").Date == postDate.Date;
        }
    }
}
