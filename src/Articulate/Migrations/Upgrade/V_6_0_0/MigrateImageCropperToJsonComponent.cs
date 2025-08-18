using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Migrations;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade;

namespace Articulate.Migrations.Upgrade.V_6_0_0
{
    public class MigrateImageCropperToJsonComponent(
        ICoreScopeProvider scopeProvider,
        IMigrationPlanExecutor migrationPlanExecutor,
        IKeyValueService keyValueService,
        IRuntimeState runtimeState)
        : IAsyncComponent
    {
        private void Initialize()
        {
            if (runtimeState.Level < RuntimeLevel.Run)
            {
                return;
            }

            var migrationPlan = new MigrationPlan("Articulate.MigrateImageCropperToJson");
            // 0ef1247c-c2b3-3343-8bba-8f83d3c36b83
            migrationPlan.From(string.Empty).To<V_6_0_0.MigrateImageCropperToJson>("a26a8851-cb9f-4e02-9dcf-1937def8abe1");

            var upgrader = new Upgrader(migrationPlan);
            upgrader.Execute(migrationPlanExecutor, scopeProvider, keyValueService);
        }

        private static void Terminate() { }

        public Task InitializeAsync(bool isRestarting, CancellationToken cancellationToken) => Task.Run(Initialize, cancellationToken);

        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken) => Task.Run(Terminate, cancellationToken);
    }
}
