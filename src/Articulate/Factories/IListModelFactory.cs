using Articulate.Models;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Factories
{
    public interface IListModelFactory
    {
        ListModel Create(
            IPublishedContent content,
            PagerModel pager,
            IEnumerable<IPublishedContent> items,
            IPublishedValueFallback publishedValueFallback,
            IVariationContextAccessor variationContextAccessor);
    }
}
