#nullable enable
using System.Globalization;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;

namespace Articulate.Routing
{
    [Obsolete(
        "'DateFormattedPostContentFinder' is obsolete: 'ContentFinderByUrl Scheduled for removal in Umbraco 18'",
        false)]
    public class DateFormattedPostContentFinder(
        ILogger<DateFormattedPostContentFinder> logger,
        IUmbracoContextAccessor umbracoContextAccessor)
        : ContentFinderByUrl(logger, umbracoContextAccessor)
    {
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
            IPublishedContent? node = FindContent(contentRequest, newRoute);

            if (!ValidateArticulatePost(node, postDate))
            {
                return false;
            }

            _ = contentRequest.SetPublishedContent(node!);
            return true;
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

            // if there's a domain attached we need to lookup the content with the domain Id
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
