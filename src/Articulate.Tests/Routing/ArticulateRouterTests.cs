#nullable enable
using System.Data;
using System.Reflection;
using Articulate.Controllers;
using Articulate.Options;
using Articulate.Routing;
using Examine;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Primitives;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Routing;

namespace Articulate.Tests.Routing
{
    [TestFixture]
    public class ArticulateRouterTests
    {
        private static readonly Type[] _controllers =
        [
            typeof(ArticulateRssController), typeof(ArticulateSearchController), typeof(ArticulateTagsController),
            typeof(MarkdownEditorController), typeof(MetaWeblogController), typeof(OpenSearchController),
            typeof(RsdController), typeof(WlwManifestController)
        ];

        private readonly Dictionary<int, string> _urls = [];
        private IServiceProvider _originalServiceProvider = null!;
        private ServiceProvider _testServiceProvider = null!;

        [OneTimeSetUp]
        public void SetUp()
        {
            _originalServiceProvider = StaticServiceProvider.Instance;

            var publishedUrlProvider = new Mock<IPublishedUrlProvider>();
            publishedUrlProvider
                .Setup(x => x.GetUrl(It.IsAny<IPublishedContent>(), It.IsAny<UrlMode>(), It.IsAny<string?>(), It.IsAny<Uri?>()))
                .Returns((IPublishedContent content, UrlMode _, string? _, Uri? _) => _urls[content.Id]);

            _testServiceProvider = new ServiceCollection()
                .AddSingleton(publishedUrlProvider.Object)
                .AddSingleton(Mock.Of<IVariationContextAccessor>())
                .AddSingleton(Mock.Of<IDomainCache>())
                .AddSingleton(Mock.Of<IPublishedContentCache>())
                .AddSingleton(Mock.Of<IMediaNavigationQueryService>())
                .AddSingleton(Mock.Of<IPublishedModelFactory>())
                .AddSingleton(Mock.Of<IDocumentNavigationQueryService>())
                .AddSingleton(Mock.Of<IPublishedContentStatusFilteringService>())
                .AddSingleton(Mock.Of<IPublishedValueFallback>())
                .AddSingleton(Mock.Of<IUserService>())
                .AddSingleton(Mock.Of<IUmbracoContextAccessor>())
                .AddSingleton(Mock.Of<ISiteDomainMapper>())
                .AddSingleton(Mock.Of<ITemplateService>())
                .AddSingleton(Mock.Of<IContentTypeService>())
                .AddSingleton(Mock.Of<IMediaTypeService>())
                .AddSingleton(Mock.Of<IMemberTypeService>())
#if !UMBRACO_18_OR_GREATER
                .AddSingleton(Mock.Of<IFileService>())
#endif
                .AddSingleton(Microsoft.Extensions.Options.Options.Create(new WebRoutingSettings()))
                .AddSingleton(Mock.Of<IExamineManager>())
                .AddSingleton(Mock.Of<IDocumentUrlService>())
                .BuildServiceProvider();

            StaticServiceProvider.Instance = _testServiceProvider;
        }

        [OneTimeTearDown]
        public void TearDown()
        {
            _testServiceProvider.Dispose();
            StaticServiceProvider.Instance = _originalServiceProvider;
        }

        [TestCase("/", "/")]
        [TestCase("/blog/", "blog/")]
        [TestCase("/sites/blog", "sites/blog/")]
        [TestCase("https://fotoblog.test/", "/")]
        [TestCase("https://example.test/blog/", "blog/")]
        public void RootNodePath_returns_the_site_relative_path(string url, string expected) =>
            Assert.That(ArticulateRouter.RootNodePath(url), Is.EqualTo(expected));

        [Test]
        public void BuildRouteTable_maps_each_route_to_the_controllers_own_action()
        {
            var routes = CreateSut([CreateRoot(100, "/blog/", ("tagsUrlName", "tags"))], enableMetaWeblog: true)
                .BuildRouteTable()
                .ToDictionary(x => x.Template, x => x.Roots);

            Assert.That(
                routes.ToDictionary(x => x.Key, x => ActionName(x.Value)),
                Is.EquivalentTo(new Dictionary<string, string>
                {
                    ["blog/rss"] = "ArticulateRssController.Index",
                    ["blog/rss/xslt"] = "ArticulateRssController.FeedXslt",
                    ["blog/author/{authorId}/rss"] = "ArticulateRssController.Author",
                    ["blog/a-new"] = "MarkdownEditorController.NewPost",
                    ["blog/metaweblog/{id}"] = "MetaWeblogController.IndexAsync",
                    ["blog/wlwmanifest/{id}"] = "WlwManifestController.Index",
                    ["blog/rsd/{id}"] = "RsdController.Index",
                    ["blog/tags/{tag?}"] = "ArticulateTagsController.Tags",
                    ["blog/tags/{tag}/rss"] = "ArticulateRssController.Tags",
                }));
            Assert.That(
                routes["blog/rss"].ControllerActionDescriptor.MethodInfo.DeclaringType,
                Is.EqualTo(typeof(ArticulateRssController)),
                "the inherited RenderController.Index must not be routed");
        }

        [Test]
        public void BuildRouteTable_serves_roots_sharing_a_path_from_one_route_by_domain()
        {
            Domain blogA = new(1, "blog-a.test", 100, string.Empty, false, 0);
            Domain blogB = new(2, "blog-b.test", 200, string.Empty, false, 0);

            ArticulateRouteRoots rss = CreateSut(
                [CreateRoot(100, "https://blog-a.test/"), CreateRoot(200, "https://blog-b.test/")],
                domains: [blogA, blogB]).BuildRouteTable().Single(x => x.Template == "/rss").Roots;
            Assert.Multiple(() =>
            {
                Assert.That(rss.GetContentId(blogA), Is.EqualTo(100));
                Assert.That(rss.GetContentId(blogB), Is.EqualTo(200));
                Assert.That(rss.GetContentId((Domain?)null), Is.Zero);
            });
        }

        [Test]
        public void BuildRouteTable_gives_each_domain_its_own_route_when_roots_share_a_segment_for_different_features()
        {
            Domain blogA = new(1, "blog-a.test", 100, string.Empty, false, 0);
            Domain blogB = new(2, "blog-b.test", 200, string.Empty, false, 0);

            (string Template, ArticulateRouteRoots Roots)[] topics = [.. CreateSut(
                [
                    CreateRoot(100, "https://blog-a.test/", ("tagsUrlName", "topics")),
                    CreateRoot(200, "https://blog-b.test/", ("categoriesUrlName", "topics")),
                ],
                domains: [blogA, blogB]).BuildRouteTable().Where(x => x.Template == "/topics/{tag?}")];

            Assert.That(
                topics.ToDictionary(x => ActionName(x.Roots), x => (x.Roots.GetContentId(blogA), x.Roots.GetContentId(blogB))),
                Is.EquivalentTo(new Dictionary<string, (int, int)>
                {
                    ["ArticulateTagsController.Tags"] = (100, 0),
                    ["ArticulateTagsController.Categories"] = (0, 200),
                }));
        }

        [Test]
        public void Endpoints_carry_the_action_and_roots_ahead_of_umbraco()
        {
            ArticulateEndpointDataSource sut = CreateDataSource([CreateRoot(100, "/blog/")], new ArticulateRouteRefreshState());

            RouteEndpoint endpoint = sut.Endpoints.OfType<RouteEndpoint>().Single(x => Template(x) == "blog/rss");
            ArticulateRouteRoots? roots = endpoint.Metadata.GetMetadata<ArticulateRouteRoots>();

            Assert.Multiple(() =>
            {
                Assert.That(endpoint.Order, Is.EqualTo(ArticulateEndpointDataSource.EndpointOrder));
                Assert.That(endpoint.RoutePattern.RawText, Is.Null, "Umbraco's path-only endpoint check must skip it");
                Assert.That(endpoint.RoutePattern.PathSegments, Has.Count.EqualTo(2));
                Assert.That(roots?.GetContentId((Domain?)null), Is.EqualTo(100));
                Assert.That(endpoint.Metadata.GetMetadata<ControllerActionDescriptor>(), Is.SameAs(roots?.ControllerActionDescriptor));
            });
        }

        [Test]
        public async Task A_protected_root_is_served_by_its_public_access_page()
        {
            IPublishedContent root = CreateRoot(100, "/blog/");
            ActionContext? invoked = null;
            Mock<IActionInvokerFactory> invokers = new();
            invokers
                .Setup(x => x.CreateInvoker(It.IsAny<ActionContext>()))
                .Callback((ActionContext context) => invoked = context)
                .Returns(Mock.Of<IActionInvoker>(x => x.InvokeAsync() == Task.CompletedTask));
            ArticulateEndpointDataSource sut = CreateDataSource([root], new ArticulateRouteRefreshState(), actionInvokerFactory: invokers.Object);
            RouteEndpoint endpoint = sut.Endpoints.OfType<RouteEndpoint>().Single(x => Template(x) == "blog/rss");

            Mock<IUmbracoContext> umbracoContext = new();
            umbracoContext.SetupGet(x => x.CleanedUmbracoUrl).Returns(new Uri("https://example.test/blog/rss"));
            umbracoContext.SetupGet(x => x.Domains).Returns(Mock.Of<IDomainCache>(x => x.GetAll(false) == Array.Empty<Domain>()));
            umbracoContext.SetupGet(x => x.Content).Returns(Mock.Of<IPublishedContentCache>(x => x.GetById(100) == root));
            umbracoContext.SetupProperty(x => x.PublishedRequest);
            IUmbracoContext? current = umbracoContext.Object;
            Mock<IUmbracoContextAccessor> umbracoContextAccessor = new();
            umbracoContextAccessor.Setup(x => x.TryGetUmbracoContext(out current)).Returns(true);

            Mock<IUmbracoVirtualPageRoute> virtualPageRoute = new();
            virtualPageRoute
                .Setup(x => x.SetRouteValues(It.IsAny<HttpContext>(), root, It.IsAny<ControllerActionDescriptor>()))
                .Callback((HttpContext context, IPublishedContent content, ControllerActionDescriptor action) =>
                    context.Features.Set(new UmbracoRouteValues(Mock.Of<IPublishedRequest>(x => x.PublishedContent == content), action)))
                .Returns(Task.CompletedTask);
            UmbracoRouteValues loginPage = new(
                Mock.Of<IPublishedRequest>(x => x.PublishedContent == Mock.Of<IPublishedContent>()),
                new ControllerActionDescriptor { ControllerName = "Render", ActionName = "Index" });
            Mock<Umbraco.Cms.Web.Website.Routing.IPublicAccessRequestHandler> publicAccess = new();
            publicAccess
                .Setup(x => x.RewriteForPublishedContentAccessAsync(It.IsAny<HttpContext>(), It.IsAny<UmbracoRouteValues>()))
                .ReturnsAsync(loginPage);

            DefaultHttpContext httpContext = new()
            {
                RequestServices = new ServiceCollection()
                    .AddSingleton(umbracoContextAccessor.Object)
                    .AddSingleton(virtualPageRoute.Object)
                    .AddSingleton(publicAccess.Object)
                    .BuildServiceProvider(),
            };
            httpContext.SetEndpoint(endpoint);

            await ArticulateEndpointDataSource.SetRouteValuesAsync(httpContext, endpoint.RequestDelegate!);

            Assert.Multiple(() =>
            {
                Assert.That(httpContext.Features.Get<UmbracoRouteValues>(), Is.SameAs(loginPage));
                Assert.That(current.PublishedRequest, Is.SameAs(loginPage.PublishedRequest));
                Assert.That(invoked?.ActionDescriptor, Is.SameAs(loginPage.ControllerActionDescriptor));
            });
        }

        // With TryMatchingEndpointsForAllPages on, Umbraco reserves any path matching an endpoint's RawText, whatever
        // the host, so an Articulate route would hide another site's page. Fails if Umbraco stops skipping null RawText.
        [Test]
        public void Umbracos_endpoint_matching_does_not_reserve_articulate_paths()
        {
            ArticulateEndpointDataSource articulate = CreateDataSource(
                [CreateRoot(100, "/blog/", ("tagsUrlName", "tags"))],
                new ArticulateRouteRefreshState());
            var withRawText = new DefaultEndpointDataSource(new RouteEndpoint(
                _ => Task.CompletedTask, RoutePatternFactory.Parse("blog/rss"), 0, EndpointMetadataCollection.Empty, "blog/rss"));

            Assert.Multiple(() =>
            {
                Assert.That(DocumentFilter(withRawText).IsDocumentRequest("/blog/rss"), Is.False, "Umbraco reserves a matching RawText");
                Assert.That(DocumentFilter(articulate).IsDocumentRequest("/blog/rss"), Is.True);
                Assert.That(DocumentFilter(articulate).IsDocumentRequest("/blog/tags/umbraco"), Is.True);
            });
        }

        [Test]
        public void Endpoints_rebuild_only_after_routes_are_marked_dirty()
        {
            List<IPublishedContent> roots = [CreateRoot(100, "/blog/")];
            var refreshState = new ArticulateRouteRefreshState();
            ArticulateEndpointDataSource sut = CreateDataSource(roots, refreshState);

            _ = sut.Endpoints;
            IChangeToken token = sut.GetChangeToken();
            roots.Add(CreateRoot(200, "/news/"));

            Assert.That(Patterns(sut), Does.Not.Contain("news/rss"));
            Assert.That(token.HasChanged, Is.False);

            refreshState.MarkDirty();

            Assert.That(token.HasChanged, Is.True);
            Assert.That(Patterns(sut), Does.Contain("news/rss"));
        }

        [Test]
        public void Endpoints_keep_the_last_good_routes_when_a_rebuild_fails()
        {
            List<IPublishedContent> roots = [CreateRoot(100, "/blog/")];
            var refreshState = new ArticulateRouteRefreshState();
            ArticulateEndpointDataSource sut = CreateDataSource(roots, refreshState);
            IReadOnlyList<Endpoint> built = sut.Endpoints;

            roots.Add(CreateRoot(200, "/news/", ("tagsUrlName", "not/one-segment")));
            refreshState.MarkDirty();

            Assert.That(sut.Endpoints, Is.SameAs(built));
        }

        [Test]
        public void Endpoints_retry_a_failed_build_without_a_route_change()
        {
            List<IPublishedContent> roots = [CreateRoot(100, "/blog/", ("tagsUrlName", "not/one-segment"))];
            var time = new ManualTimeProvider();
            ArticulateEndpointDataSource sut = CreateDataSource(roots, new ArticulateRouteRefreshState(), time);

            Assert.That(sut.Endpoints, Is.Empty);

            roots[0] = CreateRoot(100, "/blog/");
            time.FireLatest();

            Assert.That(Patterns(sut), Does.Contain("blog/rss"));
        }

        [Test]
        public void Endpoints_back_off_and_stop_retrying_a_build_that_keeps_failing()
        {
            var time = new ManualTimeProvider();
            ArticulateEndpointDataSource sut = CreateDataSource(
                [CreateRoot(100, "/blog/", ("tagsUrlName", "not/one-segment"))],
                new ArticulateRouteRefreshState(),
                time);

            _ = sut.Endpoints;
            for (var i = 0; i < ArticulateEndpointDataSource.MaxBuildRetries; i++)
            {
                time.FireLatest();
                _ = sut.Endpoints;
            }

            Assert.That(time.Delays.Select(x => x.TotalSeconds), Is.EqualTo(new[] { 10, 20, 40, 80, 160 }));
        }

        [Test]
        public void Endpoints_keep_the_retry_schedule_when_a_route_change_fails_during_backoff()
        {
            var refreshState = new ArticulateRouteRefreshState();
            var time = new ManualTimeProvider();
            ArticulateEndpointDataSource sut = CreateDataSource(
                [CreateRoot(100, "/blog/", ("tagsUrlName", "not/one-segment"))],
                refreshState,
                time);

            _ = sut.Endpoints;
            refreshState.MarkDirty();
            _ = sut.Endpoints;

            Assert.That(time.Delays.Select(x => x.TotalSeconds), Is.EqualTo(new[] { 10 }));
        }

        [Test]
        public void Endpoints_ignore_a_cancelled_retry_that_fires_after_a_newer_one_is_scheduled()
        {
            List<IPublishedContent> roots = [CreateRoot(100, "/blog/", ("tagsUrlName", "not/one-segment"))];
            var refreshState = new ArticulateRouteRefreshState();
            var time = new ManualTimeProvider();
            ArticulateEndpointDataSource sut = CreateDataSource(roots, refreshState, time);

            _ = sut.Endpoints;                                 // fails: retry A
            roots[0] = CreateRoot(100, "/blog/");
            refreshState.MarkDirty();
            _ = sut.Endpoints;                                 // succeeds: A cancelled
            roots[0] = CreateRoot(100, "/blog/", ("tagsUrlName", "not/one-segment"));
            refreshState.MarkDirty();
            _ = sut.Endpoints;                                 // fails: retry B
            long version = refreshState.CurrentVersion;

            time.Fire(0);
            Assert.That(refreshState.CurrentVersion, Is.EqualTo(version), "the cancelled retry must not mark routes dirty");

            time.Fire(1);
            Assert.That(refreshState.CurrentVersion, Is.EqualTo(version + 1), "the newer retry is still scheduled");
        }

        [Test]
        public void Dispose_cancels_a_pending_retry()
        {
            var refreshState = new ArticulateRouteRefreshState();
            var time = new ManualTimeProvider();
            ArticulateEndpointDataSource sut = CreateDataSource(
                [CreateRoot(100, "/blog/", ("tagsUrlName", "not/one-segment"))],
                refreshState,
                time);
            _ = sut.Endpoints;
            long version = refreshState.CurrentVersion;

            sut.Dispose();
            time.FireLatest();

            Assert.That(refreshState.CurrentVersion, Is.EqualTo(version));
        }

        [Test]
        public void Endpoints_retry_does_not_throw_when_marking_routes_dirty_fails()
        {
            Mock<IArticulateRouteRefreshState> refreshState = new();
            refreshState.SetupGet(x => x.CurrentVersion).Returns(1);
            refreshState.Setup(x => x.MarkDirty()).Throws(new AggregateException("a change-token callback failed"));
            var time = new ManualTimeProvider();
            ArticulateEndpointDataSource sut = CreateDataSource(
                [CreateRoot(100, "/blog/", ("tagsUrlName", "not/one-segment"))],
                refreshState.Object,
                time);

            _ = sut.Endpoints;

            Assert.DoesNotThrow(time.FireLatest);
        }

        private static RoutableDocumentFilter DocumentFilter(EndpointDataSource endpoints) =>
            new(
                Microsoft.Extensions.Options.Options.Create(new GlobalSettings { ReservedPaths = string.Empty, ReservedUrls = string.Empty }),
                Microsoft.Extensions.Options.Options.Create(new WebRoutingSettings { TryMatchingEndpointsForAllPages = true }),
                Mock.Of<Umbraco.Cms.Core.Hosting.IHostingEnvironment>(),
                endpoints);

        private static string ActionName(ArticulateRouteRoots roots) =>
            $"{roots.ControllerActionDescriptor.ControllerTypeInfo.Name}.{roots.ControllerActionDescriptor.MethodInfo.Name}";

        // The display name ends with the template; the pattern has no RawText.
        private static string Template(Endpoint endpoint) => endpoint.DisplayName![(endpoint.DisplayName!.LastIndexOf(':') + 1)..];

        private static string[] Patterns(ArticulateEndpointDataSource sut) => [.. sut.Endpoints.Select(Template)];

        private static ArticulateEndpointDataSource CreateDataSource(
            IReadOnlyList<IPublishedContent> roots,
            IArticulateRouteRefreshState refreshState,
            TimeProvider? timeProvider = null,
            IActionInvokerFactory? actionInvokerFactory = null) =>
            new(
                CreateSut(roots),
                actionInvokerFactory ?? Mock.Of<IActionInvokerFactory>(),
                refreshState,
                timeProvider ?? new ManualTimeProvider(),
                NullLogger<ArticulateEndpointDataSource>.Instance);

        private static ArticulateRouter CreateSut(
            IReadOnlyList<IPublishedContent> roots,
            bool enableMetaWeblog = false,
            IReadOnlyList<Domain>? domains = null)
        {
            Mock<ICoreScopeProvider> scopeProvider = new();
            scopeProvider
                .Setup(x => x.CreateCoreScope(
                    It.IsAny<IsolationLevel>(),
                    It.IsAny<RepositoryCacheMode>(),
                    It.IsAny<IEventDispatcher?>(),
                    It.IsAny<IScopedNotificationPublisher?>(),
                    It.IsAny<bool?>(),
                    It.IsAny<bool>(),
                    It.IsAny<bool>()))
                .Returns(Mock.Of<ICoreScope>());

            IEnumerable<Domain> allDomains = domains ?? [];
            IUmbracoContext umbracoContext = Mock.Of<IUmbracoContext>(x =>
                x.Domains == Mock.Of<IDomainCache>(d => d.GetAll(false) == allDomains));
            Mock<IUmbracoContextFactory> umbracoContextFactory = new();
            umbracoContextFactory
                .Setup(x => x.EnsureUmbracoContext())
                .Returns(new UmbracoContextReference(umbracoContext, true, Mock.Of<IUmbracoContextAccessor>()));

            IPublishedContentType articulateType = Mock.Of<IPublishedContentType>();
            Mock<IDocumentCacheService> documentCacheService = new();
            documentCacheService.Setup(x => x.GetByContentType(articulateType)).Returns(() => roots);

            List<ActionDescriptor> actions =
            [
                .. _controllers.SelectMany(controller => controller
                    .GetMethods(BindingFlags.Public | BindingFlags.Instance)
                    .Where(method => method.DeclaringType != typeof(object) && !method.IsSpecialName && !method.IsDefined(typeof(NonActionAttribute), inherit: true))
                    .Select(method => new ControllerActionDescriptor
                    {
                        ControllerTypeInfo = controller.GetTypeInfo(),
                        MethodInfo = method,
                        ControllerName = controller.Name[..^"Controller".Length],
                        ActionName = method.Name,
                    }))
            ];

            return new ArticulateRouter(
                Mock.Of<IRuntimeState>(x => x.Level == RuntimeLevel.Run),
                umbracoContextFactory.Object,
                scopeProvider.Object,
                Mock.Of<IPublishedContentTypeCache>(x => x.Get(PublishedItemType.Content, ArticulateConstants.ContentType.Articulate) == articulateType),
                documentCacheService.Object,
                Mock.Of<IActionDescriptorCollectionProvider>(x => x.ActionDescriptors == new ActionDescriptorCollection(actions, 1)),
#if UMBRACO_18_OR_GREATER
                Mock.Of<IDocumentUrlService>(),
#endif
                Microsoft.Extensions.Options.Options.Create(new ArticulateOptions { EnableMetaWeblog = enableMetaWeblog }));
        }

        private IPublishedContent CreateRoot(int id, string url, params (string Alias, string Value)[] values)
        {
            _urls[id] = url;

            Mock<IPublishedContent> root = new();
            root.SetupGet(x => x.Id).Returns(id);
            root.SetupGet(x => x.Key).Returns(Guid.NewGuid());
            root.SetupGet(x => x.Name).Returns($"Blog {id}");
            root.SetupGet(x => x.Path).Returns($"-1,{id}");
            root.SetupGet(x => x.ItemType).Returns(PublishedItemType.Content);
            root.SetupGet(x => x.ContentType).Returns(Mock.Of<IPublishedContentType>(x => x.ItemType == PublishedItemType.Content && x.Alias == ArticulateConstants.ContentType.Articulate));
            root.Setup(x => x.GetProperty(It.IsAny<string>())).Returns((IPublishedProperty?)null);
            foreach ((string alias, string value) in values)
            {
                root.Setup(x => x.GetProperty(alias)).Returns(Mock.Of<IPublishedProperty>(p =>
                    p.Alias == alias &&
                    p.HasValue(It.IsAny<string?>(), It.IsAny<string?>()) == true &&
                    p.GetValue(It.IsAny<string?>(), It.IsAny<string?>()) == (object)value));
            }

            return root.Object;
        }

        private sealed class ManualTimeProvider : TimeProvider
        {
            private readonly List<(TimerCallback Callback, object? State)> _timers = [];

            public List<TimeSpan> Delays { get; } = [];

            public override ITimer CreateTimer(TimerCallback callback, object? state, TimeSpan dueTime, TimeSpan period)
            {
                _timers.Add((callback, state));
                Delays.Add(dueTime);
                return Mock.Of<ITimer>();
            }

            public void FireLatest() => Fire(_timers.Count - 1);

            public void Fire(int timer) => _timers[timer].Callback(_timers[timer].State);
        }
    }
}
