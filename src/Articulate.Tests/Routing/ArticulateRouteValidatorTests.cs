#nullable enable
using Articulate.Routing;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;

namespace Articulate.Tests.Routing
{
    [TestFixture]
    public class ArticulateRouteValidatorTests
    {
        [Test]
        public void DomainsForContent_returns_domains_for_root_and_ancestors_in_path()
        {
            IPublishedContent content = CreateRoot(id: 200, path: "-1,100,200");
            List<Domain> domains =
            [
                new(10, "section.local", 100, string.Empty, false, 0),
                new(11, "blog.local", 200, string.Empty, false, 0),
                new(12, "elsewhere.local", 999, string.Empty, false, 0)
            ];

            List<Domain> matchedDomains = ArticulateRouteValidator.DomainsForContent(content, domains);

            Assert.That(matchedDomains.Select(x => x.ContentId), Is.EqualTo(new[] { 100, 200 }));
        }

        [Test]
        public void DomainsForContent_returns_empty_when_no_domains_match_path()
        {
            IPublishedContent content = CreateRoot(id: 200, path: "-1,100,200");
            List<Domain> domains =
            [
                new(10, "elsewhere.local", 999, string.Empty, false, 0)
            ];

            List<Domain> matchedDomains = ArticulateRouteValidator.DomainsForContent(content, domains);

            Assert.That(matchedDomains, Is.Empty);
        }

        [Test]
        public void DomainsForContent_throws_invalid_operation_for_malformed_path()
        {
            IPublishedContent root = CreateRoot(path: "-1,not-an-int");

            InvalidOperationException ex = Assert.Throws<InvalidOperationException>(() =>
                ArticulateRouteValidator.DomainsForContent(root, []))!;

            Assert.That(ex.Message, Does.Contain("invalid path"));
        }

        [Test]
        public void ValidateRootPathMappings_rejects_same_path_without_domains()
        {
            IPublishedContent left = CreateRoot(id: 1, name: "Blog A", path: "-1,1");
            IPublishedContent right = CreateRoot(id: 2, name: "Blog B", path: "-1,2");

            InvalidOperationException ex = Assert.Throws<InvalidOperationException>(() =>
                ArticulateRouteValidator.ValidateRootPathMappings(
                    "/blog/",
                    [left, right],
                    [],
                    new Uri("https://example.local/")))!;

            Assert.That(ex.Message, Does.Contain("Ambiguous Articulate root routing"));
        }

        [Test]
        public void ValidateRootPathMappings_allows_same_path_with_distinct_domains()
        {
            IPublishedContent left = CreateRoot(id: 1, name: "Blog A", path: "-1,1");
            IPublishedContent right = CreateRoot(id: 2, name: "Blog B", path: "-1,2");

            List<Domain> domains =
            [
                new(10, "a.local", 1, string.Empty, false, 0),
                new(11, "b.local", 2, string.Empty, false, 0)
            ];

            Assert.DoesNotThrow(() =>
                ArticulateRouteValidator.ValidateRootPathMappings(
                    "/blog/",
                    [left, right],
                    domains,
                    new Uri("https://example.local/")));
        }

        [Test]
        public void ValidateRootPathMappings_rejects_same_path_with_equivalent_domains_even_when_ids_differ()
        {
            IPublishedContent left = CreateRoot(id: 1, name: "Blog A", path: "-1,1");
            IPublishedContent right = CreateRoot(id: 2, name: "Blog B", path: "-1,2");

            List<Domain> domains =
            [
                new(10, "blog.local", 1, string.Empty, false, 0),
                new(11, "https://blog.local/", 2, string.Empty, false, 0)
            ];

            InvalidOperationException ex = Assert.Throws<InvalidOperationException>(() =>
                ArticulateRouteValidator.ValidateRootPathMappings(
                    "/blog/",
                    [left, right],
                    domains,
                    new Uri("https://blog.local/")))!;

            Assert.That(ex.Message, Does.Contain("Ambiguous Articulate root routing"));
        }

        [Test]
        public void ValidateRootPathMappings_allows_single_root_without_domains()
        {
            IPublishedContent single = CreateRoot(id: 1, name: "Blog", path: "-1,1");

            Assert.DoesNotThrow(() =>
                ArticulateRouteValidator.ValidateRootPathMappings(
                    "/blog/",
                    [single],
                    [],
                    new Uri("https://example.local/")));
        }

        [Test]
        public void ValidateRootPathMappings_allows_same_path_with_same_host_but_distinct_cultures()
        {
            IPublishedContent left = CreateRoot(id: 1, name: "Blog A", path: "-1,1");
            IPublishedContent right = CreateRoot(id: 2, name: "Blog B", path: "-1,2");

            List<Domain> domains =
            [
                new(10, "blog.local", 1, "en-US", false, 0),
                new(11, "blog.local", 2, "da-DK", false, 0)
            ];

            Assert.DoesNotThrow(() =>
                ArticulateRouteValidator.ValidateRootPathMappings(
                    "/blog/",
                    [left, right],
                    domains,
                    new Uri("https://blog.local/")));
        }

        [Test]
        public void ValidateRootPathMappings_rejects_same_path_with_equivalent_path_based_domains()
        {
            IPublishedContent left = CreateRoot(id: 1, name: "Blog A", path: "-1,1");
            IPublishedContent right = CreateRoot(id: 2, name: "Blog B", path: "-1,2");

            List<Domain> domains =
            [
                new(10, "blog.local/articles/", 1, string.Empty, false, 0),
                new(11, "https://blog.local/articles", 2, string.Empty, false, 0)
            ];

            InvalidOperationException ex = Assert.Throws<InvalidOperationException>(() =>
                ArticulateRouteValidator.ValidateRootPathMappings(
                    "/blog/",
                    [left, right],
                    domains,
                    new Uri("https://blog.local/")))!;

            Assert.That(ex.Message, Does.Contain("Ambiguous Articulate root routing"));
        }

        [Test]
        public void ValidateConfiguredRouteSegments_rejects_duplicate_child_route_segments()
        {
            IPublishedContent root = CreateRoot(
                children:
                [
                    CreateRoot(name: "Child A", urlSegment: "tags"),
                    CreateRoot(name: "Child B", urlSegment: "Tags")
                ]);

            InvalidOperationException ex = Assert.Throws<InvalidOperationException>(() =>
                ArticulateRouteValidator.ValidateConfiguredRouteSegments(root))!;

            Assert.That(ex.Message, Does.Contain("child content 'Child A'"));
            Assert.That(ex.Message, Does.Contain("child content 'Child B'"));
        }

        [TestCase("   ", "non-slash character")]
        [TestCase("///", "non-slash character")]
        [TestCase(" / / ", "single URL segment")]
        public void ValidateConfiguredRouteSegment_rejects_invalid_route_segments(
            string routeSegment,
            string expectedMessageFragment)
        {
            IPublishedContent content = CreateRoot();

            InvalidOperationException ex = Assert.Throws<InvalidOperationException>(() =>
                ArticulateRouteValidator.ValidateConfiguredRouteSegment(
                    content,
                    "searchUrlName",
                    routeSegment,
                    new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)))!;

            Assert.That(ex.Message, Does.Contain(expectedMessageFragment));
        }

        [Test]
        public void ValidateConfiguredRouteSegment_allows_empty_route_segment()
        {
            IPublishedContent content = CreateRoot();

            Assert.DoesNotThrow(() =>
                ArticulateRouteValidator.ValidateConfiguredRouteSegment(
                    content,
                    "searchUrlName",
                    string.Empty,
                    new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)));
        }

        private static IPublishedContent CreateRoot(
            int id = 1,
            string name = "Blog",
            string path = "-1,1",
            string urlSegment = "blog",
            IEnumerable<IPublishedContent>? children = null)
        {
            Mock<IPublishedContentType> contentType = new();
            contentType.SetupGet(x => x.Alias).Returns(ArticulateConstants.ContentType.Articulate);

            Mock<IPublishedContent> root = new();
            root.SetupGet(x => x.Id).Returns(id);
            root.SetupGet(x => x.Name).Returns(name);
            root.SetupGet(x => x.Path).Returns(path);
            root.SetupGet(x => x.UrlSegment).Returns(urlSegment);
            root.SetupGet(x => x.ContentType).Returns(contentType.Object);
#pragma warning disable CS0618 // Test double needs to supply the legacy Children property used by validation.
            root.SetupGet(x => x.Children).Returns(children ?? []);
#pragma warning restore CS0618
            return root.Object;
        }
    }
}
