#nullable enable
using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.PropertyEditors
{

    // Maps to alias: \Client\src\editors\theme-picker.element.ts
    // ArticulateThemePicker.UI | Umbraco.Plain.String
    [DataEditor(ArticulateConstants.DataType.AriculateThemePicker, ValueType = ValueTypes.String, ValueEditorIsReusable = true)]
    public class ThemePickerPropertyEditor(IDataValueEditorFactory dataValueEditorFactory)
        : DataEditor(dataValueEditorFactory)
    {
        protected override IConfigurationEditor CreateConfigurationEditor() => new ThemePickerConfigurationEditor();
    }
}
