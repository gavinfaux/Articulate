export const name = 'Articulate.MarkdownEditor';

// Full clone of Umbraco.Web.UI.Client/src/packages/markdown-editor
// Prevent any conflicts with the markdown editor in the backoffice
// TODO: Remove this when the Markdig package is merged into Umbraco
// See: https://github.com/umbraco/Umbraco-CMS/pull/19500
export const extensions = [
    {
        name: 'Articulate Markdown Editor Bundle',
        alias: 'Articulate.Bundle.MarkdownEditor',
        type: 'bundle',
        js: () => import('./manifests.js'),
    },
];
