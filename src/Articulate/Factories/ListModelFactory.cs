#if NET9_0_OR_GREATER
using Umbraco.Cms.Core.Services.Navigation;
#endif
using Articulate.Models;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Factories
{
    public class ListModelFactory : IListModelFactory
    {
#if NET9_0_OR_GREATER
        private readonly INavigationQueryService _navigationQueryService;
        private readonly IPublishedContentStatusFilteringService _statusFilteringService;

        public ListModelFactory(
            INavigationQueryService navigationQueryService,
            IPublishedContentStatusFilteringService statusFilteringService)
        {
            _navigationQueryService = navigationQueryService;
            _statusFilteringService = statusFilteringService;
        }

        public ListModel Create(
            IPublishedContent content,
            PagerModel pager,
            IEnumerable<IPublishedContent> items,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor)
        {
            return new ListModel(content, pager, items, publishedValueFallback, variationContextAccessor, _navigationQueryService, _statusFilteringService);
        }
#else
        public ListModel Create(
            IPublishedContent content,
            PagerModel pager,
            IEnumerable<IPublishedContent> items,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor)
        {
            return new ListModel(content, pager, items, publishedValueFallback, variationContextAccessor);
        }
#endif
    }
}
