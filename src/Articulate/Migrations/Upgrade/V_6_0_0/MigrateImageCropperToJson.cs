#nullable enable
using System.Text.Json;
using Microsoft.Extensions.Logging;
using NPoco;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Persistence;
using IScope = Umbraco.Cms.Infrastructure.Scoping.IScope;
using IScopeProvider = Umbraco.Cms.Infrastructure.Scoping.IScopeProvider;

namespace Articulate.Migrations.Upgrade.V_6_0_0
{
    public class MigrateImageCropperToJson(
        IMigrationContext context,
        IScopeProvider scopeProvider,
        IMediaService mediaService,
        IDataTypeService dataTypeService,
        ILogger<MigrateImageCropperToJson> logger)
        : MigrationBase(context)
    {
        protected override void Migrate()
        {
            List<int> imageCropperDataTypeIds = GetImageCropperDataTypeIdsAsync().GetAwaiter().GetResult();
            if (imageCropperDataTypeIds.Count == 0)
            {
                logger.LogInformation("No 'Umbraco.ImageCropper' data types found. Migration complete.");
                return;
            }

            List<int> nodeIdsToUpdate = GetNodeIdsToUpdate(imageCropperDataTypeIds);
            if (nodeIdsToUpdate.Count == 0)
            {
                logger.LogInformation("No media found with non-JSON Image Cropper data. Migration complete.");
                return;
            }

            logger.LogInformation("Found {count} media items that require Image Cropper data updates.", nodeIdsToUpdate.Count);

            logger.LogInformation("Migration starting for Umbraco.ImageCropper string src to to JSON.");

            ProcessInBatches(nodeIdsToUpdate, imageCropperDataTypeIds);

            logger.LogInformation("Migration succeeded.");
        }

        private async Task<List<int>> GetImageCropperDataTypeIdsAsync() =>
            (await dataTypeService
                .GetByEditorAliasAsync(Constants.PropertyEditors.Aliases.ImageCropper).ConfigureAwait(false))
            .Select(dt => dt.Id)
            .ToList();

        private List<int> GetNodeIdsToUpdate(List<int> imageCropperDataTypeIds)
        {
            using IScope scope = scopeProvider.CreateScope(autoComplete: true);

            Sql<ISqlContext> sqlQuery = scope.SqlContext.Sql(
                """
                SELECT T2.nodeId AS NodeId, T0.textValue AS TextValue
                FROM umbracoPropertyData AS T0
                INNER JOIN cmsPropertyType AS T1 ON T0.propertyTypeId = T1.id
                INNER JOIN umbracoContentVersion AS T2 ON T0.versionId = T2.id
                WHERE T1.dataTypeId IN (@dataTypeIds)
                AND T2.[current] = 1
                AND T0.textValue IS NOT NULL
                AND substring(T0.textValue, 1, 1) != '{'
                """,
                new { dataTypeIds = imageCropperDataTypeIds });

            List<PropertyDataDto>? potentialCandidates = scope.Database.Fetch<PropertyDataDto>(sqlQuery);

            return potentialCandidates?
                .Where(p => p.TextValue is not null && !p.TextValue.DetectIsJson())
                .Select(p => p.NodeId)
                .Distinct()
                .ToList() ?? [];
        }

        private void ProcessInBatches(List<int> nodeIdsToUpdate, List<int> imageCropperDataTypeIds)
        {
            const int batchSize = 200;
            var mediaToSave = new List<IMedia>();

            for (var i = 0; i < nodeIdsToUpdate.Count; i += batchSize)
            {
                var batchIds = nodeIdsToUpdate.Skip(i).Take(batchSize).ToArray();
                IMedia[] mediaBatch = mediaService.GetByIds(batchIds).ToArray();
                mediaToSave.AddRange(from media in mediaBatch let wasModified = TryUpdateMediaProperties(media, imageCropperDataTypeIds) where wasModified select media);
            }

            if (mediaToSave.Count <= 0)
            {
                return;
            }

            _ = mediaService.Save(mediaToSave);
            logger.LogInformation("Saving {count} media items with updated Image Cropper data...", mediaToSave.Count);
        }

        private bool TryUpdateMediaProperties(IMedia media, List<int> imageCropperDataTypeIds)
        {
            var mediaModified = false;
            IEnumerable<IProperty> cropperProperties = media.Properties
                .Where(p => imageCropperDataTypeIds.Contains(p.PropertyType.DataTypeId));

            foreach (IProperty property in cropperProperties)
            {
                foreach (IPropertyValue pValue in property.Values)
                {
                    if (pValue.EditedValue is not string textValue || string.IsNullOrWhiteSpace(textValue) || textValue.DetectIsJson())
                    {
                        continue;
                    }

                    try
                    {
                        var newValue = new { src = textValue };
                        property.SetValue(JsonSerializer.Serialize(newValue), pValue.Culture, pValue.Segment);
                        mediaModified = true;
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error converting value for media ID {mediaId}, Property Alias {PropertyAlias}", media.Id, property.Alias);
                    }
                }
            }

            return mediaModified;
        }

        private class PropertyDataDto
        {
            public int NodeId { get; set; }

            public string? TextValue { get; set; }
        }
    }
}
