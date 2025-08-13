#nullable enable
using System.ServiceModel.Syndication;
using Articulate.Models;

namespace Articulate.Syndication
{
    public interface IRssFeedGenerator
    {
        internal SyndicationFeed GetFeed(IMasterModel rootPageModel, IEnumerable<PostModel> posts);
    }
}
