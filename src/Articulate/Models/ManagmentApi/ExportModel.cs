using System;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace Articulate.Models.ManagmentApi
{
    /// <summary>
    /// Represents the options for exporting blog data in BlogML format.
    /// </summary>
    [DataContract]
    public class ExportModel
    {
        /// <summary>
        /// Gets or sets the unique identifier of the Articulate node to export.
        /// </summary>
        [Required]
        public Guid ArticulateBlogNode { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether images should be exported as Base64-encoded strings in the BlogML file.
        /// </summary>
        public bool ExportImagesAsBase64 { get; set; } = false;
    }
}
