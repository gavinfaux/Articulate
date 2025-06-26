export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "propertyEditorUi",
    alias: "ArticulateThemePicker.UI",
    name: "Articulate Theme Picker UI",
    elementName: "theme-picker-element",
    js: async () => await import("./theme-picker.element.js"),
    meta: {
      label: "Articulate Theme Picker",
      propertyEditorSchemaAlias: "Umbraco.Plain.String",
      icon: "icon-palette",
      group: "pickers",
    },
  },
];
