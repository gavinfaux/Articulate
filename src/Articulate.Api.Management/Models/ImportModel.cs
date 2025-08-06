#nullable enable
using System.ComponentModel.DataAnnotations;

namespace Articulate.Api.Management.Models
{
    /// <summary>
    /// Represents the options for importing blog data from a BlogML file.
    /// </summary>
    public class ImportModel
    {
        /// <summary>
        /// Gets or sets the unique identifier of the Articulate node to import into.
        /// </summary>
        [Required]
        public Guid ArticulateBlogNode { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to overwrite existing posts during import.
        /// </summary>
        public bool Overwrite { get; set; }

        /// <summary>
        /// Gets or sets the regular expression pattern to match in post content during import.
        /// </summary>
        public string? RegexMatch { get; set; }

        /// <summary>
        /// Gets or sets the replacement string for the regular expression match in post content.
        /// </summary>
        public string? RegexReplace { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to publish imported posts.
        /// </summary>
        public bool Publish { get; set; }

        /// <summary>
        /// Gets or sets the temporary file name of the uploaded BlogML file.
        /// </summary>
        [Required(AllowEmptyStrings = false)]
        public required string TempFile { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to export Disqus XML after import.
        /// </summary>
        public bool ExportDisqusXml { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to import the first image found in each post.
        /// </summary>
        public bool ImportFirstImage { get; set; }
    }
}
