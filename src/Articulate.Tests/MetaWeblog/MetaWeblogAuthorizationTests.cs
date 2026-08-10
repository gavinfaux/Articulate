#nullable enable
using System.Security.Authentication;
using Articulate.MetaWeblog;
using Articulate.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Core.Web;
using WilderMinds.MetaWeblog;

namespace Articulate.Tests.MetaWeblog
{
    [TestFixture]
    public class MetaWeblogAuthorizationTests
    {
        [Test]
        public void Cross_blog_edit_is_denied_before_save()
        {
            (ArticulateMetaWeblogProvider provider, Mock<IContentService> contentService, Mock<IContentPermissionService> permissions) = CreateSut(targetPath: "-1,999,200");
            permissions
                .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), It.IsAny<Guid>(), ActionUpdate.ActionLetter))
                .ReturnsAsync(Umbraco.Cms.Core.Services.AuthorizationStatus.ContentAuthorizationStatus.Success);

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await provider.EditPostAsync("200", "editor", "password", new Post { title = "changed" }, false));

            contentService.Verify(x => x.Save(It.IsAny<IContent>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public void Unauthorized_edit_is_denied_before_save()
        {
            (ArticulateMetaWeblogProvider provider, Mock<IContentService> contentService, Mock<IContentPermissionService> permissions) = CreateSut();
            permissions
                .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), It.IsAny<Guid>(), ActionUpdate.ActionLetter))
                .ReturnsAsync(Umbraco.Cms.Core.Services.AuthorizationStatus.ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await provider.EditPostAsync("200", "editor", "password", new Post { title = "changed" }, false));

            contentService.Verify(x => x.Save(It.IsAny<IContent>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public void Cross_blog_create_is_denied_before_any_save()
        {
            (ArticulateMetaWeblogProvider provider, Mock<IContentService> contentService, _) = CreateSut();

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await provider.AddPostAsync("999", "editor", "password", new Post { title = "create" }, false));

            contentService.Verify(x => x.Save(It.IsAny<IContent>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public void Cross_blog_delete_is_denied_before_recycle_bin_move()
        {
            (ArticulateMetaWeblogProvider provider, Mock<IContentService> contentService, _) = CreateSut(targetPath: "-1,999,200");

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await provider.DeletePostAsync("key", "200", "editor", "password", false));

            contentService.Verify(x => x.MoveToRecycleBin(It.IsAny<IContent>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public void Unauthorized_publish_is_denied_before_save()
        {
            (ArticulateMetaWeblogProvider provider, Mock<IContentService> contentService, Mock<IContentPermissionService> permissions) = CreateSut();
            permissions
                .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), It.IsAny<Guid>(), ActionUpdate.ActionLetter))
                .ReturnsAsync(Umbraco.Cms.Core.Services.AuthorizationStatus.ContentAuthorizationStatus.Success);
            permissions
                .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), It.IsAny<Guid>(), ActionPublish.ActionLetter))
                .ReturnsAsync(Umbraco.Cms.Core.Services.AuthorizationStatus.ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await provider.EditPostAsync("200", "editor", "password", new Post { title = "publish" }, true));

            contentService.Verify(x => x.Save(It.IsAny<IContent>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public void Unauthorized_get_is_denied_before_unpublished_fallback()
        {
            (ArticulateMetaWeblogProvider provider, _, Mock<IContentPermissionService> permissions) = CreateSut();
            permissions
                .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), It.IsAny<Guid>(), ActionBrowse.ActionLetter))
                .ReturnsAsync(Umbraco.Cms.Core.Services.AuthorizationStatus.ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await provider.GetPostAsync("200", "editor", "password"));
        }

        [Test]
        public void Unauthorized_upload_is_denied_before_file_validation()
        {
            (ArticulateMetaWeblogProvider provider, _, Mock<IContentPermissionService> permissions) = CreateSut();
            permissions
                .Setup(x => x.AuthorizeAccessAsync(It.IsAny<IUser>(), It.IsAny<Guid>(), ActionUpdate.ActionLetter))
                .ReturnsAsync(Umbraco.Cms.Core.Services.AuthorizationStatus.ContentAuthorizationStatus.UnauthorizedMissingPermissionAccess);

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await provider.NewMediaObjectAsync("100", "editor", "password", new MediaObject()));
        }

        private static (ArticulateMetaWeblogProvider, Mock<IContentService>, Mock<IContentPermissionService>) CreateSut(
            string targetPath = "-1,100,200")
        {
            const int rootId = 100;
            var identityUser = new BackOfficeIdentityUser(new Umbraco.Cms.Core.Configuration.Models.GlobalSettings(), 1, []);
            Mock<IBackOfficeUserManager> userManager = new();
            Mock<IUserService> userService = new();
            Mock<IUser> user = new();
            userService.Setup(x => x.GetByUsername("editor")).Returns(user.Object);
            userManager.Setup(x => x.FindByNameAsync("editor")).ReturnsAsync(identityUser);
            userManager.Setup(x => x.IsLockedOutAsync(identityUser)).ReturnsAsync(false);
            userManager.Setup(x => x.GetTwoFactorEnabledAsync(identityUser)).ReturnsAsync(false);
            userManager.Setup(x => x.CheckPasswordAsync(identityUser, "password")).ReturnsAsync(true);
            userManager.Setup(x => x.ResetAccessFailedCountAsync(identityUser)).ReturnsAsync(Microsoft.AspNetCore.Identity.IdentityResult.Success);

            Mock<ISimpleContentType> rootType = new();
            rootType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.Articulate);
            Mock<ISimpleContentType> postType = new();
            postType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.ArticulatePost);
            Mock<IContent> root = new();
            root.SetupGet(x => x.Id).Returns(rootId);
            root.SetupGet(x => x.Key).Returns(Guid.NewGuid());
            root.SetupGet(x => x.Path).Returns("-1,100");
            root.SetupGet(x => x.ContentType).Returns(rootType.Object);
            Mock<IContent> post = new();
            post.SetupGet(x => x.Id).Returns(200);
            post.SetupGet(x => x.Key).Returns(Guid.NewGuid());
            post.SetupGet(x => x.Path).Returns(targetPath);
            post.SetupGet(x => x.ContentType).Returns(postType.Object);
            Mock<IContentService> contentService = new();
            contentService.Setup(x => x.GetById(rootId)).Returns(root.Object);
            contentService.Setup(x => x.GetById(200)).Returns(post.Object);
            Mock<IContentPermissionService> permissions = new();

            var provider = new ArticulateMetaWeblogProvider(
                Mock.Of<IUmbracoContextAccessor>(),
                userService.Object,
                Mock.Of<IContentTypeService>(),
                Mock.Of<ILanguageService>(),
                userManager.Object,
                contentService.Object,
                Mock.Of<IShortStringHelper>(),
                Mock.Of<IDataTypeService>(),
                null!,
                Mock.Of<IJsonSerializer>(),
                null!,
                Mock.Of<IPublishedValueFallback>(),
                NullLogger<ArticulateMetaWeblogProvider>.Instance,
                rootId,
                Mock.Of<IArticulateImportMediaService>(),
                Mock.Of<IArticulateMarkdownConverter>(),
                Mock.Of<IArticulateRichTextRenderer>(),
                null!,
                permissions.Object,
#if UMBRACO_18_OR_GREATER
                Mock.Of<IHtmlSanitizer>(),
                Mock.Of<IIdKeyMap>());
#else
                Mock.Of<IHtmlSanitizer>());
#endif

            return (provider, contentService, permissions);
        }
    }
}
