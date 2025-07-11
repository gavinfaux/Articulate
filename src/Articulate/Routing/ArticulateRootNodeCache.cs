using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.Controllers;
using Umbraco.Cms.Core.Routing;

namespace Articulate.Routing
{
    /// <summary>
    /// Used to create all of the dynamic routes.
    /// </summary>
    public class ArticulateRootNodeCache(ControllerActionDescriptor controllerActionDescriptor)
    {
        private readonly Dictionary<int, IReadOnlyList<Domain>> _content = new();

        public ControllerActionDescriptor ControllerActionDescriptor { get; } = controllerActionDescriptor;

        public void Add(int contentId, IReadOnlyList<Domain> domains)
            => _content.Add(contentId, domains);

        public int GetContentId(Domain currentDomain)
        {
            var found = _content.First(x =>
                (currentDomain == null && x.Value.Count == 0) || x.Value.Any(x => x.Id == currentDomain?.Id));

            return found.Key;
        }
    }
}
