#nullable enable
using Microsoft.AspNetCore.Hosting;
using Smidge;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Extensions;

namespace Articulate.Components
{
    /// <inheritdoc />
    public class ArticulateComponent(IBundleManager bundleManager, IWebHostEnvironment hostingEnvironment) : IAsyncComponent
    {
        /// <inheritdoc />
        public Task InitializeAsync(bool isRestarting, CancellationToken cancellationToken)
        {
            foreach (DefaultThemes.DefaultTheme theme in DefaultThemes.AllThemes)
            {
                theme.CreateBundles(bundleManager);
            }

            var systemPath = hostingEnvironment.MapPathContentRoot(PathHelper.SystemThemeViewPath);

            // Create bundles for the markdown editor.
            _ = bundleManager.CreateJs("md-editor-js", Path.Combine(systemPath, "MarkdownEditor", "assets/css/**/*.js"));
            _ = bundleManager.CreateCss("md-editor-css", Path.Combine(systemPath, "MarkdownEditor", "assets/css/**/*.css"));

            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task TerminateAsync(bool isRestarting, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
