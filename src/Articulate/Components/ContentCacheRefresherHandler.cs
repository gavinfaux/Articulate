#nullable enable
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Services.Changes;
using Umbraco.Cms.Core.Sync;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Infrastructure.Scoping;
using Articulate.Routing;

namespace Articulate.Components
{
    /// <summary>
    /// Notification handler to refresh Articulate routes when the content cache is updated.
    /// </summary>
    public sealed class ContentCacheRefresherHandler(
        IUmbracoContextAccessor umbracoContextAccessor,
        AppCaches appCaches,
        IPublishedContentTypeCache publishedContentTypeCache,
        IDocumentCacheService documentCacheService,
        IScopeProvider scopeProvider)
        : INotificationHandler<ContentCacheRefresherNotification>
    {
        private void EnsureRoutesRefreshQueued() =>
            _ = appCaches.RequestCache.GetCacheItem(ArticulateConstants.RefreshRoutesToken, () => true);

        /// <summary>
        /// When the page/content cache is refreshed, we'll check if any articulate root nodes were included in the refresh, if so we'll set a flag
        /// on the current request to rebuild the routes at the end of the request
        /// </summary>
        /// <remarks>
        /// This will also work for load balanced scenarios since this event executes on all servers
        /// </remarks>
        public void Handle(ContentCacheRefresherNotification notification)
        {
            switch (notification.MessageType)
            {
                case MessageType.RefreshByPayload:
                    HandleRefreshByPayload((ContentCacheRefresher.JsonPayload[])notification.MessageObject);
                    break;
                case MessageType.RefreshById:
                case MessageType.RemoveById:
                    RefreshById((int)notification.MessageObject);
                    break;
                case MessageType.RefreshByInstance:
                case MessageType.RemoveByInstance:
                    HandleRefreshByInstance(notification.MessageObject);
                    break;
                case MessageType.RefreshAll:
                case MessageType.RefreshByJson:
                default:
                    break;
            }
        }

        private void HandleRefreshByPayload(ContentCacheRefresher.JsonPayload[] payloads)
        {
            foreach (ContentCacheRefresher.JsonPayload payload in payloads)
            {
                if (payload.ChangeTypes.HasTypesAny(TreeChangeTypes.Remove | TreeChangeTypes.RefreshBranch |
                                                    TreeChangeTypes.RefreshNode))
                {
                    RefreshById(payload.Id);
                }
            }
        }

        private void HandleRefreshByInstance(object messageObject)
        {
            if (messageObject is not IContent content)
            {
                return;
            }

            if (ArticulateRouteChangeDetector.AffectsArticulateRoutes(
                    content.Path,
                    content.Level,
                    content.SortOrder,
                    content.ContentType.Alias,
                    GetArticulateRoots()))
            {
                EnsureRoutesRefreshQueued();
            }
        }

        private void RefreshById(int id)
        {
            if (!umbracoContextAccessor.TryGetUmbracoContext(out IUmbracoContext? umbracoContext))
            {
                return;
            }

            using (scopeProvider.CreateScope(autoComplete: true))
            {
                IPublishedContent? item = umbracoContext.Content.GetById(id);

                // We need to handle cases where the state of siblings at a lower sort order directly affect an Articulate node's routing.
                // This will happen on copy, move, sort, unpublish, delete
                if (item is null)
                {
                    item = umbracoContext.Content.GetById(true, id);

                    // This will occur on delete, then what?
                    // TODO: How would we know this is a node that might be at the same level/above?
                    // For now, we have no choice, rebuild routes on each delete :/
                    if (item is null)
                    {
                        EnsureRoutesRefreshQueued();
                        return;
                    }
                }

                if (!ArticulateRouteChangeDetector.AffectsArticulateRoutes(
                        item.Path,
                        item.Level,
                        item.SortOrder,
                        item.ContentType.Alias,
                        GetArticulateRoots()))
                {
                    return;
                }

                EnsureRoutesRefreshQueued();
            }
        }

        private IEnumerable<IPublishedContent> GetArticulateRoots()
        {
            IPublishedContentType articulateContentType = publishedContentTypeCache.Get(
                PublishedItemType.Content,
                ArticulateConstants.ContentType.Articulate);

            return documentCacheService.GetByContentType(articulateContentType);
        }
    }
}
