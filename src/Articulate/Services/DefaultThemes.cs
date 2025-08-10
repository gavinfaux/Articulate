#nullable enable
using Smidge;
using static Articulate.ArticulateConstants;

namespace Articulate.Services
{
    internal static class DefaultThemes
    {

        private static readonly IReadOnlyDictionary<string, DefaultTheme> _sDefaultThemes
            = new Dictionary<string, DefaultTheme>(StringComparer.InvariantCultureIgnoreCase)
            {
                [Vapor.Name] = new Vapor(),
                [Material.Name] = new Material(),
                [Phantom.Name] = new Phantom(),
                [Mini.Name] = new Mini(),
            };

        /// <summary>
        /// Returns the root virtual path for a given theme.
        /// e.g., “~/Views/Articulate/_System/Themes/VAPOR”.
        /// </summary>
        private static string GetThemePath(this string themeName)
        {
            if (string.IsNullOrEmpty(themeName))
            {
                throw new ArgumentException($"'{nameof(themeName)}' cannot be null or empty.", nameof(themeName));
            }

            return Path.Combine(Paths.SystemVirtualPath, Paths.ThemesPath, themeName);
        }

        internal static DefaultTheme[] AllThemes { get; } = _sDefaultThemes.Values.ToArray();

        internal static IEnumerable<string> AllThemeNames => _sDefaultThemes.Keys;

        public abstract class DefaultTheme
        {
            public abstract void CreateBundles(IBundleManager bundleManager);

            protected static string RequiredThemedCssFolder(string theme)
                => Path.Combine(theme.GetThemePath(), Paths.CssPath);

            protected static string RequiredThemedJsFolder(string theme)
                => Path.Combine(theme.GetThemePath(), Paths.JsPath);
        }

        private class Vapor : DefaultTheme
        {
            public const string Name = "VAPOR";

            public override void CreateBundles(IBundleManager bundleManager)
            {
                _ = bundleManager.CreateCss("articulate-vapor-css", RequiredThemedCssFolder(Name));
                _ = bundleManager.CreateJs("articulate-vapor-js", RequiredThemedJsFolder(Name));
            }
        }

        private class Material : DefaultTheme
        {
            public const string Name = "Material";

            public override void CreateBundles(IBundleManager bundleManager)
            {
                _ = bundleManager.CreateCss("articulate-material-css", RequiredThemedCssFolder(Name));
                _ = bundleManager.CreateJs("articulate-material-js", RequiredThemedJsFolder(Name));
            }
        }

        private class Phantom : DefaultTheme
        {
            public const string Name = "Phantom";

            public override void CreateBundles(IBundleManager bundleManager)
            {
                _ = bundleManager.CreateCss("articulate-phantom-css", RequiredThemedCssFolder(Name));
                _ = bundleManager.CreateJs("articulate-phantom-js", RequiredThemedJsFolder(Name));
            }
        }

        private class Mini : DefaultTheme
        {
            public const string Name = "Mini";

            public override void CreateBundles(IBundleManager bundleManager)
            {
                _ = bundleManager.CreateCss("articulate-mini-css", RequiredThemedCssFolder(Name));
                _ = bundleManager.CreateJs("articulate-mini-js", RequiredThemedJsFolder(Name));
            }
        }
    }
}
