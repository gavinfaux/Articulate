#nullable enable
using Articulate.Controllers;
using Articulate.Options;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;

namespace Articulate.Routing
{
    /// <summary>
    /// Builds the route templates for every published Articulate root.
    /// </summary>
    internal sealed class ArticulateRouter(
        IRuntimeState runtimeState,
        IUmbracoContextFactory umbracoContextFactory,
        ICoreScopeProvider scopeProvider,
        IPublishedContentTypeCache publishedContentTypeCache,
        IDocumentCacheService documentCacheService,
        IActionDescriptorCollectionProvider actionDescriptors,
#if UMBRACO_18_OR_GREATER
        IDocumentUrlService documentUrlService,
#endif
        IOptions<ArticulateOptions> articulateOptions)
    {
        /// <remarks>
        /// One route per template and action. Roots sharing a path on separate domains may use one segment for
        /// different features; each gets its own route, and the selector policy keeps the one serving the domain.
        /// </remarks>
        public IReadOnlyList<(string Template, ArticulateRouteRoots Roots)> BuildRouteTable()
        {
            var routes = new Dictionary<string, (string Template, ArticulateRouteRoots Roots)>(StringComparer.OrdinalIgnoreCase);
            if (runtimeState.Level != RuntimeLevel.Run)
            {
                return [];
            }

            using UmbracoContextReference contextReference = umbracoContextFactory.EnsureUmbracoContext();
            using ICoreScope scope = scopeProvider.CreateCoreScope(autoComplete: true);

            IPublishedContentType articulateType = publishedContentTypeCache.Get(
                PublishedItemType.Content,
                ArticulateConstants.ContentType.Articulate);
            var domains = contextReference.UmbracoContext.Domains.GetAll(false).ToList();

            // Roots on different domains can share a path; each route then serves every root and picks one per request.
            // Materialised first: the lazy query holds its reader open, and Url() can query too (SQL Server rejects that).
            IEnumerable<IGrouping<string, IPublishedContent>> rootsByPath = documentCacheService
                .GetByContentType(articulateType)
                .ToList()
                .Select(root => (Root: root, Url: root.Url()))
                .Where(x => x.Url != "#")
                .GroupBy(x => RootNodePath(x.Url), x => x.Root, StringComparer.OrdinalIgnoreCase);

            foreach (IGrouping<string, IPublishedContent> rootsAtPath in rootsByPath)
            {
                ArticulateRouteValidator.ValidateRootPathMappings(rootsAtPath.Key, [.. rootsAtPath], domains);

                foreach (IPublishedContent root in rootsAtPath)
                {
#if UMBRACO_18_OR_GREATER
                    ArticulateRouteValidator.ValidateConfiguredRouteSegments(root, documentUrlService);
#else
                    ArticulateRouteValidator.ValidateConfiguredRouteSegments(root);
#endif
                    List<Domain> rootDomains = ArticulateRouteValidator.DomainsForContent(root, domains);
                    foreach ((Type controller, string method, string template) in RouteMappings(rootsAtPath.Key, root))
                    {
                        AddRoute(routes, template, FindAction(controller, method)).Add(root.Id, rootDomains);
                    }
                }
            }

            return [.. routes.Values];
        }

        // note: assumes the site isn't hosted under a PathBase, as did the dynamic router.
        internal static string RootNodePath(string url) =>
            (Uri.TryCreate(url, UriKind.Absolute, out Uri? absolute) ? absolute.AbsolutePath : url).Trim('/').EnsureEndsWith('/');

        private IEnumerable<(Type Controller, string Method, string Template)> RouteMappings(string rootPath, IPublishedContent root)
        {
            yield return (typeof(ArticulateRssController), nameof(ArticulateRssController.Index), $"{rootPath}{ArticulateRouteSegmentHelper.Rss}");
            yield return (typeof(ArticulateRssController), nameof(ArticulateRssController.FeedXslt), $"{rootPath}{ArticulateRouteSegmentHelper.Rss}/xslt");
            yield return (typeof(ArticulateRssController), nameof(ArticulateRssController.Author), $"{rootPath}{ArticulateRouteSegmentHelper.Author}/{{authorId}}/rss");
            yield return (typeof(MarkdownEditorController), nameof(MarkdownEditorController.NewPost), $"{rootPath}{ArticulateRouteSegmentHelper.NewPost}");

            if (ArticulateRouteSegmentHelper.CombineRoutePath(rootPath, root.Value<string>("searchUrlName")) is { } searchPath)
            {
                yield return (typeof(ArticulateSearchController), nameof(ArticulateSearchController.Search), searchPath);
                yield return (typeof(OpenSearchController), nameof(OpenSearchController.Index), $"{rootPath}{ArticulateRouteSegmentHelper.OpenSearch}/{{id}}");
            }

            if (articulateOptions.Value.EnableMetaWeblog)
            {
                yield return (typeof(MetaWeblogController), nameof(MetaWeblogController.IndexAsync), $"{rootPath}{ArticulateRouteSegmentHelper.MetaWeblog}/{{id}}");
                yield return (typeof(WlwManifestController), nameof(WlwManifestController.Index), $"{rootPath}{ArticulateRouteSegmentHelper.WlwManifest}/{{id}}");
                yield return (typeof(RsdController), nameof(RsdController.Index), $"{rootPath}{ArticulateRouteSegmentHelper.Rsd}/{{id}}");
            }

            if (ArticulateRouteSegmentHelper.CombineRoutePath(rootPath, root.Value<string>("categoriesUrlName")) is { } categoriesPath)
            {
                yield return (typeof(ArticulateTagsController), nameof(ArticulateTagsController.Categories), $"{categoriesPath}/{{tag?}}");
                yield return (typeof(ArticulateRssController), nameof(ArticulateRssController.Categories), $"{categoriesPath}/{{tag}}/rss");
            }

            if (ArticulateRouteSegmentHelper.CombineRoutePath(rootPath, root.Value<string>("tagsUrlName")) is { } tagsPath)
            {
                yield return (typeof(ArticulateTagsController), nameof(ArticulateTagsController.Tags), $"{tagsPath}/{{tag?}}");
                yield return (typeof(ArticulateRssController), nameof(ArticulateRssController.Tags), $"{tagsPath}/{{tag}}/rss");
            }
        }

        private static ArticulateRouteRoots AddRoute(
            Dictionary<string, (string Template, ArticulateRouteRoots Roots)> routes,
            string template,
            ControllerActionDescriptor action)
        {
            string key = $"{action.Id}:{template}";
            if (!routes.TryGetValue(key, out (string Template, ArticulateRouteRoots Roots) route))
            {
                routes[key] = route = (template, new ArticulateRouteRoots(action));
            }

            return route.Roots;
        }

        // By method, not action name: RenderController.Index is inherited alongside each controller's own Index.
        private ControllerActionDescriptor FindAction(Type controller, string method) =>
            actionDescriptors.ActionDescriptors.Items
                .OfType<ControllerActionDescriptor>()
                .SingleOrDefault(x => x.ControllerTypeInfo == controller && x.MethodInfo.DeclaringType == controller && x.MethodInfo.Name == method)
            ?? throw new InvalidOperationException($"No MVC action found for {controller.Name}.{method}.");
    }
}
