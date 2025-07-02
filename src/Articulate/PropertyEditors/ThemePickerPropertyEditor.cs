using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;

namespace Articulate.PropertyEditors
{
    [DataEditor("ArticulateThemePicker")]
    public class ThemePickerPropertyEditor : DataEditor
    {
        private readonly IIOHelper _ioHelper;

        public ThemePickerPropertyEditor(IDataValueEditorFactory dataValueEditorFactory, IIOHelper ioHelper)
            : base(dataValueEditorFactory)
        {
            _ioHelper = ioHelper;
        }

        protected override IConfigurationEditor CreateConfigurationEditor() => new ThemePickerConfigurationEditor(_ioHelper);
    }

    public class ThemePickerConfigurationEditor : ConfigurationEditor
    {
        public ThemePickerConfigurationEditor(IIOHelper ioHelper) : base()
        {
            // No specific configuration needed for theme picker
        }
    }
}
