using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Articulate.Models.ManagmentApi
{
    public class MardownEditorModel
    {
        [Required]
        public int? ArticulateNodeId { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string Body { get; set; }

        public string Tags { get; set; }

        public string Categories { get; set; }

        public string Slug { get; set; }

        public string Excerpt { get; set; }

    }
}
