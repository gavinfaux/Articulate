#nullable enable
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Articulate.Options;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Scoping;

namespace Articulate.Migrations.Upgrade.V_6_0_0
{
    /// <summary>
    /// Migration to update Articulate RichText data type configuration to use Tiptap editor.
    /// </summary>
    public class MigrateArticulateRichText(
        IMigrationContext context,
        IScopeProvider scopeProvider,
        IDataTypeService dataTypeService,
        ILogger<MigrateArticulateRichText> logger,
        IOptions<ArticulateOptions> articulateOptions)
        : MigrateDataTypeConfigurationBase(context, scopeProvider, dataTypeService, logger)
    {
        /// <inheritdoc/>
        protected override async Task MigrateAsync()
        {
            try
            {
                if (!articulateOptions.Value.MigrateRichTextDataTypeToTiptapOnUpgrade)
                {
                    logger.LogInformation(
                        "Skipping Articulate Rich Text data type migration because Articulate:MigrateRichTextDataTypeToTiptapOnUpgrade is disabled.");
                    return;
                }

                logger.LogInformation("Migration starting for Articulate DataType's.");

                var totalUpdated = 0;

                totalUpdated += await UpdateDataTypeAsync(
                    ArticulateConstants.DataType.ArticulateRichTextKey,
                    "Umb.PropertyEditorUi.Tiptap",
                    "{\"extensions\": [\"Umb.Tiptap.Embed\", \"Umb.Tiptap.Link\", \"Umb.Tiptap.Figure\", \"Umb.Tiptap.Image\", \"Umb.Tiptap.Subscript\", \"Umb.Tiptap.Superscript\", \"Umb.Tiptap.Table\", \"Umb.Tiptap.Underline\", \"Umb.Tiptap.TextAlign\", \"Umb.Tiptap.MediaUpload\"], \"maxImageSize\": 500, \"overlaySize\": \"medium\", \"toolbar\": [[[\"Umb.Tiptap.Toolbar.SourceEditor\"], [\"Umb.Tiptap.Toolbar.Bold\", \"Umb.Tiptap.Toolbar.Italic\", \"Umb.Tiptap.Toolbar.Underline\"], [\"Umb.Tiptap.Toolbar.TextAlignLeft\", \"Umb.Tiptap.Toolbar.TextAlignCenter\", \"Umb.Tiptap.Toolbar.TextAlignRight\"], [\"Umb.Tiptap.Toolbar.BulletList\", \"Umb.Tiptap.Toolbar.OrderedList\"], [\"Umb.Tiptap.Toolbar.Blockquote\", \"Umb.Tiptap.Toolbar.HorizontalRule\"], [\"Umb.Tiptap.Toolbar.Link\", \"Umb.Tiptap.Toolbar.Unlink\"], [\"Umb.Tiptap.Toolbar.MediaPicker\", \"Umb.Tiptap.Toolbar.EmbeddedMedia\"]]]}");

                logger.LogInformation("Updated {count} Articulate DataType records.", totalUpdated);
                logger.LogInformation("Migration completed successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error running MigrateDataTypeConfigurations.");
                throw;
            }
        }
    }
}
