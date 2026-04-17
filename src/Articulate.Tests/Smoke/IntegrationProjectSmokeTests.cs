#nullable enable
using NUnit.Framework;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Tests.Common.Testing;
using Umbraco.Cms.Tests.Integration.Testing;

namespace Articulate.Tests.Smoke
{
    [TestFixture]
    [UmbracoTest(Database = UmbracoTestOptions.Database.None)]
    public class IntegrationProjectSmokeTests : UmbracoIntegrationTest
    {
        [Test]
        public void Can_resolve_core_services()
        {
            Assert.Multiple(() =>
            {
                Assert.That(GetRequiredService<IContentService>(), Is.Not.Null);
                Assert.That(GetRequiredService<IContentTypeService>(), Is.Not.Null);
            });
        }
    }
}
