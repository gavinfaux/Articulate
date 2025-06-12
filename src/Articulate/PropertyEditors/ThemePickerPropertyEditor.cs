// TODO: Deprecated code, please update or remove. Theme picker schema using Umbraco.Plain.String which core handles without DataEditor.

//using Umbraco.Cms.Core.PropertyEditors;
//using Umbraco.Cms.Core.IO;

//namespace Articulate.PropertyEditors
//{
//    [DataEditor("ArticulateThemePicker")]
//    public class ThemePickerPropertyEditor : DataEditor
//    {
//        private readonly IIOHelper _ioHelper;

//        public ThemePickerPropertyEditor(IDataValueEditorFactory dataValueEditorFactory, IIOHelper ioHelper) 
//            : base(dataValueEditorFactory)
//        {
//            _ioHelper = ioHelper;
//        }

//        protected override IConfigurationEditor CreateConfigurationEditor()
//        {
//            return new ThemePickerConfigurationEditor(_ioHelper);
//        }
//    }

//    public class ThemePickerConfigurationEditor : ConfigurationEditor
//    {
//        public ThemePickerConfigurationEditor(IIOHelper ioHelper) : base()
//        {
//            // No specific configuration needed for theme picker
//        }
//    }
//}
