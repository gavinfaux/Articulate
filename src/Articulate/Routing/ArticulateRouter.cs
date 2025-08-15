#nullable enable
using Articulate.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Template;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Infrastructure.Scoping;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Cms.Web.Website.Routing;

namespace Articulate.Routing
{
    internal class ArticulateRouter
    {
        private const string MarkdownEditorControllerName = "MarkdownEditor";
        private static readonly Lock _sLocker = new();
        private static readonly string _sSearchControllerName = ControllerExtensions.GetControllerName<ArticulateSearchController>();
        private static readonly string _sOpenSearchControllerName = ControllerExtensions.GetControllerName<OpenSearchController>();
        private static readonly string _sRsdControllerName = ControllerExtensions.GetControllerName<RsdController>();
        private static readonly string _sWlwControllerName = ControllerExtensions.GetControllerName<WlwManifestController>();
        private static readonly string _sTagsControllerName = ControllerExtensions.GetControllerName<ArticulateTagsController>();
        private static readonly string _sRssControllerName = ControllerExtensions.GetControllerName<ArticulateRssController>();
        private static readonly string _sMetaWeblogControllerName = ControllerExtensions.GetControllerName<MetaWeblogController>();

        private readonly Dictionary<ArticulateRouteTemplate, ArticulateRootNodeCache> _routeCache = [];
        private readonly IControllerActionSearcher _controllerActionSearcher;
        private readonly IScopeProvider _scopeProvider;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="controllerActionSearcher"></param>
        /// <param name="scopeProvider"></param>
        public ArticulateRouter(IControllerActionSearcher controllerActionSearcher, IScopeProvider scopeProvider)
        {
            _controllerActionSearcher = controllerActionSearcher;
            _scopeProvider = scopeProvider;
        }

        public bool TryMatch(PathString path, RouteValueDictionary routeValues, out ArticulateRootNodeCache? articulateRootNodeCache)
        {
            foreach (KeyValuePair<ArticulateRouteTemplate, ArticulateRootNodeCache> item in _routeCache)
            {
                var templateMatcher = new TemplateMatcher(item.Key.RouteTemplate, routeValues);
                if (!templateMatcher.TryMatch(path, routeValues))
                {
                    continue;
                }

                articulateRootNodeCache = item.Value;
                return true;
            }

            articulateRootNodeCache = null;
            return false;
        }

        /// <summary>
        /// Builds all route caches.
        /// </summary>
        /// <param name="httpContext"></param>
        /// <param name="umbracoContext"></param>
        /// <param name="publishedContentTypeCache"></param>
        /// <param name="documentCacheService"></param>
        public void MapRoutes(HttpContext httpContext, IUmbracoContext umbracoContext, IPublishedContentTypeCache publishedContentTypeCache, IDocumentCacheService documentCacheService)
        {
            lock (_sLocker)
            {
                using (_scopeProvider.CreateCoreScope(autoComplete: true))
                {
                    IPublishedContentType articulateCt = publishedContentTypeCache.Get(PublishedItemType.Content, ArticulateConstants.ContentType.Articulate);

                    var articulateNodes = documentCacheService.GetByContentType(articulateCt).ToList();

                    var domains = umbracoContext.Domains.GetAll(false).ToList();

                    // Ensure we always start with an empty cache
                    // We may call this MapRoutes method again when Articulate root node is published
                    // and any of the dynamic URLs from the content node change
                    // So we clear this out, otherwise we will have the previous working URL and the updated URL (Until the site restarts)
                    _routeCache.Clear();

                    // For each articulate root, we need to create some custom route, BUT routes can overlap
                    // based on multi-tenency so we need to deal with that.
                    // For example a root articulate node might yield a route like:
                    //      /
                    // and another articulate root node that has a domain might have this url:
                    //      http://mydomain/
                    // but when that is processed through RoutePathFromNodeUrl, it becomes:
                    //      /
                    // which already exists and is already assigned to a specific node ID.
                    // So what we need to do in these cases is use a special route handler that takes
                    // into account the domain assigned to the route.
                    IOrderedEnumerable<IGrouping<string, IPublishedContent>> articulateNodesGroupedByUriPath = articulateNodes
                        .GroupBy(x => RouteCollectionExtensions.RoutePathFromNodeUrl(httpContext, x.Url()))

                        // This is required to ensure that we create routes that are more specific first
                        // before creating routes that are less specific
                        .OrderByDescending(x => x.Key.Split('/').Length);

                    foreach (IGrouping<string, IPublishedContent> nodeByPathGroup in articulateNodesGroupedByUriPath)
                    {
                        var rootNodePath = nodeByPathGroup.Key.EnsureEndsWith('/');

                        foreach (IPublishedContent articulateRootNode in nodeByPathGroup)
                        {
                            MapRssRoute(httpContext, rootNodePath, articulateRootNode, domains);

                            // TODO: Enable when Editor refactor to Alpine.js completed
                            // MapMarkdownEditorRoute(httpContext, rootNodePath, articulateRootNode, domains);
                            MapAuthorsRssRoute(httpContext, rootNodePath, articulateRootNode, domains);

                            MapSearchRoute(httpContext, rootNodePath, articulateRootNode, domains);
                            MapMetaWeblogRoute(httpContext, rootNodePath, articulateRootNode, domains);
                            MapManifestRoute(httpContext, rootNodePath, articulateRootNode, domains);
                            MapRsdRoute(httpContext, rootNodePath, articulateRootNode, domains);
                            MapOpenSearchRoute(httpContext, rootNodePath, articulateRootNode, domains);

                            // tags/cats routes are the least specific
                            MapTagsAndCategoriesRoute(httpContext, rootNodePath, articulateRootNode, domains);
                        }
                    }
                }
            }
        }

        private static List<Domain> DomainsForContent(IPublishedContent content, IReadOnlyList<Domain> domains)
        {
            var nodePaths = new HashSet<int>(content.Path.Split(',').Select(int.Parse).ToList());

            return domains.Where(domain => nodePaths.Contains(domain.ContentId)).ToList();
        }

        /// <summary>
        /// Generically caches a url path for a particular controller
        /// </summary>
        private void MapRoute(
            string? controllerName,
            string? actionName,
            RouteTemplate routeTemplate,
            HttpContext httpContext,
            IPublishedContent articulateRootNode,
            IReadOnlyList<Domain> domains)
        {
            var art = new ArticulateRouteTemplate(routeTemplate);
            if (!_routeCache.TryGetValue(art, out ArticulateRootNodeCache? dynamicRouteValues))
            {
                ControllerActionDescriptor controllerActionDescriptor = _controllerActionSearcher.Find<IRenderController>(httpContext, controllerName, actionName) ?? throw new InvalidOperationException("No controller found with name " + controllerName);

                dynamicRouteValues = new ArticulateRootNodeCache(controllerActionDescriptor);

                _routeCache[art] = dynamicRouteValues;
            }

            dynamicRouteValues.Add(articulateRootNode.Id, DomainsForContent(articulateRootNode, domains));
        }

        private void MapOpenSearchRoute(HttpContext httpContext, string rootNodePath, IPublishedContent articulateRootNode, List<Domain> domains)
        {
            RouteTemplate template = TemplateParser.Parse($"{rootNodePath}opensearch/{{id}}");
            MapRoute(
                _sOpenSearchControllerName,
                nameof(OpenSearchController.Index),
                template,
                httpContext,
                articulateRootNode,
                domains);
        }

        private void MapRsdRoute(HttpContext httpContext, string rootNodePath, IPublishedContent articulateRootNode, List<Domain> domains)
        {
            RouteTemplate template = TemplateParser.Parse($"{rootNodePath}rsd/{{id}}");
            MapRoute(
                _sRsdControllerName,
                nameof(RsdController.Index),
                template,
                httpContext,
                articulateRootNode,
                domains);
        }

        private void MapMetaWeblogRoute(HttpContext httpContext, string rootNodePath, IPublishedContent articulateRootNode, List<Domain> domains)
        {
            RouteTemplate template = TemplateParser.Parse($"{rootNodePath}metaweblog/{{id}}");
            MapRoute(
                _sMetaWeblogControllerName,
                nameof(MetaWeblogController.Index),
                template,
                httpContext,
                articulateRootNode,
                domains);
        }

        private void MapManifestRoute(HttpContext httpContext, string rootNodePath, IPublishedContent articulateRootNode, List<Domain> domains)
        {
            RouteTemplate template = TemplateParser.Parse($"{rootNodePath}wlwmanifest/{{id}}");
            MapRoute(
                _sWlwControllerName,
                nameof(WlwManifestController.Index),
                template,
                httpContext,
                articulateRootNode,
                domains);
        }

        /// <summary>
        /// Create route for root RSS
        /// </summary>
        /// <param name="httpContext"></param>
        /// <param name="rootNodePath"></param>
        /// <param name="articulateRootNode"></param>
        /// <param name="domains"></param>
        private void MapRssRoute(HttpContext httpContext, string rootNodePath, IPublishedContent articulateRootNode, IReadOnlyList<Domain> domains)
        {
            RouteTemplate rssTemplate = TemplateParser.Parse($"{rootNodePath}rss");
            MapRoute(
                _sRssControllerName,
                nameof(ArticulateRssController.Index),
                rssTemplate,
                httpContext,
                articulateRootNode,
                domains);

            RouteTemplate xsltTemplate = TemplateParser.Parse($"{rootNodePath}rss/xslt");
            MapRoute(
                _sRssControllerName,
                nameof(ArticulateRssController.FeedXslt),
                xsltTemplate,
                httpContext,
                articulateRootNode,
                domains);
        }

        private void MapAuthorsRssRoute(HttpContext httpContext, string rootNodePath, IPublishedContent articulateRootNode, IReadOnlyList<Domain> domains)
        {
            RouteTemplate rssTemplate = TemplateParser.Parse($"{rootNodePath}author/{{authorId}}/rss");
            MapRoute(
                _sRssControllerName,
                nameof(ArticulateRssController.Author),
                rssTemplate,
                httpContext,
                articulateRootNode,
                domains);
        }

        private void MapMarkdownEditorRoute(HttpContext httpContext, string rootNodePath, IPublishedContent articulateRootNode, IReadOnlyList<Domain> domains)
        {
            RouteTemplate template = TemplateParser.Parse($"{rootNodePath}a-new");
            MapRoute(
                MarkdownEditorControllerName,
                "NewPost",
                template,
                httpContext,
                articulateRootNode,
                domains);
        }

        private void MapSearchRoute(HttpContext httpContext, string rootNodePath, IPublishedContent articulateRootNode, IReadOnlyList<Domain> domains)
        {
            var searchUrlName = articulateRootNode.Value<string>("searchUrlName");
            RouteTemplate template = TemplateParser.Parse($"{rootNodePath}{searchUrlName}");
            MapRoute(
                _sSearchControllerName,
                nameof(ArticulateSearchController.Search),
                template,
                httpContext,
                articulateRootNode,
                domains);
        }

        private void MapTagsAndCategoriesRoute(HttpContext httpContext, string rootNodePath, IPublishedContent articulateRootNode, IReadOnlyList<Domain> domains)
        {
            var categoriesUrlName = articulateRootNode.Value<string>("categoriesUrlName");
            RouteTemplate categoriesTemplate = TemplateParser.Parse($"{rootNodePath}{categoriesUrlName}/{{tag?}}");
            MapRoute(
                _sTagsControllerName,
                nameof(ArticulateTagsController.Categories),
                categoriesTemplate,
                httpContext,
                articulateRootNode,
                domains);
            RouteTemplate categoriesRssTemplate = TemplateParser.Parse($"{rootNodePath}{categoriesUrlName}/{{tag}}/rss");
            MapRoute(
                _sRssControllerName,
                nameof(ArticulateRssController.Categories),
                categoriesRssTemplate,
                httpContext,
                articulateRootNode,
                domains);

            var tagsUrlName = articulateRootNode.Value<string>("tagsUrlName");
            RouteTemplate tagsTemplate = TemplateParser.Parse($"{rootNodePath}{tagsUrlName}/{{tag?}}");
            MapRoute(
                _sTagsControllerName,
                nameof(ArticulateTagsController.Tags),
                tagsTemplate,
                httpContext,
                articulateRootNode,
                domains);
            RouteTemplate tagsRssTemplate = TemplateParser.Parse($"{rootNodePath}{tagsUrlName}/{{tag}}/rss");
            MapRoute(
                _sRssControllerName,
                nameof(ArticulateRssController.Tags),
                tagsRssTemplate,
                httpContext,
                articulateRootNode,
                domains);
        }
    }
}
