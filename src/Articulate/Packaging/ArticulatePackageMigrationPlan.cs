#nullable enable
using Umbraco.Cms.Infrastructure.Packaging;

namespace Articulate.Packaging
{
    public class ArticulatePackageMigrationPlan()
        : AutomaticPackageMigrationPlan(ArticulateConstants.Convention.Articulate);
}
