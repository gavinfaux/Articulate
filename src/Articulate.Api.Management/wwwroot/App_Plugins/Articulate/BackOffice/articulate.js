const e = [
  {
    type: "dashboard",
    alias: "Articulate.BackOffice.Dashboard",
    name: "Articulate BackOffice Dashboard",
    js: async () => await import("./dashboard.element-CyU5XSyy.js"),
    weight: 10,
    meta: {
      label: "Articulate Dashboard",
      pathname: "articulate-dashboard"
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "Umb.Section.Settings"
      }
    ]
  }
], t = [
  {
    type: "propertyEditorUi",
    alias: "ArticulateThemePicker.UI",
    name: "Articulate Theme Picker UI",
    elementName: "theme-picker-element",
    js: async () => await import("./theme-picker.element-BLGgzqe4.js"),
    meta: {
      label: "Articulate Theme Picker",
      propertyEditorSchemaAlias: "Umbraco.Plain.String",
      icon: "icon-palette",
      group: "pickers"
    }
  }
], i = [
  {
    name: "Articulate Entrypoint",
    alias: "Articulate.Entrypoint",
    type: "backofficeEntryPoint",
    js: async () => await import("./entrypoint-D6YpuHXE.js")
  }
], a = [
  {
    type: "propertyEditorUi",
    alias: "Articulate.MarkdownEditor",
    name: "Articulate Markdown Editor",
    element: () => import("./property-editor-ui-markdown-editor.element-UZXc7HKT.js"),
    meta: {
      label: "Articulate Markdown Editor",
      propertyEditorSchemaAlias: "Umbraco.MarkdownEditor",
      icon: "icon-code",
      group: "richContent",
      supportsReadOnly: !0,
      settings: {
        properties: [
          {
            alias: "preview",
            label: "Preview",
            description: "Display a live preview",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Toggle"
          },
          {
            alias: "overlaySize",
            label: "Overlay Size",
            description: "Select the width of the overlay.",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.OverlaySize"
          }
        ]
      }
    }
  }
], r = [...a], o = [...i, ...e, ...t, ...r];
export {
  o as manifests
};
//# sourceMappingURL=articulate.js.map
