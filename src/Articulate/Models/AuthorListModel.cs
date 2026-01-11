#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models
{
    /// <summary>
    /// Model for a list of authors.
    /// </summary>
    public class AuthorListModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback)
        : MasterModel(content, publishedValueFallback)
    {
        /// <summary>
        /// Gets or sets the list of authors.
        /// </summary>
        public IEnumerable<AuthorModel>? Authors { get; set; }
    }
}
