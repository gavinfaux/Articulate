#nullable enable
namespace Articulate.Options
{
    /// <summary>
    /// Articulate options that affect how articulate works
    /// </summary>
    public class ArticulateOptions
    {
        /// <summary>
        /// Constructor sets defaults
        /// </summary>
        public ArticulateOptions() =>
            GenerateExcerpt = val => val.DetectIsJson()
                ? string.Empty
                : val.StripHtml()
                    .DecodeHtml()
                    .NewLinesToSpaces()
                    .TruncateAtWord(200, string.Empty);

        /// <summary>
        /// Default is true and will generate an excerpt if it is blank, will be a truncated version based on the post content
        /// </summary>
        public bool AutoGenerateExcerpt { get; set; } = true;

        /// <summary>
        /// The default generator will truncate the post content with 200 chars
        /// </summary>
        public Func<string, string> GenerateExcerpt { get; set; }

        /// <summary>
        /// Default comments provider to use when none is specified via ViewData["CommentsProvider"].
        /// Supported values: <c>disqus</c> or <c>giscus</c>. Null/empty shows a placeholder.
        /// </summary>
        public string? DefaultCommentsProvider { get; set; }

        /// <summary>
        /// Provider-specific settings (optional). If present and DefaultCommentsProvider (or ViewData) selects the provider,
        /// Shared CommentsProvider can render a working embed without theme overrides.
        /// </summary>
        public DisqusOptions Disqus { get; set; } = new();

        public GiscusOptions Giscus { get; set; } = new();

        /// <summary>
        /// When true, Articulate content created during the installer is published automatically.
        /// </summary>
        public bool AutoPublishOnStartup { get; set; } = false;

    }

    public class DisqusOptions
    {
        /// <summary>
        /// Required when using Disqus. Set this to your Disqus site shortname (e.g., <c>contoso-blog</c>).
        /// </summary>
        public string? Shortname { get; set; }
    }

    public class GiscusOptions
    {
        /// <summary>
        /// Required when using Giscus. Owner/name of the repository that hosts the discussions.
        /// </summary>
        public string? Repo { get; set; }

        /// <summary>
        /// Required when using Giscus. The node ID of the repository (available in the Giscus onboarding UI).
        /// </summary>
        public string? RepoId { get; set; }

        /// <summary>
        /// Required when using Giscus. The discussion category slug configured for comments.
        /// </summary>
        public string? Category { get; set; }

        /// <summary>
        /// Required when using Giscus. The node ID of the category selected above.
        /// </summary>
        public string? CategoryId { get; set; }

        public string? Mapping { get; set; } = "pathname";

        public string? Theme { get; set; } = "light";

        public string? Lang { get; set; } = "en";

        public bool ReactionsEnabled { get; set; } = true;

        public bool EmitMetadata { get; set; } = false;

        public string? InputPosition { get; set; } = "bottom";
    }
}
