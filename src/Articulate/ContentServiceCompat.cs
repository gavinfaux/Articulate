#nullable enable
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Persistence.Querying;
using Umbraco.Cms.Core.Services;

namespace Articulate
{
    internal static class ContentServiceCompat
    {
        internal static IEnumerable<IContent> GetPagedChildrenCompat(
            this IContentService contentService,
            int id,
            long pageIndex,
            int pageSize,
            out long totalRecords,
            IQuery<IContent>? filter = null,
            Ordering? ordering = null)
        {
#if NET10_0_OR_GREATER
            return contentService.GetPagedChildren(
                id,
                pageIndex,
                pageSize,
                out totalRecords,
                propertyAliases: null,
                filter,
                ordering,
                loadTemplates: true);
#else
            return contentService.GetPagedChildren(
                id,
                pageIndex,
                pageSize,
                out totalRecords,
                filter,
                ordering);
#endif
        }
    }
}
