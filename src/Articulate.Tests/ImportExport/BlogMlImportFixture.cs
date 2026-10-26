#nullable enable
using System.Linq.Expressions;
using System.Text;
using System.Xml.Linq;
using Articulate.ImportExport;
using Articulate.Options;
using Articulate.Services;
using Articulate.Syndication.BlogML;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Persistence.Querying;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Cms.Infrastructure.Scoping;

namespace Articulate.Tests.ImportExport;

// Real content/property models; only filesystem, query and service boundaries are substituted.
internal sealed class BlogMlImportFixture : IDisposable
{
    private readonly string _tempRoot = Path.Combine(Path.GetTempPath(), "articulate-import-" + Guid.NewGuid().ToString("N"));
    private readonly Dictionary<string, ContentType> _types = new(StringComparer.Ordinal);
    private readonly Dictionary<IQuery<IContent>, Func<IContent, bool>> _filters = [];
    private int _nextId = 100;

    public BlogMlImportFixture(bool variesByCulture = false)
    {
        Culture = variesByCulture ? "en-GB" : null;
        var helper = new DefaultShortStringHelper(new DefaultShortStringHelperConfig());
        var dataType = new Mock<IDataType>();
        dataType.SetupGet(x => x.Id).Returns(1);
        dataType.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        dataType.SetupGet(x => x.HasIdentity).Returns(true);
        dataType.SetupGet(x => x.EditorAlias).Returns("Umbraco.TextBox");
        dataType.SetupGet(x => x.DatabaseType).Returns(ValueStorageType.Ntext);
        dataType.SetupGet(x => x.ConfigurationObject).Returns(new TagConfiguration { StorageType = TagsStorageType.Csv });
        var dataTypes = new Mock<IDataTypeService>();
#if !UMBRACO_18_OR_GREATER
#pragma warning disable CS0618 // Exercise the v17 tags API, which still resolves data types by ID.
        dataTypes.Setup(x => x.GetDataType(It.IsAny<int>())).Returns(dataType.Object);
#pragma warning restore CS0618
#endif
        dataTypes.Setup(x => x.GetAsync(It.IsAny<Guid>())).ReturnsAsync(dataType.Object);
        var typeService = new Mock<IContentTypeService>();
        foreach (string alias in new[] { ArticulateConstants.ContentType.Articulate, ArticulateConstants.ContentType.ArticulateArchive, ArticulateConstants.ContentType.ArticulateRichText, ArticulateConstants.ContentType.ArticulateAuthors, ArticulateConstants.ContentType.ArticulateAuthor })
        {
            var type = new ContentType(helper, -1) { Id = _types.Count + 1, Alias = alias, Name = alias };
            if (alias == ArticulateConstants.ContentType.ArticulateRichText)
            {
                type.Variations = variesByCulture ? ContentVariation.Culture : ContentVariation.Nothing;
                foreach (string property in new[] { "umbracoUrlName", "importId", "publishedDate", "excerpt", "richText", "enableComments", "author", "tags", "categories" })
                {
                    type.AddPropertyType(new PropertyType(helper, dataType.Object, property)
                    {
                        Variations = type.Variations,
                    });
                }
            }

            _types.Add(alias, type);
            typeService.Setup(x => x.Get(alias)).Returns(type);
        }

        Root = AddContent("Blog", -1, ArticulateConstants.ContentType.Articulate);
        _ = AddContent("Authors", Root.Id, ArticulateConstants.ContentType.ArticulateAuthors);
        ContentService.Setup(x => x.GetById(It.IsAny<Guid>())).Returns<Guid>(key => Nodes.SingleOrDefault(x => x.Key == key));
        ContentService.Setup(x => x.Create(It.IsAny<string>(), It.IsAny<IContent>(), It.IsAny<string>(), It.IsAny<int>()))
            .Returns<string, IContent, string, int>((name, parent, alias, _) => NewContent(name, parent.Id, alias));
        ContentService.Setup(x => x.Save(It.IsAny<IContent>(), It.IsAny<int?>(), It.IsAny<ContentScheduleCollection?>()))
            .Returns<IContent, int?, ContentScheduleCollection?>((content, _, _) =>
            {
                if (content.Id == 0)
                {
                    content.Id = _nextId++;
                    Nodes.Add(content);
                }

                Saved.Add(content);
                Persisted[content.Key] = (IContent)content.DeepClone();
                return OperationResult.Succeed(new EventMessages());
            });
        ContentService.Setup(x => x.Publish(It.IsAny<IContent>(), It.IsAny<string[]>(), It.IsAny<int>()))
            .Returns<IContent, string[], int>((content, _, _) =>
            {
                Published.Add(content);
                return new PublishResult(new EventMessages(), content);
            });
        EntityService.Setup(x => x.Exists(It.IsAny<Guid>())).Returns<Guid>(key => Nodes.Any(x => x.Key == key));
        var sql = new Mock<ISqlContext>();
        sql.Setup(x => x.Query<IContent>()).Returns(() =>
        {
            var query = new Mock<IQuery<IContent>>();
            query.Setup(x => x.Where(It.IsAny<Expression<Func<IContent, bool>>>()))
                .Returns<Expression<Func<IContent, bool>>>(predicate =>
                {
                    _filters[query.Object] = predicate.Compile();
                    return query.Object;
                });
            return query.Object;
        });
        ContentService.Setup(x => x.GetPagedOfType(It.IsAny<int>(), It.IsAny<long>(), It.IsAny<int>(), out It.Ref<long>.IsAny, It.IsAny<IQuery<IContent>>(), It.IsAny<Ordering?>()))
            .Returns((int type, long _, int _, out long total, IQuery<IContent> filter, Ordering? _) =>
            {
                IContent[] found = [.. Nodes.Where(x => x.ContentType.Id == type && _filters[filter](x))];
                total = found.Length;
                return found;
            });
        ContentService.Setup(x => x.GetPagedChildren(It.IsAny<int>(), It.IsAny<long>(), It.IsAny<int>(), out It.Ref<long>.IsAny, null, It.IsAny<IQuery<IContent>?>(), It.IsAny<Ordering?>(), true))
            .Returns((int parent, long _, int _, out long total, string[]? _, IQuery<IContent>? filter, Ordering? _, bool _) =>
            {
                IContent[] found = [.. Nodes.Where(x => x.ParentId == parent && (filter is null || _filters[filter](x)))];
                total = found.Length;
                return found;
            });
        var languages = new Mock<ILanguageService>();
        languages.Setup(x => x.GetDefaultIsoCodeAsync()).ReturnsAsync("en-GB");
        var scopes = new Mock<IScopeProvider>();
        scopes.Setup(x => x.CreateScope(It.IsAny<System.Data.IsolationLevel>(), It.IsAny<Umbraco.Cms.Core.Scoping.RepositoryCacheMode>(), It.IsAny<IEventDispatcher?>(), It.IsAny<IScopedNotificationPublisher?>(), It.IsAny<bool?>(), It.IsAny<bool>(), It.IsAny<bool>())).Returns(Mock.Of<IScope>());
        var io = new Mock<IIOHelper>();
        io.Setup(x => x.PathStartsWith(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<char[]>())).Returns<string, string, char[]>((path, root, _) => path.StartsWith(root, StringComparison.OrdinalIgnoreCase));
        var hosting = new Mock<IHostingEnvironment>();
#pragma warning disable CS0618
        hosting.SetupGet(x => x.LocalTempPath).Returns(_tempRoot);
        hosting.Setup(x => x.MapPathContentRoot(It.IsAny<string>())).Returns<string>(x => x);
        hosting.Setup(x => x.MapPathWebRoot(It.IsAny<string>())).Returns<string>(x => x);
#pragma warning restore CS0618
        TempFiles = new ArticulateTempFileSystem(io.Object, hosting.Object, NullLogger<ArticulateTempFileSystem>.Instance);
        var sanitizer = new Mock<IHtmlSanitizer>();
        sanitizer.Setup(x => x.Sanitize(It.IsAny<string>())).Returns<string>(x => x);
#pragma warning disable SA1111
        Importer = new BlogMlImporter(
            new DisqusXmlExporter(Mock.Of<IPublishedUrlProvider>(), NullLogger<DisqusXmlExporter>.Instance, Mock.Of<IArticulateMarkdownConverter>()),
            ContentService.Object,
            typeService.Object,
            Mock.Of<IUserService>(),
            NullLogger<BlogMlImporter>.Instance,
            dataTypes.Object,
            sql.Object,
            scopes.Object,
            languages.Object,
            new PropertyEditorCollection(new DataEditorCollection(() => [])),
            Mock.Of<IJsonSerializer>(),
            TempFiles,
            Mock.Of<IArticulateImportMediaService>(),
            sanitizer.Object,
            helper,
            Microsoft.Extensions.Options.Options.Create(new ArticulateOptions()),
            Microsoft.Extensions.Options.Options.Create(new ArticulateCommentsOptions()),
            EntityService.Object
#if UMBRACO_18_OR_GREATER
            ,
            Mock.Of<IIdKeyMap>()
#endif
        );
#pragma warning restore SA1111
    }

    public string? Culture { get; }
    public IContent Root { get; }
    public List<IContent> Nodes { get; } = [];
    public List<IContent> Saved { get; } = [];
    public Dictionary<Guid, IContent> Persisted { get; } = [];
    public List<IContent> Published { get; } = [];
    public Mock<IContentService> ContentService { get; } = new();
    public Mock<IEntityService> EntityService { get; } = new();
    public ArticulateTempFileSystem TempFiles { get; }
    public BlogMlImporter Importer { get; }
    public IEnumerable<IContent> Posts => Nodes.Where(x => x.ContentType.Alias == ArticulateConstants.ContentType.ArticulateRichText);
    public IEnumerable<IContent> Archives => Nodes.Where(x => x.ParentId == Root.Id && x.ContentType.Alias == ArticulateConstants.ContentType.ArticulateArchive);

    public IContent AddArchive(string name, Guid? key = null, IContent? root = null)
    {
        IContent archive = AddContent(name, (root ?? Root).Id, ArticulateConstants.ContentType.ArticulateArchive);
        if (key is { } value)
        {
            archive.Key = value;
        }

        return archive;
    }

    public IContent AddPost(IContent archive, string name, string? importId = null, string? urlName = null)
    {
        IContent post = AddContent(name, archive.Id, ArticulateConstants.ContentType.ArticulateRichText);
        post.SetValue("importId", importId, Culture);
        post.SetValue("umbracoUrlName", urlName, Culture);
        post.SetValue("richText", "original", Culture);
        Persisted[post.Key] = (IContent)post.DeepClone();
        return post;
    }

    public IContent AddContent(string name, int parent, string alias)
    {
        IContent content = NewContent(name, parent, alias);
        content.Id = _nextId++;
        Nodes.Add(content);
        return content;
    }

    public Task<ImportResponseDto> ImportAsync(bool overwrite, bool publishAll = false, params XElement[] posts)
    {
        WritePosts(posts);
        return Importer.ImportAsync(7, "import.xml", Root.Key, overwrite, null, null, publishAll);
    }

    public void WritePosts(params object?[] posts)
    {
        XNamespace ns = "http://www.blogml.com/2006/09/BlogML";
        var document = new XDocument(new XElement(ns + "blog", new XAttribute("date-created", "2020-01-01T00:00:00"), new XElement(ns + "title", "Blog"), new XElement(ns + "posts", posts)));
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(document.ToString()));
        TempFiles.AddFile("import.xml", stream, true);
    }

    public static XElement Post(string id, string? slug = "hello", string body = "updated", Guid? archiveKey = null, string? archiveName = null, string url = "/hello.aspx", string title = "Title")
    {
        XNamespace ns = "http://www.blogml.com/2006/09/BlogML";
        var post = new XElement(ns + "post", new XAttribute("id", id), new XAttribute("date-created", "2020-01-01T00:00:00"), new XAttribute("post-url", url), new XElement(ns + "title", title), new XElement(ns + "content", new XAttribute("type", "text"), body));
        if (slug is not null)
        {
            post.Add(new XElement(ns + "post-name", slug));
        }

        if (archiveKey is not null || archiveName is not null)
        {
            post.Add(new XElement(XName.Get(ArchiveSyndicationExtension.ElementName, ArchiveSyndicationExtension.Namespace), new XAttribute("key", archiveKey ?? Guid.Empty), new XAttribute("name", archiveName ?? string.Empty)));
        }

        return post;
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot))
        {
            Directory.Delete(_tempRoot, true);
        }
    }

    private IContent NewContent(string name, int parent, string alias) => new Content(name, parent, _types[alias], alias == ArticulateConstants.ContentType.ArticulateRichText ? Culture : null);
}
