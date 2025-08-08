#nullable enable
using Articulate.Models;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common;

namespace Articulate.Services
{
    public class ArticulateTagService(
        IArticulateTagRepository repository,
        ICoreScopeProvider provider,
        ILoggerFactory loggerFactory,
        IEventMessagesFactory eventMessagesFactory)
        : RepositoryService(provider, loggerFactory, eventMessagesFactory)
    {
        // TODO: Wrap the repo

        public IEnumerable<PostsByTagModel> GetContentByTags(
            UmbracoHelper helper,
            ITagQuery tagQuery,
            IMasterModel masterModel,
            string tagGroup,
            string baseUrlName)
        {
            using (ScopeProvider.CreateCoreScope(autoComplete: true))
            {
                return repository.GetContentByTags(
                    helper,
                    tagQuery,
                    masterModel,
                    tagGroup,
                    baseUrlName);
            }
        }

        public PostsByTagModel GetContentByTag(
            UmbracoHelper helper,
            IMasterModel masterModel,
            string tag,
            string tagGroup,
            string baseUrlName,
            long page,
            long pageSize)
        {
            using (ScopeProvider.CreateCoreScope(autoComplete: true))
            {
                return repository.GetContentByTag(
                    helper,
                    masterModel,
                    tag,
                    tagGroup,
                    baseUrlName,
                    page,
                    pageSize);
            }
        }

        public IEnumerable<string> GetAllCategories(
            IMasterModel masterModel)
        {
            using (ScopeProvider.CreateCoreScope(autoComplete: true))
            {
                return repository.GetAllCategories(masterModel);
            }
        }
    }
}
