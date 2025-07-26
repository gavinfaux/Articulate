using System.Threading;
using System.Threading.Tasks;
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
            bundleManager.CreateJs("md-editor-js", "~/assets/md-editor/js");
            bundleManager.CreateCss("md-editor-css", "~/assets/md-editor/css");

            return Task.CompletedTask;
        }

        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
