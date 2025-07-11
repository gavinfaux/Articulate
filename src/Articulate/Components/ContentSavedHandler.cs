using System;
using System.Linq;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Extensions;

namespace Articulate.Components
{
    
    public class ContentSavedHandler(
        IContentTypeService contentTypeService,
        IContentService contentService,
        ILocalizationService languageService)
        : INotificationHandler<ContentSavedNotification>
    {
        void INotificationHandler<ContentSavedNotification>.Handle(ContentSavedNotification notification)
        {
            var e = notification;

            foreach (var c in e.SavedEntities)
            {
                if (!c.WasPropertyDirty("Id") ||
                    !c.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate))
                {
                    continue;
                }

                //it's a root blog node, set up the required sub nodes (archive , authors) if they don't exist

                var defaultLang = languageService.GetDefaultLanguageIsoCode();

                var children = contentService.GetPagedChildren(c.Id, 0, 10, out var total).ToList();
                if (total == 0 || children.All(x =>
                        x.ContentType.Alias != ArticulateConstants.ContentType.ArticulateArchive))
                {
                    var archiveContentType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive);
                    if (archiveContentType != null)
                    {
                        if (archiveContentType.VariesByCulture())
                        {
                            var articles = contentService.Create("", c,
                                ArticulateConstants.ContentType.ArticulateArchive);
                            articles.SetCultureName(ArticulateConstants.Convention.ArticlesDocument, defaultLang);
                            contentService.Save(articles);
                        }
                        else
                        {
                            contentService.CreateAndSave(
                                ArticulateConstants.Convention.ArticlesDocument, c,
                                ArticulateConstants.ContentType.ArticulateArchive);
                        }
                    }
                }

                if (total == 0 || children.All(x =>
                        x.ContentType.Alias != ArticulateConstants.ContentType.ArticulateAuthors))
                {
                    var authorContentType = contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthors);
                    if (authorContentType != null)
                    {
                        if (authorContentType.VariesByCulture())
                        {
                            var authors = contentService.Create("", c,
                                ArticulateConstants.ContentType.ArticulateAuthors);
                            authors.SetCultureName(ArticulateConstants.Convention.ArticlesDocument, defaultLang);
                            contentService.Save(authors);
                        }
                        else
                        {
                            contentService.CreateAndSave(ArticulateConstants.Convention.ArticlesDocument,
                                c, ArticulateConstants.ContentType.ArticulateAuthors);
                        }
                    }
                }
            }
        }
    }
}
