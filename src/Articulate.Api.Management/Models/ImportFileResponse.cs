#nullable enable
using System.ComponentModel.DataAnnotations;

namespace Articulate.Api.Management.Models
{
    /// <summary>
    /// Represents the response model for the BlogML post initialization.
    /// </summary>
    public class ImportFileResponse
    {
        /// <summary>
        /// Gets or sets the temporary file name used for the uploaded BlogML file.
        /// </summary>
        [Required(AllowEmptyStrings = false)]
        public required string TemporaryFileName { get; set; }

        /// <summary>
        /// Gets or sets the number of posts detected in the BlogML file.
        /// </summary>
        public int PostCount { get; set; }
    }
}
