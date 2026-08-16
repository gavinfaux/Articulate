#nullable enable
using System.Reflection;
using Microsoft.Extensions.Logging;
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
        ILogger<MigrateArticulateRichText> logger)
        : MigrateDataTypeConfigurationBase(context, scopeProvider, dataTypeService, logger)
    {
        private const string TinyMceAssemblyName = "TinyMCE.Umbraco";
        internal const string TiptapEditorUiAlias = "Umb.PropertyEditorUi.Tiptap";

        internal const string TiptapConfigurationJson = "{\"extensions\":[\"Umb.Tiptap.Embed\",\"Umb.Tiptap.Link\",\"Umb.Tiptap.Figure\",\"Umb.Tiptap.Image\",\"Umb.Tiptap.Table\",\"Umb.Tiptap.MediaUpload\",\"Umb.Tiptap.Anchor\",\"Umb.Tiptap.CodeBlock\",\"Umb.Tiptap.Bold\",\"Umb.Tiptap.Italic\",\"Umb.Tiptap.Strike\",\"Umb.Tiptap.Underline\",\"Umb.Tiptap.TextAlign\",\"Umb.Tiptap.BulletList\",\"Umb.Tiptap.OrderedList\",\"Umb.Tiptap.Heading\",\"Umb.Tiptap.HorizontalRule\",\"Umb.Tiptap.Blockquote\",\"Umb.Tiptap.HtmlAttributeClass\",\"Umb.Tiptap.HtmlAttributeDataset\",\"Umb.Tiptap.HtmlAttributeId\",\"Umb.Tiptap.HtmlAttributeStyle\",\"Umb.Tiptap.HtmlTagDiv\",\"Umb.Tiptap.HtmlTagSpan\",\"Umb.Tiptap.Subscript\",\"Umb.Tiptap.Superscript\",\"Umb.Tiptap.TextDirection\",\"Umb.Tiptap.TextIndent\"],\"maxImageSize\":500,\"overlaySize\":\"medium\",\"toolbar\":[[[\"Umb.Tiptap.Toolbar.SourceEditor\"],[\"Umb.Tiptap.Toolbar.Bold\",\"Umb.Tiptap.Toolbar.Italic\",\"Umb.Tiptap.Toolbar.Underline\"],[\"Umb.Tiptap.Toolbar.TextAlignLeft\",\"Umb.Tiptap.Toolbar.TextAlignCenter\",\"Umb.Tiptap.Toolbar.TextAlignRight\"],[\"Umb.Tiptap.Toolbar.BulletList\",\"Umb.Tiptap.Toolbar.OrderedList\"],[\"Umb.Tiptap.Toolbar.Blockquote\",\"Umb.Tiptap.Toolbar.HorizontalRule\"],[\"Umb.Tiptap.Toolbar.Link\",\"Umb.Tiptap.Toolbar.Unlink\"],[\"Umb.Tiptap.Toolbar.MediaPicker\",\"Umb.Tiptap.Toolbar.EmbeddedMedia\"]]],\"allowedMediaTypes\":\"cc07b313-0843-4aa8-bbda-871c8da728c8\"}";

        /// <inheritdoc/>
        protected override async Task MigrateAsync()
        {
            try
            {
                if (IsTinyMcePackageInstalled())
                {
                    logger.LogInformation(
                        "Skipping Articulate Rich Text data type migration because TinyMCE.Umbraco is installed.");
                    return;
                }

                logger.LogInformation("Migration starting for Articulate DataType's.");

                var totalUpdated = 0;

                totalUpdated += await UpdateDataTypeAsync(
                    ArticulateConstants.DataType.ArticulateRichTextKey,
                    TiptapEditorUiAlias,
                    TiptapConfigurationJson);

                logger.LogInformation("Updated {count} Articulate DataType records.", totalUpdated);
                logger.LogInformation("Migration completed successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error running MigrateDataTypeConfigurations.");
                throw;
            }
        }

        internal static bool IsTinyMcePackageInstalled() =>
            IsTinyMcePackageInstalled(
                AppDomain.CurrentDomain.GetAssemblies().Select(static x => x.GetName().Name),
                static assemblyName => Assembly.Load(new AssemblyName(assemblyName)));

        internal static bool IsTinyMcePackageInstalled(
            IEnumerable<string?> loadedAssemblyNames,
            Func<string, Assembly> loadAssembly)
        {
            if (loadedAssemblyNames.Any(x => string.Equals(x, TinyMceAssemblyName, StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }

            try
            {
                _ = loadAssembly(TinyMceAssemblyName);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
