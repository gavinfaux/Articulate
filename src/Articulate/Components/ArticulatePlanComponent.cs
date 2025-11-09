using Articulate.Migrations.Upgrade;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Migrations;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
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
        public Task InitializeAsync(bool isRestarting, CancellationToken cancellationToken) => Task.Run(Initialize, cancellationToken);

        /// <inheritdoc/>
        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken) => Task.Run(Terminate, cancellationToken);

        private void Initialize()
        {
            if (runtimeState.Level < RuntimeLevel.Run)
            {
                return;
            }

            var migrationPlan = new ArticulatePlan();

            var upgrader = new Upgrader(migrationPlan);
            _ = upgrader.Execute(migrationPlanExecutor, scopeProvider, keyValueService);
        }

        private static void Terminate()
        {
        }
    }
}
