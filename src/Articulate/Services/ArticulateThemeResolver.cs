#nullable enable
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;

namespace Articulate.Services
{
    public class ArticulateThemeResolver(IUmbracoContextAccessor umbracoContextAccessor, AppCaches appCaches)
        : IArticulateThemeResolver
    {
        public string? GetCurrentThemeName() =>

            // cache a single request.
            appCaches.RequestCache.GetCacheItem(
                "Articulate_CurrentRequestThemeName",
                () =>
                {
                    if (!umbracoContextAccessor.TryGetUmbracoContext(out IUmbracoContext? umbracoContext) ||
                        umbracoContext.PublishedRequest?.PublishedContent is null)
                    {
                        return string.Empty;
                    }

                    IPublishedContent articulateRoot =
                        umbracoContext.PublishedRequest.PublishedContent.AncestorOrSelf(ArticulateConstants.ContentType
                            .Articulate);

                    var themeName = articulateRoot.Value<string>("theme");
                    return themeName ?? string.Empty;
                });
    }
}
