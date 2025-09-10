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
            public const string ArticulateAuthors = "ArticulateAuthors";
            public const string ArticulateAuthor = "ArticulateAuthor";
            public const string ArticulateMarkdown = "ArticulateMarkdown";
            public const string ArticulatePost = "ArticulatePost";
            public const string ArticulateRichText = "ArticulateRichText";
        }

        public static class DataType
        {
            public const string ArticulateCategories = "ArticulateCategories";
            public const string ArticulateTags = "ArticulateTags";
            public const string ArticulateThemePicker = "ArticulateThemePicker";
            public const string ArticulateMarkdownEditor = "Articulate.MarkdownEditor";

            internal static readonly Guid ArticulateRichTextKey = new("DBCB0707-021D-4CD4-BA8B-5CC891516C28");
        }

        public static class Migration
        {
            public const string AutomaticPackageMigrationPlan = "Articulate";
            public const string ArticulatePackageMigrationPlan = "Articulate.Core";
        }

        public static class Convention
        {
            public const string Articulate = "Articulate";

            public const string ArticlesDocument = "Articles";
            public const string AuthorsDocument = "Authors";
        }

        internal static class Paths
        {
            internal const string SystemViewPath = "wwwroot/App_Plugins/Articulate";
            internal const string LegacyUserVirtualPath = "~/Views/ArticulateThemes";
            internal const string UserVirtualPath = "~/Views/Articulate";
            internal const string ThemesPath = "Themes";
            internal const string MarkdownEditorPath = "MarkdownEditor";
            internal const string PartialsPath = "Partials";
            internal const string ViewsPath = "Views";
            internal const string ViewPlaceHolder = "{0}.cshtml";

            internal const string ArticulateTemp = "Articulate/Temp";
        }

        public static class DefaultThemes
        {
            private const string Vapor = "VAPOR";
            private const string Material = "Material";
            private const string Phantom = "Phantom";
            private const string Mini = "Mini";
            private const string Aurora = "Aurora";

            public static readonly IEnumerable<string> AllThemeNames = [Aurora, Vapor, Material, Phantom, Mini];
        }
    }
}
