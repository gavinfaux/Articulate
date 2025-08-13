import type { ManifestPropertyEditorSchema } from '@umbraco-cms/backoffice/property-editor';

export const manifest: ManifestPropertyEditorSchema = {
    type: 'propertyEditorSchema',
    name: 'Articulate Markdown Editor',
    // matches EditorAlias.Equals("Articulate.MarkdownEditor")
    alias: 'Articulate.MarkdownEditor',
    meta: {
        defaultPropertyEditorUiAlias: 'Articulate.PropertyEditorUi.MarkdownEditor',
    },
};
