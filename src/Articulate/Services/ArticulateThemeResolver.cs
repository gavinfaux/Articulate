using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace Articulate.Services
{
    public class ArticulateThemeResolver(IUmbracoContextAccessor umbracoContextAccessor, AppCaches appCaches)
        : IArticulateThemeResolver
    {
        public string GetCurrentThemeName()
        {
            // cache a single request.
            return appCaches.RequestCache.GetCacheItem(
                "Articulate_CurrentRequestThemeName",
                () =>
                {
                    if (!umbracoContextAccessor.TryGetUmbracoContext(out var umbracoContext) ||
                        umbracoContext.PublishedRequest?.PublishedContent == null)
                    {
                        return string.Empty;
                    }

                    var articulateRoot =
                        umbracoContext.PublishedRequest.PublishedContent.AncestorOrSelf(ArticulateConstants.ContentType
                            .Articulate);
                    if (articulateRoot == null)
                    {
                        return string.Empty;
                    }

                    var themeName = articulateRoot.Value<string>("theme");
                    return themeName ?? string.Empty;
                });
        }
    }
}
