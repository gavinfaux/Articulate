#nullable enable
using Articulate.Services;
using FluentAssertions;
using NUnit.Framework;

namespace Articulate.UnitTests
{
    [TestFixture]
    public class ViewLocationProviderTests
    {
        [Test]
        public void Provider_Emits_Forward_Slashes_And_Virtual_First()
        {
            var provider = new DefaultArticulateViewLocationProvider();
            var locations = provider.GetLocations("Aurora").ToArray();

            _ = locations.Should().NotBeEmpty();
            _ = locations.Should().OnlyContain(p => !p.Contains("\\"));
            _ = locations.First().Should().StartWith("~/Views/Articulate/");
        }

        [Test]
        public void Provider_Fallbacks_To_Shared_When_Theme_View_Missing_Simulation()
        {
            // Arrange
            var provider = new DefaultArticulateViewLocationProvider();
            var theme = "Aurora";
            var search = provider.GetLocations(theme)
                .Select(p => p.Replace("{0}.cshtml", "Post.cshtml"))
                .ToList();

            // Only the Shared content-root path exists in this simulation
            var existing = new HashSet<string> { "wwwroot/App_Plugins/Articulate/Themes/Shared/Post.cshtml" };

            // Act: find first match in order
            var resolved = search.FirstOrDefault(existing.Contains);

            // Assert: we fall back to Shared content-root view
            _ = resolved.Should().Be("wwwroot/App_Plugins/Articulate/Themes/Shared/Post.cshtml");
        }

        [Test]
        public void Provider_GroupOrdering_NoDuplicates_And_Suffix()
        {
            // Arrange
            var provider = new DefaultArticulateViewLocationProvider();
            var theme = "Aurora";
            var list = provider.GetLocations(theme).ToList();

            // Assert: forward slashes only
            _ = list.Should().OnlyContain(p => !p.Contains("\\"));

            // Assert: all end with placeholder suffix
            _ = list.Should().OnlyContain(p => p.EndsWith("{0}.cshtml"));

            // Assert: no duplicates
            _ = list.Distinct().Count().Should().Be(list.Count);

            // Group ordering: user > legacy user > system (virtual, content-root) > shared (virtual, content-root) > markdown (virtual, content-root)
            var user = "~/Views/Articulate/";
            var legacy = "~/Views/ArticulateThemes/";
            var sysVirtTheme = "~/App_Plugins/Articulate/Themes/" + theme + "/";
            var sysRootTheme = "wwwroot/App_Plugins/Articulate/Themes/" + theme + "/";
            var sharedVirt = "~/App_Plugins/Articulate/Themes/Shared/";
            var sharedRoot = "wwwroot/App_Plugins/Articulate/Themes/Shared/";
            var mdVirt = "~/App_Plugins/Articulate/MarkdownEditor/";
            var mdRoot = "wwwroot/App_Plugins/Articulate/MarkdownEditor/";

            int GroupOf(string s)
            {
                if (s.StartsWith(user))
                {
                    return 0;
                }

                if (s.StartsWith(legacy))
                {
                    return 1;
                }

                if (s.StartsWith(sysVirtTheme))
                {
                    return 2;
                }

                if (s.StartsWith(sysRootTheme))
                {
                    return 3;
                }

                if (s.StartsWith(sharedVirt))
                {
                    return 4;
                }

                if (s.StartsWith(sharedRoot))
                {
                    return 5;
                }

                if (s.StartsWith(mdVirt))
                {
                    return 6;
                }

                if (s.StartsWith(mdRoot))
                {
                    return 7;
                }

                return 99;
            }

            var groups = list.Select(GroupOf).ToArray();

            // Order must be non-decreasing by group index
            for (var i = 1; i < groups.Length; i++)
            {
                _ = groups[i].Should().BeGreaterThanOrEqualTo(groups[i - 1]);
            }

            // Must include at least one from each expected group present in provider output
            _ = groups.Should().Contain(0);
            _ = groups.Should().Contain(1);
            _ = groups.Should().Contain(2);
            _ = groups.Should().Contain(3);
            _ = groups.Should().Contain(4);
            _ = groups.Should().Contain(5);
            _ = groups.Should().Contain(6);
            _ = groups.Should().Contain(7);
        }

        [Test]
        public void Provider_Includes_MarkdownEditor_Virtual_And_ContentRoot()
        {
            var provider = new DefaultArticulateViewLocationProvider();
            var locations = provider.GetLocations("Aurora").ToArray();

            _ = locations.Should().Contain(p => p == "~/App_Plugins/Articulate/MarkdownEditor/{0}.cshtml");
            _ = locations.Should().Contain(p => p == "wwwroot/App_Plugins/Articulate/MarkdownEditor/{0}.cshtml");
        }

        [Test]
        public void Provider_Includes_Partials_For_All_Groups()
        {
            var provider = new DefaultArticulateViewLocationProvider();
            var theme = "Aurora";
            var list = provider.GetLocations(theme).ToList();

            // User
            _ = list.Should().Contain(p =>
                p.StartsWith("~/Views/Articulate/" + theme + "/") && p.Contains("/Partials/") &&
                p.EndsWith("{0}.cshtml"));

            // Legacy user
            _ = list.Should().Contain(p =>
                p.StartsWith("~/Views/ArticulateThemes/" + theme + "/") && p.Contains("/Partials/") &&
                p.EndsWith("{0}.cshtml"));

            // System virtual
            _ = list.Should().Contain(p =>
                p.StartsWith("~/App_Plugins/Articulate/Themes/" + theme + "/") && p.Contains("/Partials/") &&
                p.EndsWith("{0}.cshtml"));

            // System content-root
            _ = list.Should().Contain(p =>
                p.StartsWith("wwwroot/App_Plugins/Articulate/Themes/" + theme + "/") && p.Contains("/Partials/") &&
                p.EndsWith("{0}.cshtml"));

            // Shared virtual
            _ = list.Should().Contain(p =>
                p.StartsWith("~/App_Plugins/Articulate/Themes/Shared/") && p.Contains("/Partials/") &&
                p.EndsWith("{0}.cshtml"));

            // Shared content-root
            _ = list.Should().Contain(p =>
                p.StartsWith("wwwroot/App_Plugins/Articulate/Themes/Shared/") && p.Contains("/Partials/") &&
                p.EndsWith("{0}.cshtml"));
        }

        [Test]
        public void Provider_Includes_Shared_Fallback_And_ContentRoot_System()
        {
            var provider = new DefaultArticulateViewLocationProvider();
            var locations = provider.GetLocations("Aurora").ToArray();

            _ = locations.Should().Contain(p => p.Contains("/Themes/Shared/") && p.EndsWith("{0}.cshtml"));
            _ = locations.Should().Contain(p =>
                p.StartsWith("wwwroot/App_Plugins/Articulate/") && p.Contains("/Themes/Aurora/"));
        }

        [Test]
        public void Provider_Includes_Views_For_System_And_Shared()
        {
            var provider = new DefaultArticulateViewLocationProvider();
            var theme = "Aurora";
            var list = provider.GetLocations(theme).ToList();

            _ = list.Should().Contain(p => p == "~/App_Plugins/Articulate/Themes/" + theme + "/Views/{0}.cshtml");
            _ = list.Should().Contain(p => p == "wwwroot/App_Plugins/Articulate/Themes/" + theme + "/Views/{0}.cshtml");
            _ = list.Should().Contain(p => p == "~/App_Plugins/Articulate/Themes/Shared/Views/{0}.cshtml");
            _ = list.Should().Contain(p => p == "wwwroot/App_Plugins/Articulate/Themes/Shared/Views/{0}.cshtml");
        }

        [Test]
        public void Provider_Layout_Fallback_To_Shared_Simulation()
        {
            var provider = new DefaultArticulateViewLocationProvider();
            var theme = "Aurora";
            var search = provider.GetLocations(theme)
                .Select(p => p.Replace("{0}.cshtml", "_Layout.cshtml"))
                .ToList();

            var existing = new HashSet<string> { "wwwroot/App_Plugins/Articulate/Themes/Shared/_Layout.cshtml" };

            var resolved = search.FirstOrDefault(existing.Contains);
            _ = resolved.Should().Be("wwwroot/App_Plugins/Articulate/Themes/Shared/_Layout.cshtml");
        }

        [Test]
        public void Provider_Layout_ThemeFirst_Simulation()
        {
            var provider = new DefaultArticulateViewLocationProvider();
            var theme = "Aurora";
            var search = provider.GetLocations(theme)
                .Select(p => p.Replace("{0}.cshtml", "_Layout.cshtml"))
                .ToList();

            var existing = new HashSet<string> { "~/App_Plugins/Articulate/Themes/Aurora/_Layout.cshtml" };

            var resolved = search.FirstOrDefault(existing.Contains);
            _ = resolved.Should().Be("~/App_Plugins/Articulate/Themes/Aurora/_Layout.cshtml");
        }

        [Test]
        public void Provider_Partials_Fallback_To_Shared_Simulation()
        {
            var provider = new DefaultArticulateViewLocationProvider();
            var theme = "Aurora";
            var search = provider.GetLocations(theme)
                .Select(p => p.Replace("{0}.cshtml", "Partials/HeadAssets.cshtml"))
                .ToList();

            // Only Shared content-root exists
            var existing = new HashSet<string>
            {
                "wwwroot/App_Plugins/Articulate/Themes/Shared/Partials/HeadAssets.cshtml"
            };

            var resolved = search.FirstOrDefault(existing.Contains);
            _ = resolved.Should().Be("wwwroot/App_Plugins/Articulate/Themes/Shared/Partials/HeadAssets.cshtml");
        }

        [Test]
        public void Provider_Partials_ThemeFirst_Simulation()
        {
            var provider = new DefaultArticulateViewLocationProvider();
            var theme = "Aurora";
            var search = provider.GetLocations(theme)
                .Select(p => p.Replace("{0}.cshtml", "Partials/HeadAssets.cshtml"))
                .ToList();

            // Theme override exists (virtual path)
            var existing = new HashSet<string> { "~/App_Plugins/Articulate/Themes/Aurora/Partials/HeadAssets.cshtml" };

            var resolved = search.FirstOrDefault(existing.Contains);
            _ = resolved.Should().Be("~/App_Plugins/Articulate/Themes/Aurora/Partials/HeadAssets.cshtml");
        }
    }
}
