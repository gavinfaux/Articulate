#if UMBRACO_19_OR_GREATER
#nullable enable

using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Search.Indexing;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Infrastructure.Search.PropertyValueHandlers;

namespace Articulate.Tests
{
    [TestFixture]
    public class ArticulatePostContentIndexerTests
    {
        [Test]
        public async Task GetIndexFieldsAsync_MapsPostFieldsToTiers()
        {
            Mock<IMarkdownToHtmlConverter> markdown = new();
            markdown.Setup(converter => converter.ToHtml("# Title\nbody text")).Returns("<h1>Title</h1><p>body text</p>");
            ArticulatePostContentIndexer sut = new(
                markdown.Object,
                new HtmlIndexValueParser(NullLogger<HtmlIndexValueParser>.Instance),
                Mock.Of<IJsonSerializer>(),
                NullLogger<ArticulatePostContentIndexer>.Instance);

            IContentBase post = CreateContent(
                ArticulateConstants.ContentType.ArticulateMarkdown,
                ("umbracoUrlName", "my-post"),
                ("tags", "alpha, beta"),
                ("markdown", "# Title\nbody text"),
                ("nodeName", "ignored"));

            var fields = (await sut.GetIndexFieldsAsync(post, [null], true, CancellationToken.None))
                .ToDictionary(field => field.FieldName, field => field.Value);

            Assert.That(fields.Keys, Is.EquivalentTo(new[] { "umbracoUrlName", "tags", "markdown" }));
            Assert.That(fields["umbracoUrlName"].TextsR1, Is.EqualTo(new[] { "my-post" }));
            Assert.That(fields["tags"].TextsR3, Is.EqualTo(new[] { "alpha", "beta" }));
            Assert.That(fields["markdown"].TextsR2, Is.EqualTo(new[] { "body text" }));
        }

        [Test]
        public async Task GetIndexFieldsAsync_IgnoresOtherContentTypes()
        {
            ArticulatePostContentIndexer sut = new(
                Mock.Of<IMarkdownToHtmlConverter>(),
                Mock.Of<IHtmlIndexValueParser>(),
                Mock.Of<IJsonSerializer>(),
                NullLogger<ArticulatePostContentIndexer>.Instance);

            IEnumerable<IndexField> fields = await sut.GetIndexFieldsAsync(
                CreateContent("textPage", ("umbracoUrlName", "page")), [null], true, CancellationToken.None);

            Assert.That(fields, Is.Empty);
        }

        private static IContentBase CreateContent(string contentTypeAlias, params (string Alias, string Value)[] values)
        {
            var properties = values.Select(value =>
            {
                Mock<IProperty> property = new();
                property.SetupGet(instance => instance.Alias).Returns(value.Alias);
                property.SetupGet(instance => instance.PropertyType).Returns(Mock.Of<IPropertyType>());
                property.Setup(instance => instance.GetValue(null, null, true)).Returns(value.Value);
                return property.Object;
            }).ToList<IProperty>();

            Mock<IPropertyCollection> collection = new();
            collection.Setup(instance => instance.GetEnumerator()).Returns(() => properties.GetEnumerator());
            Mock<IContentBase> content = new();
            content.SetupGet(instance => instance.ContentType).Returns(Mock.Of<ISimpleContentType>(type => type.Alias == contentTypeAlias));
            content.SetupGet(instance => instance.Properties).Returns(collection.Object);
            return content.Object;
        }
    }
}
#endif
