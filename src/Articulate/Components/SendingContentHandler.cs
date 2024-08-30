using System.Linq;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Extensions;

namespace Articulate.Components
{
    public sealed class SendingContentHandler : INotificationHandler<ContentSavingNotification>
    {
        /// <summary>
        /// Fill in default properties when creating an Articulate root node
        /// </summary>
        public void Handle(ContentSavingNotification notification)
        {
            foreach (var content in notification.SavedEntities)
            {

                if (!content.ContentType.Alias.InvariantEquals(ArticulateConstants.ArticulateContentTypeAlias))
                    return;

                //if it's not new don't continue
                if (content.Id != default(int))
                    return;

                foreach (var prop in content.Properties)
                {
                    switch (prop.Alias)
                    {
                        case "theme":
                            if (prop.GetValue("theme") == null) prop.SetValue("VAPOR");
                            break;
                        case "pageSize":
                            if (prop.GetValue("pageSize") == null)
                                 prop.SetValue(10);
                            break;
                        case "categoriesUrlName":
                            if (prop.GetValue("categoriesUrlName") == null)
                                prop.SetValue("categories");
                            break;
                        case "tagsUrlName":
                            if (prop.GetValue("tagsUrlName") == null)
                                prop.SetValue("tags");
                            break;
                        case "searchUrlName":
                            if (prop.GetValue("searchUrlName") == null)
                                prop.SetValue("search");
                            break;
                        case "categoriesPageName":
                            if (prop.GetValue("categoriesPageName") == null)
                                prop.SetValue("Categories");
                            break;
                        case "tagsPageName":
                            if (prop.GetValue("tagsPageName") == null)
                                prop.SetValue("Tags");
                            break;
                        case "searchPageName":
                            if (prop.GetValue("searchPageName") == null)
                                prop.SetValue("Search results");
                            break;
                    }
                }
            }
        }
    }
}
