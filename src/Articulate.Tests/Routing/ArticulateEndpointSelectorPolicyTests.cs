#nullable enable
using Articulate.Routing;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Matching;
using Microsoft.AspNetCore.Routing.Patterns;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Security;

namespace Articulate.Tests.Routing
{
    [TestFixture]
    public class ArticulateEndpointSelectorPolicyTests
    {
        private static readonly Domain _blogDomain = new(1, "blog.test", 100, "en-US", false, 0);
        private static readonly Domain _shopDomain = new(2, "shop.test", 300, "en-US", false, 0);
        private static readonly EphemeralDataProtectionProvider _dataProtectionProvider = new();

        [Test]
        public void AppliesToEndpoints_only_when_an_articulate_endpoint_is_a_candidate()
        {
            ArticulateEndpointSelectorPolicy sut = Sut(Mock.Of<IUmbracoContextAccessor>());

            Assert.Multiple(() =>
            {
                Assert.That(sut.AppliesToEndpoints([Endpoint(), Endpoint(BlogRoots())]), Is.True);
                Assert.That(sut.AppliesToEndpoints([Endpoint(), Endpoint()]), Is.False);
            });
        }

        [TestCase("https://blog.test/rss", true)]
        [TestCase("https://shop.test/rss", false)]
        public async Task ApplyAsync_routes_to_articulate_or_umbraco_by_whether_a_root_serves_the_domain(string url, bool articulateServes)
        {
            CandidateSet candidates = Candidates(Endpoint(BlogRoots()), UmbracoCatchAll(), Endpoint(), DynamicRoute("/{**appSlug}", 20));

            await Sut(UmbracoContextAccessor(new Uri(url)))
                .ApplyAsync(new DefaultHttpContext(), candidates);

            Assert.Multiple(() =>
            {
                Assert.That(candidates.IsValidCandidate(0), Is.EqualTo(articulateServes), "Articulate");
                Assert.That(candidates.IsValidCandidate(1), Is.EqualTo(!articulateServes), "Umbraco's catch-all");
                Assert.That(candidates.IsValidCandidate(2), Is.True, "other endpoints are left alone");
                Assert.That(candidates.IsValidCandidate(3), Is.True, "the host's own dynamic routes are left alone");
            });
        }

        [Test]
        public async Task ApplyAsync_keeps_umbracos_catch_all_when_the_articulate_route_rejects_the_method()
        {
            CandidateSet candidates = Candidates(Endpoint(BlogRoots(), new HttpMethodMetadata(["POST"])), UmbracoCatchAll());
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Method = HttpMethods.Get;

            await Sut(UmbracoContextAccessor(new Uri("https://blog.test/metaweblog/100")))
                .ApplyAsync(httpContext, candidates);

            Assert.That(candidates.IsValidCandidate(1), Is.True);
        }

        [Test]
        public async Task ApplyAsync_leaves_a_surface_controller_form_post_to_umbracos_catch_all()
        {
            CandidateSet candidates = Candidates(Endpoint(BlogRoots()), UmbracoCatchAll());
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Method = HttpMethods.Post;
            httpContext.Request.ContentType = "application/x-www-form-urlencoded";
            httpContext.Request.Form = new FormCollection(new()
            {
                ["ufprt"] = EncryptionHelper.CreateEncryptedRouteString(_dataProtectionProvider, "Newsletter", "Subscribe", string.Empty),
            });

            await Sut(UmbracoContextAccessor(new Uri("https://blog.test/tags/")))
                .ApplyAsync(httpContext, candidates);

            Assert.Multiple(() =>
            {
                Assert.That(candidates.IsValidCandidate(0), Is.False, "Articulate");
                Assert.That(candidates.IsValidCandidate(1), Is.True, "Umbraco's catch-all");
            });
        }

        [Test]
        public async Task ApplyAsync_keeps_serving_articulate_when_the_ufprt_token_is_invalid()
        {
            CandidateSet candidates = Candidates(Endpoint(BlogRoots()), UmbracoCatchAll());
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("?ufprt=invalid");

            await Sut(UmbracoContextAccessor(new Uri("https://blog.test/rss?ufprt=invalid")))
                .ApplyAsync(httpContext, candidates);

            Assert.Multiple(() =>
            {
                Assert.That(candidates.IsValidCandidate(0), Is.True, "Articulate");
                Assert.That(candidates.IsValidCandidate(1), Is.False, "Umbraco's catch-all");
            });
        }

        [Test]
        public async Task ApplyAsync_drops_articulate_endpoints_without_an_umbraco_context()
        {
            CandidateSet candidates = Candidates(Endpoint(BlogRoots()));

            await Sut(Mock.Of<IUmbracoContextAccessor>())
                .ApplyAsync(new DefaultHttpContext(), candidates);

            Assert.That(candidates.IsValidCandidate(0), Is.False);
        }

        private static ArticulateEndpointSelectorPolicy Sut(IUmbracoContextAccessor umbracoContextAccessor) =>
            new(umbracoContextAccessor, _dataProtectionProvider);

        private static ArticulateRouteRoots BlogRoots()
        {
            var roots = new ArticulateRouteRoots(new ControllerActionDescriptor());
            roots.Add(100, [_blogDomain]);
            return roots;
        }

        private static IUmbracoContextAccessor UmbracoContextAccessor(Uri url)
        {
            IDomainCache domains = Mock.Of<IDomainCache>(x =>
                x.GetAll(false) == new[] { _blogDomain, _shopDomain } &&
                x.DefaultCulture == "en-US");
            IUmbracoContext? umbracoContext = Mock.Of<IUmbracoContext>(x => x.CleanedUmbracoUrl == url && x.Domains == domains);

            Mock<IUmbracoContextAccessor> accessor = new();
            accessor.Setup(x => x.TryGetUmbracoContext(out umbracoContext)).Returns(true);
            return accessor.Object;
        }

        private static CandidateSet Candidates(params Endpoint[] endpoints) =>
            new(endpoints, endpoints.Select(_ => new RouteValueDictionary()).ToArray(), new int[endpoints.Length]);

        private static RouteEndpoint UmbracoCatchAll() => DynamicRoute(Umbraco.Cms.Core.Constants.Web.Routing.DynamicRoutePattern, 11);

        private static RouteEndpoint DynamicRoute(string pattern, int order) =>
            new(
                _ => Task.CompletedTask,
                RoutePatternFactory.Parse(pattern),
                order,
                new EndpointMetadataCollection(Mock.Of<IDynamicEndpointMetadata>(x => x.IsDynamic)),
                pattern);

        private static Endpoint Endpoint(params object[] metadata) =>
            new(_ => Task.CompletedTask, new EndpointMetadataCollection(metadata), null);
    }
}
