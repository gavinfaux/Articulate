using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Migrations;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade;

namespace Articulate.Migrations.Upgrade.V_6_0_0
{
    public class MigrateImageCropperPathsToJsonComponent(
        ICoreScopeProvider scopeProvider,
        IMigrationPlanExecutor migrationPlanExecutor,
        IKeyValueService keyValueService,
        IRuntimeState runtimeState)
        : IAsyncComponent
    {
        public void Initialize()
        {
            if (runtimeState.Level < RuntimeLevel.Run)
            {
                return;
            }

            var migrationPlan = new MigrationPlan("MigrateImageCropperPathsToJson");

            migrationPlan.From(string.Empty).To<MigrateImageCropperPathsToJson>("Umbraco.ImageCropper");

            var upgrader = new Upgrader(migrationPlan);
            upgrader.Execute(migrationPlanExecutor, scopeProvider, keyValueService);
        }

        public void Terminate() { }
        public Task InitializeAsync(bool isRestarting, CancellationToken cancellationToken) => Task.Run(Initialize, cancellationToken);

        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken) => Task.Run(Terminate, cancellationToken);
    }
}
