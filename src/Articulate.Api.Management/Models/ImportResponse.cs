using Articulate.Models;

namespace Articulate.Api.Management.Models
{
    /// <summary>
    /// Represents the result of a BlogML import with operation statistics.
    /// </summary>
    public class ImportResponse
    {
        public ImportResponse()
        {
        }

        public ImportResponse(ImportResponseDto dto)
        {
            AuthorCount = dto.AuthorCount;
            CommentCount = dto.CommentCount;
            Completed = dto.Completed;
            PostCount = dto.PostCount;
        }

        /// <summary>
        /// Gets or sets the number of Posts that were imported.
        /// </summary>
        public long PostCount { get; set; }

        /// <summary>
        /// Gets or sets the number of Authors that were imported.
        /// </summary>
        public long AuthorCount { get; set; }

        /// <summary>
        /// Gets or sets the number of comments that were written to the Disqus comments XML export file.
        /// </summary>
        public long CommentCount { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether the import completed successfully (true) or if it failed (false).
        /// </summary>
        public bool Completed { get; set; }
    }
}
