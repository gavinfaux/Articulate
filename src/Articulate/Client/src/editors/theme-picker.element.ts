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
export default class ThemePickerElement extends UmbElementMixin(UmbLitElement) implements UmbPropertyEditorUiElement {
  @property()
  value?: string;

  @property({ attribute: false })
  config?: UmbPropertyEditorConfigCollection;

  @state()
  private _themeSelectOptions: Array<{ name: string; value: string; selected?: boolean }> = [];

  @state()
  private _error: { title: string; details: string[] } | null = null;

  constructor() {
    super();
  }

  async connectedCallback() {
    super.connectedCallback();
    this._fetchThemes();
  }

  override updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has("value") && this._themeSelectOptions.length > 0) {
      this._themeSelectOptions = this._themeSelectOptions.map((option) => ({
        ...option,
        selected: !!this.value && option.value === this.value,
      }));
    }
  }

  private async _fetchThemes() {
    this._error = null;

    const result = await Articulate.getArticulateEditorsThemesV1();

    if (!result.response.ok || !result.data) {
      this._error = formatApiError(result.error, "Failed to load themes from the server.");
      return;
    }

    const data = result.data;

    this._themeSelectOptions = data.map((theme) => ({
      name: theme,
      value: theme,
      selected: !!this.value && theme === this.value,
    }));
  }

  private _handleInput(event: Event) {
    const newValue = (event.target as any).value as string | undefined;

    if (this.value !== newValue) {
      this.value = newValue;
      this.dispatchEvent(new UmbPropertyValueChangeEvent());
    }
  }

  override render() {
    if (this._error) {
      return html`
        <span style="color: var(--uui-color-danger);">${this._error.title}</span>
      `;
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
