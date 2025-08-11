#nullable enable
using Articulate.Services;
using Microsoft.AspNetCore.Mvc.Razor;
using static Articulate.ArticulateConstants;

namespace Articulate.Components
{
    // This will first try to find the View in User themes, then in System themes.

    /// <inheritdoc />
    public class ArticulateViewLocationExpander(IArticulateThemeResolver themeResolver) : IViewLocationExpander
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
                // User themes
                Path.Combine(Paths.UserVirtualPath,  themeName, Paths.ViewPlaceHolder),
                Path.Combine(Paths.UserVirtualPath,  themeName, partialPlaceHolder),

                // System themes
                Path.Combine(Paths.SystemViewPath, Paths.ThemesPath, themeName, Paths.ViewPlaceHolder),
                Path.Combine(Paths.SystemViewPath, Paths.ThemesPath, themeName, partialPlaceHolder),

                // MarkdownEditor has no theme, but routed via Articulate root node, so themeName found
                Path.Combine(Paths.SystemViewPath, Paths.MarkdownEditorPath, Paths.ViewPlaceHolder)
            };

            IEnumerable<string> locations = themeLocations.Concat(viewLocations);

            return locations;
        }
    }
}
