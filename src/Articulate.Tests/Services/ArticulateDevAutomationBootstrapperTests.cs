#nullable enable
using Articulate.Options;
using Articulate.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Models.Membership.Permissions;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Security.OperationStatus;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.OperationStatus;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Infrastructure.Security;

namespace Articulate.Tests.Services
{
    [TestFixture]
    public class ArticulateDevAutomationBootstrapperTests
    {
        [Test]
        public async Task HandleAsync_is_noop_when_disabled()
        {
            Mock<IServiceScopeFactory> scopeFactory = new(MockBehavior.Strict);
            ArticulateDevAutomationBootstrapper sut = CreateSut(
                scopeFactory.Object,
                new ArticulateDevAutomationOptions
                {
                    Enabled = false
                });

            await sut.HandleAsync(null!, CancellationToken.None);

            scopeFactory.Verify(x => x.CreateScope(), Times.Never);
        }

        [Test]
        public async Task HandleAsync_creates_api_user_and_client_credentials_when_missing()
        {
            UserGroup adminGroup = CreateGroup("admin");
            Mock<IUser> apiUser = CreateUser("articulate-dev-automation@localhost", "articulate-dev-automation", "Articulate Dev Automation", UserKind.Api);

            var userService = new Mock<IUserService>();
            userService.Setup(x => x.FindByClientIdAsync("articulate-dev-automation"))
                .ReturnsAsync((IUser?)null);

            var userStore = new Mock<IBackOfficeUserStore>();
            userStore.SetupSequence(x => x.GetByEmailAsync("articulate-dev-automation@localhost"))
                .ReturnsAsync((IUser?)null)
                .ReturnsAsync(apiUser.Object);
            userStore.Setup(x => x.SaveAsync(apiUser.Object))
                .ReturnsAsync(UserOperationStatus.Success);

            var coreUserManager = new Mock<ICoreBackOfficeUserManager>();
            coreUserManager
                .Setup(x => x.CreateAsync(It.Is<UserCreateModel>(model =>
                    model.Kind == UserKind.Api &&
                    model.Email == "articulate-dev-automation@localhost" &&
                    model.UserName == "articulate-dev-automation" &&
                    model.Name == "Articulate Dev Automation" &&
                    model.UserGroupKeys.Count == 1 &&
                    model.UserGroupKeys.Contains(adminGroup.Key))))
                .ReturnsAsync(new IdentityCreationResult { Succeded = true });

            var credentialsManager = new Mock<IBackOfficeUserClientCredentialsManager>();
            credentialsManager
                .Setup(x => x.SaveAsync(apiUser.Object.Key, "articulate-dev-automation", "secret-123"))
                .ReturnsAsync(Attempt.Succeed(BackOfficeUserClientCredentialsOperationStatus.Success));

            var backOfficeApplicationManager = new Mock<IBackOfficeApplicationManager>();
            backOfficeApplicationManager
                .Setup(x => x.EnsureBackOfficeClientCredentialsApplicationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var userGroupService = new Mock<IUserGroupService>();
            userGroupService.Setup(x => x.GetAsync("admin"))
                .ReturnsAsync((IUserGroup)adminGroup);

            ArticulateDevAutomationBootstrapper sut = CreateSut(
                scopeFactory: BuildScopeFactory(userService.Object, userStore.Object, coreUserManager.Object, credentialsManager.Object, backOfficeApplicationManager.Object, userGroupService.Object),
                options: new ArticulateDevAutomationOptions
                {
                    Enabled = true,
                    ClientId = "articulate-dev-automation",
                    ClientSecret = "secret-123",
                    UserName = "articulate-dev-automation",
                    Email = "articulate-dev-automation@localhost",
                    Name = "Articulate Dev Automation",
                    UserGroupAliases = ["admin"]
                },
                backOfficeApplicationManager: backOfficeApplicationManager.Object);

            await sut.HandleAsync(null!, CancellationToken.None);

            Assert.That(apiUser.Object.Groups, Is.Not.Empty);
            userService.Verify(x => x.FindByClientIdAsync("articulate-dev-automation"), Times.Once);
            userStore.Verify(x => x.SaveAsync(apiUser.Object), Times.Once);
            credentialsManager.Verify(x => x.SaveAsync(apiUser.Object.Key, "articulate-dev-automation", "secret-123"), Times.Once);
            backOfficeApplicationManager.Verify(x => x.EnsureBackOfficeClientCredentialsApplicationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
            coreUserManager.VerifyAll();
            userGroupService.Verify(x => x.GetAsync("admin"), Times.Once);
        }

        [Test]
        public async Task HandleAsync_refreshes_client_credentials_when_client_is_already_bound()
        {
            UserGroup adminGroup = CreateGroup("admin");
            Mock<IUser> apiUser = CreateUser("articulate-dev-automation@localhost", "articulate-dev-automation", "Articulate Dev Automation", UserKind.Api);

            var userService = new Mock<IUserService>();
            userService.Setup(x => x.FindByClientIdAsync("articulate-dev-automation"))
                .ReturnsAsync(apiUser.Object);

            var userStore = new Mock<IBackOfficeUserStore>();
            var coreUserManager = new Mock<ICoreBackOfficeUserManager>(MockBehavior.Strict);

            var credentialsManager = new Mock<IBackOfficeUserClientCredentialsManager>();
            var backOfficeApplicationManager = new Mock<IBackOfficeApplicationManager>();
            backOfficeApplicationManager
                .Setup(x => x.EnsureBackOfficeClientCredentialsApplicationAsync("articulate-dev-automation", "secret-rotated", It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var userGroupService = new Mock<IUserGroupService>();
            userGroupService.Setup(x => x.GetAsync("admin"))
                .ReturnsAsync((IUserGroup)adminGroup);

            ArticulateDevAutomationBootstrapper sut = CreateSut(
                scopeFactory: BuildScopeFactory(userService.Object, userStore.Object, coreUserManager.Object, credentialsManager.Object, backOfficeApplicationManager.Object, userGroupService.Object),
                options: new ArticulateDevAutomationOptions
                {
                    Enabled = true,
                    ClientId = "articulate-dev-automation",
                    ClientSecret = "secret-rotated",
                    UserName = "articulate-dev-automation",
                    Email = "articulate-dev-automation@localhost",
                    Name = "Articulate Dev Automation",
                    UserGroupAliases = ["admin"]
                },
                backOfficeApplicationManager: backOfficeApplicationManager.Object);

            await sut.HandleAsync(null!, CancellationToken.None);

            userService.Verify(x => x.FindByClientIdAsync("articulate-dev-automation"), Times.Once);
            credentialsManager.Verify(x => x.SaveAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
            backOfficeApplicationManager.Verify(x => x.EnsureBackOfficeClientCredentialsApplicationAsync("articulate-dev-automation", "secret-rotated", It.IsAny<CancellationToken>()), Times.Once);
            userStore.Verify(x => x.GetByEmailAsync(It.IsAny<string>()), Times.Never);
            userStore.Verify(x => x.SaveAsync(It.IsAny<IUser>()), Times.Once);
            userGroupService.Verify(x => x.GetAsync("admin"), Times.Once);
        }

        private static ArticulateDevAutomationBootstrapper CreateSut(
            IServiceScopeFactory scopeFactory,
            ArticulateDevAutomationOptions options,
            IBackOfficeApplicationManager? backOfficeApplicationManager = null,
            RuntimeMode runtimeMode = RuntimeMode.BackofficeDevelopment,
            RuntimeLevel runtimeLevel = RuntimeLevel.Run)
        {
            return new ArticulateDevAutomationBootstrapper(
                scopeFactory,
                Microsoft.Extensions.Options.Options.Create(options),
                Microsoft.Extensions.Options.Options.Create(new RuntimeSettings { Mode = runtimeMode }),
                Mock.Of<IRuntimeState>(state => state.Level == runtimeLevel),
                backOfficeApplicationManager ?? Mock.Of<IBackOfficeApplicationManager>(),
                NullLogger<ArticulateDevAutomationBootstrapper>.Instance);
        }

        private static IServiceScopeFactory BuildScopeFactory(
            IUserService userService,
            IBackOfficeUserStore userStore,
            ICoreBackOfficeUserManager coreUserManager,
            IBackOfficeUserClientCredentialsManager credentialsManager,
            IBackOfficeApplicationManager backOfficeApplicationManager,
            IUserGroupService userGroupService)
        {
            ServiceCollection collection = new();

            collection.AddSingleton(userService);
            collection.AddSingleton(userStore);
            collection.AddSingleton(coreUserManager);
            collection.AddSingleton(credentialsManager);
            collection.AddSingleton(backOfficeApplicationManager);
            collection.AddSingleton(userGroupService);

            IServiceProvider provider = collection.BuildServiceProvider();
            var scopeFactory = new Mock<IServiceScopeFactory>();
            scopeFactory.Setup(x => x.CreateScope()).Returns(() => provider.CreateScope());
            return scopeFactory.Object;
        }

        private static UserGroup CreateGroup(string alias)
        {
            var group = new UserGroup(Mock.Of<IShortStringHelper>())
            {
                Id = 1,
                Key = Guid.NewGuid(),
                Alias = alias,
                Name = "Administrators",
                Icon = "icon-lock",
                StartContentId = -1,
                StartMediaId = -1,
                Permissions = new HashSet<string>(),
                GranularPermissions = new HashSet<IGranularPermission>(),
                HasAccessToAllLanguages = true
            };
            return group;
        }

        private static Mock<IUser> CreateUser(string email, string username, string name, UserKind kind)
        {
            var groups = new List<IReadOnlyUserGroup>();
            var user = new Mock<IUser>();
            user.SetupProperty(x => x.Id, 0);
            user.SetupProperty(x => x.Key, Guid.NewGuid());
            user.SetupProperty(x => x.Email, email);
            user.SetupProperty(x => x.Username, username);
            user.SetupProperty(x => x.Name, name);
            user.SetupProperty(x => x.Kind, kind);
            user.SetupProperty(x => x.IsApproved, false);
            user.SetupProperty(x => x.IsLockedOut, false);
            user.SetupProperty(x => x.RawPasswordValue, string.Empty);
            user.SetupProperty(x => x.PasswordConfiguration, null);
            user.SetupProperty(x => x.Comments, null);
            user.SetupProperty(x => x.EmailConfirmedDate, null);
            user.SetupProperty(x => x.LastLoginDate, null);
            user.SetupProperty(x => x.LastPasswordChangeDate, null);
            user.SetupProperty(x => x.LastLockoutDate, null);
            user.SetupProperty(x => x.FailedPasswordAttempts, 0);
            user.SetupProperty(x => x.SecurityStamp, null);
            user.SetupProperty(x => x.SessionTimeout, 60);
            user.SetupProperty(x => x.Language, "en-US");
            user.SetupProperty(x => x.Avatar, null);
            user.SetupProperty(x => x.StartContentIds, null);
            user.SetupProperty(x => x.StartMediaIds, null);
            user.SetupGet(x => x.Groups).Returns(groups);
            user.SetupGet(x => x.AllowedSections).Returns(Array.Empty<string>());
            user.SetupGet(x => x.ProfileData).Returns(Mock.Of<IProfile>());
            user.Setup(x => x.AddGroup(It.IsAny<IReadOnlyUserGroup>()))
                .Callback<IReadOnlyUserGroup>(group => groups.Add(group));
            user.Setup(x => x.RemoveGroup(It.IsAny<string>()))
                .Callback<string>(groupAlias => groups.RemoveAll(group => string.Equals(group.Alias, groupAlias, StringComparison.OrdinalIgnoreCase)));
            user.Setup(x => x.ClearGroups())
                .Callback(() => groups.Clear());
            user.SetupGet(x => x.UserState).Returns(UserState.Active);
            user.SetupGet(x => x.HasIdentity).Returns(true);
            return user;
        }
    }
}
