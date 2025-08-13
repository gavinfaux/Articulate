#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models;

public class AuthorListModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback)
    : MasterModel(content, publishedValueFallback)
{
    public IEnumerable<AuthorModel>? Authors { get; set; }
}
