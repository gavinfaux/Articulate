#nullable enable
using Microsoft.Extensions.Logging;
using Articulate.Migrations.Upgrade.V_6_0_0;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Scoping;

namespace Articulate.Migrations.Upgrade.V_6_0_1;

/// <summary>
/// Applies the complete Tiptap configuration to existing Articulate Rich Text data types.
/// </summary>
public sealed class MigrateArticulateRichTextTiptapConfiguration(
    IMigrationContext context,
    IScopeProvider scopeProvider,
    IDataTypeService dataTypeService,
    ILogger<MigrateArticulateRichTextTiptapConfiguration> logger)
    : MigrateDataTypeConfigurationBase(context, scopeProvider, dataTypeService, logger)
{
    /// <inheritdoc />
    protected override async Task MigrateAsync()
    {
        if (MigrateArticulateRichText.IsTinyMcePackageInstalled())
        {
            logger.LogInformation(
                "Skipping Articulate Rich Text Tiptap configuration migration because TinyMCE.Umbraco is installed.");
            return;
        }

        int updated = await UpdateDataTypeAsync(
            ArticulateConstants.DataType.ArticulateRichTextKey,
            MigrateArticulateRichText.TiptapEditorUiAlias,
            MigrateArticulateRichText.TiptapConfigurationJson);

        logger.LogInformation("Updated {Count} Articulate Rich Text data type records.", updated);
    }
}
