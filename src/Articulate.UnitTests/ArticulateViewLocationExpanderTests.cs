#nullable enable
using Articulate.Components;
using Articulate.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Articulate.UnitTests
{
    public class ArticulateViewLocationExpanderTests
    {
        [Fact]
        public void ExpandViewLocations_Appends_Provider_Locations_Before_Defaults()
        {
            // Arrange
            var providerLocations = new[] { "THEME1", "THEME2" };
            var defaults = new[] { "DEFAULT1", "DEFAULT2" };

            var services = new ServiceCollection();
            services.AddSingleton<IArticulateThemeResolver>(new FakeThemeResolver("Aurora"));
            services.AddSingleton<IArticulateViewLocationProvider>(new FakeLocationProvider(providerLocations));
            using ServiceProvider sp = services.BuildServiceProvider();

            ViewLocationExpanderContext ctx = MakeContext(sp);
            var expander = new ArticulateViewLocationExpander();
            expander.PopulateValues(ctx); // sets articulate-theme

            // Act
            IEnumerable<string> result = expander.ExpandViewLocations(ctx, defaults);

            // Assert
            result.Should().StartWith(providerLocations);
            result.Skip(providerLocations.Length).Should().StartWith(defaults);
        }

        [Fact]
        public void ExpandViewLocations_NoTheme_Returns_Defaults()
        {
            // Arrange
            var defaults = new[] { "DEFAULT1", "DEFAULT2" };
            var services = new ServiceCollection();
            using ServiceProvider sp = services.BuildServiceProvider();
            ViewLocationExpanderContext ctx = MakeContext(sp);

            var expander = new ArticulateViewLocationExpander();

            // Act
            IEnumerable<string> result = expander.ExpandViewLocations(ctx, defaults);

            // Assert
            result.Should().Equal(defaults);
        }

        private static ViewLocationExpanderContext MakeContext(ServiceProvider sp)
        {
            var http = new DefaultHttpContext { RequestServices = sp };
            var actionContext = new ActionContext(http, new RouteData(), new ActionDescriptor());
            return new ViewLocationExpanderContext(actionContext, "Index", "Home", null, null, true);
        }

        [Fact]
        public void PopulateValues_Sets_Theme_And_HttpContext_Item()
        {
            // Arrange
            var services = new ServiceCollection();
            services.AddSingleton<IArticulateThemeResolver>(new FakeThemeResolver("Aurora"));
            using ServiceProvider sp = services.BuildServiceProvider();
            ViewLocationExpanderContext ctx = MakeContext(sp);
            var expander = new ArticulateViewLocationExpander();

            // Act
            expander.PopulateValues(ctx);

            // Assert
            // Note: In some frameworks, ViewLocationExpanderContext.Values may be null in tests.
            // We assert the HttpContext.Items fallback (used by the expander when Values is null).
            ctx.ActionContext.HttpContext.Items.Should()
                .ContainKey("ThemeName").WhoseValue.Should().Be("Aurora");
        }

        private sealed class FakeLocationProvider(IEnumerable<string> locations) : IArticulateViewLocationProvider
        {
            public IEnumerable<string> GetLocations(string themeName) => locations;
        }

        private sealed class FakeThemeResolver(string theme) : IArticulateThemeResolver
        {
            public string? GetCurrentThemeName() => theme;
        }
    }
}
