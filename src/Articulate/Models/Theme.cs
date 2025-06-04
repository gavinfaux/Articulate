using System.Runtime.Serialization;

namespace Articulate.Models
{
    [DataContract(Name = "theme")]
    public class Theme
    {
        [DataMember(Name = "name")]
        public required string Name { get; set; }

    }
}
