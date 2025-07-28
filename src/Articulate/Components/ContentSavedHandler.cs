#nullable enable
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Extensions;

namespace Articulate.Components
{

    public class ContentSavedHandler : INotificationHandler<ContentSavedNotification>
    {
        private readonly IContentTypeService _contentTypeService;
        private readonly IContentService _contentService;
        private readonly ILanguageService _languageService;

        public ContentSavedHandler(
            IContentTypeService contentTypeService,
            IContentService contentService,
            ILanguageService languageService)
        {
            _contentTypeService = contentTypeService;
            _contentService = contentService;
            _languageService = languageService;
        }

        public void Handle(ContentSavedNotification notification)
        {
            foreach (IContent c in notification.SavedEntities)
            {
                if (!c.WasPropertyDirty("Id") || !c.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate))
                {
                    continue;
                }

                //it's a root blog node, set up the required sub nodes (archive , authors) if they don't exist

                var defaultLang = Task.Run(() => _languageService.GetDefaultIsoCodeAsync()).GetAwaiter().GetResult();
                var children = _contentService.GetPagedChildren(c.Id, 0, 10, out var total).ToList();
                if (total == 0 || children.All(x => x.ContentType.Alias != ArticulateConstants.ContentType.ArticulateArchive))
                {
                    IContentType? archiveContentType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive);
                    if (archiveContentType != null)
                    {
                        if (archiveContentType.VariesByCulture())
                        {
                            IContent articles = _contentService.Create(string.Empty, c, ArticulateConstants.ContentType.ArticulateArchive);
                            articles.SetCultureName(ArticulateConstants.Convention.ArticlesDocument, defaultLang);
                            _contentService.Save(articles);
                        }
                        else
                        {
                            _contentService.CreateAndSave(ArticulateConstants.Convention.ArticlesDocument, c, ArticulateConstants.ContentType.ArticulateArchive);
                        }
                    }
                }

                if (total != 0 && children.Any(x => x.ContentType.Alias == ArticulateConstants.ContentType.ArticulateAuthors))
                {
                    continue;
                }

                IContentType? authorContentType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthors);
                if (authorContentType == null)
                {
                    continue;
                }

                if (authorContentType.VariesByCulture())
                {
                    IContent authors = _contentService.Create(string.Empty, c, ArticulateConstants.ContentType.ArticulateAuthors);
                    authors.SetCultureName(ArticulateConstants.Convention.AuthorsDocument, defaultLang);
                    _contentService.Save(authors);
                }
                else
                {
                    _contentService.CreateAndSave(ArticulateConstants.Convention.AuthorsDocument, c, ArticulateConstants.ContentType.ArticulateAuthors);
                }
            }
        }
    }
}
