#nullable enable
using Microsoft.AspNetCore.Mvc.Controllers;
using Umbraco.Cms.Core.Routing;

namespace Articulate.Routing;

/// <summary>
/// Used to create all of the dynamic routes.
/// </summary>
internal class ArticulateRootNodeCache(ControllerActionDescriptor controllerActionDescriptor)
{
    private readonly Dictionary<int, IReadOnlyList<Domain>> _content = [];

    public ControllerActionDescriptor ControllerActionDescriptor { get; } = controllerActionDescriptor;

    public void Add(int contentId, IReadOnlyList<Domain> domains)
        => _content.Add(contentId, domains);

    public int GetContentId(Domain? currentDomain)
    {
        KeyValuePair<int, IReadOnlyList<Domain>> found = _content.First(x =>
            (currentDomain is null && x.Value.Count == 0) || x.Value.Any(d => d.Id == currentDomain?.Id));

        return found.Key;
    }
}
