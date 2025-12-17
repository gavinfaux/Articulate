#nullable enable
using System.Globalization;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;

namespace Articulate.Routing
{
    [Obsolete("'DateFormattedPostContentFinder' is obsolete: 'ContentFinderByUrl Scheduled for removal in Umbraco 18'", false)]
    public class DateFormattedPostContentFinder(
        ILogger<DateFormattedPostContentFinder> logger,
        IUmbracoContextAccessor umbracoContextAccessor)
        : ContentFinderByUrl(logger, umbracoContextAccessor)
    {
        /// <inheritdoc/>
        public override async Task<bool> TryFindContent(IPublishedRequestBuilder contentRequest)
        {
            await Task.CompletedTask.ConfigureAwait(false);

            // This simple logic should do the trick: basically if I find an url with more than 4 segments (the 3 date parts and the slug)
            // I leave the last segment (the slug), remove the 3 date parts, and keep all the rest.
            var segmentLength = contentRequest.Uri.Segments.Length;
            if (segmentLength <= 4)
            {
                return false;
            }

            var stringDate = contentRequest.Uri.Segments[segmentLength - 4] + contentRequest.Uri.Segments[segmentLength - 3] + contentRequest.Uri.Segments[segmentLength - 2].TrimEnd('/');
            DateTime postDate;
            try
            {
                postDate = DateTime.ParseExact(stringDate, "yyyy/MM/dd", CultureInfo.InvariantCulture);
            }
            catch (FormatException)
            {
                return false;
            }

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

            IPublishedContent? node = FindContent(contentRequest, newRoute);

            // If by chance something matches the format pattern I check again if there is sucn a node and if it's an articulate post
            if (node is null || (node.ContentType.Alias != ArticulateConstants.ContentType.ArticulateRichText && node.ContentType.Alias != ArticulateConstants.ContentType.ArticulateMarkdown))
            {
                return false;
            }

            if (node.Parent()?.Parent()?.Value<bool>("useDateFormatForUrl") != true)
            {
                return false;
            }
            if (node.Value<DateTime>("publishedDate").Date != postDate.Date)
            {
                return false;
            }

            _ = contentRequest.SetPublishedContent(node);
            return true;
        }
    }
}
