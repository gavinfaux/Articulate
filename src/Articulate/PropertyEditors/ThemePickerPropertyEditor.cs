using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.PropertyEditors
{
    [DataEditor("ArticulateThemePicker", IsDeprecated = false, ValueEditorIsReusable = false, ValueType = ValueTypes.Json)]
    public class ThemePickerPropertyEditor(IDataValueEditorFactory dataValueEditorFactory)
        : DataEditor(dataValueEditorFactory);
}
