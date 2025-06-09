using System;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
                
namespace Articulate.Models
{
    /// <summary>
    /// Represents the options for exporting blog data in BlogML format.
    /// </summary>
    /// <remarks>
    /// This model is used to specify the Articulate node to export and whether images should be embedded as Base64 in the BlogML export.
    /// </remarks>
    /// <example>
    /// <code>
    /// {
    ///   "articulateNode": "b1a7e2c23f4d-4e2a9c1a2b3c4d5e6f7a",
    ///   "exportImagesAsBase64": true
    /// }
    /// </code>
    /// </example>
    [DataContract]
    public class ExportBlogMlModel
    {
        /// <summary>
        /// Gets or sets the unique identifier of the Articulate node to export.
        /// </summary>
        /// <remarks>
        /// This should be the GUID of the root Articulate blog node.
        /// </remarks>
        /// <example>b1a7e2c23f4d-4e2a9c1a2b3c4d5e6f7a</example>
        [DataMember(Name = "articulateNode", IsRequired = true)]
        [Required]
        public Guid ArticulateNodeId { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether images should be exported as Base64-encoded strings in the BlogML file.
        /// </summary>
        /// <remarks>
        /// If set to <c>true</c>, images will be embedded as Base64 in the export. If <c>false</c>, images will be referenced by URL.
        /// </remarks>
        /// <example>true</example>
        [DataMember(Name = "exportImagesAsBase64")]
        public bool ExportImagesAsBase64 { get; set; } = false;
    }
}
