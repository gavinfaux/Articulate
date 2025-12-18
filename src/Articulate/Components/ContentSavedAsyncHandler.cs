#nullable enable
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Articulate.Components
{
    public class ContentSavedAsyncHandler : INotificationAsyncHandler<ContentSavedNotification>
    {
        private readonly IContentTypeService _contentTypeService;
        private readonly IContentService _contentService;
        private readonly ILanguageService _languageService;
        private readonly ILogger<ContentSavedAsyncHandler> _logger;

        public ContentSavedAsyncHandler(
            IContentTypeService contentTypeService,
            IContentService contentService,
            ILanguageService languageService,
            ILogger<ContentSavedAsyncHandler> logger)
        {
            _contentTypeService = contentTypeService;
            _contentService = contentService;
            _languageService = languageService;
            _logger = logger;
        }


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
                cancellationToken.ThrowIfCancellationRequested();

                bool hasArchive = ChildExists(c.Id, ArticulateConstants.ContentType.ArticulateArchive, cancellationToken);

                if (!hasArchive)
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

                cancellationToken.ThrowIfCancellationRequested();

                bool hasAuthors = ChildExists(c.Id, ArticulateConstants.ContentType.ArticulateAuthors, cancellationToken);
                if (hasAuthors)
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

        private bool ChildExists(int parentId, string contentTypeAlias, CancellationToken cancellationToken)
        {
            const int pageSize = 50;
            var pageIndex = 0;

            while (true)
            {
                cancellationToken.ThrowIfCancellationRequested();

                IEnumerable<IContent> page = _contentService.GetPagedChildren(parentId, pageIndex, pageSize, out var total);
                List<IContent> items = page?.ToList() ?? [];

                if (items.Any(x => x.ContentType.Alias == contentTypeAlias))
                {
                    return true;
                }

                if (items.Count == 0 || (pageIndex + 1) * pageSize >= total)
                {
                    return false;
                }

                pageIndex++;
            }
        }
    }
}
