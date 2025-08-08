#nullable enable
using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.PropertyEditors
{
    [DataEditor("ArticulateThemePicker")]
    public class ThemePickerPropertyEditor(IDataValueEditorFactory dataValueEditorFactory)
        : DataEditor(dataValueEditorFactory)
    {
        protected override IConfigurationEditor CreateConfigurationEditor() => new ThemePickerConfigurationEditor();
    }
}
