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
        /// Supported values: disqus, giscus, utterances, hyvor, isso. Null/empty shows a placeholder.
        /// </summary>
        public string? DefaultCommentsProvider { get; set; }

        /// <summary>
        /// Provider-specific settings (optional). If present and DefaultCommentsProvider (or ViewData) selects the provider,
        /// Shared CommentsProvider can render a working embed without theme overrides.
        /// </summary>
        public DisqusOptions Disqus { get; set; } = new();
        public GiscusOptions Giscus { get; set; } = new();
        public UtterancesOptions Utterances { get; set; } = new();
        public HyvorOptions Hyvor { get; set; } = new();
        public IssoOptions Isso { get; set; } = new();
    }

    public class DisqusOptions
    {
        public string? Shortname { get; set; }
    }

    public class GiscusOptions
    {
        public string? Repo { get; set; }
        public string? RepoId { get; set; }
        public string? Category { get; set; }
        public string? CategoryId { get; set; }
        public string? Mapping { get; set; } = "pathname";
        public string? Theme { get; set; } = "light";
        public string? Lang { get; set; } = "en";
        public bool ReactionsEnabled { get; set; } = true;
        public bool EmitMetadata { get; set; } = false;
        public string? InputPosition { get; set; } = "bottom";
    }

    public class UtterancesOptions
    {
        public string? Repo { get; set; }
        public string? IssueTerm { get; set; } = "pathname";
        public string? Label { get; set; } = "comment";
        public string? Theme { get; set; } = "github-light";
    }

    public class HyvorOptions
    {
        public int? Website { get; set; }
        public string? Host { get; set; } // optional self-host
    }

    public class IssoOptions
    {
        public string? Host { get; set; }
    }
}
