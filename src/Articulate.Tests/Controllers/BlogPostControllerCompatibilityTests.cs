using Articulate.Controllers;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Web;

namespace Articulate.Tests.Controllers;

[TestFixture]
public class BlogPostControllerCompatibilityTests
{
    [Test]
    public void LegacyConstructor_DoesNotRequireGlobalServices()
    {
        Assert.DoesNotThrow(() => new ArticulateMarkdownController(
            NullLogger<ArticulateMarkdownController>.Instance,
            Mock.Of<ICompositeViewEngine>(),
            Mock.Of<IUmbracoContextAccessor>(),
            Mock.Of<IPublishedValueFallback>()));
    }
}
