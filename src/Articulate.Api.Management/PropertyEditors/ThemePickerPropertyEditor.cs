#nullable enable
using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.Api.Management.PropertyEditors
{

    // Maps to alias: \Client\src\editors\theme-picker.element.ts
    // ArticulateThemePicker | Umbraco.Plain.String
    [DataEditor(ArticulateConstants.DataType.ArticulateThemePicker, ValueType = ValueTypes.String, ValueEditorIsReusable = true)]
    public class ThemePickerPropertyEditor(IDataValueEditorFactory dataValueEditorFactory)
        : DataEditor(dataValueEditorFactory)
    {
        protected override IConfigurationEditor CreateConfigurationEditor() => new ThemePickerConfigurationEditor();
    }
}
