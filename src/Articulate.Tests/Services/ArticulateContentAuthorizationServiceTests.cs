#nullable enable
using Articulate.Services;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.AuthorizationStatus;

namespace Articulate.Tests.Services;

[TestFixture]
public class ArticulateContentAuthorizationServiceTests
{
    [Test]
    public void Root_and_ancestry_checks_fail_closed_for_foreign_content()
    {
        var root = new Mock<IContent>();
        root.SetupGet(x => x.Id).Returns(100);
        root.SetupGet(x => x.Path).Returns("-1,100");
        var type = new Mock<ISimpleContentType>();
        type.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.Articulate);
        root.SetupGet(x => x.ContentType).Returns(type.Object);

        var post = new Mock<IContent>();
        post.SetupGet(x => x.Id).Returns(200);
        post.SetupGet(x => x.Path).Returns("-1,999,200");

        var service = new ArticulateContentAuthorizationService(
            Mock.Of<IContentPermissionService>(),
            Mock.Of<IMediaPermissionService>());

        Assert.That(service.IsArticulateRoot(root.Object), Is.True);
        Assert.That(service.IsDescendantOf(post.Object, root.Object), Is.False);
    }

    [Test]
    public void Content_action_batch_denial_throws_before_caller_mutation()
    {
        var permissions = new Mock<IContentPermissionService>();
        permissions
            .Setup(x => x.AuthorizeAccessAsync(
                It.IsAny<IUser>(),
                It.IsAny<IEnumerable<Guid>>(),
                It.IsAny<ISet<string>>()))
            .ReturnsAsync(ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);
        var content = new Mock<IContent>();
        content.SetupGet(x => x.Key).Returns(Guid.NewGuid());

        var service = new ArticulateContentAuthorizationService(
            permissions.Object,
            Mock.Of<IMediaPermissionService>());

        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.EnsureContentAccessAsync(
                Mock.Of<IUser>(),
                content.Object,
                Umbraco.Cms.Core.Actions.ActionNew.ActionLetter,
                Umbraco.Cms.Core.Actions.ActionPublish.ActionLetter));
    }

    [Test]
    public void One_action_for_two_content_keys_uses_batch_authorization()
    {
        var firstKey = Guid.NewGuid();
        var secondKey = Guid.NewGuid();
        var permissions = new Mock<IContentPermissionService>();
        permissions
            .Setup(x => x.AuthorizeAccessAsync(
                It.IsAny<IUser>(),
                It.IsAny<IEnumerable<Guid>>(),
                It.Is<ISet<string>>(set => set.Contains(Umbraco.Cms.Core.Actions.ActionBrowse.ActionLetter))))
            .ReturnsAsync(ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);
        var first = new Mock<IContent>();
        first.SetupGet(x => x.Key).Returns(firstKey);
        var second = new Mock<IContent>();
        second.SetupGet(x => x.Key).Returns(secondKey);
        var service = new ArticulateContentAuthorizationService(
            permissions.Object,
            Mock.Of<IMediaPermissionService>());

        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.EnsureContentAccessAsync(
                Mock.Of<IUser>(),
                [first.Object, second.Object],
                new[] { Umbraco.Cms.Core.Actions.ActionBrowse.ActionLetter }));
        permissions.Verify(
            x => x.AuthorizeAccessAsync(
                It.IsAny<IUser>(),
                It.Is<IEnumerable<Guid>>(keys => keys.Contains(firstKey) && keys.Contains(secondKey)),
                It.Is<ISet<string>>(set => set.SetEquals(new[] { Umbraco.Cms.Core.Actions.ActionBrowse.ActionLetter }))),
            Times.Once);
    }

    [Test]
    public void Media_write_denial_is_reported_before_media_adapter_use()
    {
        var mediaPermissions = new Mock<IMediaPermissionService>();
        mediaPermissions
            .Setup(x => x.AuthorizeRootAccessAsync(It.IsAny<IUser>()))
            .ReturnsAsync(MediaAuthorizationStatus.UnauthorizedMissingRootAccess);
        var service = new ArticulateContentAuthorizationService(
            Mock.Of<IContentPermissionService>(),
            mediaPermissions.Object);

        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.EnsureMediaWriteAccessAsync(Mock.Of<IUser>()));
    }

    [Test]
    public void Media_read_denial_is_reported_before_file_read()
    {
        var mediaPermissions = new Mock<IMediaPermissionService>();
        mediaPermissions
            .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(MediaAuthorizationStatus.UnauthorizedMissingPathAccess);
        var service = new ArticulateContentAuthorizationService(
            Mock.Of<IContentPermissionService>(),
            mediaPermissions.Object);

        Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.EnsureMediaReadAccessAsync(Mock.Of<IUser>(), [Guid.NewGuid()]));
    }
}
