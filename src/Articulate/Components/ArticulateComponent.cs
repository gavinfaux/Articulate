#nullable enable
using Articulate.Services;
using Smidge;
using Umbraco.Cms.Core.Composing;
using static Articulate.ArticulateConstants;

namespace Articulate.Components
{
    /// <inheritdoc />
    public class ArticulateComponent(IBundleManager bundleManager) : IAsyncComponent
    {
        /// <inheritdoc />
        public Task InitializeAsync(bool isRestarting, CancellationToken cancellationToken)
        {
            foreach (DefaultThemes.DefaultTheme theme in DefaultThemes.AllThemes)
            {
                theme.CreateBundles(bundleManager);
            }


            // Create bundles for the markdown editor.TODO: Move to Web project where controller/view lives
            _ = bundleManager.CreateJs("md-editor-js", Path.Combine(Paths.SystemVirtualPath, Paths.MarkdownEditorPath, Paths.JsPath));
            _ = bundleManager.CreateCss("md-editor-css", Path.Combine(Paths.SystemVirtualPath, Paths.MarkdownEditorPath, Paths.CssPath));

            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
