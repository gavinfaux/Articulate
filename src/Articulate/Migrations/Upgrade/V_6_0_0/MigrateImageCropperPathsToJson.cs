#nullable enable
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
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
    public class MigrateImageCropperPathsToJson(
        IMigrationContext context,
        IScopeProvider scopeProvider,
        IContentService contentService,
        IDataTypeService dataTypeService,
        ILogger<MigrateImageCropperPathsToJson> logger)
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

            List<int> contentIdsToUpdate = GetContentIdsToUpdate(imageCropperDataTypeIds);
            if (contentIdsToUpdate.Count == 0)
            {
                logger.LogInformation("No content found with non-JSON Image Cropper data. Migration complete.");
                return;
            }

            logger.LogInformation("Found {count} content items that require Image Cropper data updates.", contentIdsToUpdate.Count);

            logger.LogInformation("Migration starting for Umbraco.ImageCropper string src to to JSON.");

            ProcessContentInBatches(contentIdsToUpdate, imageCropperDataTypeIds);

            logger.LogInformation("Migration succeeded.");
        }

        private async Task<List<int>> GetImageCropperDataTypeIdsAsync() =>
            (await dataTypeService
                .GetByEditorAliasAsync(Constants.PropertyEditors.Aliases.ImageCropper).ConfigureAwait(false))
            .Select(dt => dt.Id)
            .ToList();

        private List<int> GetContentIdsToUpdate(List<int> imageCropperDataTypeIds)
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
                AND T0.textValue IS NOT NULL AND T0.textValue != ''
                """,
                new { dataTypeIds = imageCropperDataTypeIds });

            List<PropertyDataDto>? potentialCandidates = scope.Database.Fetch<PropertyDataDto>(sqlQuery);

            return potentialCandidates?
                .Where(p => p.TextValue is not null && !p.TextValue.DetectIsJson())
                .Select(p => p.NodeId)
                .Distinct()
                .ToList() ?? [];
        }

        private void ProcessContentInBatches(List<int> contentIdsToUpdate, List<int> imageCropperDataTypeIds)
        {
            const int batchSize = 200;
            var contentToSave = new List<IContent>();

            for (var i = 0; i < contentIdsToUpdate.Count; i += batchSize)
            {
                IEnumerable<int> batchIds = contentIdsToUpdate.Skip(i).Take(batchSize);
                IEnumerable<IContent> contentBatch = contentService.GetByIds(batchIds);

                contentToSave.AddRange(from content in contentBatch let wasModified = TryUpdateContentProperties(content, imageCropperDataTypeIds) where wasModified select content);
            }

            if (contentToSave.Count <= 0)
            {
                return;
            }

            logger.LogInformation("Saving {count} content items with updated Image Cropper data...", contentToSave.Count);
            _ = contentService.Save(contentToSave);
            contentToSave.Where(c => c.Published).ToList().ForEach(c => contentService.Publish(c, ["*"]));
        }

        private bool TryUpdateContentProperties(IContent content, List<int> imageCropperDataTypeIds)
        {
            var contentModified = false;
            IEnumerable<IProperty> cropperProperties = content.Properties
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
                        property.SetValue(JsonConvert.SerializeObject(newValue), pValue.Culture, pValue.Segment);
                        contentModified = true;
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error converting value for Content ID {ContentId}, Property Alias {PropertyAlias}", content.Id, property.Alias);
                    }
                }
            }

            return contentModified;
        }

        private class PropertyDataDto
        {
            public int NodeId { get; set; }

            public string? TextValue { get; set; }
        }
    }
}
