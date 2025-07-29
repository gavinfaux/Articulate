//TODO: #nullable enable
using Articulate.Models;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Extensions;

namespace Articulate
{
    public static class UrlHelperExtensions
    {
        /// <summary>
        /// Returns the url of a themed asset
        /// </summary>
        /// <param name="url"></param>
        /// <param name="model"></param>
        /// <param name="relativeAssetPath"></param>
        /// <returns></returns>
        public static string ThemedAsset(this IUrlHelper url, IMasterModel model, string relativeAssetPath) => url.Content(PathHelper.GetThemePath(model)).EnsureEndsWith('/') + "assets/" + relativeAssetPath;
    }
}
