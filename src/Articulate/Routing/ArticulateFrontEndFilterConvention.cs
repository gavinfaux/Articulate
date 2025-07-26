using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Umbraco.Cms.Core.PublishedCache;

namespace Articulate.Routing
{
    internal class ArticulateFrontEndFilterConvention : IApplicationModelConvention
    {
        private readonly IPublishedContentTypeCache _publishedContentTypeCache;
        private readonly IDocumentCacheService _documentCacheService;

        public ArticulateFrontEndFilterConvention(IPublishedContentTypeCache publishedContentTypeCache, IDocumentCacheService documentCacheService)
        {
            _documentCacheService = documentCacheService;
            _publishedContentTypeCache = publishedContentTypeCache;
        }

        public void Apply(ApplicationModel application)
        {
            foreach (ControllerModel controller in application.Controllers)
            {
                controller.Filters.Add(new RouteCacheRefresherFilter(_publishedContentTypeCache, _documentCacheService));
            }
        }
    }
}
