#nullable enable
namespace Articulate.Services
{
    /// <summary>
    /// Provides canonical theme keys contributed by installed packages.
    /// </summary>
    public interface IArticulateThemeDescriptorProvider
    {
        /// <summary>
        /// Gets canonical theme keys exposed by the current package.
        /// </summary>
        /// <returns>A collection of canonical theme keys.</returns>
        public IEnumerable<string> GetThemeKeys();
    }
}
