namespace Articulate.Models
{
    internal sealed class ImportResponseDto
    {
        public long PostCount { get; set; }

        public long AuthorCount { get; set; }

        public long CommentCount { get; set; }

        public bool Completed { get; set; }
    }
}
