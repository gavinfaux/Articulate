#nullable enable
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Web;

namespace Articulate.Routing
{
    [Obsolete("'DefaultUrlProvider' is obsolete, use 'NewDefaultUrlProvider' instead. Scheduled for removal in V18", false)]
    public class DateFormattedUrlProvider : DefaultUrlProvider
    {
#if NET10_0_OR_GREATER
        public DateFormattedUrlProvider(
    IOptionsMonitor<RequestHandlerSettings> requestSettings,
    ILogger<DateFormattedUrlProvider> logger,
    ISiteDomainMapper siteDomainMapper,
    IUmbracoContextAccessor umbracoContextAccessor,
    UriUtility uriUtility,
    ILocalizationService localizationService,
    IDocumentNavigationQueryService navigationQueryService,
    IPublishedContentStatusFilteringService publishedContentStatusFilteringService)
    : base(requestSettings, logger, siteDomainMapper, umbracoContextAccessor, uriUtility, localizationService, navigationQueryService, publishedContentStatusFilteringService)
        {
        }
#else
        [Obsolete("Please use ILanguageService and IDictionaryItemService for localization. Will be removed in future", false)]
        public DateFormattedUrlProvider(
    IOptionsMonitor<RequestHandlerSettings> requestSettings,
    ILogger<DateFormattedUrlProvider> logger,
    ISiteDomainMapper siteDomainMapper,
    IUmbracoContextAccessor umbracoContextAccessor,
    UriUtility uriUtility,
    ILocalizationService localizationService)
    : base(requestSettings, logger, siteDomainMapper, umbracoContextAccessor, uriUtility, localizationService)
        {
        }
#endif

        /// <inheritdoc/>
        public override UrlInfo? GetUrl(IPublishedContent content, UrlMode mode, string? culture, Uri current)
        {
            if (content is
                    not
                    {
                        ContentType.Alias: ArticulateConstants.ContentType.ArticulateRichText
                        or ArticulateConstants.ContentType.ArticulateMarkdown
                    }

                || content.Parent() is null)
            {
                return null;
            }

            if (content.Parent()?.Parent() is not null)
            {
                var useDateFormat = content.Parent()?.Parent()?.Value<bool>("useDateFormatForUrl") ?? false;
                if (!useDateFormat)
                {
                    return null;
                }
            }

            DateTime? date = content.Value<DateTime?>("publishedDate");
            if (date is null)
            {
                return null;
            }

            var urlFolder = $"{date.Value.Year}/{date.Value.Month:d2}/{date.Value.Day:d2}";
            IPublishedContent? parent = content.Parent();
            if (parent is null)
            {
                return null;
            }
#if NET10_0_OR_GREATER
            UrlInfo? parentPath = base.GetUrl(parent, mode, culture, current);
            var parentUrl = parentPath?.Url?.ToString()?.EnsureEndsWith("/");
            if (string.IsNullOrWhiteSpace(parentUrl))
            {
                return null;
            }
            var newUrl = parentUrl + urlFolder + "/" + content.UrlSegment?.EnsureEndsWith("/");
            return UrlInfo.AsUrl(newUrl, "Articulate.Routing.DateFormattedUrlProvider", culture);

#else
            UrlInfo? parentPath = base.GetUrl(parent, mode, culture, current);
            var parentUrl = parentPath?.Text.EnsureEndsWith("/");
            if (string.IsNullOrWhiteSpace(parentUrl))
            {
                return null;
            }
            var newUrl = parentUrl + urlFolder + "/" + content.UrlSegment?.EnsureEndsWith("/");
            return UrlInfo.Url(newUrl, culture);

#endif

        }
    }
}
