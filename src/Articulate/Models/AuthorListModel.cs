using System.Collections.Generic;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models
{
    public class AuthorListModel(
        IPublishedContent content,
        IPublishedValueFallback publishedValueFallback,
        IVariationContextAccessor variationContextAccessor)
        : MasterModel(content, publishedValueFallback,
            variationContextAccessor)
    {
        public IEnumerable<AuthorModel> Authors { get; set; }
    }
}
