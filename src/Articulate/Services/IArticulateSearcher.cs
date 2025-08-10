#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate.Services
{
    public interface IArticulateSearcher
    {
        public IEnumerable<IPublishedContent>? Search(string term, string? indexName, int blogArchiveNodeId, int pageSize, int pageIndex, out long totalResults);
    }
}
