#nullable enable
namespace Articulate
{
    public static class ArticulateConstants
    {
        internal const string RefreshRoutesToken = "articulate-refresh-routes";

        public static class ContentType
        {
            public const string Articulate = "Articulate";
            public const string ArticulateArchive = "ArticulateArchive";
            public const string ArticulateAuthor = "ArticulateAuthor";
            public const string ArticulateAuthors = "ArticulateAuthors";
            public const string ArticulateMarkdown = "ArticulateMarkdown";
            public const string ArticulatePost = "ArticulatePost";
            public const string ArticulateRichText = "ArticulateRichText";
        }

        public static class Convention
        {
            public const string ArticlesDocument = "Articles";
            public const string Articulate = "Articulate";
            public const string AuthorsDocument = "Authors";
        }

        public static class DataType
        {
            public const string ArticulateCategories = "ArticulateCategories";
            public const string ArticulateMarkdownEditor = "Articulate.MarkdownEditor";
            public const string ArticulateTags = "ArticulateTags";
            public const string ArticulateThemePicker = "ArticulateThemePicker";

            internal static readonly Guid _articulateRichTextKey = new("DBCB0707-021D-4CD4-BA8B-5CC891516C28");
        }

        public static class DefaultThemes
        {
            public static readonly IEnumerable<string> AllThemeNames = [Aurora, Vapor, Material, Phantom, Mini];

            private const string Aurora = "Aurora";
            private const string Material = "Material";
            private const string Mini = "Mini";
            private const string Phantom = "Phantom";
            private const string Vapor = "VAPOR";
        }

        public static class Migration
        {
            public const string ArticulatePackageMigrationPlan = "Articulate.Core";
            public const string AutomaticPackageMigrationPlan = "Articulate";
        }

        internal static class Paths
        {
            internal const string ArticulateTemp = "Articulate/Temp";

            /// <summary>
            ///     Virtual (application-relative) base path for system assets and views.
            ///     Preferred for Razor view resolution. Example: ~/App_Plugins/Articulate/Themes/{Theme}/...
            /// </summary>
            internal const string LayoutSystemVirtualPath = "~/App_Plugins/Articulate";

            internal const string MarkdownEditorPath = "MarkdownEditor";
            internal const string PartialsPath = "Partials";

            /// <summary>
            ///     Content-root base path for system views (alias for SystemViewPath).
            /// </summary>
            internal const string SystemViewContentRoot = SystemViewPath;

            /// <summary>
            ///     Content-root (physical) base path under the project root for system assets and views.
            ///     Example: wwwroot/App_Plugins/Articulate/Themes/{Theme}/...
            /// </summary>
            internal const string SystemViewPath = "wwwroot/App_Plugins/Articulate";

            /// <summary>
            ///     Virtual base path for system views (alias for LayoutSystemVirtualPath).
            /// </summary>
            internal const string SystemViewVirtualRoot = LayoutSystemVirtualPath;

            internal const string ThemesPath = "Themes";

            /// <summary>
            ///     Virtual base path for user themes (alias for UserVirtualPath).
            /// </summary>
            internal const string UserViewVirtualRoot = UserVirtualPath;

            /// <summary>
            ///     Virtual base path for user themes. Example: ~/Views/ArticulateThemes/{Theme}/...
            /// </summary>
            internal const string UserVirtualPath = "~/Views/ArticulateThemes";

            internal const string ViewPlaceHolder = "{0}.cshtml";
            internal const string ViewsPath = "Views";
        }
    }
}
