import type { UmbPropertyValuePreset } from "@umbraco-cms/backoffice/property";
import type { UmbPropertyEditorConfig } from "@umbraco-cms/backoffice/property-editor";
import type { ArticulateMarkdownPropertyEditorUiValue } from "./types.js";

export class ArticulateMarkdownPropertyValuePreset
  implements UmbPropertyValuePreset<ArticulateMarkdownPropertyEditorUiValue>
{
  async processValue(
    value: undefined | ArticulateMarkdownPropertyEditorUiValue,
    config: UmbPropertyEditorConfig,
  ) {
    const defaultValue = config.find((x) => x.alias === "defaultValue")?.value as
      | string
      | undefined;
    return value !== undefined ? value : defaultValue;
  }

  destroy(): void {}
}

export { ArticulateMarkdownPropertyValuePreset as api };
