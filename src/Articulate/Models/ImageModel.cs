using Umbraco.Cms.Core.Models;

namespace Articulate.Models
{
    public interface IImageModel
    {
        MediaWithCrops Image { get; }
        string Name { get; }
        string Url { get; }
    }
}
