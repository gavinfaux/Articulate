#nullable enable
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Web.Common;

namespace Articulate.Services;

public interface IArticulateTagRepository
{
    public IEnumerable<string> GetAllCategories(IMasterModel masterModel);

    public IEnumerable<PostsByTagModel> GetContentByTags(UmbracoHelper helper, ITagQuery tagQuery, IMasterModel masterModel, string tagGroup, string baseUrlName);

    public PostsByTagModel GetContentByTag(UmbracoHelper helper, IMasterModel masterModel, string tag, string tagGroup, string baseUrlName, long page, long pageSize);
}
