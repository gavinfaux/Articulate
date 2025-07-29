#nullable enable
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.PropertyEditors
{
    public class ThemePickerConfigurationEditor : ConfigurationEditor
    {
        public ThemePickerConfigurationEditor(IIOHelper ioHelper) : base()
        {
            // No specific configuration needed for theme picker
        }
    }
}
