#nullable enable
using Articulate.Models;
using Articulate.Options;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Web.Common.DependencyInjection;

namespace Articulate.Tests.Models;

[TestFixture]
public class PostModelCommentsOptionsTests
{
    [Test]
    public void Constructor_UsesSuppliedCommentOptions()
    {
        IServiceProvider original = StaticServiceProvider.Instance;
        using ServiceProvider provider = new ServiceCollection()
            .AddSingleton(Mock.Of<IPublishedValueFallback>())
            .BuildServiceProvider();
        StaticServiceProvider.Instance = provider;
        try
        {
            Mock<IPublishedContent> content = new();
            content.SetupGet(x => x.Name).Returns("Post");
            var options = new ArticulateCommentsOptions
            {
                Giscus = new GiscusCommentsOptions { DataMapping = "url" },
            };
            var post = new PostModel(content.Object, Mock.Of<IPublishedValueFallback>(), options);

            Assert.That(post.GiscusMapping, Is.EqualTo("url"));
        }
        finally
        {
            StaticServiceProvider.Instance = original;
        }
    }
}
