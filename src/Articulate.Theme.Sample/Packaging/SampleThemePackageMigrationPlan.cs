#nullable enable
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Infrastructure.Packaging;

namespace Articulate.Theme.Sample.Packaging
{
    /// <summary>
    /// Imports the sample theme package data using Umbraco's package migration pipeline.
    /// </summary>
    [Weight(20)]
    public sealed class SampleThemePackageMigrationPlan() : AutomaticPackageMigrationPlan(SampleTheme.PackageName);
}
