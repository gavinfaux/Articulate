#nullable enable
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Scoping;

namespace Articulate.Migrations.Upgrade
{
    /// <inheritdoc />
    [Obsolete("'MigrationBase' is obsolete: Use 'AsyncMigrationBase' instead. Scheduled for removal in Umbraco 18", false)]
    public abstract class MigrateDataTypeConfigurationBase(
        IMigrationContext context,
        IScopeProvider scopeProvider,
        IDataTypeService dataTypeService,
        ILogger<MigrateDataTypeConfigurationBase> logger)
        : MigrationBase(context)
    {
        protected async Task<int> UpdateDataTypeAsync(Guid id, string editorUiAlias, string configurationJson)
        {
            try
            {
                using IScope scope = scopeProvider.CreateScope(autoComplete: true);

                IDataType? dataType = await dataTypeService.GetAsync(id).ConfigureAwait(false);
                if (dataType is null)
                {
                    return 0;
                }

                if (dataType is not DataType dt)
                {
                    logger.LogWarning("DataType with id {id} is not a concrete DataType, skipping.", id);
                    return 0;
                }

                var wasChanged = false;

                if (!string.Equals(dt.EditorUiAlias, editorUiAlias, StringComparison.Ordinal))
                {
                    dt.EditorUiAlias = editorUiAlias;
                    wasChanged = true;
                }

                Dictionary<string, object> configObj = TryParseConfiguration(configurationJson, logger);
                IDictionary<string, object> currentCfg = dt.ConfigurationData;
                if (!EqualsConfig(currentCfg, configObj, logger))
                {
                    dt.ConfigurationData = configObj;
                    wasChanged = true;
                }

                if (!wasChanged)
                {
                    return 0;
                }

                _ = await dataTypeService.UpdateAsync(dt, Constants.Security.SuperUserKey).ConfigureAwait(false);
                return 1;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed updating DataType id {id}", id);
            }

            return 0;
        }

        private static Dictionary<string, object> TryParseConfiguration(string json, ILogger logger)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(json))
                {
                    return new Dictionary<string, object>();
                }

                Dictionary<string, object>? dict = JsonSerializer.Deserialize<Dictionary<string, object>>(json);
                return dict ?? new Dictionary<string, object>();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to parse configuration JSON, using empty dictionary");
                return new Dictionary<string, object>();
            }
        }

        private static bool EqualsConfig(object? a, object? b, ILogger logger)
        {
            try
            {
                var sa = JsonSerializer.Serialize(a ?? new Dictionary<string, object?>());
                var sb = JsonSerializer.Serialize(b ?? new Dictionary<string, object?>());
                return string.Equals(sa, sb, StringComparison.Ordinal);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to compare configuration JSON, using default comparison");
                return Equals(a, b);
            }
        }
    }
}
