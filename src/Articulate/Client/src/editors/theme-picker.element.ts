import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { css, customElement, html, property, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import {
  UmbPropertyValueChangeEvent,
  type UmbPropertyEditorConfigCollection,
  type UmbPropertyEditorUiElement,
} from "@umbraco-cms/backoffice/property-editor";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { Articulate } from "../api/sdk.gen";
import { formatApiError } from "../utils/error-utils";

@customElement("theme-picker-element")
export default class ThemePickerElement
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
  private _error: string[] = [];

  constructor() {
    super();
  }

  async connectedCallback() {
    super.connectedCallback();
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
    this._error = [];

    const result = await Articulate.getArticulateEditorsThemesV1();

    if (!result.response.ok) {
      this._error = formatApiError(result.error, "Failed to load themes.");
      return;
    }

    const data = result.data;
    if (!data) {
      this._error = ["No theme data returned from the server."];
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
      this.dispatchEvent(new UmbPropertyValueChangeEvent());
    }
  }

  override render() {
    if (this._error && this._error.length > 0) {
      return html`<span style="color: var(--uui-color-danger);">${this._error[0]}</span>`;
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
    "theme-picker-element": ThemePickerElement;
  }
}
