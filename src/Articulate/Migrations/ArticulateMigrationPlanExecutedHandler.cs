using Articulate.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Notifications;

#nullable enable

namespace Articulate.Migrations;

/// <summary>
/// Handles notifications for Articulate migration plans.
/// </summary>
public class ArticulateMigrationPlanExecutedHandler(
    IRuntimeState runtimeState,
    IContentService contentService,
    IContentTypeService contentTypeService,
    ISqlContext sqlContext,
    ILogger<ArticulateMigrationPlanExecutedHandler> logger,
    IOptions<ArticulateOptions> options)
    : INotificationHandler<MigrationPlansExecutedNotification>, INotificationHandler<ImportedPackageNotification>
{
    /// <summary>
    /// Handles the <see cref="MigrationPlansExecutedNotification"/>.
    /// </summary>
    /// <param name="notification">The notification information.</param>
    public void Handle(MigrationPlansExecutedNotification notification)
    {
        if (!ShouldPublish("migration execution", notification.ExecutedPlans))
        {
            return;
        }

        PublishArticulateTree("migration execution");
    }

    /// <summary>
    /// Handles the <see cref="ImportedPackageNotification"/>.
    /// </summary>
    /// <param name="notification">The notification information.</param>
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
            logger.LogInformation(
                "Umbraco is not in Run level, skipping Articulate post-migration tasks ({Trigger}).",
                trigger);
            return false;
        }

        if (!options.Value.AutoPublishOnStartup)
        {
            logger.LogInformation(
                "AutoPublishOnStartup is false, skipping Articulate post-migration tasks ({Trigger}).", trigger);
            return false;
        }

        if (executedPlans is not null && !HasMigrationRun(executedPlans))
        {
            logger.LogInformation(
                "No Articulate migrations have run for this notification ({Trigger}), skipping publish.", trigger);
            return false;
        }

        return true;
    }

    private void PublishArticulateTree(string trigger)
    {
        logger.LogInformation("Beginning Articulate post-migration tasks triggered by {Trigger}", trigger);

        IContentType? articulateContentType = contentTypeService.Get(ArticulateConstants.ContentType.Articulate);
        if (articulateContentType is null)
        {
            logger.LogWarning(
                "The Articulate content type was not found when handling {Trigger}",
                trigger);
            return;
        }

        logger.LogInformation("Attempting to get Articulate root content for trigger {Trigger}", trigger);

        IEnumerable<IContent> articulateRoots = contentService.GetPagedOfType(
            articulateContentType.Id,
            0,
            int.MaxValue,
            out _,
            sqlContext.Query<IContent>().Where(x => x.Trashed == false))
            .Where(x => !x.Trashed);

        var publishedAny = false;
        foreach (IContent contentHome in articulateRoots)
        {
            logger.LogInformation(
                "Found Articulate root node with ID {NodeId} for trigger {Trigger}",
                contentHome.Id,
                trigger);

            try
            {
                logger.LogInformation(
                    "Attempting to publish Articulate branch for root node ID {NodeId} and trigger {Trigger}",
                    contentHome.Id,
                    trigger);

                bool isFirstTimePublish = !contentHome.Published;
                PublishBranchFilter filter = isFirstTimePublish
                    ? PublishBranchFilter.IncludeUnpublished
                    : PublishBranchFilter.ForceRepublish;

                logger.LogInformation(
                    "Publish filter for root node ID {NodeId} is {Filter} (FirstTime: {IsFirstTime})",
                    contentHome.Id,
                    filter,
                    isFirstTimePublish);

                IEnumerable<PublishResult> resultEnumerable =
                    contentService.PublishBranch(contentHome, filter, []);
                var result = resultEnumerable.ToList();
                publishedAny = true;

                if (result.All(r => r.Success))
                {
                    logger.LogInformation(
                        "Published Articulate Home page and descendants for root node ID {NodeId} after {Trigger}",
                        contentHome.Id,
                        trigger);
                }
                else
                {
                    var failures = result.Where(r => !r.Success).ToList();
                    logger.LogWarning(
                        "Partial publish failure for root node ID {NodeId}: {FailureCount} items failed for trigger {Trigger}",
                        contentHome.Id,
                        failures.Count,
                        trigger);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex,
                    "Error publishing Articulate Home page and descendants for root node ID {NodeId} after {Trigger}",
                    contentHome.Id,
                    trigger);
            }
        }

        if (!publishedAny)
        {
            logger.LogWarning("No installed Articulate root nodes were found when handling {Trigger}", trigger);
        }
    }

    private bool HasMigrationRun(IEnumerable<ExecutedMigrationPlan> executedMigrationPlans)
    {
        foreach (ExecutedMigrationPlan executedMigrationPlan in executedMigrationPlans)
        {
            logger.LogInformation(
                "Executed {Name}:{Success}",
                executedMigrationPlan.Plan.Name,
                executedMigrationPlan.Successful);

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
