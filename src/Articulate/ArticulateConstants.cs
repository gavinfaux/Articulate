#nullable enable
namespace Articulate;

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
        public const string AriculateThemePicker = "ArticulateThemePicker.UI";
        public const string ArticulateMarkdownEditor = "Articulate.MarkdownEditor";
    }
    public static class Convention
    {
        public const string Articulate = "Articulate";

        public const string ArticlesDocument = "Articles";
        public const string AuthorsDocument = "Authors";
    }

    public static class Paths
    {
        internal const string SystemViewPath = "wwwroot/App_Plugins/Articulate";
        internal const string UserVirtualPath = "~/Views/Articulate";
        internal const string ThemesPath = "Themes";
        internal const string MarkdownEditorPath = "MarkdownEditor";
        internal const string PartialsPath = "Partials";
        internal const string ViewPlaceHolder = "{0}.cshtml";

        internal const string ArticulateTemp = "Articulate/Temp";
    }

    public static class DefaultThemes
    {
        private const string Vapor = "VAPOR";
        private const string Material = "Material";
        private const string Phantom = "Phantom";
        private const string Mini = "Mini";

        public static readonly IEnumerable<string> AllThemeNames = [Vapor, Material, Phantom, Mini];
    }
}
