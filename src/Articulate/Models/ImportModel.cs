using System.Runtime.Serialization;

namespace Articulate.Models
{
    /// <summary>
    /// Represents the result of a BlogML import with operation statistics.
    /// </summary>
    /// <remarks>
    /// This model is returned by API endpoint after an import.
    /// </remarks>
    /// <example>
    /// <code>
    /// {
    ///   "authorCount": 1,
    ///   "commentCount": 42,
    ///   "completed": true,
    ///   "postCount": 12
    /// }
    /// </code>
    /// </example>
    [DataContract]
    public class ImportModel
    {
        /// <summary>
        /// Gets or sets the number of Posts that were imported.
        /// </summary>
        /// <example>20</example>
        [DataMember(Name = "postCount")]
        public long PostCount { get; set; }

        /// <summary>
        /// Gets or sets the number of Authors that were imported.
        /// </summary>
        /// <example>1</example>
        [DataMember(Name = "authorCount")]
        public long AuthorCount { get; set; }

        /// <summary>
        /// Gets or sets the number of comments that were written to the Disqus comments XML export file.
        /// </summary>
        /// <example>0</example>
        [DataMember(Name = "commentCount")]
        public long CommentCount { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the import completed successfully (true) or if it failed (false).
        /// </summary>
        /// <example>true</example>
        [DataMember(Name = "completed")]
        public bool Completed { get; set; }
    }
}
