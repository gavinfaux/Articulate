#nullable enable

namespace Articulate.Options
{
    /// <summary>
    /// Articulate options that affect how articulate works
    /// </summary>
    public class ArticulateOptions
    {

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
        /// When true, Articulate content created during the installer is published automatically.
        /// Default: false.
        /// </summary>
        public bool AutoPublishOnStartup { get; set; } = false;
    }

}
