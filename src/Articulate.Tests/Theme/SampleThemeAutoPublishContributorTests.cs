#nullable enable
using System.IO.Compression;
using System.Reflection;
using Articulate;
using Articulate.Services;
using Articulate.Theme.Sample;
using Articulate.Theme.Sample.Packaging;
using Articulate.Packaging;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Packaging;
using Umbraco.Cms.Infrastructure.Packaging;
using NUnit.Framework;

namespace Articulate.Tests.Theme
{
    [TestFixture]
    public class SampleThemeAutoPublishContributorTests
    {
        [Test]
        public void Returns_articulate_publish_target()
        {
            SampleThemeAutoPublishContributor contributor = new();

            AutoPublishTarget target = contributor.GetTargets().Single();

            Assert.That(target.PackageName, Is.EqualTo(SampleTheme.PackageName));
            Assert.That(target.RootContentTypeAlias, Is.EqualTo(ArticulateConstants.ContentType.Articulate));
            Assert.That(target.PublishDescendants, Is.True);
        }

        [Test]
        public void Embeds_publishable_package_zip_content()
        {
            Assembly assembly = typeof(SampleThemeAutoPublishContributor).Assembly;
            string? resourceName = assembly.GetManifestResourceNames()
                .FirstOrDefault(name => name.EndsWith("Packaging.package.zip", StringComparison.OrdinalIgnoreCase));

            Assert.That(resourceName, Is.Not.Null);

            using Stream? stream = assembly.GetManifestResourceStream(resourceName!);
            Assert.That(stream, Is.Not.Null);

            using var archive = new ZipArchive(stream!, ZipArchiveMode.Read, leaveOpen: false);
            ZipArchiveEntry? packageXmlEntry = archive.GetEntry("package.xml");

            Assert.That(packageXmlEntry, Is.Not.Null);

            using var reader = new StreamReader(packageXmlEntry!.Open());
            string packageXml = reader.ReadToEnd();

            Assert.That(packageXml, Does.Contain("<Documents>"));
            Assert.That(packageXml, Does.Contain("<MediaItems>"));
        }

        [Test]
        public void Declares_an_automatic_package_migration_plan()
        {
            Assert.That(typeof(SampleThemePackageMigrationPlan).IsSubclassOf(typeof(AutomaticPackageMigrationPlan)), Is.True);
            Assert.That(typeof(SampleThemePackageMigrationPlan).Name, Does.StartWith(nameof(SampleThemePackageMigrationPlan)));
        }

        [Test]
        public void Package_migration_plans_are_ordered_by_weight()
        {
            IServiceCollection services = new ServiceCollection();

            PackageMigrationPlanCollectionBuilder builder = new();
            builder.Add<ArticulatePackageMigrationPlan>();
            builder.Add<SampleThemePackageMigrationPlan>();
            builder.RegisterWith(services);

            using ServiceProvider provider = services.BuildServiceProvider();

            PackageMigrationPlanCollection plans = provider.GetRequiredService<PackageMigrationPlanCollection>();

            Assert.That(
                plans.Select(plan => plan.Name),
                Is.EqualTo(new[] { ArticulateConstants.Migration.AutomaticPackageMigrationPlan, SampleTheme.PackageName }));
        }
    }
}
