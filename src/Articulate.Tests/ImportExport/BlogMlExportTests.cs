#nullable enable
using System.Linq.Expressions;
using System.Text.Encodings.Web;
using System.Xml;
using System.Xml.Linq;
using Articulate.ImportExport;
using Articulate.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Persistence.Querying;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Infrastructure.Serialization;
using Umbraco.Cms.Infrastructure.Persistence;

namespace Articulate.Tests.ImportExport;

[TestFixture]
public class BlogMlExportTests
{
    private static readonly XNamespace BlogMl = "http://www.blogml.com/2006/09/BlogML";

    [TestCase("{\"markup\":\"<p>Hi</p>\",\"blocks\":null}", "<p>Hi</p>")]
    [TestCase("<p>Legacy &amp; raw HTML</p>", "<p>Legacy &amp; raw HTML</p>")]
    public async Task Export_serializes_rich_text_markup(string storedValue, string expected)
    {
        using var fixture = new BlogMlImportFixture();
        IContent archive = fixture.AddArchive("Archive");
        IContent post = fixture.AddPost(archive, "Hello");
        post.SetValue("richText", storedValue);
        ((Content)post).Published = true;

        XDocument document = await ExportAsync(fixture, []);

        Assert.That(document.Descendants(BlogMl + "post").Single().Element(BlogMl + "content")?.Value, Is.EqualTo(expected));
    }

    [Test]
    public async Task Export_serializes_only_referenced_categories_and_utc_generation_time()
    {
        using var fixture = new BlogMlImportFixture();
        IContent archive = fixture.AddArchive("Archive");
        IContent first = fixture.AddPost(archive, "First");
        IContent second = fixture.AddPost(archive, "Second");
        ((Content)first).Published = true;
        ((Content)second).Published = true;
        IContent draft = fixture.AddPost(archive, "Draft");
        IContent otherRoot = fixture.AddContent("Other blog", -1, ArticulateConstants.ContentType.Articulate);
        IContent otherArchive = fixture.AddArchive("Other archive", root: otherRoot);
        IContent otherPost = fixture.AddPost(otherArchive, "Other post");
        ((Content)otherPost).Published = true;
        var shared = new Tag(1, "categories", "Shared");
        var secondOnly = new Tag(2, "categories", "Second only");
        var draftOnly = new Tag(3, "categories", "Draft only");
        var otherOnly = new Tag(4, "categories", "Other blog only");
        var unused = new Tag(5, "categories", "Unused");
        var categories = new Dictionary<int, ITag[]>
        {
            [first.Id] = [shared],
            [second.Id] = [shared, secondOnly],
            [draft.Id] = [draftOnly],
            [otherPost.Id] = [otherOnly],
        };

        XDocument document = await ExportAsync(fixture, categories, [shared, secondOnly, draftOnly, otherOnly, unused]);

        XElement root = document.Root!;
        Assert.That(root.Element(BlogMl + "categories")?.Elements(BlogMl + "category").Select(x => (string?)x.Attribute("id")), Is.EquivalentTo(new[] { "1", "2" }));
        Assert.That(root.Element(BlogMl + "posts")?.Elements(BlogMl + "post").Select(x => (string?)x.Attribute("id")), Is.EquivalentTo(new[] { first.Key.ToString(), second.Key.ToString() }));
        Assert.That(document.Descendants(BlogMl + "post").SelectMany(x => x.Element(BlogMl + "categories")!.Elements()).Select(x => (string?)x.Attribute("ref")), Is.EquivalentTo(new[] { "1", "1", "2" }));
        string generatedOn = root.Attribute("date-created")!.Value;
        Assert.That(generatedOn, Does.EndWith("Z"));
        Assert.That(XmlConvert.ToDateTime(generatedOn, XmlDateTimeSerializationMode.RoundtripKind).Kind, Is.EqualTo(DateTimeKind.Utc));
    }

    private static async Task<XDocument> ExportAsync(BlogMlImportFixture fixture, Dictionary<int, ITag[]> categories, ITag[]? allCategories = null)
    {
        var types = new Mock<IContentTypeService>();
        foreach (IContent node in fixture.Nodes)
        {
            IContentType type = Mock.Of<IContentType>(x => x.Id == node.ContentType.Id && x.Alias == node.ContentType.Alias);
            types.Setup(x => x.Get(node.ContentType.Alias)).Returns(type);
        }

        var dataTypes = new Mock<IDataTypeService>();
        foreach (string group in new[] { "categories", "tags" })
        {
            var dataType = new Mock<IDataType>();
            dataType.SetupGet(x => x.ConfigurationObject).Returns(new TagConfiguration { Group = group });
            dataTypes.Setup(x => x.GetAsync(group == "categories" ? "Articulate Categories" : "Articulate Tags")).ReturnsAsync(dataType.Object);
        }

        var filters = new Dictionary<IQuery<IContent>, Func<IContent, bool>>();
        var sql = new Mock<ISqlContext>();
        sql.Setup(x => x.Query<IContent>()).Returns(() =>
        {
            var query = new Mock<IQuery<IContent>>();
            query.Setup(x => x.Where(It.IsAny<Expression<Func<IContent, bool>>>())).Returns<Expression<Func<IContent, bool>>>(predicate =>
            {
                filters[query.Object] = predicate.Compile();
                return query.Object;
            });
            return query.Object;
        });
        fixture.ContentService.Setup(x => x.GetPagedDescendants(It.IsAny<int>(), It.IsAny<long>(), It.IsAny<int>(), out It.Ref<long>.IsAny, It.IsAny<IQuery<IContent>?>(), It.IsAny<Ordering?>()))
            .Returns((int parent, long page, int size, out long total, IQuery<IContent>? filter, Ordering? _) =>
            {
                IContent[] found = [.. fixture.Nodes.Where(x => IsDescendant(fixture, x, parent) && (filter is null || filters[filter](x)))];
                total = found.Length;
                return found.Skip((int)page * size).Take(size);
            });
        var tags = new Mock<ITagService>();
        tags.Setup(x => x.GetTagsForEntity(It.IsAny<int>(), It.IsAny<string>())).Returns<int, string, string?>((id, group, _) => group == "categories" && categories.TryGetValue(id, out ITag[]? values) ? values : []);
        tags.Setup(x => x.GetAllContentTags("categories")).Returns(allCategories ?? []);
        var urls = new Mock<IPublishedUrlProvider>();
        urls.Setup(x => x.GetUrl(It.IsAny<int>(), It.IsAny<UrlMode>(), It.IsAny<string?>(), It.IsAny<Uri?>())).Returns<int, UrlMode, string?, Uri?>((id, _, _, _) => "https://example.test/" + id);
        var encoderFactory = new Mock<IJsonSerializerEncoderFactory>();
        encoderFactory.Setup(x => x.CreateEncoder<SystemTextJsonSerializer>()).Returns(JavaScriptEncoder.Default);
        var serializer = new SystemTextJsonSerializer(encoderFactory.Object);
        var exporter = new BlogMlExporter(fixture.ContentService.Object, Mock.Of<IMediaService>(), types.Object, dataTypes.Object, tags.Object, null!, fixture.TempFiles, urls.Object, sql.Object, NullLogger<BlogMlExporter>.Instance, Mock.Of<IArticulateMarkdownConverter>(), serializer);

        await exporter.ExportAsync(fixture.Root.Key, "export.xml");
        await using Stream stream = fixture.TempFiles.OpenFile("export.xml");
        return XDocument.Load(stream);
    }

    private static bool IsDescendant(BlogMlImportFixture fixture, IContent node, int parent)
    {
        while (node.ParentId != parent)
        {
            IContent? ancestor = fixture.Nodes.FirstOrDefault(x => x.Id == node.ParentId);
            if (ancestor is null)
            {
                return false;
            }

            node = ancestor;
        }

        return true;
    }
}
