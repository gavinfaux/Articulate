#nullable enable
using Smidge;
using Umbraco.Cms.Core.Composing;

namespace Articulate.Components
{
    public class ArticulateComponent(IBundleManager bundleManager) : IAsyncComponent
    {
        public Task InitializeAsync(bool isRestarting, CancellationToken cancellationToken)
        {
            foreach (DefaultThemes.DefaultTheme theme in DefaultThemes.AllThemes)
            {
                theme.CreateBundles(bundleManager);
            }

            // Create bundles for the markdown editor from the new subdirectories.
            bundleManager.CreateJs("md-editor-js", "~/Views/Articulate/MarkdownEditor/assets/js/**/*.js");
            bundleManager.CreateCss("md-editor-css", "~/Views/Articulate/MarkdownEditor/assets/css/**/*.css");

            return Task.CompletedTask;
        }

        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
