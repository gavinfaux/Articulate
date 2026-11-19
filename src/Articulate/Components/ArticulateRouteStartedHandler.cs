#nullable enable
using Articulate.Routing;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace Articulate.Components
{
    /// <summary>
    /// Rebuilds Articulate's routes once Umbraco reaches the Run level, including after an install, upgrade or restart.
    /// </summary>
    internal sealed class ArticulateRouteStartedHandler(IArticulateRouteRefreshState routeRefreshState)
        : INotificationHandler<UmbracoApplicationStartedNotification>
    {
        public void Handle(UmbracoApplicationStartedNotification notification) => routeRefreshState.MarkDirty();
    }
}
