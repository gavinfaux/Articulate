#nullable enable
using Microsoft.AspNetCore.Builder;
using NUnit.Framework;

namespace Articulate.Tests
{
    [TestFixture]
    public class StartupSmokeTests
    {
        [Test]
        public void WebsiteHostStartup_DoesNotThrow()
        {
            Assert.DoesNotThrow(() =>
            {
                using var app = BuildApplication();
            });
        }

#if NET10_0
        [Test]
        public void DeliveryApiHostStartup_DoesNotThrow()
        {
            Assert.DoesNotThrow(() =>
            {
                using var app = BuildApplication(static builder => builder.AddDeliveryApi());
            });
        }

        [Test]
        public void DeliveryApiHostStartup_WithDevelopmentModeBackOfficeReferenced_DoesNotThrow()
        {
            var developmentModeType = Type.GetType(
                "Umbraco.Cms.DevelopmentMode.Backoffice.InMemoryAuto.InMemoryModelFactory, Umbraco.Cms.DevelopmentMode.Backoffice",
                throwOnError: false);

            Assert.That(developmentModeType, Is.Not.Null);

            Assert.DoesNotThrow(() =>
            {
                using var app = BuildApplication(
                    static builder => builder.AddDeliveryApi(),
                    "Development");
            });
        }
#endif

        private static WebApplication BuildApplication(
            Action<IUmbracoBuilder>? configureUmbraco = null,
            string environmentName = "Production")
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions
            {
                ApplicationName = typeof(StartupSmokeTests).Assembly.GetName().Name,
                ContentRootPath = AppContext.BaseDirectory,
                EnvironmentName = environmentName,
            });

            var umbracoBuilder = builder.CreateUmbracoBuilder()
                .AddBackOffice()
                .AddWebsite();

            configureUmbraco?.Invoke(umbracoBuilder);

            umbracoBuilder
                .AddComposers()
                .Build();

            return builder.Build();
        }
    }
}
