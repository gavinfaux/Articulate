#nullable enable
using Umbraco.Cms.Core.Models;

namespace Articulate.Models
{
    public interface IImageModel
    {
        public MediaWithCrops? Image { get; }
        public string Name { get; }
        public string Url { get; }
    }
}
