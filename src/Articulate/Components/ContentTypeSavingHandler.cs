//using Umbraco.Cms.Core.Events;
//using Umbraco.Cms.Core.Models;
//using Umbraco.Cms.Core.Notifications;
//using Umbraco.Cms.Core.Services;
//using Umbraco.Extensions;

//namespace Articulate.Components
//{
//    public class ContentTypeSavingHandler : INotificationHandler<ContentTypeSavingNotification>
//    {
//        private readonly IDataTypeService _dataTypeService;

//        public ContentTypeSavingHandler(IDataTypeService dataTypeService)
//        {
//            _dataTypeService = dataTypeService;
//        }
//        public void Handle(ContentTypeSavingNotification notification)
//        {
//            // TODO: Check this is the correct datatype
//            var listViewDataType = _dataTypeService.GetDataType("Umbraco.ListView");

//            foreach (IContentType c in notification.SavedEntities
//                .Where(c => c.Alias.InvariantEquals(ArticulateConstants.ArticulateArchiveContentTypeAlias) || c.Alias.InvariantEquals(ArticulateConstants.ArticulateAuthorsContentTypeAlias))
//                .Where(c => c.HasIdentity == false))
//            {
//                c.ListView = listViewDataType?.Key; 
//            }
//        }
//    }
//}
