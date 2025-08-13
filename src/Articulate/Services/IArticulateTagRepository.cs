#nullable enable
using Articulate.Models;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Web.Common;

namespace Articulate.Services
{
    public interface IArticulateTagRepository
    {
        internal IEnumerable<string> GetAllCategories(IMasterModel masterModel);

        internal IEnumerable<PostsByTagModel> GetContentByTags(UmbracoHelper helper, ITagQuery tagQuery, IMasterModel masterModel, string tagGroup, string baseUrlName);

        internal PostsByTagModel GetContentByTag(UmbracoHelper helper, IMasterModel masterModel, string tag, string tagGroup, string baseUrlName, long page, long pageSize);
    }
}
