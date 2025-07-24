using System.Collections.Generic;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Models
{
    public class AuthorListModel : MasterModel
    {
        public AuthorListModel(IPublishedContent content, IPublishedValueFallback publishedValueFallback) : base(content, publishedValueFallback)
        {
        }

        public IEnumerable<AuthorModel> Authors { get; set; }
    }
}
