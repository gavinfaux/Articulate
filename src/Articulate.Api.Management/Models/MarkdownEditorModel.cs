#nullable enable
using System.ComponentModel.DataAnnotations;

namespace Articulate.Api.Management.Models
{
    public class MarkdownEditorModel
    {
        [Required]
        public required int ArticulateBlogNode { get; set; }

        [Required]
        public required string Title { get; set; }


        [Required]
        public required string Body { get; set; }

        public string? Tags { get; set; }

        public string? Categories { get; set; }

        public string? Slug { get; set; }

        public string? Excerpt { get; set; }
    }
}
