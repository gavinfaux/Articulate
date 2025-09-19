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
using Moq;
using NUnit.Framework;

namespace Articulate.UnitTests
{
    [TestFixture]
    public class ArticulateViewLocationExpanderTests
    {
        [Test]
        public void ExpandViewLocations_Appends_Provider_Locations_Before_Defaults()
        {
            var providerLocations = new[] { "THEME1", "THEME2" };
            var defaults = new[] { "DEFAULT1", "DEFAULT2" };

            var themeResolver = new Mock<IArticulateThemeResolver>();
            themeResolver.Setup(r => r.GetCurrentThemeName()).Returns("Aurora");

            var locationProvider = new Mock<IArticulateViewLocationProvider>();
            locationProvider.Setup(p => p.GetLocations("Aurora")).Returns(providerLocations);

            var services = new ServiceCollection();
            services.AddSingleton(themeResolver.Object);
            services.AddSingleton(locationProvider.Object);
            using ServiceProvider sp = services.BuildServiceProvider();

            ViewLocationExpanderContext ctx = MakeContext(sp);
            var expander = new ArticulateViewLocationExpander();
            expander.PopulateValues(ctx);

            IEnumerable<string> result = expander.ExpandViewLocations(ctx, defaults);

            result.Should().StartWith(providerLocations);
            result.Skip(providerLocations.Length).Should().StartWith(defaults);
            themeResolver.Verify(r => r.GetCurrentThemeName(), Times.Once);
            locationProvider.Verify(p => p.GetLocations("Aurora"), Times.Once);
        }

        [Test]
        public void ExpandViewLocations_NoTheme_Returns_Defaults()
        {
            var defaults = new[] { "DEFAULT1", "DEFAULT2" };

            var themeResolver = new Mock<IArticulateThemeResolver>();
            themeResolver.Setup(r => r.GetCurrentThemeName()).Returns((string?)null);

            var locationProvider = new Mock<IArticulateViewLocationProvider>(MockBehavior.Strict);

            var services = new ServiceCollection();
            services.AddSingleton(themeResolver.Object);
            services.AddSingleton(locationProvider.Object);
            using ServiceProvider sp = services.BuildServiceProvider();

            ViewLocationExpanderContext ctx = MakeContext(sp);
            var expander = new ArticulateViewLocationExpander();
            expander.PopulateValues(ctx);

            IEnumerable<string> result = expander.ExpandViewLocations(ctx, defaults);

            result.Should().Equal(defaults);
            locationProvider.Verify(p => p.GetLocations(It.IsAny<string>()), Times.Never);
        }

        private static ViewLocationExpanderContext MakeContext(ServiceProvider sp)
        {
            var http = new DefaultHttpContext { RequestServices = sp };
            var actionContext = new ActionContext(http, new RouteData(), new ActionDescriptor());
            return new ViewLocationExpanderContext(actionContext, "Index", "Home", null, null, true);
        }

        [Test]
        public void PopulateValues_Sets_Theme_And_HttpContext_Item()
        {
            var themeResolver = new Mock<IArticulateThemeResolver>();
            themeResolver.Setup(r => r.GetCurrentThemeName()).Returns("Aurora");

            var services = new ServiceCollection();
            services.AddSingleton(themeResolver.Object);
            using ServiceProvider sp = services.BuildServiceProvider();

            ViewLocationExpanderContext ctx = MakeContext(sp);
            var expander = new ArticulateViewLocationExpander();

            expander.PopulateValues(ctx);

            ctx.ActionContext.HttpContext.Items.Should()
                .ContainKey("ThemeName").WhoseValue.Should().Be("Aurora");
            themeResolver.Verify(r => r.GetCurrentThemeName(), Times.Once);
        }
    }
}
