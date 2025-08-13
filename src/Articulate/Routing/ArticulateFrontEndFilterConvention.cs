#nullable enable
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Umbraco.Cms.Core.PublishedCache;

namespace Articulate.Routing;

internal class ArticulateFrontEndFilterConvention(
    IPublishedContentTypeCache publishedContentTypeCache,
    IDocumentCacheService documentCacheService)
    : IApplicationModelConvention
{
    public void Apply(ApplicationModel application)
    {
        foreach (ControllerModel controller in application.Controllers)
        {
            controller.Filters.Add(new RouteCacheRefresherFilter(publishedContentTypeCache, documentCacheService));
        }
    }
}
