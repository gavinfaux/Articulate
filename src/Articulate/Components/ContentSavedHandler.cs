using System.Linq;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Extensions;

namespace Articulate.Components
{

    public class ContentSavedHandler : INotificationHandler<ContentSavedNotification>
    {
        private readonly IContentTypeService _contentTypeService;
        private readonly IContentService _contentService;
        private readonly ILocalizationService _languageService;

        public ContentSavedHandler(
            IContentTypeService contentTypeService,
            IContentService contentService,
            ILocalizationService languageService)
        {
            _contentTypeService = contentTypeService;
            _contentService = contentService;
            _languageService = languageService;
        }

        public void Handle(ContentSavedNotification notification)
        {
            var e = notification;

            foreach (var c in e.SavedEntities)
            {
                if (!c.WasPropertyDirty("Id") || !c.ContentType.Alias.InvariantEquals(ArticulateConstants.ArticulateContentTypeAlias))
                {
                    continue;
                }

                //it's a root blog node, set up the required sub nodes (archive , authors) if they don't exist

                var defaultLang = _languageService.GetDefaultLanguageIsoCode();

                var children = _contentService.GetPagedChildren(c.Id, 0, 10, out var total).ToList();
                if (total == 0 || children.All(x => x.ContentType.Alias != ArticulateConstants.ArticulateArchive))
                {
                    var archiveContentType = _contentTypeService.Get(ArticulateConstants.ArticulateArchive);
                    if (archiveContentType != null)
                    {
                        if (archiveContentType.VariesByCulture())
                        {
                            var articles = _contentService.Create("", c, ArticulateConstants.ArticulateArchive);
                            articles.SetCultureName(ArticulateConstants.ArticlesDefaultName, defaultLang);
                            _contentService.Save(articles);
                        }
                        else
                        {
                            var articles = _contentService.CreateAndSave(ArticulateConstants.ArticlesDefaultName, c, ArticulateConstants.ArticulateArchive);
                        }
                    }
                }

                if (total == 0 || children.All(x => x.ContentType.Alias != ArticulateConstants.ArticulateAuthors))
                {
                    var authorContentType = _contentTypeService.Get(ArticulateConstants.ArticulateAuthors);
                    if (authorContentType != null)
                    {
                        if (authorContentType.VariesByCulture())
                        {
                            var authors = _contentService.Create("", c, ArticulateConstants.ArticulateAuthors);
                            authors.SetCultureName(ArticulateConstants.AuthorsDefaultName, defaultLang);
                            _contentService.Save(authors);
                        }
                        else
                        {
                            var authors = _contentService.CreateAndSave(ArticulateConstants.AuthorsDefaultName, c, ArticulateConstants.ArticulateAuthors);
                        }
                    }
                }
            }
        }
    }
}
