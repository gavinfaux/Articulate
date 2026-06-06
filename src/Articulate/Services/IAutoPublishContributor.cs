#nullable enable
namespace Articulate.Services
{
    /// <summary>
    /// Contributes auto-publish targets for a package that ships publishable content.
    /// </summary>
    public interface IAutoPublishContributor
    {
        /// <summary>
        /// Gets the publish targets contributed by the package.
        /// </summary>
        public IEnumerable<AutoPublishTarget> GetTargets();
    }
}
