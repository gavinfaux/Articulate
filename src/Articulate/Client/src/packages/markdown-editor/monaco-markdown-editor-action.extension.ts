import type { ManifestApi } from "@umbraco-cms/backoffice/extension-api";

export interface ArticulateManifestMonacoMarkdownEditorAction extends ManifestApi<any> {
  type: "articulateMonacoMarkdownEditorAction";
  meta?: ArticulateMetaMonacoMarkdownEditorAction;
}

export type ArticulateMetaMonacoMarkdownEditorAction = {
  icon?: string | null;
  label?: string | null;
};

declare global {
  interface UmbExtensionManifestMap {
    articulateMonacoMarkdownEditorAction: ArticulateManifestMonacoMarkdownEditorAction;
  }
}
