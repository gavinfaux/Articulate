import type { ManifestPropertyEditorSchema } from "@umbraco-cms/backoffice/property-editor";

export const manifest: ManifestPropertyEditorSchema = {
  type: "propertyEditorSchema",
  name: "ArticulateMarkdown Editor",
  alias: "Articulate.MarkdownEditor",
  meta: {
    defaultPropertyEditorUiAlias: "Articulate.PropertyEditorUi.MarkdownEditor",
  },
};
