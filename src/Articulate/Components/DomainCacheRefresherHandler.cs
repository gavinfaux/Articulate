#nullable enable
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace Articulate.Components
{
    public sealed class DomainCacheRefresherHandler(AppCaches appCaches)
        : INotificationHandler<DomainCacheRefresherNotification>
    {
        public void Handle(DomainCacheRefresherNotification notification) =>

            // ensure routes are rebuilt
            appCaches.RequestCache.GetCacheItem(ArticulateConstants.RefreshRoutesToken, () => true);
    }
}
