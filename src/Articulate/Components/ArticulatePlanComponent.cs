using Articulate.Migrations.Upgrade;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Migrations;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade;

namespace Articulate.Components
{
    public class ArticulatePlanComponent(
        ICoreScopeProvider scopeProvider,
        IMigrationPlanExecutor migrationPlanExecutor,
        IKeyValueService keyValueService,
        IRuntimeState runtimeState)
        : IAsyncComponent
    {
        /// <inheritdoc/>
        public Task InitializeAsync(bool isRestarting, CancellationToken cancellationToken)
        {
            Initialize();
            return Task.CompletedTask;
        }

        /// <inheritdoc/>
        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken) => Task.CompletedTask;

        private void Initialize()
        {
            if (runtimeState.Level < RuntimeLevel.Run)
            {
                return;
            }

            var migrationPlan = new ArticulatePlan();

            var upgrader = new Upgrader(migrationPlan);

            // TODO: "Use ExecuteAsync instead. Scheduled for removal in Umbraco 18."
            ExecutedMigrationPlan result = upgrader.Execute(migrationPlanExecutor, scopeProvider, keyValueService);
            if (!result.Successful)
            {
                throw new InvalidOperationException("Articulate migration failed.", result.Exception);
            }
        }

    }
}
