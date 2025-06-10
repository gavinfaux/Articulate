export const name = "Articulate.MarkdownEditor";
export const extensions = [
  {
    name: "Articulate Markdown Editor Bundle",
    alias: "Articulate.MarkdownEditor.Bundle",
    type: "bundle",
    js: () => import("./manifests.js"),
  },
];
