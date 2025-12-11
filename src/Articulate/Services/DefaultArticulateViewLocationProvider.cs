#nullable enable
using Paths = Articulate.ArticulateConstants.Paths;

namespace Articulate.Services
{

    public sealed class DefaultArticulateViewLocationProvider : IArticulateViewLocationProvider
    {


        public IEnumerable<string> GetLocations(string themeName)
        {
            var searchRoots = new[]
            {
                Paths.ArticulateRoot,
                Path.Combine("wwwroot", Paths.ArticulateRoot)
            };

            var locations = new List<string>
            {
                BuildPath(Paths.UserThemesRoot, themeName, Paths.Views, Paths.ViewPlaceholder),
                BuildPath(Paths.UserThemesRoot, themeName, Paths.Views, Paths.Partials, Paths.ViewPlaceholder)
            };

            foreach (var root in searchRoots)
            {
                locations.Add(BuildPath(root, Paths.Themes, themeName, Paths.Views, Paths.ViewPlaceholder));
                locations.Add(BuildPath(root, Paths.Themes, themeName, Paths.Views, Paths.Partials,
                    Paths.ViewPlaceholder));

                locations.Add(BuildPath(root, Paths.MarkdownEditor, Paths.Views, Paths.ViewPlaceholder));
            }

            return locations.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct();
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
