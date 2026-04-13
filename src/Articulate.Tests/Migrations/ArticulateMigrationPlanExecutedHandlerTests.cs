#nullable enable
using Articulate.Migrations;
using Articulate.Options;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Packaging;
using Umbraco.Cms.Core.Persistence.Querying;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Notifications;
using Umbraco.Cms.Infrastructure.Persistence;

namespace Articulate.Tests.Migrations
{
    [TestFixture]
    public class ArticulateMigrationPlanExecutedHandlerTests
    {
        [Test]
        public void Handle_publishes_all_articulate_roots_when_articulate_migration_ran()
        {
            var publishedRootIds = new List<int>();

            var contentType = new Mock<IContentType>();
            contentType.SetupGet(x => x.Id).Returns(123);

            IContent rootOne = CreateContent(1, published: true);
            IContent rootTwo = CreateContent(2, published: true);

            var contentService = new Mock<IContentService>();
            contentService
                .Setup(x => x.GetPagedOfType(123, 0, int.MaxValue, out It.Ref<long>.IsAny, It.IsAny<IQuery<IContent>>()))
                .Returns((int _, long _, int _, out long totalRecords, IQuery<IContent> _, Ordering? _) =>
                {
                    totalRecords = 2;
                    return new[] { rootOne, rootTwo };
                });
            contentService
                .Setup(x => x.PublishBranch(It.IsAny<IContent>(), PublishBranchFilter.ForceRepublish, It.IsAny<string[]>()))
                .Returns((IContent content, PublishBranchFilter _, string[] _, int _) =>
                {
                    publishedRootIds.Add(content.Id);
                    return [];
                });

            var contentTypeService = new Mock<IContentTypeService>();
            contentTypeService
                .Setup(x => x.Get(ArticulateConstants.ContentType.Articulate))
                .Returns(contentType.Object);

            var sqlContext = new Mock<ISqlContext>();
            sqlContext
                .Setup(x => x.Query<IContent>())
                .Returns(Mock.Of<IQuery<IContent>>());

            var runtimeState = new Mock<IRuntimeState>();
            runtimeState.SetupGet(x => x.Level).Returns(RuntimeLevel.Run);

            var sut = new ArticulateMigrationPlanExecutedHandler(
                runtimeState.Object,
                contentService.Object,
                contentTypeService.Object,
                sqlContext.Object,
                NullLogger<ArticulateMigrationPlanExecutedHandler>.Instance,
                Microsoft.Extensions.Options.Options.Create(new ArticulateOptions { AutoPublishOnStartup = true }));

            MigrationPlan plan = new(ArticulateConstants.Migration.ArticulatePackageMigrationPlan);
            var notification = new MigrationPlansExecutedNotification(
                [new ExecutedMigrationPlan(plan, string.Empty, "done", true, [])]);

            sut.Handle(notification);

            Assert.That(publishedRootIds, Is.EqualTo(new[] { 1, 2 }));
        }

        [Test]
        public void Handle_does_not_publish_trashed_articulate_roots()
        {
            var publishedRootIds = new List<int>();

            var contentType = new Mock<IContentType>();
            contentType.SetupGet(x => x.Id).Returns(123);

            IContent liveRoot = CreateContent(1, published: true, trashed: false);
            IContent trashedRoot = CreateContent(2, published: true, trashed: true);

            var contentService = new Mock<IContentService>();
            contentService
                .Setup(x => x.GetPagedOfType(123, 0, int.MaxValue, out It.Ref<long>.IsAny, It.IsAny<IQuery<IContent>>()))
                .Returns((int _, long _, int _, out long totalRecords, IQuery<IContent> _, Ordering? _) =>
                {
                    totalRecords = 2;
                    return new[] { liveRoot, trashedRoot };
                });
            contentService
                .Setup(x => x.PublishBranch(It.IsAny<IContent>(), PublishBranchFilter.ForceRepublish, It.IsAny<string[]>()))
                .Returns((IContent content, PublishBranchFilter _, string[] _, int _) =>
                {
                    publishedRootIds.Add(content.Id);
                    return [];
                });

            var contentTypeService = new Mock<IContentTypeService>();
            contentTypeService
                .Setup(x => x.Get(ArticulateConstants.ContentType.Articulate))
                .Returns(contentType.Object);

            var sqlContext = new Mock<ISqlContext>();
            sqlContext
                .Setup(x => x.Query<IContent>())
                .Returns(Mock.Of<IQuery<IContent>>());

            var runtimeState = new Mock<IRuntimeState>();
            runtimeState.SetupGet(x => x.Level).Returns(RuntimeLevel.Run);

            var sut = new ArticulateMigrationPlanExecutedHandler(
                runtimeState.Object,
                contentService.Object,
                contentTypeService.Object,
                sqlContext.Object,
                NullLogger<ArticulateMigrationPlanExecutedHandler>.Instance,
                Microsoft.Extensions.Options.Options.Create(new ArticulateOptions { AutoPublishOnStartup = true }));

            MigrationPlan plan = new(ArticulateConstants.Migration.ArticulatePackageMigrationPlan);
            var notification = new MigrationPlansExecutedNotification(
                [new ExecutedMigrationPlan(plan, string.Empty, "done", true, [])]);

            sut.Handle(notification);

            Assert.That(publishedRootIds, Is.EqualTo(new[] { 1 }));
        }

        [Test]
        public void Handle_does_not_publish_when_no_articulate_migration_ran()
        {
            var contentService = new Mock<IContentService>(MockBehavior.Strict);
            var contentTypeService = new Mock<IContentTypeService>(MockBehavior.Strict);
            var sqlContext = new Mock<ISqlContext>(MockBehavior.Strict);

            var runtimeState = new Mock<IRuntimeState>();
            runtimeState.SetupGet(x => x.Level).Returns(RuntimeLevel.Run);

            var sut = new ArticulateMigrationPlanExecutedHandler(
                runtimeState.Object,
                contentService.Object,
                contentTypeService.Object,
                sqlContext.Object,
                NullLogger<ArticulateMigrationPlanExecutedHandler>.Instance,
                Microsoft.Extensions.Options.Options.Create(new ArticulateOptions { AutoPublishOnStartup = true }));

            MigrationPlan plan = new("Other.Plan");
            var notification = new MigrationPlansExecutedNotification(
                [new ExecutedMigrationPlan(plan, string.Empty, "done", true, [])]);

            Assert.DoesNotThrow(() => sut.Handle(notification));
            contentService.VerifyNoOtherCalls();
            contentTypeService.VerifyNoOtherCalls();
            sqlContext.VerifyNoOtherCalls();
        }

        [Test]
        public void Handle_imported_package_publishes_installed_unpublished_articulate_roots_when_enabled()
        {
            List<int> publishedRootIds = [];

            IContent rootOne = CreateContent(1, published: false);
            IContent rootTwo = CreateContent(2, published: false);

            Mock<IContentService> contentService = new();
            contentService
                .Setup(x => x.PublishBranch(It.IsAny<IContent>(), PublishBranchFilter.IncludeUnpublished, It.IsAny<string[]>()))
                .Returns((IContent content, PublishBranchFilter _, string[] _, int _) =>
                {
                    publishedRootIds.Add(content.Id);
                    return [];
                });

            Mock<IContentTypeService> contentTypeService = new(MockBehavior.Strict);
            Mock<ISqlContext> sqlContext = new(MockBehavior.Strict);

            Mock<IRuntimeState> runtimeState = new();
            runtimeState.SetupGet(x => x.Level).Returns(RuntimeLevel.Run);

            var sut = new ArticulateMigrationPlanExecutedHandler(
                runtimeState.Object,
                contentService.Object,
                contentTypeService.Object,
                sqlContext.Object,
                NullLogger<ArticulateMigrationPlanExecutedHandler>.Instance,
                Microsoft.Extensions.Options.Options.Create(new ArticulateOptions { AutoPublishOnStartup = true }));

            sut.Handle(CreateImportedPackageNotification(rootOne, rootTwo));

            Assert.That(publishedRootIds, Is.EqualTo(new[] { 1, 2 }));
        }

        [Test]
        public void Handle_imported_package_does_not_publish_when_auto_publish_disabled()
        {
            Mock<IContentService> contentService = new(MockBehavior.Strict);
            Mock<IContentTypeService> contentTypeService = new(MockBehavior.Strict);
            Mock<ISqlContext> sqlContext = new(MockBehavior.Strict);

            Mock<IRuntimeState> runtimeState = new();
            runtimeState.SetupGet(x => x.Level).Returns(RuntimeLevel.Run);

            var sut = new ArticulateMigrationPlanExecutedHandler(
                runtimeState.Object,
                contentService.Object,
                contentTypeService.Object,
                sqlContext.Object,
                NullLogger<ArticulateMigrationPlanExecutedHandler>.Instance,
                Microsoft.Extensions.Options.Options.Create(new ArticulateOptions { AutoPublishOnStartup = false }));

            Assert.DoesNotThrow(() => sut.Handle(CreateImportedPackageNotification()));
            contentService.VerifyNoOtherCalls();
            contentTypeService.VerifyNoOtherCalls();
            sqlContext.VerifyNoOtherCalls();
        }

        [Test]
        public void Handle_imported_package_does_not_publish_when_runtime_not_run()
        {
            Mock<IContentService> contentService = new(MockBehavior.Strict);
            Mock<IContentTypeService> contentTypeService = new(MockBehavior.Strict);
            Mock<ISqlContext> sqlContext = new(MockBehavior.Strict);

            Mock<IRuntimeState> runtimeState = new();
            runtimeState.SetupGet(x => x.Level).Returns(RuntimeLevel.Upgrade);

            var sut = new ArticulateMigrationPlanExecutedHandler(
                runtimeState.Object,
                contentService.Object,
                contentTypeService.Object,
                sqlContext.Object,
                NullLogger<ArticulateMigrationPlanExecutedHandler>.Instance,
                Microsoft.Extensions.Options.Options.Create(new ArticulateOptions { AutoPublishOnStartup = true }));

            Assert.DoesNotThrow(() => sut.Handle(CreateImportedPackageNotification()));
            contentService.VerifyNoOtherCalls();
            contentTypeService.VerifyNoOtherCalls();
            sqlContext.VerifyNoOtherCalls();
        }

        [Test]
        public void Handle_imported_package_does_not_publish_when_package_did_not_install_articulate_roots()
        {
            Mock<IContentService> contentService = new(MockBehavior.Strict);
            Mock<IContentTypeService> contentTypeService = new(MockBehavior.Strict);
            Mock<ISqlContext> sqlContext = new(MockBehavior.Strict);

            Mock<IRuntimeState> runtimeState = new();
            runtimeState.SetupGet(x => x.Level).Returns(RuntimeLevel.Run);

            var sut = new ArticulateMigrationPlanExecutedHandler(
                runtimeState.Object,
                contentService.Object,
                contentTypeService.Object,
                sqlContext.Object,
                NullLogger<ArticulateMigrationPlanExecutedHandler>.Instance,
                Microsoft.Extensions.Options.Options.Create(new ArticulateOptions { AutoPublishOnStartup = true }));

            Assert.DoesNotThrow(() => sut.Handle(CreateImportedPackageNotification()));
            contentService.VerifyNoOtherCalls();
            contentTypeService.VerifyNoOtherCalls();
            sqlContext.VerifyNoOtherCalls();
        }

        private static IContent CreateContent(int id, bool published = true, bool trashed = false)
        {
            Mock<ISimpleContentType> contentType = new();
            contentType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.Articulate);

            var content = new Mock<IContent>();
            content.SetupGet(x => x.Id).Returns(id);
            content.SetupGet(x => x.Published).Returns(published);
            content.SetupGet(x => x.Trashed).Returns(trashed);
            content.SetupGet(x => x.ContentType).Returns(contentType.Object);
            return content.Object;
        }

        private static ImportedPackageNotification CreateImportedPackageNotification(params IContent[] installedContent) =>
            new(new InstallationSummary("Articulate")
            {
                ContentInstalled = installedContent,
            });
    }
}
