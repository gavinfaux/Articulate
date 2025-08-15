#nullable enable
using Articulate.Services;
using Microsoft.AspNetCore.Mvc.Razor;
using static Articulate.ArticulateConstants;

namespace Articulate.Components
{
    // This will first try to find the View in User themes, then in System themes.
    // User themes can override System themes (a Post.cshtml in User theme folder with the same name as a system theme will take precedence).

    /// <inheritdoc />
    internal class ArticulateViewLocationExpander(IArticulateThemeResolver themeResolver) : IViewLocationExpander
    {
        private const string ThemeKey = "articulate-theme";

        /// <inheritdoc />
        public void PopulateValues(ViewLocationExpanderContext context)
        {
            var themeName = themeResolver.GetCurrentThemeName() ?? string.Empty;
            context.Values[ThemeKey] = themeName;
        }

        /// <inheritdoc />
        public IEnumerable<string> ExpandViewLocations(ViewLocationExpanderContext context, IEnumerable<string> viewLocations)
        {
            if (!context.Values.TryGetValue(ThemeKey, out var themeName) || string.IsNullOrEmpty(themeName))
            {
                return viewLocations;
            }

            var partialPlaceHolder = Path.Combine(Paths.PartialsPath, Paths.ViewPlaceHolder);
            var themeLocations = new[]
            {
                // User themes take priority over system themes, allows overrides.
                // This needs documentation.
                // Override a pager to use infinite scrolling, just need to override the themes Pager.cshtml partial
                // Theming & styles, need to copy base theme to new theme as Views use Master from base theme.
                Path.Combine(Paths.UserVirtualPath,  themeName, Paths.ViewPlaceHolder),
                Path.Combine(Paths.UserVirtualPath,  themeName, partialPlaceHolder),

                // System themes
                Path.Combine(Paths.SystemViewPath, Paths.ThemesPath, themeName, Paths.ViewPlaceHolder),
                Path.Combine(Paths.SystemViewPath, Paths.ThemesPath, themeName, partialPlaceHolder),

                // MarkdownEditor has no theme, but routed via Articulate root node, so themeName found.
                Path.Combine(Paths.SystemViewPath, Paths.MarkdownEditorPath, Paths.ViewPlaceHolder)
            };

            IEnumerable<string> locations = themeLocations.Concat(viewLocations);

            return locations;
        }
    }
}
