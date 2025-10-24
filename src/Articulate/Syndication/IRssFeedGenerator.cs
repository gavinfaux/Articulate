#nullable enable
using System.ServiceModel.Syndication;

namespace Articulate.Syndication
{
    public interface IRssFeedGenerator
    {
        public SyndicationFeed GetFeed(IMasterModel rootPageModel, IEnumerable<PostModel> posts);
    }
}
