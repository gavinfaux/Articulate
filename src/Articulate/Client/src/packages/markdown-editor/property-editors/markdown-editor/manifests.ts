import { manifest as schemaManifest } from "./Articulate.MarkdownEditor.js";

export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "propertyValuePreset",
    forPropertyEditorSchemaAlias: "Articulate.MarkdownEditor",
    alias: "Articulate.PropertyValuePreset.MarkdownEditor",
    name: "Articulate Markdown Editor Property Value Preset",
    api: () => import("./markdown-editor-property-value-preset.js"),
  },
  {
    type: "propertyEditorUi",
    alias: "Articulate.PropertyEditorUi.MarkdownEditor",
    name: "ArticulateMarkdown Editor Property Editor UI",
    element: () => import("./property-editor-ui-markdown-editor.element.js"),
    meta: {
      label: "Articulate Markdown Editor",
      propertyEditorSchemaAlias: "Articulate.MarkdownEditor",
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
            alias: "defaultValue",
            label: "Default value",
            description: "If value is blank, the editor will show this",
            propertyEditorUiAlias: "Articulate.PropertyEditorUi.MarkdownEditor",
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
  schemaManifest,
];
