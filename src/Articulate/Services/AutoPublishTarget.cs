#nullable enable
namespace Articulate.Services
{
    /// <summary>
    /// Describes a publish target contributed by an installed package.
    /// </summary>
    public sealed record AutoPublishTarget(
        string PackageName,
        string RootContentTypeAlias,
        bool PublishDescendants = true);
}
