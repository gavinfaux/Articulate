#nullable enable
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;

namespace Articulate.Services;

internal static class ArticulateMediaFolderResolver
{
    public static IMedia? Resolve(IUser user, IMediaService mediaService, Func<IMedia?> fallback)
    {
        foreach (int mediaId in (user.StartMediaIds ?? [])
                     .Concat(user.Groups?.Select(x => x.StartMediaId).OfType<int>() ?? []))
        {
            if (mediaId > 0 && mediaService.GetById(mediaId) is IMedia media)
            {
                return media;
            }
        }

        return fallback();
    }
}
