import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UmbChangeEvent } from "@umbraco-cms/backoffice/event";
import { css, customElement, html, property, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import type {
  UmbPropertyEditorConfigCollection,
  UmbPropertyEditorUiElement,
} from "@umbraco-cms/backoffice/property-editor";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { Articulate } from "../api/articulate/sdk.gen";
import { handleApiError } from "../utils/error-utils";

@customElement("articulate-theme-picker-element")
export default class ArticulateThemePickerElement
  extends UmbElementMixin(UmbLitElement)
  implements UmbPropertyEditorUiElement
{
  @property()
  value?: string;

  @property({ attribute: false })
  config?: UmbPropertyEditorConfigCollection;

  @state()
  private _themeSelectOptions: Array<{ name: string; value: string; selected?: boolean }> = [];

  @state()
  private _themeData: Array<{ name: string; value: string }> = [];

  @state()
  private _error = "";

  constructor() {
    super();
    this._fetchThemes();
  }

  override updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    const valueChanged = changedProperties.has("value");
    const themeDataChanged = changedProperties.has("_themeData");

    if (this._themeData.length > 0 && (valueChanged || themeDataChanged)) {
      this._rebuildAndSetSelectOptions();
    }
  }

  private async _fetchThemes() {
    this._error = "";

    const result = await Articulate.getUmbracoManagementApiV1ArticulateEditorsThemes();

    if (!result.response.ok) {
      this._error = await handleApiError(result.response, "Failed to load themes.");
      return;
    }

    const data = result.data;
    if (!data) {
      this._error = "No theme data returned from the server.";
      return;
    }

    this._themeData = data.map((theme) => ({
      name: theme,
      value: theme,
    }));
    this._rebuildAndSetSelectOptions();
  }

  private _rebuildAndSetSelectOptions() {
    if (!this._themeData || this._themeData.length === 0) {
      if (this._themeSelectOptions.length > 0) {
        this._themeSelectOptions = [];
      }
      return;
    }

    const valueToSelect = this.value;
    const newOptions = this._themeData.map((theme) => ({
      name: theme.name,
      value: theme.value,
      selected: !!valueToSelect && theme.value === valueToSelect,
    }));

    this._themeSelectOptions = newOptions;
  }

  private _handleInput(event: Event) {
    const newValue = (event.target as any).value as string | undefined;

    if (this.value !== newValue) {
      this.value = newValue;
      this.dispatchEvent(new UmbChangeEvent());
    }
  }

  override render() {
    if (this._error && this._error.length > 0) {
      return html`<span class="text-danger">${this._error}</span>`;
    }

    return html`
      <uui-select
        .options=${this._themeSelectOptions}
        .value=${this.value}
        @change=${this._handleInput}
        label="Select a theme"
      ></uui-select>
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    css`
      uui-select {
        width: 100%;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "articulate-theme-picker-element": ArticulateThemePickerElement;
  }
}
