using Articulate.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Notifications;

#nullable enable

namespace Articulate.Migrations;

public class ArticulateMigrationPlanExecutedHandler(
    IRuntimeState runtimeState,
    IContentService contentService,
    ILogger<ArticulateMigrationPlanExecutedHandler> logger,
    IOptions<ArticulateOptions> options)
    : INotificationHandler<MigrationPlansExecutedNotification>, INotificationHandler<ImportedPackageNotification>
{
    public void Handle(MigrationPlansExecutedNotification notification)
    {
        if (!ShouldPublish("migration execution", notification.ExecutedPlans))
        {
            return;
        }

        PublishArticulateTree("migration execution");
    }

    public void Handle(ImportedPackageNotification notification)
    {
        if (!ShouldPublish("package import"))
        {
            return;
        }

        PublishArticulateTree("package import");
    }

    private bool ShouldPublish(string trigger, IEnumerable<ExecutedMigrationPlan>? executedPlans = null)
    {
        if (runtimeState.Level is not RuntimeLevel.Run)
        {
            logger.LogInformation("Umbraco is not in Run level, skipping Articulate post-migration tasks ({Trigger}).", trigger);
            return false;
        }

        if (!options.Value.AutoPublishOnStartup)
        {
            logger.LogInformation("AutoPublishOnStartup is false, skipping Articulate post-migration tasks ({Trigger}).", trigger);
            return false;
        }

        if (executedPlans is not null && HasMigrationRun(executedPlans) is false)
        {
            logger.LogInformation("No Articulate migrations have run for this notification ({Trigger}), skipping publish.", trigger);
            return false;
        }

        return true;
    }

    private void PublishArticulateTree(string trigger)
    {
        logger.LogInformation("Beginning Articulate post-migration tasks triggered by {Trigger}", trigger);

        logger.LogInformation("Attempting to get Articulate root content for trigger {Trigger}", trigger);
        IContent? contentHome = contentService.GetRootContent()
            .FirstOrDefault(x => x.ContentType.Alias == ArticulateConstants.ContentType.Articulate);
        if (contentHome is not null)
        {
            logger.LogInformation("Found Articulate root node with ID {NodeId} for trigger {Trigger}", contentHome.Id, trigger);
            try
            {
                logger.LogInformation("Attempting to publish Articulate branch for root node ID {NodeId} and trigger {Trigger}", contentHome.Id, trigger);
                contentService.PublishBranch(contentHome, PublishBranchFilter.IncludeUnpublished, []);
                logger.LogInformation("Published Articulate Home page and descendants after {Trigger}", trigger);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error publishing Articulate Home page and descendants for trigger {Trigger}", trigger);
            }
        }
        else
        {
            logger.LogWarning("The installed Articulate root node was not found when handling {Trigger}", trigger);
        }
    }

    private bool HasMigrationRun(IEnumerable<ExecutedMigrationPlan> executedMigrationPlans)
    {
        foreach (ExecutedMigrationPlan executedMigrationPlan in executedMigrationPlans)
        {
            logger.LogInformation("Executed {Name}:{Success}", executedMigrationPlan.Plan.Name, executedMigrationPlan.Successful);

            if (executedMigrationPlan.Successful &&
                (executedMigrationPlan.Plan.Name == ArticulateConstants.Migration.ArticulatePackageMigrationPlan ||
                 executedMigrationPlan.Plan.Name == ArticulateConstants.Migration.AutomaticPackageMigrationPlan))
            {
                return true;
            }
        }

        return false;
    }
}
