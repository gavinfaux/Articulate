#nullable enable
using System.IO.Compression;
using System.Reflection;
using Articulate.Options;
using Articulate.Services;
using Umbraco.Cms.Core.Events;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Packaging;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Persistence;
using Umbraco.Cms.Infrastructure.Scoping;
using Umbraco.Extensions;

namespace Articulate.Migrations
{
    /// <summary>
    /// Optional opt-in package-side auto-publish hook for content-bearing package installs.
    /// </summary>
    internal sealed class ArticulateAutoPublishHandler(
        IRuntimeState runtimeState,
        IContentService contentService,
        IContentTypeService contentTypeService,
        ISqlContext sqlContext,
        IOptions<ArticulateOptions> options,
        IEnumerable<IAutoPublishContributor> autoPublishContributors,
        ILogger<ArticulateAutoPublishHandler> logger,
        IScopeProvider scopeProvider)
        : INotificationHandler<ImportedPackageNotification>
    {
        private readonly IReadOnlyList<IAutoPublishContributor> _autoPublishContributors =
            autoPublishContributors.ToArray();

        /// <inheritdoc/>
        public void Handle(ImportedPackageNotification notification)
        {
            if (!ShouldAutoPublish("package import", notification.InstallationSummary))
            {
                return;
            }

            IReadOnlyList<IAutoPublishContributor> contributors = GetEligibleContributors();
            if (contributors.Count == 0)
            {
                logger.LogInformation(
                    "No package-facing auto-publish contributors were eligible after importing '{PackageName}'.",
                    notification.InstallationSummary.PackageName);
                return;
            }

            foreach (AutoPublishTarget target in contributors
                         .SelectMany(x => x.GetTargets())
                         .Where(x => x.PackageName.InvariantEquals(notification.InstallationSummary.PackageName))
                         .Where(x => !string.IsNullOrWhiteSpace(x.RootContentTypeAlias))
                         .GroupBy(x => (x.PackageName, x.RootContentTypeAlias, x.PublishDescendants))
                         .Select(x => x.First()))
            {
                PublishTargets("package import", target);
            }
        }

        private bool ShouldAutoPublish(string trigger, InstallationSummary? installationSummary = null)
        {
            if (!ShouldAutoPublish(trigger))
            {
                return false;
            }

            if (installationSummary is not null)
            {
                logger.LogInformation(
                    "Package '{PackageName}' installed {ContentCount} content items and {MediaCount} media items before auto-publish.",
                    installationSummary.PackageName,
                    installationSummary.ContentInstalled.Count(),
                    installationSummary.MediaInstalled.Count());
            }

            return true;
        }

        private IReadOnlyList<IAutoPublishContributor> GetEligibleContributors() =>
            _autoPublishContributors
                .Where(contributor => HasPublishableEmbeddedPackageContent(contributor.GetType().Assembly))
                .ToArray();

        private bool ShouldAutoPublish(string trigger)
        {
            if (runtimeState.Level < RuntimeLevel.Run)
            {
                logger.LogInformation(
                    "Umbraco runtime level '{RuntimeLevel}' is below Run, skipping package auto-publish ({Trigger}).",
                    runtimeState.Level,
                    trigger);
                return false;
            }

            if (!options.Value.AutoPublishOnStartup)
            {
                logger.LogInformation(
                    "AutoPublishOnStartup is false, skipping package auto-publish ({Trigger}).",
                    trigger);
                return false;
            }

            return true;
        }

        private void PublishTargets(string trigger, AutoPublishTarget target)
        {
            IEnumerable<IContent> roots = GetRootsByContentTypeAlias(target.RootContentTypeAlias);
            var attemptedAny = false;
            foreach (IContent root in roots.GroupBy(x => x.Id).Select(x => x.First()))
            {
                try
                {
                    using IScope scope = scopeProvider.CreateScope(autoComplete: true);
                    // Always use All for package imports so newly imported unpublished descendants get published.
                    // ForceRepublish only republishes already-published nodes; it skips unpublished children.
                    PublishBranchFilter filter = target.PublishDescendants ? PublishBranchFilter.All : PublishBranchFilter.Default;

#pragma warning disable CS0618 // Keep the v16-compatible PublishBranch overload for multi-targeted package builds.
                    IEnumerable<PublishResult> publishResults =
                        contentService.PublishBranch(root, filter, [], Constants.Security.SuperUserId);
#pragma warning restore CS0618
                    var result = publishResults.ToList();
                    attemptedAny = true;

                    if (result.All(x => x.Success))
                    {
                        logger.LogInformation(
                            "Published root node ID {NodeId} for content type '{ContentTypeAlias}' after {Trigger}.",
                            root.Id,
                            target.RootContentTypeAlias,
                            trigger);
                    }
                    else
                    {
                        var failures = result.Where(x => !x.Success).ToList();
                        logger.LogWarning(
                            "Partial auto-publish failure for root node ID {NodeId} and content type '{ContentTypeAlias}': {FailureCount} items failed for trigger {Trigger}.",
                            root.Id,
                            target.RootContentTypeAlias,
                            failures.Count,
                            trigger);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(
                        ex,
                        "Error auto-publishing root node ID {NodeId} for content type '{ContentTypeAlias}' after {Trigger}.",
                        root.Id,
                        target.RootContentTypeAlias,
                        trigger);
                }
            }

            if (!attemptedAny)
            {
                logger.LogInformation("No root nodes were eligible for auto-publish when handling {Trigger}.", trigger);
            }
        }

        private IEnumerable<IContent> GetRootsByContentTypeAlias(string contentTypeAlias)
        {
            IContentType? contentType = contentTypeService.Get(contentTypeAlias);
            if (contentType is null)
            {
                logger.LogWarning(
                    "The content type '{ContentTypeAlias}' was not found when attempting to locate auto-publish roots.",
                    contentTypeAlias);
                return [];
            }

            return contentService.GetPagedOfType(
                    contentType.Id,
                    0,
                    int.MaxValue,
                    out _,
                    sqlContext.Query<IContent>().Where(x => x.Trashed == false))
                .Where(x => !x.Trashed)
                .ToArray();
        }

        private static bool HasPublishableEmbeddedPackageContent(Assembly assembly)
        {
            string? resourceName = assembly.GetManifestResourceNames()
                .FirstOrDefault(name => name.EndsWith("Packaging.package.zip", StringComparison.OrdinalIgnoreCase));

            if (resourceName is null)
            {
                return false;
            }

            using Stream? stream = assembly.GetManifestResourceStream(resourceName);
            if (stream is null)
            {
                return false;
            }

            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: false);
            ZipArchiveEntry? packageXmlEntry = archive.GetEntry("package.xml");
            if (packageXmlEntry is null)
            {
                return false;
            }

            using var reader = new StreamReader(packageXmlEntry.Open());
            string packageXml = reader.ReadToEnd();

            return packageXml.Contains("<Documents>", StringComparison.OrdinalIgnoreCase) ||
                   packageXml.Contains("<MediaItems>", StringComparison.OrdinalIgnoreCase);
        }
    }
}
