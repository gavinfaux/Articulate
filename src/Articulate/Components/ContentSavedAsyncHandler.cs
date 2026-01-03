#nullable enable
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Articulate.Components
{
    public class ContentSavedAsyncHandler(
        IContentTypeService contentTypeService,
        IContentService contentService,
        ILanguageService languageService,
        ILogger<ContentSavedAsyncHandler> logger)
        : INotificationAsyncHandler<ContentSavedNotification>
    {
        /// <inheritdoc/>
        public async Task HandleAsync(ContentSavedNotification notification, CancellationToken cancellationToken)
        {
            foreach (IContent c in notification.SavedEntities)
            {
                if (!c.WasPropertyDirty("Id") ||
                    !c.ContentType.Alias.InvariantEquals(ArticulateConstants.ContentType.Articulate))
                {
                    continue;
                }

                // it's a root blog node, set up the required sub nodes (archive , authors) if they don't exist
                var defaultLang = await languageService.GetDefaultIsoCodeAsync();
                cancellationToken.ThrowIfCancellationRequested();

                await EnsureChildNodeExistsAsync(
                    c,
                    ArticulateConstants.ContentType.ArticulateArchive,
                    ArticulateConstants.Convention.ArticlesDocument,
                    defaultLang,
                    cancellationToken);

                cancellationToken.ThrowIfCancellationRequested();

                await EnsureChildNodeExistsAsync(
                    c,
                    ArticulateConstants.ContentType.ArticulateAuthors,
                    ArticulateConstants.Convention.AuthorsDocument,
                    defaultLang,
                    cancellationToken);
            }
        }

        private Task<bool> EnsureChildNodeExistsAsync(
            IContent parent,
            string contentTypeAlias,
            string documentName,
            string defaultLang,
            CancellationToken cancellationToken)
        {
            if (ChildExists(parent.Id, contentTypeAlias, cancellationToken))
            {
                return Task.FromResult(true);
            }

            IContentType? contentType = contentTypeService.Get(contentTypeAlias);
            if (contentType is null)
            {
                logger.LogWarning(
                    "Content type {ContentTypeAlias} not found when ensuring child for parent {ParentId}",
                    contentTypeAlias,
                    parent.Id);
                return Task.FromResult(false);
            }

            IContent child = contentService.Create(string.Empty, parent, contentTypeAlias);
            if (contentType.VariesByCulture())
            {
                child.SetCultureName(documentName, defaultLang);
            }
            else
            {
                child.Name = documentName;
            }

            OperationResult saveResult = contentService.Save(child);
            if (!saveResult.Success)
            {
                // Mitigate race: if another request created it after our initial check, skip without error.
                if (ChildExists(parent.Id, contentTypeAlias, cancellationToken))
                {
                    return Task.FromResult(true);
                }

                logger.LogError(
                    "Failed to save {ContentType} node for parent {ParentId}: {SaveResult}",
                    contentTypeAlias,
                    parent.Id,
                    saveResult);
                return Task.FromResult(false);
            }

            return Task.FromResult(true);
        }

        private bool ChildExists(int parentId, string contentTypeAlias, CancellationToken cancellationToken)
        {
            const int pageSize = 50;
            var pageIndex = 0;

            var contentTypeId = contentTypeService.Get(contentTypeAlias)?.Id;
            if (contentTypeId is null)
            {
                return false;
            }

            while (true)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    IEnumerable<IContent> page =
                        contentService.GetPagedChildren(parentId, pageIndex, pageSize, out var total);
                    List<IContent> items = page.ToList() ?? [];

                    if (items.Any(x => x.ContentTypeId == contentTypeId))
                    {
                        return true;
                    }

                    if (items.Count == 0 || (pageIndex + 1) * pageSize >= total)
                    {
                        return false;
                    }

                    pageIndex++;
                }
                catch (Exception ex)
                {
                    logger.LogError(
                        ex,
                        "Error checking if child exists for parent {ParentId} with type {ContentTypeAlias}",
                        parentId,
                        contentTypeAlias);
                    return false; // Assume doesn't exist to allow creation attempt
                }
            }
        }
    }
}
