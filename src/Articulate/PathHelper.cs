#nullable enable
using Articulate.Models;
using Microsoft.AspNetCore.Http;

namespace Articulate
{
    /// <summary>
    /// A helper class for resolving theme-related folder paths.
    /// This class knows nothing about views or .cshtml files; ArticulateViewLocationExpander deals with that.
    /// </summary>
    public static class PathHelper
    {
        public const string VirtualThemePath = "~/App_Plugins/Articulate/Themes";
        public const string UserVirtualThemePath = "~/Views/ArticulateThemes";

        /// <summary>
        /// Returns the root virtual path for a given theme.
        /// e.g., "~/App_Plugins/Articulate/Themes/VAPOR"
        /// </summary>
        public static string GetThemePath(string themeName)
        {
            if (string.IsNullOrEmpty(themeName))
            {
                throw new ArgumentException($"'{nameof(themeName)}' cannot be null or empty.", nameof(themeName));
            }

            // check if it's a built-in theme or a user theme.
            return DefaultThemes.IsDefaultTheme(themeName)
                ? $"{VirtualThemePath}/{themeName}"
                : $"{UserVirtualThemePath}/{themeName}";
        }

        // This overload now just a pass-through
        public static string GetThemePath(IMasterModel model) => GetThemePath(model.Theme);

        /// <summary>
        /// Get the full domain of the current page. Still needed for absolute URLs in social meta tags.
        /// </summary>
        public static string GetDomain(HttpRequest request) => $"{request.Scheme}{Uri.SchemeDelimiter}{request.Host.Value}";
    }
}
