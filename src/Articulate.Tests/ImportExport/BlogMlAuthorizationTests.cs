#nullable enable
using System.Text;
using System.Xml;
using System.Xml.Linq;
using Argotic.Syndication.Specialized;
using Microsoft.Extensions.Hosting;
using Articulate.ImportExport;
using Articulate.Options;
using Articulate.Services;
using Articulate.Syndication.BlogML;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.AuthorizationStatus;

namespace Articulate.Tests.ImportExport;

#pragma warning disable IDE0007, IDE0008
[TestFixture]
public class BlogMlAuthorizationTests
{
    [Test]
    public void Archive_marker_is_namespaced_and_import_reads_it()
    {
        var post = new BlogMLPost { Id = "post-1" };
        _ = post.AddExtension(new ArchiveSyndicationExtension { ArchiveIdentity = "key:archive-1" });
        var xml = new StringBuilder();
        using (var writer = XmlWriter.Create(xml, new XmlWriterSettings
        {
            ConformanceLevel = ConformanceLevel.Fragment,
            OmitXmlDeclaration = true
        }))
        {
            post.WriteTo(writer);
        }

        var document = XDocument.Parse(xml.ToString());
        XElement marker = document.Descendants(
                XName.Get(ArchiveSyndicationExtension.ElementName, ArchiveSyndicationExtension.Namespace))
            .Single();
        Assert.That(marker.Attribute(ArchiveSyndicationExtension.KeyAttribute)?.Value, Is.EqualTo("key:archive-1"));
        Assert.That(
            BlogMlImporter.GetArchiveIdentityFromDocument(document, post),
            Is.EqualTo("key:archive-1"));
    }

    [Test]
    public void Archive_marker_selects_destination_and_missing_marker_falls_back()
    {
        IContent root = new Mock<IContent>().Object;
        var first = new Mock<IContent>();
        var firstKey = Guid.NewGuid();
        first.SetupGet(x => x.Key).Returns(firstKey);
        var second = new Mock<IContent>();
        var secondKey = Guid.NewGuid();
        second.SetupGet(x => x.Key).Returns(secondKey);
        var post = new BlogMLPost { Id = "post-1" };
        var marked = XDocument.Parse($"<blogml xmlns=\"http://blogml.org/\"><posts><post id=\"post-1\"><archive xmlns=\"{ArchiveSyndicationExtension.Namespace}\" key=\"key:{secondKey:D}\" /></post></posts></blogml>");

        Assert.That(
            BlogMlImporter.ResolveArchiveForPost(root, [first.Object, second.Object], marked, post),
            Is.SameAs(second.Object));
        Assert.That(
            BlogMlImporter.ResolveArchiveForPost(root, [first.Object, second.Object], null, post),
            Is.SameAs(first.Object));
    }

    [Test]
    public void Archive_marker_name_fallback_resolves_across_sites_with_different_keys()
    {
        var first = new Mock<IContent>();
        first.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        first.SetupGet(x => x.Name).Returns("Archive A");
        var second = new Mock<IContent>();
        second.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        second.SetupGet(x => x.Name).Returns("Archive B");
        var post = new BlogMLPost { Id = "post-1" };
        var document = XDocument.Parse($"<blogml xmlns=\"http://blogml.org/\"><posts><post id=\"post-1\"><archive xmlns=\"{ArchiveSyndicationExtension.Namespace}\" key=\"key:{Guid.NewGuid():D}\" name=\"Archive B\" /></post></posts></blogml>");

        Assert.That(
            BlogMlImporter.ResolveArchiveForPost(
                new Mock<IContent>().Object,
                [first.Object, second.Object],
                document,
                post),
            Is.SameAs(second.Object));
    }

    [Test]
    public void Third_party_blogml_without_archive_marker_uses_fallback()
    {
        var post = new BlogMLPost { Id = "post-1" };
        var document = XDocument.Parse("<blogml xmlns=\"http://blogml.org/\"><posts><post id=\"post-1\" /></posts></blogml>");

        Assert.That(BlogMlImporter.GetArchiveIdentityFromDocument(document, post), Is.Null);
    }

    [Test]
    public async Task Import_new_marked_post_creates_under_marked_archive()
    {
        var root = new Mock<IContent>();
        root.SetupGet(x => x.Id).Returns(100);
        root.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        var firstArchive = new Mock<IContent>();
        firstArchive.SetupGet(x => x.Id).Returns(200);
        firstArchive.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        var secondArchive = new Mock<IContent>();
        secondArchive.SetupGet(x => x.Id).Returns(201);
        var secondKey = Guid.NewGuid();
        secondArchive.SetupGet(x => x.Key).Returns(secondKey);
        var archiveType = new Mock<IContentType>();
        archiveType.SetupGet(x => x.Id).Returns(20);
        archiveType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateArchive);
        var postType = new Mock<IContentType>();
        postType.SetupGet(x => x.Id).Returns(21);
        postType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateRichText);
        var createdPost = new Mock<IContent>();
        createdPost.SetupProperty(x => x.Name);
        var createdPostType = new Mock<ISimpleContentType>();
        createdPostType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateRichText);
        createdPost.SetupGet(x => x.ContentType).Returns(createdPostType.Object);
        var contentTypes = new Mock<IContentTypeService>();
        contentTypes.Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateArchive)).Returns(archiveType.Object);
        contentTypes.Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateRichText)).Returns(postType.Object);
        var contentService = new Mock<IContentService>();
        contentService
            .Setup(x => x.GetPagedOfType(
                archiveType.Object.Id,
                0,
                int.MaxValue,
                out It.Ref<long>.IsAny,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>()))
            .Returns([firstArchive.Object, secondArchive.Object]);
        contentService
            .Setup(x => x.GetPagedChildren(
                It.IsAny<int>(),
                0,
                int.MaxValue,
                out It.Ref<long>.IsAny,
                null,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>()))
            .Returns([]);
        contentService
            .Setup(x => x.Create(
                It.IsAny<string>(),
                It.IsAny<IContent>(),
                postType.Object.Alias,
                It.IsAny<int>()))
            .Returns(createdPost.Object);
        contentService
            .Setup(x => x.Save(It.IsAny<IContent>(), It.IsAny<int>()))
            .Returns(new Umbraco.Cms.Core.Services.OperationResult(
                Umbraco.Cms.Core.Services.OperationResultType.Success,
                new Umbraco.Cms.Core.Events.EventMessages()));
        var sqlContext = new Mock<Umbraco.Cms.Infrastructure.Persistence.ISqlContext>();
        sqlContext
            .Setup(x => x.Query<IContent>())
            .Returns(Mock.Of<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>());
        BlogMlImporter importer = CreateImporter(
            contentService,
            new Mock<IContentPermissionService>(),
            contentTypes,
            sqlContext);
        var post = new BlogMLPost
        {
            Id = "post-1",
            Title = new BlogMLTextConstruct("Marked post"),
            Name = new BlogMLTextConstruct("Marked post")
        };
        var xDoc = XDocument.Parse($"<blogml xmlns=\"http://blogml.org/\"><posts><post id=\"post-1\"><archive xmlns=\"{ArchiveSyndicationExtension.Namespace}\" key=\"key:{secondKey:D}\" /></post></posts></blogml>");

        _ = await importer.ImportPostsAsync(
            Mock.Of<IUser>(),
            1,
            xDoc,
            root.Object,
            [post],
            [],
            [],
            [],
            false,
            null,
            null,
            false);

        contentService.Verify(
            x => x.Create(
                It.IsAny<string>(),
                secondArchive.Object,
                postType.Object.Alias,
                It.IsAny<int>()),
            Times.Once);
        contentService.Verify(
            x => x.Create(
                It.IsAny<string>(),
                firstArchive.Object,
                postType.Object.Alias,
                It.IsAny<int>()),
            Times.Never);
    }

    [Test]
    public void Export_denied_before_file_write()
    {
        var user = new Mock<IUser>();
        var root = new Mock<IContent>();
        var rootType = new Mock<ISimpleContentType>();
        rootType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.Articulate);
        root.SetupGet(x => x.ContentType).Returns(rootType.Object);
        root.SetupGet(x => x.Key).Returns(Guid.NewGuid());

        var contentService = new Mock<IContentService>();
        contentService.Setup(x => x.GetById(It.IsAny<Guid>())).Returns(root.Object);
        var permissions = new Mock<IContentPermissionService>();
        permissions
            .Setup(x => x.AuthorizeAccessAsync(
                user.Object,
                root.Object.Key,
                ActionBrowse.ActionLetter))
            .ReturnsAsync(ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);

        var exporter = new BlogMlExporter(
            contentService.Object,
            Mock.Of<IMediaService>(),
            Mock.Of<IContentTypeService>(),
            Mock.Of<IDataTypeService>(),
            Mock.Of<ITagService>(),
            null!,
            null!,
            Mock.Of<IPublishedUrlProvider>(),
            Mock.Of<Umbraco.Cms.Infrastructure.Persistence.ISqlContext>(),
            NullLogger<BlogMlExporter>.Instance,
            Mock.Of<IArticulateMarkdownConverter>(),
            Mock.Of<IArticulateRichTextRenderer>(),
            new ArticulateContentAuthorizationService(
                permissions.Object,
                Mock.Of<IMediaPermissionService>()));

        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            exporter.ExportAsync(user.Object, root.Object.Key, "export.xml"));
    }

    [Test]
    public void Export_denied_media_item_does_not_write_file()
    {
        var user = new Mock<IUser>();
        var rootType = new Mock<ISimpleContentType>();
        rootType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.Articulate);
        var root = new Mock<IContent>();
        root.SetupGet(x => x.Id).Returns(100);
        root.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        root.SetupGet(x => x.ContentType).Returns(rootType.Object);
        var richTextType = new Mock<IContentType>();
        richTextType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateRichText);
        var archiveType = new Mock<IContentType>();
        archiveType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateArchive);
        var richTextSimpleType = new Mock<ISimpleContentType>();
        richTextSimpleType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateRichText);
        var archiveSimpleType = new Mock<ISimpleContentType>();
        archiveSimpleType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateArchive);
        var authorsType = new Mock<IContentType>();
        authorsType.SetupGet(x => x.Id).Returns(12);
        var contentTypes = new Mock<IContentTypeService>();
        contentTypes
            .Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateRichText))
            .Returns(richTextType.Object);
        contentTypes
            .Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateAuthors))
            .Returns(authorsType.Object);
        contentTypes
            .Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateArchive))
            .Returns(archiveType.Object);
        var post = new Mock<IContent>();
        post.SetupGet(x => x.Id).Returns(300);
        post.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        var mediaKey = Guid.NewGuid();
        post.SetupGet(x => x.Published).Returns(true);
        post.SetupGet(x => x.ContentType).Returns(richTextSimpleType.Object);
        post.Setup(x => x.HasProperty("postImage")).Returns(true);
        post.Setup(x => x.GetValue<string>("postImage")).Returns("umb://media/" + mediaKey.ToString("N"));
        var archive = new Mock<IContent>();
        archive.SetupGet(x => x.Id).Returns(200);
        archive.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        archive.SetupGet(x => x.ContentType).Returns(archiveSimpleType.Object);
        var contentService = new Mock<IContentService>();
        contentService.Setup(x => x.GetById(It.IsAny<Guid>())).Returns(root.Object);
        contentService
            .Setup(x => x.GetPagedDescendants(
                root.Object.Id,
                It.IsAny<long>(),
                It.IsAny<int>(),
                out It.Ref<long>.IsAny,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>()))
            .Returns((IEnumerable<IContent>)[archive.Object]);
        contentService
            .Setup(x => x.GetPagedDescendants(
                It.Is<int>(id => id != root.Object.Id),
                It.IsAny<long>(),
                It.IsAny<int>(),
                out It.Ref<long>.IsAny,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>()))
            .Returns((IEnumerable<IContent>)[]);
        contentService
            .Setup(x => x.GetPagedChildren(
                archive.Object.Id,
                It.IsAny<long>(),
                It.IsAny<int>(),
                out It.Ref<long>.IsAny,
                null,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>(),
                true))
            .Returns([post.Object]);
        contentService
            .Setup(x => x.GetPagedChildren(
                It.Is<int>(id => id != archive.Object.Id),
                It.IsAny<long>(),
                It.IsAny<int>(),
                out It.Ref<long>.IsAny,
                null,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>(),
                true))
            .Returns([]);
        var mediaPermissions = new Mock<IMediaPermissionService>();
        mediaPermissions
            .Setup(x => x.AuthorizeAccessAsync(user.Object, It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(MediaAuthorizationStatus.UnauthorizedMissingPathAccess);
        var mediaService = new Mock<IMediaService>();
        mediaService.Setup(x => x.GetById(mediaKey)).Returns(Mock.Of<IMedia>());
        var dataTypes = new Mock<IDataTypeService>();
        var urls = new Mock<IPublishedUrlProvider>();
        urls.Setup(x => x.GetUrl(It.IsAny<int>())).Returns("/blog");
        dataTypes.Setup(x => x.GetAsync("Articulate Categories"))
            .ReturnsAsync(Mock.Of<IDataType>());
        dataTypes.Setup(x => x.GetAsync("Articulate Tags"))
            .ReturnsAsync(Mock.Of<IDataType>());
        var tempFileSystem = new ArticulateTempFileSystem(
            Mock.Of<Umbraco.Cms.Core.IO.IIOHelper>(),
            CreateHostingEnvironment(),
            NullLogger<ArticulateTempFileSystem>.Instance);
        var sqlContext = new Mock<Umbraco.Cms.Infrastructure.Persistence.ISqlContext>();
        sqlContext.Setup(x => x.Query<IContent>())
            .Returns(Mock.Of<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>());
        var exporter = new BlogMlExporter(
            contentService.Object,
            mediaService.Object,
            contentTypes.Object,
            dataTypes.Object,
            Mock.Of<ITagService>(),
            null!,
            tempFileSystem,
            urls.Object,
            sqlContext.Object,
            NullLogger<BlogMlExporter>.Instance,
            Mock.Of<IArticulateMarkdownConverter>(),
            Mock.Of<IArticulateRichTextRenderer>(),
            new ArticulateContentAuthorizationService(
                Mock.Of<IContentPermissionService>(),
                mediaPermissions.Object));

        var exportFileName = $"{Guid.NewGuid():N}.xml";
        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            exporter.ExportAsync(user.Object, root.Object.Key, exportFileName, true));
        Assert.That(
            System.IO.File.Exists(Path.Combine(AppContext.BaseDirectory, "Articulate", "Temp", exportFileName)),
            Is.False);
    }

#pragma warning disable SA1111
    [Test]
    public void Import_denied_before_xml_parse_or_content_write()
    {
        var user = new Mock<IUser>();
        var root = new Mock<IContent>();
        var rootType = new Mock<ISimpleContentType>();
        rootType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.Articulate);
        root.SetupGet(x => x.ContentType).Returns(rootType.Object);
        root.SetupGet(x => x.Key).Returns(Guid.NewGuid());

        var contentService = new Mock<IContentService>();
        contentService.Setup(x => x.GetById(It.IsAny<Guid>())).Returns(root.Object);
        var permissions = new Mock<IContentPermissionService>();
        permissions
            .Setup(x => x.AuthorizeAccessAsync(user.Object, root.Object.Key, It.IsAny<string>()))
            .ReturnsAsync(ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);
        BlogMlImporter importer = CreateImporter(contentService, permissions);

        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            importer.ImportAsync(user.Object, "import.xml", root.Object.Key, false, null, null, false));
        contentService.Verify(x => x.Save(It.IsAny<IContent>(), It.IsAny<int>()), Times.Never);
    }
#pragma warning restore SA1111

    [Test]
    public async Task Empty_author_collection_does_not_query_or_save_content()
    {
        var contentService = new Mock<IContentService>();
        var permissions = new Mock<IContentPermissionService>();
        BlogMlImporter importer = CreateImporter(contentService, permissions);

        _ = await importer.ImportAuthorsAsync(1, null!, []);

        contentService.VerifyNoOtherCalls();
    }

    [Test]
    public async Task Empty_post_collection_does_not_query_or_save_content()
    {
        var contentService = new Mock<IContentService>();
        var permissions = new Mock<IContentPermissionService>();
        BlogMlImporter importer = CreateImporter(contentService, permissions);

        _ = await importer.ImportPostsAsync(
            Mock.Of<IUser>(),
            1,
            null!,
            null!,
            [],
            [],
            [],
            [],
            false,
            null,
            null,
            false);

        contentService.VerifyNoOtherCalls();
    }

    [Test]
    public void Import_requires_author_publish_permission_even_when_posts_are_not_published()
    {
        var user = new Mock<IUser>();
        var root = new Mock<IContent>();
        root.SetupGet(x => x.Id).Returns(100);
        root.SetupGet(x => x.Key).Returns(Guid.NewGuid());

        var authorsType = new Mock<IContentType>();
        authorsType.SetupGet(x => x.Id).Returns(200);
        var archiveType = new Mock<IContentType>();
        archiveType.SetupGet(x => x.Id).Returns(201);
        var contentTypes = new Mock<IContentTypeService>();
        contentTypes
            .Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateAuthors))
            .Returns(authorsType.Object);
        contentTypes
            .Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateArchive))
            .Returns(archiveType.Object);

        var contentService = new Mock<IContentService>();
        contentService
            .Setup(x => x.GetPagedOfType(
                It.IsAny<int>(),
                0,
                1,
                out It.Ref<long>.IsAny,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>()))
            .Returns([]);
        var sqlContext = new Mock<Umbraco.Cms.Infrastructure.Persistence.ISqlContext>();
        sqlContext
            .Setup(x => x.Query<IContent>())
            .Returns(Mock.Of<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>());

        var permissions = new Mock<IContentPermissionService>();
        permissions
            .Setup(x => x.AuthorizeAccessAsync(user.Object, root.Object.Key, ActionNew.ActionLetter))
            .ReturnsAsync(ContentAuthorizationStatus.Success);
        permissions
            .Setup(x => x.AuthorizeAccessAsync(
                user.Object,
                It.IsAny<IEnumerable<Guid>>(),
                It.Is<ISet<string>>(set => set.Contains(ActionNew.ActionLetter) && set.Contains(ActionPublish.ActionLetter))))
            .ReturnsAsync(ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);

        BlogMlImporter importer = CreateImporter(contentService, permissions, contentTypes, sqlContext);
        var document = new BlogMLDocument();
        document.Authors.Add(new BlogMLAuthor
        {
            Id = "author",
            Title = new BlogMLTextConstruct("Author")
        });

        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            importer.EnsureImportPermissionsAsync(user.Object, root.Object, document, false, false, false));
    }

    [Test]
    public void Existing_authors_require_no_new_or_publish_permission()
    {
        var author = new Mock<IContent>();
        author.SetupGet(x => x.Name).Returns("Alice");
        var sut = CreateMatrixSut(existingAuthors: [author.Object]);
        var document = new BlogMLDocument();
        document.Authors.Add(new BlogMLAuthor
        {
            Id = "author-1",
            Title = new BlogMLTextConstruct("Alice")
        });

        Assert.DoesNotThrowAsync(() =>
            sut.importer.EnsureImportPermissionsAsync(sut.user.Object, sut.root, document, false, false, false));
        sut.permissions.Verify(
            x => x.AuthorizeAccessAsync(
                It.IsAny<IUser>(),
                It.IsAny<Guid>(),
                It.IsAny<string>()),
            Times.Never);
    }

    [Test]
    public void Existing_posts_without_overwrite_are_a_noop_without_new_permission()
    {
        var existing = CreateExistingPost("post-1");
        var sut = CreateMatrixSut(existingPosts: [existing.Object]);
        var document = new BlogMLDocument();
        _ = document.AddPost(CreateBlogMlPost("post-1"));

        Assert.DoesNotThrowAsync(() =>
            sut.importer.EnsureImportPermissionsAsync(sut.user.Object, sut.root, document, false, false, false));
        sut.permissions.VerifyNoOtherCalls();
    }

    [Test]
    public void Overwrite_only_requires_update_without_new()
    {
        var existing = CreateExistingPost("post-1");
        var sut = CreateMatrixSut(existingPosts: [existing.Object]);
        sut.permissions
            .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), existing.Object.Key, ActionUpdate.ActionLetter))
            .ReturnsAsync(ContentAuthorizationStatus.Success);
        var document = new BlogMLDocument();
        _ = document.AddPost(CreateBlogMlPost("post-1"));

        Assert.DoesNotThrowAsync(() =>
            sut.importer.EnsureImportPermissionsAsync(sut.user.Object, sut.root, document, true, false, false));
        sut.permissions.Verify(
            x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), existing.Object.Key, ActionUpdate.ActionLetter),
            Times.Once);
        sut.permissions.Verify(
            x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), It.IsAny<Guid>(), ActionNew.ActionLetter),
            Times.Never);
    }

    [Test]
    public void Mixed_new_and_overwrite_targets_require_new_and_update()
    {
        var existing = CreateExistingPost("post-1");
        var sut = CreateMatrixSut(existingPosts: [existing.Object]);
        sut.permissions
            .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), sut.archive.Key, ActionNew.ActionLetter))
            .ReturnsAsync(ContentAuthorizationStatus.Success);
        sut.permissions
            .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), existing.Object.Key, ActionUpdate.ActionLetter))
            .ReturnsAsync(ContentAuthorizationStatus.Success);
        var document = new BlogMLDocument();
        _ = document.AddPost(CreateBlogMlPost("post-1"));
        _ = document.AddPost(CreateBlogMlPost("post-2"));

        Assert.DoesNotThrowAsync(() =>
            sut.importer.EnsureImportPermissionsAsync(sut.user.Object, sut.root, document, true, false, false));
        sut.permissions.Verify(
            x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), sut.archive.Key, ActionNew.ActionLetter),
            Times.Once);
        sut.permissions.Verify(
            x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), existing.Object.Key, ActionUpdate.ActionLetter),
            Times.Once);
    }

    [Test]
    public void Missing_archive_uses_root_new_capability_for_auto_creation()
    {
        var sut = CreateMatrixSut(includeArchive: false);
        sut.permissions
            .Setup(x => x.AuthorizeAccessAsync(sut.user.Object, sut.root.Key, ActionNew.ActionLetter))
            .ReturnsAsync(ContentAuthorizationStatus.Success);
        var document = new BlogMLDocument();
        _ = document.AddPost(CreateBlogMlPost("post-1"));

        Assert.DoesNotThrowAsync(() =>
            sut.importer.EnsureImportPermissionsAsync(sut.user.Object, sut.root, document, false, false, false));
        sut.permissions.Verify(
            x => x.AuthorizeAccessAsync(sut.user.Object, sut.root.Key, ActionNew.ActionLetter),
            Times.Once);
        sut.permissions.Verify(
            x => x.AuthorizeAccessAsync(sut.user.Object, sut.archive.Key, It.IsAny<string>()),
            Times.Never);
    }

    [Test]
    public async Task Missing_archive_import_creates_post_under_auto_created_archive()
    {
        var sut = CreateMatrixSut(includeArchive: false);
        var createdPost = new Mock<IContent>();
        createdPost.SetupProperty(x => x.Name);
        sut.contentService
            .Setup(x => x.Create(
                It.IsAny<string>(),
                sut.root,
                ArticulateConstants.ContentType.ArticulateArchive,
                It.IsAny<int>()))
            .Returns(sut.archive);
        sut.contentService
            .Setup(x => x.Create(
                It.IsAny<string>(),
                sut.archive,
                ArticulateConstants.ContentType.ArticulateRichText,
                It.IsAny<int>()))
            .Returns(createdPost.Object);
        sut.contentService
            .Setup(x => x.Save(It.IsAny<IContent>(), It.IsAny<int>()))
            .Returns(new Umbraco.Cms.Core.Services.OperationResult(
                Umbraco.Cms.Core.Services.OperationResultType.Success,
                new Umbraco.Cms.Core.Events.EventMessages()));

        _ = await sut.importer.ImportPostsAsync(
            sut.user.Object,
            1,
            XDocument.Parse("<blogml xmlns=\"http://blogml.org/\" />"),
            sut.root,
            [CreateBlogMlPost("post-1")],
            [],
            [],
            [],
            false,
            null,
            null,
            false);

        sut.contentService.Verify(
            x => x.Create(
                It.IsAny<string>(),
                sut.root,
                ArticulateConstants.ContentType.ArticulateArchive,
                It.IsAny<int>()),
            Times.Once);
        sut.contentService.Verify(
            x => x.Create(
                It.IsAny<string>(),
                sut.archive,
                ArticulateConstants.ContentType.ArticulateRichText,
                It.IsAny<int>()),
            Times.Once);
    }

    [Test]
    public void Unusable_image_attachment_does_not_require_media_permission()
    {
        var sut = CreateMatrixSut();
        var document = new BlogMLDocument();
        _ = document.AddPost(new BlogMLPost
        {
            Attachments =
            {
                new BlogMLAttachment { MimeType = "image/png" }
            }
        });

        Assert.DoesNotThrowAsync(() =>
            sut.importer.EnsureImportPermissionsAsync(sut.user.Object, sut.root, document, false, false, true));
        sut.mediaPermissions.Verify(
            x => x.AuthorizeRootAccessAsync(It.IsAny<IUser>()),
            Times.Never);

    }

    [Test]
    public void Publish_denial_fails_preflight_before_any_save()
    {
        var sut = CreateMatrixSut();
        sut.permissions
            .Setup(x => x.AuthorizeAccessAsync(
                It.IsAny<IUser>(),
                It.Is<IEnumerable<Guid>>(keys => keys.Contains(sut.archive.Key)),
                It.Is<ISet<string>>(actions => actions.Contains(ActionNew.ActionLetter) && actions.Contains(ActionPublish.ActionLetter))))
            .ReturnsAsync(ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);
        var document = new BlogMLDocument();
        _ = document.AddPost(CreateBlogMlPost("post-1"));

        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            sut.importer.EnsureImportPermissionsAsync(sut.user.Object, sut.root, document, false, true, false));
        sut.contentService.Verify(x => x.Save(It.IsAny<IContent>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public void Import_requires_media_root_and_bin_access_for_image_import()
    {
        var user = new Mock<IUser>();
        var root = new Mock<IContent>();
        root.SetupGet(x => x.Id).Returns(100);
        root.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        var contentTypes = new Mock<IContentTypeService>();
        var authorsType = new Mock<IContentType>();
        var archiveType = new Mock<IContentType>();
        contentTypes
            .Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateAuthors))
            .Returns(authorsType.Object);
        contentTypes
            .Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateArchive))
            .Returns(archiveType.Object);
        var contentService = new Mock<IContentService>();
        contentService
            .Setup(x => x.GetPagedOfType(
                It.IsAny<int>(),
                0,
                1,
                out It.Ref<long>.IsAny,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>()))
            .Returns([]);
        var sqlContext = new Mock<Umbraco.Cms.Infrastructure.Persistence.ISqlContext>();
        sqlContext
            .Setup(x => x.Query<IContent>())
            .Returns(Mock.Of<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>());
        var mediaPermissions = new Mock<IMediaPermissionService>();
        mediaPermissions
            .Setup(x => x.AuthorizeRootAccessAsync(user.Object))
            .ReturnsAsync(MediaAuthorizationStatus.UnauthorizedMissingRootAccess);
        BlogMlImporter importer = CreateImporter(
            contentService,
            new Mock<IContentPermissionService>(),
            contentTypes,
            sqlContext,
            mediaPermissions);

        var document = new BlogMLDocument();
        _ = document.AddPost(new BlogMLPost
        {
            Attachments =
            {
                new BlogMLAttachment { MimeType = "image/png", Content = "not-used" }
            }
        });

        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            importer.EnsureImportPermissionsAsync(user.Object, root.Object, document, false, false, true));
    }

    private sealed class MatrixFixture
    {
        public required BlogMlImporter importer { get; init; }
        public required Mock<IContentService> contentService { get; init; }
        public required Mock<IContentPermissionService> permissions { get; init; }
        public required Mock<IMediaPermissionService> mediaPermissions { get; init; }
        public required Mock<IUser> user { get; init; }
        public required IContent root { get; init; }
        public required IContent archive { get; init; }
    }

    private static MatrixFixture CreateMatrixSut(
        bool includeArchive = true,
        IContent[]? existingPosts = null,
        IContent[]? existingAuthors = null)
    {
        var user = new Mock<IUser>();
        var root = new Mock<IContent>();
        root.SetupGet(x => x.Id).Returns(100);
        root.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        var archive = new Mock<IContent>();
        archive.SetupGet(x => x.Id).Returns(200);
        archive.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        var archiveType = new Mock<IContentType>();
        archiveType.SetupGet(x => x.Id).Returns(20);
        archiveType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateArchive);
        var postType = new Mock<IContentType>();
        postType.SetupGet(x => x.Id).Returns(21);
        postType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateRichText);
        var authorsType = new Mock<IContentType>();
        authorsType.SetupGet(x => x.Id).Returns(22);
        var authorType = new Mock<IContentType>();
        authorType.SetupGet(x => x.Id).Returns(23);
        var authorsContainer = new Mock<IContent>();
        authorsContainer.SetupGet(x => x.Id).Returns(300);
        var contentTypes = new Mock<IContentTypeService>();
        contentTypes.Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateArchive)).Returns(archiveType.Object);
        contentTypes.Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateRichText)).Returns(postType.Object);
        contentTypes.Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateAuthors)).Returns(authorsType.Object);
        contentTypes.Setup(x => x.Get(ArticulateConstants.ContentType.ArticulateAuthor)).Returns(authorType.Object);
        var contentService = new Mock<IContentService>();
        contentService
            .Setup(x => x.GetPagedOfType(
                archiveType.Object.Id,
                0,
                int.MaxValue,
                out It.Ref<long>.IsAny,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>()))
            .Returns(includeArchive ? new[] { archive.Object } : Array.Empty<IContent>());
        contentService
            .Setup(x => x.GetPagedOfType(
                authorsType.Object.Id,
                0,
                int.MaxValue,
                out It.Ref<long>.IsAny,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>()))
            .Returns(existingAuthors is null ? [] : [authorsContainer.Object]);
        contentService
            .Setup(x => x.GetPagedOfType(
                authorType.Object.Id,
                0,
                int.MaxValue,
                out It.Ref<long>.IsAny,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>()))
            .Returns(existingAuthors ?? []);
        contentService
            .Setup(x => x.GetPagedChildren(
                archive.Object.Id,
                0,
                int.MaxValue,
                out It.Ref<long>.IsAny,
                null,
                It.IsAny<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>(),
                It.IsAny<Umbraco.Cms.Core.Services.Ordering?>()))
            .Returns(existingPosts ?? []);
        var sqlContext = new Mock<Umbraco.Cms.Infrastructure.Persistence.ISqlContext>();
        sqlContext.Setup(x => x.Query<IContent>())
            .Returns(Mock.Of<Umbraco.Cms.Core.Persistence.Querying.IQuery<IContent>>());
        var permissions = new Mock<IContentPermissionService>();
        var mediaPermissions = new Mock<IMediaPermissionService>();
        return new MatrixFixture
        {
            importer = CreateImporter(contentService, permissions, contentTypes, sqlContext, mediaPermissions),
            contentService = contentService,
            permissions = permissions,
            mediaPermissions = mediaPermissions,
            user = user,
            root = root.Object,
            archive = archive.Object
        };
    }

    private static Umbraco.Cms.Core.Hosting.IHostingEnvironment CreateHostingEnvironment()
    {
        var contentRoot = Path.Combine(Path.GetTempPath(), "ArticulateBlogMlTests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(contentRoot);
        var hosting = new Mock<Umbraco.Cms.Core.Hosting.IHostingEnvironment>();
        hosting.SetupGet(x => x.ApplicationPhysicalPath).Returns(contentRoot);
        hosting.SetupGet(x => x.LocalTempPath).Returns(Path.Combine(contentRoot, "Temp"));
        return hosting.Object;
    }

    private static Mock<IContent> CreateExistingPost(string importId)
    {
        var post = new Mock<IContent>();
        post.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        var type = new Mock<ISimpleContentType>();
        type.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateRichText);
        post.SetupGet(x => x.ContentType).Returns(type.Object);
        post.Setup(x => x.GetValue<string>("importId")).Returns(importId);
        return post;
    }

    private static BlogMLPost CreateBlogMlPost(string id) => new()
    {
        Id = id,
        Title = new BlogMLTextConstruct(id),
        Name = new BlogMLTextConstruct(id)
    };

    private static BlogMlImporter CreateImporter(
        Mock<IContentService> contentService,
        Mock<IContentPermissionService> permissions,
        Mock<IContentTypeService>? contentTypes = null,
        Mock<Umbraco.Cms.Infrastructure.Persistence.ISqlContext>? sqlContext = null,
        Mock<IMediaPermissionService>? mediaPermissions = null)
    {
        object[] importerArgs =
        [
            null!,
            contentService.Object,
            contentTypes?.Object ?? Mock.Of<IContentTypeService>(),
            Mock.Of<IUserService>(),
            NullLogger<BlogMlImporter>.Instance,
            Mock.Of<IDataTypeService>(),
            sqlContext?.Object ?? Mock.Of<Umbraco.Cms.Infrastructure.Persistence.ISqlContext>(),
            Mock.Of<Umbraco.Cms.Infrastructure.Scoping.IScopeProvider>(),
            Mock.Of<ILanguageService>(),
            null!,
            Mock.Of<Umbraco.Cms.Core.Serialization.IJsonSerializer>(),
            null!,
            Mock.Of<IArticulateImportMediaService>(),
            new ArticulateContentAuthorizationService(
                permissions.Object,
                mediaPermissions?.Object ?? Mock.Of<IMediaPermissionService>()),
            Mock.Of<Umbraco.Cms.Core.Security.IHtmlSanitizer>(),
            global::Microsoft.Extensions.Options.Options.Create(new ArticulateOptions()),
            global::Microsoft.Extensions.Options.Options.Create(new ArticulateCommentsOptions())
        ];
#if UMBRACO_18_OR_GREATER
        importerArgs = [.. importerArgs, Mock.Of<Umbraco.Cms.Core.Services.IIdKeyMap>()];
#endif
        return (BlogMlImporter)Activator.CreateInstance(typeof(BlogMlImporter), importerArgs)!;
    }
}
#pragma warning restore IDE0007, IDE0008
