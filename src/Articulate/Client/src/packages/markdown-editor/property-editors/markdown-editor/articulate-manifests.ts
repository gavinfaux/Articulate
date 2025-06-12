export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "propertyEditorUi",
    alias: "Articulate.MarkdownEditor",
    name: "Articulate Markdown Editor",
    element: () => import("./property-editor-ui-markdown-editor.element.js"),
    meta: {
      label: "Articulate Markdown Editor",
      propertyEditorSchemaAlias: "Umbraco.MarkdownEditor",
      icon: "icon-code",
      group: "richContent",
      supportsReadOnly: true,
      settings: {
        properties: [
          {
            alias: "preview",
            label: "Preview",
            description: "Display a live preview",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Toggle",
          },
          {
            alias: "overlaySize",
            label: "Overlay Size",
            description: "Select the width of the overlay.",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.OverlaySize",
          },
        ],
      },
    },
  },
];
