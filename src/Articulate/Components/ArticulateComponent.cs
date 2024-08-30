
using Umbraco.Cms.Core.Composing;
using Umbraco.Extensions;

namespace Articulate.Components
{
    public class ArticulateComponent : IComponent
    {

        public ArticulateComponent()
        {

        }

        public void Initialize()
        {
            foreach(var theme in DefaultThemes.AllThemes)
            {
            }
        }

        public void Terminate()
        {
        }

    }

}
