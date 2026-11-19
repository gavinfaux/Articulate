#nullable enable
using Microsoft.AspNetCore.Mvc.Controllers;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;

namespace Articulate.Routing
{
    /// <summary>
    /// The Articulate roots served by one route, and the action that renders them.
    /// </summary>
    /// <remarks>Filled while the route table is built, then only read.</remarks>
    internal sealed class ArticulateRouteRoots(ControllerActionDescriptor controllerActionDescriptor)
    {
        private readonly Dictionary<int, IReadOnlyList<Domain>> _content = [];

        public ControllerActionDescriptor ControllerActionDescriptor { get; } = controllerActionDescriptor;

        public void Add(int contentId, IReadOnlyList<Domain> domains)
            => _content.TryAdd(contentId, domains);

        public int GetContentId(Domain? currentDomain)
        {
            KeyValuePair<int, IReadOnlyList<Domain>> found = _content.FirstOrDefault(x =>
                (currentDomain is null && x.Value.Count == 0) ||
                (currentDomain is not null && x.Value.Any(d => ArticulateDomainMatcher.Matches(d, currentDomain, (currentDomain as DomainAndUri)?.Uri))));

            return found.Key; // 0 if no match (default KeyValuePair<int,...>.Key)
        }

        public int GetContentId(IUmbracoContext umbracoContext)
        {
            IDomainCache domains = umbracoContext.Domains;
            return GetContentId(DomainUtilities.SelectDomain(domains.GetAll(false), umbracoContext.CleanedUmbracoUrl, defaultCulture: domains.DefaultCulture));
        }

        public IPublishedContent? FindContent(IUmbracoContext umbracoContext) =>
            GetContentId(umbracoContext) is var contentId and not 0 ? umbracoContext.Content?.GetById(contentId) : null;
    }
}
