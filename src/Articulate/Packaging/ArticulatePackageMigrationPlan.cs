#nullable enable
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Infrastructure.Packaging;

namespace Articulate.Packaging
{
    [Weight(10)]
    public class ArticulatePackageMigrationPlan()
        : AutomaticPackageMigrationPlan(ArticulateConstants.Migration.AutomaticPackageMigrationPlan);
}
