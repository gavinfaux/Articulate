#nullable enable
using Paths = Articulate.ArticulateConstants.Paths;

namespace Articulate.Services
{
    internal sealed class DefaultArticulateViewLocationProvider : IArticulateViewLocationProvider
    {
        public IEnumerable<string> GetLocations(string themeName)
        {
            if (string.IsNullOrWhiteSpace(themeName))
            {
                return [];
            }

            var locations = new List<string>
            {
                // User themes (new structure with Views subfolder)
                BuildPath(Paths.UserThemesRoot, themeName, Paths.Views, Paths.ViewPlaceholder),
                BuildPath(Paths.UserThemesRoot, themeName, Paths.Views, Paths.Partials, Paths.ViewPlaceholder),

                // Built-in themes (new location outside wwwroot)
                BuildPath(Paths.ArticulateRoot, Paths.Themes, themeName, Paths.Views, Paths.ViewPlaceholder),
                BuildPath(Paths.ArticulateRoot, Paths.Themes, themeName, Paths.Views, Paths.Partials, Paths.ViewPlaceholder),

                // BACKWARD COMPATIBILITY: Old user theme structure (v5.x)
                // TODO: Remove in v7.0
                BuildPath(Paths.UserThemesRoot, themeName, Paths.ViewPlaceholder),
                BuildPath(Paths.UserThemesRoot, themeName, Paths.Partials, Paths.ViewPlaceholder),

                // MarkdownEditor
                BuildPath(Paths.ArticulateRoot, Paths.MarkdownEditor, Paths.Views, Paths.ViewPlaceholder)
            };

            return locations.Distinct();
        }

        /// <summary>
        /// Combines path segments and forces Forward Slashes for Razor View Engine compatibility.
        /// Ensure the result starts with "/" to denote application root relative.
        /// </summary>
        private static string BuildPath(params string[] parts)
        {
            var combined = Path.Combine(parts);

            var webPath = combined.Replace('\\', '/');

            return webPath.StartsWith('/') ? webPath : "/" + webPath;
        }
    }
}
