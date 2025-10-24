#nullable enable
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;

namespace Articulate.Routing
{
    public class DateFormattedUrlProvider : DefaultUrlProvider
    {
        [Obsolete("Please use ILanguageService and IDictionaryItemService for localization. Will be removed in V15.", false)]
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

            UrlInfo? parentPath = base.GetUrl(parent, mode, culture, current);
            var newUrl = parentPath?.Text.EnsureEndsWith("/") + urlFolder + "/" + content.UrlSegment?.EnsureEndsWith("/");

            return UrlInfo.Url(newUrl, culture);
        }
    }
}
