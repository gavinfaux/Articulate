#nullable enable
#if !UMBRACO_19_OR_GREATER
using System.Collections.Frozen;
using System.Text;
using Examine;
using Examine.Search;
using Lucene.Net.QueryParsers.Classic;
#endif
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;
#if UMBRACO_19_OR_GREATER
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Search;
using Umbraco.Cms.Core.Search.Querying.Filtering;
#endif

namespace Articulate
{
    /// <summary>
    /// Default implementation of <see cref="IArticulateSearcher"/>.
    /// </summary>
    public class DefaultArticulateSearcher : IArticulateSearcher
    {
#if UMBRACO_19_OR_GREATER
        private readonly ISearcherResolver _searcherResolver;
        private readonly IPublishedContentCache _publishedContentCache;
        private readonly IVariationContextAccessor _variationContextAccessor;

        public DefaultArticulateSearcher(
            ISearcherResolver searcherResolver,
            IPublishedContentCache publishedContentCache,
            IVariationContextAccessor variationContextAccessor)
        {
            _searcherResolver = searcherResolver;
            _publishedContentCache = publishedContentCache;
            _variationContextAccessor = variationContextAccessor;
        }
#else
        private readonly IUmbracoContextAccessor _umbracoContextAccessor;
        private readonly IExamineManager _examineManager;

        public DefaultArticulateSearcher(
            IUmbracoContextAccessor umbracoContextAccessor,
            IExamineManager examineManager)
        {
            _umbracoContextAccessor = umbracoContextAccessor;
            _examineManager = examineManager;
        }

        [ThreadStatic]
        private static StringBuilder? _sSharedStringBuilder;

        // Static to avoid allocating a new Dictionary on every search call.
        // The fields to search on and their 'weight' (importance)
        private static readonly FrozenDictionary<string, int> SearchFields = new Dictionary<string, int>
        {
            { "markdown", 2 },
            { "richText", 2 },
            { "nodeName", 3 },
            { "tags", 1 },
            { "categories", 1 },
            { "umbracoUrlName", 3 },
        }.ToFrozenDictionary();
#endif

        /// <inheritdoc/>
        public async Task<(IEnumerable<IPublishedContent> Results, long TotalResults)> SearchAsync(
            string term,
            int blogArchiveNodeId,
            int pageSize,
            int pageIndex)
        {
            if (string.IsNullOrWhiteSpace(term))
            {
                return ([], 0);
            }

            // DoS protection: limit query complexity
            const int maxTermLength = 200;
            const int maxTokenCount = 10;
            term = term[..Math.Min(term.Length, maxTermLength)];
            string[] searchTerms = term.Split([' '], StringSplitOptions.RemoveEmptyEntries);
            if (searchTerms.Length > maxTokenCount)
            {
                searchTerms = searchTerms[..maxTokenCount];
            }

#if UMBRACO_19_OR_GREATER
            // v19 exposes only the published-content alias here. Never let request input select another index.
            const string publishedContentAlias = Umbraco.Cms.Core.Constants.Search.IndexAliases.PublishedContent;
            ISearcher? searcher = _searcherResolver.GetSearcher(publishedContentAlias);
            if (searcher is null)
            {
                return ([], 0);
            }

            Guid? archiveKey = _publishedContentCache.GetById(blogArchiveNodeId)?.Key;
            if (archiveKey is null)
            {
                return ([], 0);
            }

            string culture = _variationContextAccessor.VariationContext?.Culture ?? string.Empty;
            // v9 BREAKING: CMS all-term matching and relevance replace legacy OR/boosts; ArticulatePostContentIndexer maps post fields to tiers.
            // Deferred compat: opt-in IgnorePunctuationOnlyTerms (not implemented).
            Umbraco.Cms.Core.Search.Querying.SearchResult result = await searcher.SearchAsync(
                publishedContentAlias,
                query: string.Join(' ', searchTerms),
                filters: [new KeywordFilter(
                    Umbraco.Cms.Core.Constants.Search.FieldNames.ParentId,
                    [archiveKey.Value.ToString("D")],
                    Negate: false)],
                culture: string.IsNullOrWhiteSpace(culture) ? null : culture,
                skip: pageIndex * pageSize,
                take: pageSize);

            return (result.Documents
                .Select(document => _publishedContentCache.GetById(document.Id))
                .OfType<IPublishedContent>(), result.Total);
#else
            await Task.CompletedTask; // Examine has no async search API.

            if (searchTerms.Length == 0)
            {
                return ([], 0);
            }

            var escapedTerm = QueryParserBase.Escape(term);

            // The multipliers for match types
            const int exactMatch = 5;
            const int termMatch = 2;

            _sSharedStringBuilder ??= new StringBuilder();
            StringBuilder fieldQuery = _sSharedStringBuilder;
            fieldQuery.Clear();

            // build field query
            foreach (KeyValuePair<string, int> field in SearchFields)
            {
                // full exact match (which has a higher boost)
                _ = fieldQuery.Append($"{field.Key}:\"{escapedTerm}\"^{field.Value * exactMatch} ");

                // NOTE: Phrase match wildcard isn't really supported unless you use the Lucene
                // API like ComplexPhraseWildcardSomethingOrOther...
                // split match
                foreach (string searchTerm in searchTerms)
                {
                    var escapedSplitTerm = QueryParserBase.Escape(searchTerm);

                    // match on each term, no wildcard, higher boost
                    _ = fieldQuery.Append($"{field.Key}:{escapedSplitTerm}^{field.Value * termMatch} ");

                    // match on each term, with wildcard
                    _ = fieldQuery.Append($"{field.Key}:{escapedSplitTerm}* ");
                }
            }

            // Always the public index; request input never selects one.
            if (!_examineManager.TryGetIndex(Umbraco.Cms.Core.Constants.UmbracoIndexes.ExternalIndexName, out IIndex? index) || index is null)
            {
                // Unknown index - return empty results rather than 500
                return ([], 0);
            }

            IBooleanOperation criteria = index.Searcher.CreateQuery()
                .Field("parentID", blogArchiveNodeId)
                .And()
                .NativeQuery($" +({fieldQuery})");
            ISearchResults searchResult = criteria.Execute(QueryOptions.SkipTake(pageIndex * pageSize, pageSize));
            IEnumerable<PublishedSearchResult> publishedResults = searchResult
                .ToPublishedSearchResults(_umbracoContextAccessor.GetRequiredUmbracoContext().Content);
            return (publishedResults.Select(result => result.Content), searchResult.TotalItemCount);
#endif
        }
    }
}
