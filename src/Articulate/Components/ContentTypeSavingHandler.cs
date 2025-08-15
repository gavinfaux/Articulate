#nullable enable
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;

namespace Articulate.Components
{
    public class ContentTypeSavingHandler : INotificationHandler<ContentTypeSavingNotification>
    {
        public void Handle(ContentTypeSavingNotification notification)
        {
            foreach (IContentType c in notification.SavedEntities
                         .Where(c =>
                             c.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateArchive) ||
                             c.Alias.InvariantEquals(ArticulateConstants.ContentType.ArticulateAuthors)).Where(
                             c => !c.HasIdentity))
            {
                c.ListView = Umbraco.Cms.Core.Constants.DataTypes.Guids.ListViewContentGuid;
            }
        }
    }
}
