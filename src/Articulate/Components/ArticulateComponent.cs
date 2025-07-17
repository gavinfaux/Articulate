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

            //todo: why these render as https://localhost:44366/a-new/md-editor-
            _bundleManager.CreateJs("md-editor-js", "~/App_Plugins/Articulate/Assets");
            _bundleManager.CreateCss("md-editor-css", "~/App_Plugins/Articulate/Assets");
        }

        public void Terminate()
        {
        }

    }

}
