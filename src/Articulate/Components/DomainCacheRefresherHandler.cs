#nullable enable
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace Articulate.Components
{
    /// <summary>
    /// Notification handler to refresh Articulate routes when domains are updated in the cache.
    /// </summary>
    public sealed class DomainCacheRefresherHandler(AppCaches appCaches)
        : INotificationHandler<DomainCacheRefresherNotification>
    {
        /// <inheritdoc/>
        public void Handle(DomainCacheRefresherNotification notification) =>

            // ensure routes are rebuilt
            appCaches.RequestCache.GetCacheItem(ArticulateConstants.RefreshRoutesToken, () => true);
    }
}
