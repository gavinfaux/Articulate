using System.ComponentModel.DataAnnotations;

namespace Articulate.Models.ManagmentApi
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
        public string TemporaryFileName { get; set; }

        /// <summary>
        /// Gets or sets the number of posts detected in the BlogML file.
        /// </summary>
        public int PostCount { get; set; }
    }
}
