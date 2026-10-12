#nullable enable
using Articulate.Options;
using Examine;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.Navigation;
using Umbraco.Cms.Core.Web;

namespace Articulate.Tests.Models
{
    /// <summary>
    /// Tests <see cref="MasterModel.ResolveGiscusRequired"/>.
    /// The override picks blog-doc values over appsettings values when all four Giscus fields are populated.
    /// It falls through to appsettings when any field is empty.
    /// Provider priority (Disqus wins over Giscus) lives in the Razor view as an <c>if/else if</c> chain on <c>IsDisqusEnabled</c> / <c>IsGiscusEnabled</c>.
    /// View tests cover that logic.
    /// </summary>
    [TestFixture]
    public class ArticulateCommentsProviderResolutionTests
    {
        private static readonly GiscusCommentsOptions _appsettings = new()
        {
            DataRepo = "app/repo",
            DataRepoId = "R_app",
            DataCategory = "app/cat",
            DataCategoryId = "DIC_app",
        };

        [Test]
        public void PostModel_UsesConfiguredCommentOptions()
        {
            var options = new ArticulateCommentsOptions
            {
                Giscus = new GiscusCommentsOptions { ScriptSrc = "https://comments.example.com/client.js" },
            };

            IServiceProvider original = StaticServiceProvider.Instance;
            using ServiceProvider services = new ServiceCollection()
                .AddSingleton(Mock.Of<IPublishedValueFallback>())
                .AddSingleton(Mock.Of<IVariationContextAccessor>())
                .AddSingleton(Mock.Of<IPublishedUrlProvider>())
                .AddSingleton(Mock.Of<IDomainCache>())
                .AddSingleton(Mock.Of<IPublishedContentCache>())
                .AddSingleton(Mock.Of<IMediaNavigationQueryService>())
                .AddSingleton(Mock.Of<IPublishedModelFactory>())
                .AddSingleton(Mock.Of<IDocumentNavigationQueryService>())
                .AddSingleton(Mock.Of<IPublishedContentStatusFilteringService>())
                .AddSingleton(Mock.Of<IUserService>())
                .AddSingleton(Mock.Of<IUmbracoContextAccessor>())
                .AddSingleton(Mock.Of<ISiteDomainMapper>())
                .AddSingleton(Mock.Of<ITemplateService>())
                .AddSingleton(Mock.Of<IContentTypeService>())
                .AddSingleton(Mock.Of<IMediaTypeService>())
                .AddSingleton(Mock.Of<IMemberTypeService>())
                .AddSingleton(Mock.Of<IFileService>())
                .AddSingleton(Microsoft.Extensions.Options.Options.Create(new WebRoutingSettings()))
                .AddSingleton(Mock.Of<IExamineManager>())
                .AddSingleton(Mock.Of<IDocumentUrlService>())
                .BuildServiceProvider();
            StaticServiceProvider.Instance = services;
            try
            {
                var model = new Articulate.Models.PostModel(Mock.Of<IPublishedContent>(), Mock.Of<IPublishedValueFallback>(), options);
                Assert.That(model.GiscusScriptSrc, Is.EqualTo("https://comments.example.com/client.js"));
            }
            finally
            {
                StaticServiceProvider.Instance = original;
            }
        }

        [Test]
        public void ResolveGiscusRequired_UsesAppsettings_WhenAllDocValuesAreEmpty()
        {
            (string Repo, string RepoId, string Category, string CategoryId) result = MasterModel.ResolveGiscusRequired(string.Empty, string.Empty, string.Empty, string.Empty, _appsettings);

            Assert.That(result, Is.EqualTo(("app/repo", "R_app", "app/cat", "DIC_app")));
        }

        [Test]
        public void ResolveGiscusRequired_UsesDocValues_WhenAllFourArePopulated()
        {
            (string Repo, string RepoId, string Category, string CategoryId) result = MasterModel.ResolveGiscusRequired(
                "blog/repo", "R_blog", "blog/cat", "DIC_blog", _appsettings);

            Assert.That(result, Is.EqualTo(("blog/repo", "R_blog", "blog/cat", "DIC_blog")));
        }

        [TestCase("", "R_blog", "blog/cat", "DIC_blog")]
        [TestCase("blog/repo", "", "blog/cat", "DIC_blog")]
        [TestCase("blog/repo", "R_blog", "", "DIC_blog")]
        [TestCase("blog/repo", "R_blog", "blog/cat", "")]
        [TestCase("   ", "R_blog", "blog/cat", "DIC_blog")]
        public void ResolveGiscusRequired_DiscardsPartialOverride_AndUsesAppsettings(
            string docRepo, string docRepoId, string docCategory, string docCategoryId)
        {
            (string Repo, string RepoId, string Category, string CategoryId) result = MasterModel.ResolveGiscusRequired(
                docRepo, docRepoId, docCategory, docCategoryId, _appsettings);

            Assert.That(result, Is.EqualTo(("app/repo", "R_app", "app/cat", "DIC_app")));
        }
    }
}
