#nullable enable
namespace Articulate.Services
{
    /// <summary>
    ///     Provides ordered view/partial search locations for a given theme name.
    ///     Encapsulates handling of virtual vs content-root paths.
    /// </summary>
    internal interface IArticulateViewLocationProvider
    {
        public IEnumerable<string> GetLocations(string themeName);
    }
}
