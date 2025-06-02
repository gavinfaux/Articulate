using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace Articulate.Models
{
    [DataContract]
    public class PostResponseModel
    {
        [DataMember(Name = "TemporaryFileName")]
        [Required]
        public required string TemporaryFileName { get; set; }

        [DataMember(Name = "PostCount")]
        public int PostCount { get; set; }

    }
}
