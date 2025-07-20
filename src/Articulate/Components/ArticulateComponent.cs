using Smidge;
using Umbraco.Cms.Core.Composing;

namespace Articulate.Components
{
    public class ArticulateComponent : IComponent
    {
        private readonly IBundleManager _bundleManager;

        public ArticulateComponent(IBundleManager bundleManager)
        {
            _bundleManager = bundleManager;
        }

        public void Initialize()
        {
            foreach (var theme in DefaultThemes.AllThemes)
            {
                theme.CreateBundles(_bundleManager);
            }

            // Create bundles for the markdown editor from the new subdirectories
            _bundleManager.CreateJs("md-editor-js", "~/App_Plugins/Articulate/Assets/md-editor/js");
            _bundleManager.CreateCss("md-editor-css", "~/App_Plugins/Articulate/Assets/md-editor/css");
        }

        public void Terminate()
        {
        }

    }

}
