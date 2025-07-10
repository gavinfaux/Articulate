using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.PropertyEditors
{
    [DataEditor("ArticulateThemePicker")]
    public class ThemePickerPropertyEditor(IDataValueEditorFactory dataValueEditorFactory)
        : DataEditor(dataValueEditorFactory)
    {
        protected override IConfigurationEditor CreateConfigurationEditor() => new ThemePickerConfigurationEditor();
    }

    public class ThemePickerConfigurationEditor : ConfigurationEditor
    {
        public ThemePickerConfigurationEditor() : base()
        {
            // No specific configuration needed for theme picker
        }
    }
}
