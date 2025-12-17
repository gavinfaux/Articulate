#nullable enable
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Articulate.Components
{
    public class ContentSavedHandler : INotificationAsyncHandler<ContentSavedNotification>
    {
        private readonly IContentTypeService _contentTypeService;
        private readonly IContentService _contentService;
        private readonly ILanguageService _languageService;
        private readonly ILogger<ContentSavedHandler> _logger;

        public ContentSavedHandler(
            IContentTypeService contentTypeService,
            IContentService contentService,
            ILanguageService languageService,
            ILogger<ContentSavedHandler> logger)
        {
            _contentTypeService = contentTypeService;
            _contentService = contentService;
            _languageService = languageService;
            _logger = logger;
        }

        // TODO: Review
        /// <inheritdoc/>
        public async Task HandleAsync(ContentSavedNotification notification, CancellationToken cancellationToken)
        {
            foreach (IContent c in notification.SavedEntities)
            {
                if (!c.WasPropertyDirty("Id") || !c.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate))
                {
                    continue;
                }

                // it's a root blog node, set up the required sub nodes (archive , authors) if they don't exist
                var defaultLang = await _languageService.GetDefaultIsoCodeAsync().ConfigureAwait(false);
                var children = _contentService.GetPagedChildren(c.Id, 0, 10, out var total).ToList();

                if (total == 0 || children.All(x => x.ContentType.Alias != ArticulateConstants.ContentType.ArticulateArchive))
                {
                    IContentType? archiveContentType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateArchive);
                    if (archiveContentType is not null)
                    {
                        IContent articles = _contentService.Create(string.Empty, c, ArticulateConstants.ContentType.ArticulateArchive);
                        if (archiveContentType.VariesByCulture())
                        {
                            articles.SetCultureName(ArticulateConstants.Convention.ArticlesDocument, defaultLang);
                        }
                        else
                        {
                            articles.Name = ArticulateConstants.Convention.ArticlesDocument;
                        }

                        OperationResult saveResult = _contentService.Save(articles);
                        if (!saveResult.Success)
                        {
                            _logger.LogError("Failed to save articles node: {SaveResult}", saveResult);
                            throw new InvalidOperationException($"Failed to save articles node: {saveResult}");
                        }
                    }
                }

                if (total != 0 && children.Any(x => x.ContentType.Alias == ArticulateConstants.ContentType.ArticulateAuthors))
                {
                    continue;
                }

                IContentType? authorContentType = _contentTypeService.Get(ArticulateConstants.ContentType.ArticulateAuthors);
                if (authorContentType is null)
                {
                    continue;
                }

                IContent authors = _contentService.Create(string.Empty, c, ArticulateConstants.ContentType.ArticulateAuthors);
                if (authorContentType.VariesByCulture())
                {
                    authors.SetCultureName(ArticulateConstants.Convention.AuthorsDocument, defaultLang);
                }
                else
                {
                    authors.Name = ArticulateConstants.Convention.AuthorsDocument;
                }

                OperationResult authorSaveResult = _contentService.Save(authors);
                if (!authorSaveResult.Success)
                {
                    _logger.LogError("Failed to save authors node: {SaveResult}", authorSaveResult);
                    throw new InvalidOperationException($"Failed to save authors node: {authorSaveResult}");
                }
            }
        }
    }
}
