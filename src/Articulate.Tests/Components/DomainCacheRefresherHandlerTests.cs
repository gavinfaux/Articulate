#nullable enable
using Articulate.Components;
using Articulate.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Notifications;

namespace Articulate.Tests.Components
{
    [TestFixture]
    public class DomainCacheRefresherHandlerTests
    {
        [Test]
        public void Handle_marks_routes_dirty()
        {
            Mock<IArticulateRouteRefreshState> routeRefreshState = new();
            DomainCacheRefresherHandler sut = new(routeRefreshState.Object, NullLogger<DomainCacheRefresherHandler>.Instance);

            sut.Handle(new DomainCacheRefresherNotification(new object(), Umbraco.Cms.Core.Sync.MessageType.RefreshAll));

            routeRefreshState.Verify(x => x.MarkDirty(), Times.Once);
        }

        [Test]
        public void Handle_marks_routes_dirty_for_any_message_type()
        {
            Mock<IArticulateRouteRefreshState> routeRefreshState = new();
            DomainCacheRefresherHandler sut = new(routeRefreshState.Object, NullLogger<DomainCacheRefresherHandler>.Instance);

            sut.Handle(new DomainCacheRefresherNotification(new object(), Umbraco.Cms.Core.Sync.MessageType.RefreshById));

            routeRefreshState.Verify(x => x.MarkDirty(), Times.Once);
        }

        [Test]
        public void Handle_marks_routes_dirty_once_per_notification()
        {
            Mock<IArticulateRouteRefreshState> routeRefreshState = new();
            DomainCacheRefresherHandler sut = new(routeRefreshState.Object, NullLogger<DomainCacheRefresherHandler>.Instance);

            sut.Handle(new DomainCacheRefresherNotification(new object(), Umbraco.Cms.Core.Sync.MessageType.RefreshAll));
            sut.Handle(new DomainCacheRefresherNotification(new object(), Umbraco.Cms.Core.Sync.MessageType.RefreshAll));

            routeRefreshState.Verify(x => x.MarkDirty(), Times.Exactly(2));
        }
    }
}
