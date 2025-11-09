#nullable enable
using System.Text;
using Examine;
using Examine.Search;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;

namespace Articulate
{
    public class DefaultArticulateSearcher(
        IUmbracoContextAccessor umbracoContextAccessor,
        IExamineManager examineManager)
        : IArticulateSearcher
    {
        /// <inheritdoc/>
        public IEnumerable<IPublishedContent> Search(string term, string? indexName, int blogArchiveNodeId, int pageSize, int pageIndex, out long totalResults)
        {
            var splitSearch = term.Split([' '], StringSplitOptions.RemoveEmptyEntries);

            // The fields to search on and their 'weight' (importance)
            var fields = new Dictionary<string, int>
            {
                { "markdown", 2 },
                { "richText", 2 },
                { "nodeName", 3 },
                { "tags", 1 },
                { "categories", 1 },
                { "umbracoUrlName", 3 },
            };

            // The multipliers for match types
            const int exactMatch = 5;
            const int termMatch = 2;

            var fieldQuery = new StringBuilder();

            // build field query
            foreach (KeyValuePair<string, int> field in fields)
            {
                // full exact match (which has a higher boost)
                _ = fieldQuery.Append($"{field.Key}:{"\"" + term + "\""}^{field.Value * exactMatch}");
                _ = fieldQuery.Append(' ');

                // NOTE: Phrase match wildcard isn't really supported unless you use the Lucene
                // API like ComplexPhraseWildcardSomethingOrOther...
                // split match
                foreach (var s in splitSearch)
                {
                    // match on each term, no wildcard, higher boost
                    _ = fieldQuery.Append($"{field.Key}:{s}^{field.Value * termMatch}");
                    _ = fieldQuery.Append(' ');

                    // match on each term, with wildcard
                    _ = fieldQuery.Append($"{field.Key}:{s}*");
                    _ = fieldQuery.Append(' ');
                }
            }

            indexName = indexName.IsNullOrWhiteSpace() ? Umbraco.Cms.Core.Constants.UmbracoIndexes.ExternalIndexName : indexName;

            if (!examineManager.TryGetIndex(indexName, out IIndex? index) || index is null)
            {
                throw new InvalidOperationException("No index found by name " + indexName);
            }

            ISearcher searcher = index.Searcher;

            IBooleanOperation criteria = searcher.CreateQuery()
                .Field("parentID", blogArchiveNodeId)
                .And()
                .NativeQuery($" +({fieldQuery})");

            ISearchResults searchResult = criteria.Execute(QueryOptions.SkipTake(pageIndex * pageSize, pageSize));

            IEnumerable<PublishedSearchResult> result = searchResult
                .Skip(pageIndex * pageSize)
                .ToPublishedSearchResults(umbracoContextAccessor.GetRequiredUmbracoContext().Content);

            totalResults = searchResult.TotalItemCount;

            return result.Select(x => x.Content);
        }
    }
}
