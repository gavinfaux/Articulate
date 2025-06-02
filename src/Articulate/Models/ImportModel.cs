using System.Runtime.Serialization;

namespace Articulate.Models
{
    [DataContract]
    public class ImportModel
    {
        [DataMember(Name = "downloadUrl")]
        public required string DownloadUrl { get; set; }
    }
}
