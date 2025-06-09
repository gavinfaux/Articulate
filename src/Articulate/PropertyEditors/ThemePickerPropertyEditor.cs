// // TODO: This should not be needed as Bellissima Theme Picker editor just use Umbraco.Plain.String for schema definition, therefore core already handles?

//using Umbraco.Cms.Core.PropertyEditors;
//using Umbraco.Cms.Core.IO;

//namespace Articulate.PropertyEditors
//{
//    [DataEditor("ArticulateThemePicker", ValueType = ValueTypes.Text,
//        ValueEditorIsReusable = true)]
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
