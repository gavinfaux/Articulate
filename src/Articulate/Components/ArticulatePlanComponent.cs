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
    /// <summary>
    /// Component to execute Articulate migration plans.
    /// </summary>
    public class ArticulatePlanComponent(
        ICoreScopeProvider scopeProvider,
        IMigrationPlanExecutor migrationPlanExecutor,
        IKeyValueService keyValueService,
        IRuntimeState runtimeState)
        : IAsyncComponent
    {
        /// <inheritdoc/>
        public async Task InitializeAsync(bool isRestarting, CancellationToken cancellationToken)
        {
            await InitializeAsync();
        }

        /// <inheritdoc/>
        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken) => Task.CompletedTask;

        private async Task InitializeAsync()
        {
            if (runtimeState.Level < RuntimeLevel.Run)
            {
                return;
            }

            var migrationPlan = new ArticulatePlan();

            var upgrader = new Upgrader(migrationPlan);

            ExecutedMigrationPlan result = await upgrader.ExecuteAsync(
                migrationPlanExecutor,
                scopeProvider,
                keyValueService);
            if (!result.Successful)
            {
                throw new InvalidOperationException("Articulate migration failed.", result.Exception);
            }
        }
    }
}
