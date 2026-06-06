#nullable enable
using Articulate.Migrations;
using Articulate.Options;
using Articulate.Theme.Sample;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using System.Data;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Packaging;
using Umbraco.Cms.Core.Persistence.Querying;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Cms.Infrastructure.Scoping;
using Umbraco.Cms.Core.Notifications;

namespace Articulate.Tests.Migrations
{
    [TestFixture]
    public class ArticulateAutoPublishHandlerTests
    {
        private Mock<IRuntimeState> _runtimeState = null!;
        private Mock<IContentService> _contentService = null!;
        private Mock<IContentTypeService> _contentTypeService = null!;
        private Mock<ISqlContext> _sqlContext = null!;
        private Mock<Umbraco.Cms.Infrastructure.Scoping.IScopeProvider> _scopeProvider = null!;

        [SetUp]
        public void SetUp()
        {
            _runtimeState = new Mock<IRuntimeState>();
            _runtimeState.SetupGet(x => x.Level).Returns(RuntimeLevel.Run);

            _contentService = new Mock<IContentService>();
            _contentTypeService = new Mock<IContentTypeService>();
            _sqlContext = new Mock<ISqlContext>();
            _scopeProvider = new Mock<Umbraco.Cms.Infrastructure.Scoping.IScopeProvider>();
            _scopeProvider.Setup(x => x.CreateScope(
                    It.IsAny<IsolationLevel>(),
                    It.IsAny<RepositoryCacheMode>(),
                    It.IsAny<IEventDispatcher>(),
                    It.IsAny<IScopedNotificationPublisher>(),
                    It.IsAny<bool?>(),
                    It.IsAny<bool>(),
                    It.IsAny<bool>()))
                .Returns(Mock.Of<Umbraco.Cms.Infrastructure.Scoping.IScope>());
        }

        [Test]
        public void Handle_imported_package_does_not_publish_when_auto_publish_is_disabled()
        {
            ArticulateAutoPublishHandler sut = CreateSut(enabled: false);

            sut.Handle(new ImportedPackageNotification(CreateInstallationSummary(CreateRootContent(published: false))));

            _contentService.Verify(
                x => x.PublishBranch(
                    It.IsAny<IContent>(),
                    It.IsAny<PublishBranchFilter>(),
                    It.IsAny<string[]>(),
                    It.IsAny<int>()),
                Times.Never);
        }

        [Test]
        public void Handle_imported_package_publishes_articulate_root_when_auto_publish_is_enabled()
        {
            IContent root = CreateRootContent(published: false);
            SetupRoots(root);
            SetupPublishedBranch(root);

            ArticulateAutoPublishHandler sut = CreateSut(enabled: true);

            sut.Handle(new ImportedPackageNotification(CreateInstallationSummary(root)));

            _contentService.Verify(
                x => x.PublishBranch(
                    root,
                    PublishBranchFilter.All,
                    It.Is<string[]>(cultures => cultures.Length == 0),
                    It.IsAny<int>()),
                Times.Once);
        }

        [Test]
        public void Handle_imported_package_does_not_publish_when_runtime_level_is_upgrade()
        {
            _runtimeState.SetupGet(x => x.Level).Returns(RuntimeLevel.Upgrade);

            ArticulateAutoPublishHandler sut = CreateSut(enabled: true);

            sut.Handle(new ImportedPackageNotification(CreateInstallationSummary(CreateRootContent(published: false))));

            _contentService.Verify(
                x => x.PublishBranch(
                    It.IsAny<IContent>(),
                    It.IsAny<PublishBranchFilter>(),
                    It.IsAny<string[]>(),
                    It.IsAny<int>()),
                Times.Never);
        }

        private ArticulateAutoPublishHandler CreateSut(bool enabled)
            => new(
                _runtimeState.Object,
                _contentService.Object,
                _contentTypeService.Object,
                _sqlContext.Object,
                Microsoft.Extensions.Options.Options.Create(new ArticulateOptions { AutoPublishOnStartup = enabled }),
                [new SampleThemeAutoPublishContributor()],
                NullLogger<ArticulateAutoPublishHandler>.Instance,
                _scopeProvider.Object);

        private static InstallationSummary CreateInstallationSummary(IContent root)
            => new(SampleTheme.PackageName)
            {
                ContentInstalled = [root],
                MediaInstalled = [],
            };

        private void SetupRoots(IContent root)
        {
            Mock<IQuery<IContent>> query = new();
            query
                .Setup(x => x.Where(It.IsAny<System.Linq.Expressions.Expression<Func<IContent, bool>>>()))
                .Returns(query.Object);

            _sqlContext
                .Setup(x => x.Query<IContent>())
                .Returns(query.Object);

            _contentTypeService
                .Setup(x => x.Get(ArticulateConstants.ContentType.Articulate))
                .Returns(CreateContentType());

#if NET10_0_OR_GREATER
            _contentService
                .Setup(x => x.GetPagedOfType(
                    It.IsAny<int>(),
                    It.IsAny<long>(),
                    It.IsAny<int>(),
                    out It.Ref<long>.IsAny,
                    It.IsAny<IQuery<IContent>>(),
                    null))
                .Returns((int _, long _, int _, out long total, IQuery<IContent> _, Ordering? _) =>
                {
                    total = 1;
                    return new[] { root };
                });
#else
#pragma warning disable CS0618
            _contentService
                .Setup(x => x.GetPagedOfType(
                    It.IsAny<int>(),
                    It.IsAny<long>(),
                    It.IsAny<int>(),
                    out It.Ref<long>.IsAny,
                    It.IsAny<IQuery<IContent>>(),
                    null))
                .Returns((int _, long _, int _, out long total, IQuery<IContent> _, Ordering? _) =>
                {
                    total = 1;
                    return new[] { root };
                });
#pragma warning restore CS0618
#endif
        }

        private void SetupPublishedBranch(IContent root)
        {
            _contentService
                .Setup(x => x.PublishBranch(root, PublishBranchFilter.All, It.IsAny<string[]>(), It.IsAny<int>()))
                .Returns([new PublishResult(new EventMessages(), root)]);
        }

        private static IContent CreateRootContent(bool published)
        {
            Mock<IContent> content = new();
            content.SetupGet(x => x.Id).Returns(100);
            content.SetupGet(x => x.Published).Returns(published);
            content.SetupGet(x => x.Trashed).Returns(false);
            content.SetupGet(x => x.ContentType).Returns(CreateSimpleContentType(ArticulateConstants.ContentType.Articulate));
            return content.Object;
        }

        private static IContentType CreateContentType()
        {
            Mock<IContentType> contentType = new();
            contentType.SetupGet(x => x.Id).Returns(42);
            contentType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.Articulate);
            return contentType.Object;
        }

        private static ISimpleContentType CreateSimpleContentType(string alias)
        {
            Mock<ISimpleContentType> contentType = new();
            contentType.SetupGet(x => x.Alias).Returns(alias);
            return contentType.Object;
        }
    }
}
