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

        /// <summary>
        /// Maximum number of bytes allowed when downloading an external image for import.
        /// Default: 10 MB.
        /// </summary>
        public long MaxExternalImageBytes { get; set; } = 10 * 1024 * 1024;

        /// <summary>
        /// Explicit allowlist of external hosts that Articulate may fetch images from during BlogML import.
        /// If empty, external image downloads are disabled.
        /// </summary>
        public string[] AllowedMediaHosts { get; set; } = [];

        /// <summary>
        /// When true, allows localhost/private-network external image downloads during non-production Umbraco runtime modes.
        /// This setting is ignored when Umbraco:CMS:Runtime:Mode is Production.
        /// Default: false.
        /// </summary>
        public bool AllowUnsafeLocalExternalImageHostsInDevelopment { get; set; } = false;
    }

}
