export const manifests = [
    {
        type: 'propertyEditorUi',
        alias: 'ArticulateThemePicker.UI',
        name: 'Articulate Theme Picker UI',
        element: () => import('./theme-picker.element.js'),
        meta: {
            label: 'Articulate Theme Picker',
            icon: 'icon-palette',
            group: 'common',
            propertyEditorSchemaAlias: 'ArticulateThemePicker'
        }
    }
];