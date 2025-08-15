#nullable enable
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Articulate.Components
{
    public class ContentSavedHandler(
        IContentTypeService contentTypeService,
        IContentService contentService,
        ILanguageService languageService)
        : INotificationHandler<ContentSavedNotification>
    {
        // TODO: Review
        public void Handle(ContentSavedNotification notification)
        {
            foreach (IContent c in notification.SavedEntities)
            {
                if (!c.WasPropertyDirty("Id") || !c.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate))
                {
                    continue;
                }

                // it's a root blog node, set up the required sub nodes (archive , authors) if they don't exist
                var defaultLang = Task.Run(languageService.GetDefaultIsoCodeAsync).GetAwaiter().GetResult();
                var children = contentService.GetPagedChildren(c.Id, 0, 10, out var total).ToList();
                if (total == 0 || children.All(x => x.ContentType.Alias != ArticulateConstants.ContentType.ArticulateArchive))
                {
                    IContentType? archiveContentType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive);
                    if (archiveContentType is not null)
                    {
                        if (archiveContentType.VariesByCulture())
                        {
                            IContent articles = contentService.Create(string.Empty, c, ArticulateConstants.ContentType.ArticulateArchive);
                            articles.SetCultureName(ArticulateConstants.Convention.ArticlesDocument, defaultLang);
                            contentService.Save(articles);
                        }
                        else
                        {
                            contentService.CreateAndSave(ArticulateConstants.Convention.ArticlesDocument, c, ArticulateConstants.ContentType.ArticulateArchive);
                        }
                    }
                }

                if (total != 0 && children.Any(x => x.ContentType.Alias == ArticulateConstants.ContentType.ArticulateAuthors))
                {
                    continue;
                }

                IContentType? authorContentType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthors);
                if (authorContentType is null)
                {
                    continue;
                }

                if (authorContentType.VariesByCulture())
                {
                    IContent authors = contentService.Create(string.Empty, c, ArticulateConstants.ContentType.ArticulateAuthors);
                    authors.SetCultureName(ArticulateConstants.Convention.AuthorsDocument, defaultLang);
                    contentService.Save(authors);
                }
                else
                {
                    contentService.CreateAndSave(ArticulateConstants.Convention.AuthorsDocument, c, ArticulateConstants.ContentType.ArticulateAuthors);
                }
            }
        }
    }
}
