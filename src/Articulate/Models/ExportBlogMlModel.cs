using System;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Extensions;

namespace Articulate.Models
{
    [DataContract]
    public class ExportBlogMlModel
    {
        [DataMember(Name = "articulateNode", IsRequired = true)]
        [Required]
        public Guid ArticulateNodeId { get; set; }

        [DataMember(Name = "exportImagesAsBase64")]
        public bool ExportImagesAsBase64 { get; set; } = false;
    }
}
