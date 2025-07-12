using System;
using Smidge;
using Umbraco.Cms.Core.Composing;

namespace Articulate.Components
{

    public class ArticulateComponent(IBundleManager bundleManager) : IComponent
    {
        public void Initialize()
        {
            foreach (var theme in DefaultThemes.AllThemes)
            {
                theme.CreateBundles(bundleManager);
            }

            //todo: why these render as https://localhost:44366/a-new/md-editor-
            bundleManager.CreateJs("md-editor-js", "~/App_Plugins/Articulate/Assets");
            bundleManager.CreateCss("md-editor-css", "~/App_Plugins/Articulate/Assets");
        }

        public void Terminate()
        {
        }
    }
}
