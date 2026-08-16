using Articulate;
using Articulate.Components;
using Articulate.Packaging;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Packaging;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Tests.Common.Testing;
using Umbraco.Cms.Tests.Integration.Testing;

namespace Articulate.Tests.Integration;

[TestFixture]
[NonParallelizable]
[UmbracoTest(
    Database = UmbracoTestOptions.Database.NewSchemaPerFixture,
    Logger = UmbracoTestOptions.Logger.Console,
    Boot = true)]
public sealed class ArticulatePackageInstallIntegrationTests : UmbracoIntegrationTest
{
    private IContentService ContentService => GetRequiredService<IContentService>();

    private IContentTypeService ContentTypeService => GetRequiredService<IContentTypeService>();

    protected override void CustomTestSetup(IUmbracoBuilder builder)
    {
        new ArticulateComposer().Compose(builder);
        builder.PackageMigrationPlans().Add<ArticulatePackageMigrationPlan>();
    }

    [Test]
    public void Umbraco_boots_and_reaches_run()
    {
        WaitForUmbracoToRun();
    }

    [Test]
    public void Unattended_install_restores_the_known_good_articulate_package()
    {
        WaitForUmbracoToRun();

        Assert.That(
            ContentTypeService.Get(ArticulateConstants.ContentType.Articulate),
            Is.Not.Null);
    }

    [Test]
    public void Unattended_install_restores_the_root_blog_node()
    {
        WaitForUmbracoToRun();

        Assert.That(ContentService.GetRootContent().Any(x => x.Name == "Blog"), Is.True);
    }

    [Test]
    public void Restored_blog_is_unpublished()
    {
        WaitForUmbracoToRun();

        IContent blog = ContentService.GetRootContent().Single(x => x.Name == "Blog");
        Assert.That(blog.Published, Is.False);
        Assert.That(blog.PublishDate, Is.Null);
    }

    private void WaitForUmbracoToRun()
    {
        IRuntimeState runtimeState = Services.GetRequiredService<IRuntimeState>();
        Assert.That(
            SpinWait.SpinUntil(() => runtimeState.Level == RuntimeLevel.Run, TimeSpan.FromSeconds(30)),
            Is.True,
            $"Umbraco did not finish unattended startup: {runtimeState.Level}/{runtimeState.Reason}");
    }
}

[TestFixture]
[NonParallelizable]
[UmbracoTest(
    Database = UmbracoTestOptions.Database.NewSchemaPerFixture,
    Logger = UmbracoTestOptions.Logger.Console,
    Boot = true)]
public sealed class ArticulatePackagePublishIntegrationTests : UmbracoIntegrationTest
{
    private IContentService ContentService => GetRequiredService<IContentService>();

    protected override void CustomTestSetup(IUmbracoBuilder builder)
    {
        new ArticulateComposer().Compose(builder);
        builder.PackageMigrationPlans().Add<ArticulatePackageMigrationPlan>();
    }

    [Test]
    public void Restored_blog_can_be_published()
    {
        IRuntimeState runtimeState = Services.GetRequiredService<IRuntimeState>();
        Assert.That(
            SpinWait.SpinUntil(() => runtimeState.Level == RuntimeLevel.Run, TimeSpan.FromSeconds(30)),
            Is.True,
            $"Umbraco did not finish unattended startup: {runtimeState.Level}/{runtimeState.Reason}");

        IContent blog = ContentService.GetRootContent().Single(x => x.Name == "Blog");
        PublishResult result = ContentService.Publish(blog, ["*"], -1);

        Assert.That(result.Success, Is.True);
        Assert.That(ContentService.GetById(blog.Id)?.Published, Is.True);
    }
}
