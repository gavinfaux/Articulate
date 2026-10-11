#if UMBRACO_19_OR_GREATER
#nullable enable

using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Search;
using Umbraco.Cms.Core.Search.Querying;
using Umbraco.Cms.Core.Search.Querying.Filtering;

namespace Articulate.Tests
{
    [TestFixture]
    public class DefaultArticulateSearcherTests
    {
        [Test]
        public async Task SearchAsync_UsesPublishedContentSearchAndArchiveFilter()
        {
            var archiveKey = Guid.NewGuid();
            var postKey = Guid.NewGuid();
            Mock<IPublishedContent> archive = new();
            archive.SetupGet(content => content.Key).Returns(archiveKey);
            Mock<IPublishedContent> post = new();
            Mock<IPublishedContentCache> contentCache = new();
            contentCache.Setup(cache => cache.GetById(42)).Returns(archive.Object);
            contentCache.Setup(cache => cache.GetById(postKey)).Returns(post.Object);

            IEnumerable<Filter>? receivedFilters = null;
            Mock<ISearcher> searcher = new();
            searcher.Setup(instance => instance.SearchAsync(
                    It.IsAny<string>(),
                    It.IsAny<string?>(),
                    It.IsAny<IEnumerable<Filter>?>(),
                    It.IsAny<IEnumerable<Umbraco.Cms.Core.Search.Querying.Faceting.Facet>?>(),
                    It.IsAny<IEnumerable<Umbraco.Cms.Core.Search.Querying.Sorting.Sorter>?>(),
                    It.IsAny<string?>(),
                    It.IsAny<string?>(),
                    It.IsAny<AccessContext?>(),
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<int>()))
                .Callback<string, string?, IEnumerable<Filter>?, IEnumerable<Umbraco.Cms.Core.Search.Querying.Faceting.Facet>?, IEnumerable<Umbraco.Cms.Core.Search.Querying.Sorting.Sorter>?, string?, string?, AccessContext?, int, int, int>(
                    (_, _, filters, _, _, _, _, _, _, _, _) => receivedFilters = filters)
                .ReturnsAsync(new SearchResult(
                    17,
                    [new Document(postKey, Umbraco.Cms.Core.Models.UmbracoObjectTypes.Document)],
                    []));

            Mock<ISearcherResolver> resolver = new();
            resolver.Setup(instance => instance.GetSearcher(Umbraco.Cms.Core.Constants.Search.IndexAliases.PublishedContent))
                .Returns(searcher.Object);
            Mock<IVariationContextAccessor> variationContext = new();
            variationContext.SetupGet(accessor => accessor.VariationContext).Returns(new VariationContext("fr-FR"));

            DefaultArticulateSearcher sut = new(resolver.Object, contentCache.Object, variationContext.Object);
            (IEnumerable<IPublishedContent> results, long total) = await sut.SearchAsync(
                "one two three four five six seven eight nine ten eleven",
                42,
                5,
                2);

            Assert.That(results, Is.EqualTo(new[] { post.Object }));
            Assert.That(total, Is.EqualTo(17));
            Assert.That(receivedFilters, Has.Exactly(1).TypeOf<KeywordFilter>());
            KeywordFilter archiveFilter = receivedFilters!.OfType<KeywordFilter>().Single();
            Assert.That(archiveFilter.FieldName, Is.EqualTo(Umbraco.Cms.Core.Constants.Search.FieldNames.ParentId));
            Assert.That(archiveFilter.Values, Is.EqualTo(new[] { archiveKey.ToString("D") }));
            resolver.Verify(instance => instance.GetSearcher(Umbraco.Cms.Core.Constants.Search.IndexAliases.PublishedContent), Times.Once);
            searcher.Verify(instance => instance.SearchAsync(
                Umbraco.Cms.Core.Constants.Search.IndexAliases.PublishedContent,
                "one two three four five six seven eight nine ten",
                It.IsAny<IEnumerable<Filter>?>(),
                null,
                null,
                "fr-FR",
                null,
                null,
                10,
                5,
                0),
                Times.Once);
            searcher.VerifyNoOtherCalls();
            resolver.VerifyNoOtherCalls();
        }

        [Test]
        public async Task SearchAsync_ReturnsNoResultsWithoutSearchingWhenArchiveNodeIsMissing()
        {
            Mock<IPublishedContentCache> contentCache = new();
            contentCache.Setup(cache => cache.GetById(42)).Returns((IPublishedContent?)null);
            Mock<ISearcher> searcher = new();
            Mock<ISearcherResolver> resolver = new();
            resolver.Setup(instance => instance.GetSearcher(Umbraco.Cms.Core.Constants.Search.IndexAliases.PublishedContent))
                .Returns(searcher.Object);
            Mock<IVariationContextAccessor> variationContext = new();

            DefaultArticulateSearcher sut = new(resolver.Object, contentCache.Object, variationContext.Object);
            (IEnumerable<IPublishedContent> results, long total) = await sut.SearchAsync("term", 42, 5, 0);

            Assert.That(results, Is.Empty);
            Assert.That(total, Is.EqualTo(0));
            searcher.Verify(instance => instance.SearchAsync(
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<IEnumerable<Filter>?>(),
                It.IsAny<IEnumerable<Umbraco.Cms.Core.Search.Querying.Faceting.Facet>?>(),
                It.IsAny<IEnumerable<Umbraco.Cms.Core.Search.Querying.Sorting.Sorter>?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<AccessContext?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>()),
                Times.Never);
        }
    }
}
#endif
