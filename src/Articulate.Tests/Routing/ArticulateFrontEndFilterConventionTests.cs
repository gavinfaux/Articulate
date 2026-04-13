#nullable enable
using System.Reflection;
using Articulate.Controllers;
using Articulate.Routing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using NUnit.Framework;

namespace Articulate.Tests.Routing
{
    [TestFixture]
    public class ArticulateFrontEndFilterConventionTests
    {
        [Test]
        public void Apply_adds_route_cache_refresher_filter_only_to_articulate_controllers()
        {
            var articulateController = new ControllerModel(typeof(ArticulateController).GetTypeInfo(), []);
            var nonArticulateController = new ControllerModel(typeof(TestController).GetTypeInfo(), []);

            var application = new ApplicationModel();
            application.Controllers.Add(articulateController);
            application.Controllers.Add(nonArticulateController);

            var sut = new ArticulateFrontEndFilterConvention();

            sut.Apply(application);

            Assert.That(articulateController.Filters, Has.Count.EqualTo(1));
            Assert.That(articulateController.Filters.Single(), Is.TypeOf<ServiceFilterAttribute>());

            var filter = (ServiceFilterAttribute)articulateController.Filters.Single();
            Assert.That(filter.ServiceType, Is.EqualTo(typeof(RouteCacheRefresherFilter)));
            Assert.That(nonArticulateController.Filters, Is.Empty);
        }

        private sealed class TestController : Controller;
    }
}
