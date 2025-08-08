#nullable enable
using Smidge;

namespace Articulate
{
    public static class DefaultThemes
    {
        private static readonly IReadOnlyDictionary<string, DefaultTheme> _sDefaultThemes
            = new Dictionary<string, DefaultTheme>(StringComparer.InvariantCultureIgnoreCase)
            {
                [Vapor.Name] = new Vapor(),
                [Material.Name] = new Material(),
                [Phantom.Name] = new Phantom(),
                [Mini.Name] = new Mini(),
            };

        public static DefaultTheme[] AllThemes { get; } = _sDefaultThemes.Values.ToArray();

        public static IEnumerable<string> AllThemeNames => _sDefaultThemes.Keys;

        public static bool IsDefaultTheme(string themeName)
            => _sDefaultThemes.ContainsKey(themeName);

        public abstract class DefaultTheme
        {
            public abstract void CreateBundles(IBundleManager bundleManager);

            protected static string RequiredThemedCssFolder(string theme)
                => Path.Combine(PathHelper.GetThemePath(theme), "assets/css/**/*.css");

            protected static string RequiredThemedJsFolder(string theme)
                => Path.Combine(PathHelper.GetThemePath(theme), "assets/js/**/*.js");
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
