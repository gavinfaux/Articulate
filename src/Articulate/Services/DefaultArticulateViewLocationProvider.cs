#nullable enable
using Paths = Articulate.ArticulateConstants.Paths;

namespace Articulate.Services
{
    public sealed class DefaultArticulateViewLocationProvider : IArticulateViewLocationProvider
    {
        public IEnumerable<string> GetLocations(string themeName)
        {
            // Build ordered list of search locations. We include both virtual and content-root system paths.
            var partialPlaceHolder = PathHelper.JoinVirtual(Paths.PartialsPath, Paths.ViewPlaceHolder);
            var viewsPlaceHolder = PathHelper.JoinVirtual(Paths.ViewsPath, Paths.ViewPlaceHolder);

            var userRoot = Paths.UserViewVirtualRoot; // prefer new clarified names
            var legacyUserRoot = Paths.LegacyUserViewVirtualRoot;
            var systemVirtualRoot = Paths.SystemViewVirtualRoot;
            var systemContentRoot = Paths.SystemViewContentRoot;
            var themes = Paths.ThemesPath;
            var markdownEditor = Paths.MarkdownEditorPath;

            IEnumerable<string> locations =
            [

                // User theme (virtual)
                PathHelper.JoinVirtual(userRoot, themeName, Paths.ViewPlaceHolder),
                PathHelper.JoinVirtual(userRoot, themeName, viewsPlaceHolder),
                PathHelper.JoinVirtual(userRoot, themeName, partialPlaceHolder),

                // Legacy user theme (virtual)
                PathHelper.JoinVirtual(legacyUserRoot, themeName, Paths.ViewPlaceHolder),
                PathHelper.JoinVirtual(legacyUserRoot, themeName, viewsPlaceHolder),
                PathHelper.JoinVirtual(legacyUserRoot, themeName, partialPlaceHolder),

                // System theme (virtual)
                PathHelper.JoinVirtual(systemVirtualRoot, themes, themeName, Paths.ViewPlaceHolder),
                PathHelper.JoinVirtual(systemVirtualRoot, themes, themeName, viewsPlaceHolder),
                PathHelper.JoinVirtual(systemVirtualRoot, themes, themeName, partialPlaceHolder),

                // System theme (content-root)
                PathHelper.JoinContentRoot(systemContentRoot, themes, themeName, Paths.ViewPlaceHolder),
                PathHelper.JoinContentRoot(systemContentRoot, themes, themeName, viewsPlaceHolder),
                PathHelper.JoinContentRoot(systemContentRoot, themes, themeName, partialPlaceHolder),

                // Shared base theme fallback (system) - virtual
                PathHelper.JoinVirtual(systemVirtualRoot, themes, "Shared", Paths.ViewPlaceHolder),
                PathHelper.JoinVirtual(systemVirtualRoot, themes, "Shared", viewsPlaceHolder),
                PathHelper.JoinVirtual(systemVirtualRoot, themes, "Shared", partialPlaceHolder),

                // Shared base theme fallback (system) - content-root
                PathHelper.JoinContentRoot(systemContentRoot, themes, "Shared", Paths.ViewPlaceHolder),
                PathHelper.JoinContentRoot(systemContentRoot, themes, "Shared", viewsPlaceHolder),
                PathHelper.JoinContentRoot(systemContentRoot, themes, "Shared", partialPlaceHolder),

                // MarkdownEditor (virtual)
                PathHelper.JoinVirtual(systemVirtualRoot, markdownEditor, Paths.ViewPlaceHolder),

                // MarkdownEditor (content-root)
                PathHelper.JoinContentRoot(systemContentRoot, markdownEditor, Paths.ViewPlaceHolder)
            ];

            return locations.Where(s => !string.IsNullOrWhiteSpace(s));
        }
    }
}
