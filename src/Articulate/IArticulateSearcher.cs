#nullable enable
using Umbraco.Cms.Core.Models.PublishedContent;

namespace Articulate
{
    /// <summary>
    /// Provides searching capabilities for Articulate posts.
    /// </summary>
    public interface IArticulateSearcher
    {
        /// <summary>
        /// Searches the published content index for posts based on the provided term and criteria.
        /// </summary>
        public Task<(IEnumerable<IPublishedContent> Results, long TotalResults)> SearchAsync(
            string term,
            int blogArchiveNodeId,
            int pageSize,
            int pageIndex);
    }
}
