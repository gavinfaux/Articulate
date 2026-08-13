#nullable enable
using System.Text.Json;
using Articulate.Controllers.Api;
using Articulate.Models.Api;
using Articulate.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.AuthorizationStatus;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common;

namespace Articulate.Tests.Controllers.Api;

#pragma warning disable IDE0007, IDE0008, SA1111
[TestFixture]
public class MarkdownEditorAuthorizationTests
{
    [Test]
    public async Task CreatePost_rejects_a_non_Articulate_root_before_archive_lookup()
    {
        MarkdownEditorSut sut = CreateSut(rootAlias: "Other");

        ActionResult<CreatePostResponse> result = await sut.Controller.CreatePost(CreateModelJson(sut.Root.Id));

        Assert.That(result.Result, Is.TypeOf<ObjectResult>());
        Assert.That(((ObjectResult)result.Result!).StatusCode, Is.EqualTo(StatusCodes.Status404NotFound));
        sut.ContentService.Verify(
            x => x.GetPagedChildren(
                It.IsAny<int>(),
                It.IsAny<long>(),
                It.IsAny<int>(),
                out It.Ref<long>.IsAny,
                null,
                null,
                null),
            Times.Never);
    }

    [Test]
    public async Task CreatePost_rejects_a_root_without_an_archive()
    {
        MarkdownEditorSut sut = CreateSut(children: []);

        ActionResult<CreatePostResponse> result = await sut.Controller.CreatePost(CreateModelJson(sut.Root.Id));

        Assert.That(result.Result, Is.TypeOf<ObjectResult>());
        Assert.That(((ObjectResult)result.Result!).StatusCode, Is.EqualTo(StatusCodes.Status404NotFound));
    }

    [Test]
    public async Task CreatePost_finds_archive_when_it_is_not_the_first_root_child()
    {
        MarkdownEditorSut sut = CreateSut(archiveNotFirst: true);
        sut.Controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                Request = { Form = new FormCollection(new Dictionary<string, StringValues>()) }
            }
        };

        ActionResult<CreatePostResponse> result = await sut.Controller.CreatePost(CreateModelJson(sut.Root.Id));

        Assert.That(result.Result, Is.TypeOf<ObjectResult>());
        Assert.That(((ObjectResult)result.Result!).StatusCode, Is.EqualTo(StatusCodes.Status500InternalServerError));
        sut.Permissions.Verify(
            x => x.AuthorizeAccessAsync(
                sut.User.Object,
                It.Is<IEnumerable<Guid>>(keys => keys.Contains(sut.Archive.Key)),
                It.Is<ISet<string>>(actions =>
                    actions.Contains(ActionNew.ActionLetter) && actions.Contains(ActionPublish.ActionLetter))),
            Times.Once);
    }

    //TODO: Add multipart HTTP coverage for Markdown create and media authorization.
    [Test]
    public async Task CreatePost_denied_media_write_stops_before_content_or_media_mutation()
    {
        MarkdownEditorSut sut = CreateSut(extractFirstImage: true);
        sut.MediaPermissions
            .Setup(x => x.AuthorizeRootAccessAsync(sut.User.Object))
            .ReturnsAsync(MediaAuthorizationStatus.UnauthorizedMissingRootAccess);
        sut.MediaPermissions
            .Setup(x => x.AuthorizeBinAccessAsync(sut.User.Object))
            .ReturnsAsync(MediaAuthorizationStatus.UnauthorizedMissingBinAccess);
        sut.MediaService
            .Setup(x => x.ValidateImageAsync(It.IsAny<Stream>(), It.IsAny<string>()))
            .Returns(new ValueTask<ImportMediaValidationResult>(
                ImportMediaValidationResult.Success(new MemoryStream([1]), ".png", "image/png")));
        SetRequestFile(sut.Controller);

        ActionResult<CreatePostResponse> result = await sut.Controller.CreatePost(
            CreateModelJson(sut.Root.Id, "![hero](tmp:image)"));

        Assert.That(result.Result, Is.TypeOf<ForbidResult>());
        sut.MediaService.Verify(
            x => x.SaveToMediaLibrary(
                It.IsAny<Stream>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<IMedia>()),
            Times.Never);
        sut.ContentService.Verify(x => x.Save(It.IsAny<IContent>(), It.IsAny<int>()), Times.Never);
        sut.ContentService.Verify(
            x => x.Create(
                It.IsAny<string>(),
                It.IsAny<IContent>(),
                It.IsAny<string>(),
                It.IsAny<int>()),
            Times.Never);
    }

    private static MarkdownEditorSut CreateSut(
        string rootAlias = ArticulateConstants.ContentType.Articulate,
        IContent[]? children = null,
        bool extractFirstImage = false,
        bool archiveNotFirst = false)
    {
        var user = new Mock<IUser>();
        user.SetupGet(x => x.Id).Returns(7);
        user.SetupGet(x => x.Name).Returns("Editor");

        var rootType = new Mock<ISimpleContentType>();
        rootType.SetupGet(x => x.Alias).Returns(rootAlias);
        var root = new Mock<IContent>();
        root.SetupGet(x => x.Id).Returns(100);
        root.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        root.SetupGet(x => x.ContentType).Returns(rootType.Object);
        root.Setup(x => x.HasProperty("extractFirstImage")).Returns(extractFirstImage);
        root.Setup(x => x.GetValue<bool>("extractFirstImage")).Returns(extractFirstImage);

        var archiveType = new Mock<ISimpleContentType>();
        archiveType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulateArchive);
        var archive = new Mock<IContent>();
        archive.SetupGet(x => x.Id).Returns(200);
        archive.SetupGet(x => x.Key).Returns(Guid.NewGuid());
        archive.SetupGet(x => x.ContentType).Returns(archiveType.Object);

        var contentService = new Mock<IContentService>();
        contentService.Setup(x => x.GetById(root.Object.Id)).Returns(root.Object);
        contentService
            .Setup(x => x.GetPagedChildren(
                root.Object.Id,
                It.IsAny<long>(),
                It.IsAny<int>(),
                out It.Ref<long>.IsAny,
                null,
                null,
                null))
            .Returns(children ?? (archiveNotFirst
                ? [CreateContent("Other"), archive.Object]
                : [archive.Object]));

        var permissions = new Mock<IContentPermissionService>();
        permissions
            .Setup(x => x.AuthorizeAccessAsync(user.Object, root.Object.Key, ActionBrowse.ActionLetter))
            .ReturnsAsync(ContentAuthorizationStatus.Success);
        permissions
            .Setup(x => x.AuthorizeAccessAsync(
                user.Object,
                It.Is<IEnumerable<Guid>>(keys => keys.Contains(archive.Object.Key)),
                It.Is<ISet<string>>(actions =>
                    actions.Contains(ActionNew.ActionLetter) && actions.Contains(ActionPublish.ActionLetter))))
            .ReturnsAsync(ContentAuthorizationStatus.Success);
        var mediaPermissions = new Mock<IMediaPermissionService>();

        var security = new Mock<IBackOfficeSecurity>();
        security.SetupGet(x => x.CurrentUser).Returns(user.Object);
        var securityAccessor = new Mock<IBackOfficeSecurityAccessor>();
        securityAccessor.SetupGet(x => x.BackOfficeSecurity).Returns(security.Object);
        var backOfficeAuth = new BackOfficeAuthService(
            securityAccessor.Object,
            Mock.Of<IUserService>(),
            NullLogger<BackOfficeAuthService>.Instance);

        var mediaService = new Mock<IArticulateImportMediaService>();
        var controller = new MarkdownEditorApiController(
            backOfficeAuth,
            null!,
            null!,
            null!,
            null!,
            contentService.Object,
            Mock.Of<IContentTypeService>(),
            Mock.Of<IDataTypeService>(),
            NullLogger<MarkdownEditorApiController>.Instance,
            null!,
            mediaService.Object,
            new ArticulateContentAuthorizationService(permissions.Object, mediaPermissions.Object)
#if UMBRACO_18_OR_GREATER
            , Mock.Of<Umbraco.Cms.Core.Services.IIdKeyMap>()
#endif
        );

        return new MarkdownEditorSut(controller, contentService, permissions, mediaPermissions, mediaService, user, root.Object, archive.Object);
    }

    private static IContent CreateContent(string alias)
    {
        var type = new Mock<ISimpleContentType>();
        type.SetupGet(x => x.Alias).Returns(alias);
        var content = new Mock<IContent>();
        content.SetupGet(x => x.ContentType).Returns(type.Object);
        return content.Object;
    }

    private static string CreateModelJson(int rootId, string body = "") =>
        JsonSerializer.Serialize(
            new MarkdownEditorModel
            {
                ArticulateBlogNode = rootId,
                Title = "Post",
                Body = body
            },
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

    private static void SetRequestFile(MarkdownEditorApiController controller)
    {
        var file = new FormFile(new MemoryStream([1]), 0, 1, "tmp:image", "hero.png");
        var files = new FormFileCollection { file };
        var context = new DefaultHttpContext();
        context.Request.Form = new FormCollection(
            new Dictionary<string, StringValues>(),
            files);
        controller.ControllerContext = new ControllerContext { HttpContext = context };
    }

    private sealed record MarkdownEditorSut(
        MarkdownEditorApiController Controller,
        Mock<IContentService> ContentService,
        Mock<IContentPermissionService> Permissions,
        Mock<IMediaPermissionService> MediaPermissions,
        Mock<IArticulateImportMediaService> MediaService,
        Mock<IUser> User,
        IContent Root,
        IContent Archive);
}
#pragma warning restore IDE0007, IDE0008
