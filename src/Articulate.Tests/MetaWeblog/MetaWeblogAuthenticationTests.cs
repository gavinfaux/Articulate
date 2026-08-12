#nullable enable
using System.Security.Authentication;
using Articulate.MetaWeblog;
using Microsoft.AspNetCore.Identity;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;

namespace Articulate.Tests.MetaWeblog
{
    [TestFixture]
    public class MetaWeblogAuthenticationTests
    {
        [Test]
        public void Bad_password_records_failure_and_returns_generic_error()
        {
            (Mock<IBackOfficeUserManager> manager, Mock<IUserService> userService, BackOfficeIdentityUser identityUser, _) = CreateSut();
            manager.Setup(x => x.CheckPasswordAsync(identityUser, "bad")).ReturnsAsync(false);
            manager.Setup(x => x.AccessFailedAsync(identityUser)).ReturnsAsync(IdentityResult.Success);

            AuthenticationException exception = Assert.ThrowsAsync<AuthenticationException>(async () =>
                await ArticulateMetaWeblogProvider.ValidateUserAsync(manager.Object, userService.Object, "editor", "bad"))!;

            Assert.That(exception.Message, Is.EqualTo("Invalid MetaWeblog credentials"));
            manager.Verify(x => x.AccessFailedAsync(identityUser), Times.Once);
            manager.Verify(x => x.ResetAccessFailedCountAsync(It.IsAny<BackOfficeIdentityUser>()), Times.Never);
        }

        [Test]
        public void Locked_user_is_rejected_before_password_check()
        {
            (Mock<IBackOfficeUserManager> manager, Mock<IUserService> userService, BackOfficeIdentityUser identityUser, _) = CreateSut();
            manager.Setup(x => x.IsLockedOutAsync(identityUser)).ReturnsAsync(true);

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await ArticulateMetaWeblogProvider.ValidateUserAsync(manager.Object, userService.Object, "editor", "password"));

            manager.Verify(x => x.CheckPasswordAsync(It.IsAny<BackOfficeIdentityUser>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task Successful_login_resets_failures_and_returns_user()
        {
            (Mock<IBackOfficeUserManager> manager, Mock<IUserService> userService, BackOfficeIdentityUser identityUser, IUser user) = CreateSut();
            manager.Setup(x => x.CheckPasswordAsync(identityUser, "password")).ReturnsAsync(true);
            manager.Setup(x => x.ResetAccessFailedCountAsync(identityUser)).ReturnsAsync(IdentityResult.Success);

            IUser result = await ArticulateMetaWeblogProvider.ValidateUserAsync(
                manager.Object,
                userService.Object,
                "editor",
                "password");

            Assert.That(result, Is.SameAs(user));
            manager.Verify(x => x.ResetAccessFailedCountAsync(identityUser), Times.Once);
        }

        [Test]
        public void Unapproved_user_is_rejected_by_the_manager_lockout_contract()
        {
            (Mock<IBackOfficeUserManager> manager, Mock<IUserService> userService, BackOfficeIdentityUser identityUser, _) = CreateSut();
            identityUser.IsApproved = false;
            manager.Setup(x => x.IsLockedOutAsync(identityUser)).ReturnsAsync(true);

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await ArticulateMetaWeblogProvider.ValidateUserAsync(manager.Object, userService.Object, "editor", "password"));

            manager.Verify(x => x.CheckPasswordAsync(It.IsAny<BackOfficeIdentityUser>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public void Mfa_user_is_rejected_before_password_check()
        {
            (Mock<IBackOfficeUserManager> manager, Mock<IUserService> userService, BackOfficeIdentityUser identityUser, _) = CreateSut();
            manager.Setup(x => x.GetTwoFactorEnabledAsync(identityUser)).ReturnsAsync(true);

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await ArticulateMetaWeblogProvider.ValidateUserAsync(manager.Object, userService.Object, "editor", "password"));

            manager.Verify(x => x.CheckPasswordAsync(It.IsAny<BackOfficeIdentityUser>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public void Disabled_user_is_rejected_before_password_check()
        {
            (Mock<IBackOfficeUserManager> manager, Mock<IUserService> userService, BackOfficeIdentityUser identityUser, _) = CreateSut();
            identityUser.IsApproved = false;
            manager.Setup(x => x.IsLockedOutAsync(identityUser)).ReturnsAsync(false);

            Assert.ThrowsAsync<AuthenticationException>(async () =>
                await ArticulateMetaWeblogProvider.ValidateUserAsync(manager.Object, userService.Object, "editor", "password"));

            manager.Verify(x => x.CheckPasswordAsync(It.IsAny<BackOfficeIdentityUser>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public void Approved_first_login_user_is_allowed_to_reach_password_check()
        {
            (Mock<IBackOfficeUserManager> manager, Mock<IUserService> userService, BackOfficeIdentityUser identityUser, _) = CreateSut();
            identityUser.IsApproved = true;
            identityUser.LastLoginDate = null;
            manager.Setup(x => x.CheckPasswordAsync(identityUser, "password")).ReturnsAsync(true);
            manager.Setup(x => x.ResetAccessFailedCountAsync(identityUser)).ReturnsAsync(IdentityResult.Success);

            Assert.DoesNotThrowAsync(async () =>
                await ArticulateMetaWeblogProvider.ValidateUserAsync(manager.Object, userService.Object, "editor", "password"));

            manager.Verify(x => x.CheckPasswordAsync(identityUser, "password"), Times.Once);
        }

        private static (Mock<IBackOfficeUserManager>, Mock<IUserService>, BackOfficeIdentityUser, IUser) CreateSut()
        {
            var identityUser = new BackOfficeIdentityUser(new GlobalSettings(), 1, []);
            Mock<IBackOfficeUserManager> manager = new();
            Mock<IUserService> userService = new();
            Mock<IUser> user = new();
            identityUser.IsApproved = true;

            userService.Setup(x => x.GetByUsername("editor")).Returns(user.Object);
            manager.Setup(x => x.FindByNameAsync("editor")).ReturnsAsync(identityUser);
            manager.Setup(x => x.IsLockedOutAsync(identityUser)).ReturnsAsync(false);
            manager.Setup(x => x.GetTwoFactorEnabledAsync(identityUser)).ReturnsAsync(false);

            return (manager, userService, identityUser, user.Object);
        }
    }
}
