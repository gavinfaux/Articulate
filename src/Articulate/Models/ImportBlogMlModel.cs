using System;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace Articulate.Models
{
    /// <summary>
    /// Represents the options for importing blog data from a BlogML file.
    /// </summary>
    /// <remarks>
    /// This model is used to specify the Articulate node, import file, and various import options such as overwriting, publishing, and regex replacements.
    /// </remarks>
    /// <example>
    /// <code>
    /// {
    ///   "articulateNode": "b1a7e2c23f4d4e2a9c1a2b3c4d5e6f7a",
    ///   "overwrite": true,
    ///   "regexMatch": "(old)",
    ///   "regexReplace": "new",
    ///   "publish": false,
    ///   "tempFile": "n4v8p7c1.7gk",
    ///   "exportDisqusXml": true,
    ///   "importFirstImage": false
    /// }
    /// </code>
    /// </example>
    [DataContract]
    public class ImportBlogMlModel
    {
        /// <summary>
        /// Gets or sets the unique identifier of the Articulate node to import into.
        /// </summary>
        /// <remarks>
        /// This should be the GUID of the target Articulate blog node.
        /// </remarks>
        /// <example>b1a7e2c23f4d-4e2a9c1a2b3c4d5e6f7a</example>
        [DataMember(Name = "articulateNode", IsRequired = true)]
        [Required]
        public Guid ArticulateNodeId { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to overwrite existing posts during import.
        /// </summary>
        /// <example>true</example>
        [DataMember(Name = "overwrite")]
        public bool Overwrite { get; set; }

        /// <summary>
        /// Gets or sets the regular expression pattern to match in post content during import.
        /// </summary>
        /// <example>(old)</example>
        [DataMember(Name = "regexMatch")]
        public string RegexMatch { get; set; }

        /// <summary>
        /// Gets or sets the replacement string for the regular expression match in post content.
        /// </summary>
        /// <example>new</example>
        [DataMember(Name = "regexReplace")]
        public string RegexReplace { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to publish imported posts.
        /// </summary>
        /// <example>false</example>
        [DataMember(Name = "publish")]
        public bool Publish { get; set; }

        /// <summary>
        /// Gets or sets the temporary file name of the uploaded BlogML file.
        /// </summary>
        /// <remarks>
        /// This should be the file name returned from the initialization endpoint.
        /// </remarks>
        /// <example>n4v8p7c1.7gk</example>
        [DataMember(Name = "tempFile", IsRequired = true)]
        [Required]
        public string TempFile { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to export Disqus XML after import.
        /// </summary>
        /// <example>true</example>
        [DataMember(Name = "exportDisqusXml")]
        public bool ExportDisqusXml { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether to import the first image found in each post.
        /// </summary>
        /// <example>false</example>
        [DataMember(Name = "importFirstImage")]
        public bool ImportFirstImage { get; set; }
    }
}
