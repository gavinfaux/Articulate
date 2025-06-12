using System.Runtime.Serialization;

namespace Articulate.Models
{
    /// <summary>
    /// Represents the result of a BlogML export or the Disqus export of and import operation, containing a download URL for the resulting file.
    /// </summary>
    /// <remarks>
    /// This model is typically returned by API endpoints after a successful import or export, providing a URL to download the generated file (such as BlogML or Disqus XML).
    /// </remarks>
    /// <example>
    /// <code>
    /// {
    ///   "downloadUrl": "/umbraco/management/api/v1/articulate/blog/download"
    /// }
    /// </code>
    /// </example>
    [DataContract]
    public class ImportModel
    {
        /// <summary>
        /// Gets or sets the URL where the client can download the exported or processed file.
        /// </summary>
        /// <example>/umbraco/management/api/v1/articulate/blog/download</example>
        [DataMember(Name = "downloadUrl")]
        public string DownloadUrl { get; set; }
    }
}