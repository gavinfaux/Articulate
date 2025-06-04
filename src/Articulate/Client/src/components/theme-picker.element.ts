import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UmbChangeEvent } from "@umbraco-cms/backoffice/event";
import { css, customElement, html, property, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import {
  UMB_NOTIFICATION_CONTEXT,
  type UmbNotificationContext,
  type UmbNotificationDefaultData,
} from "@umbraco-cms/backoffice/notification";
import type {
  UmbPropertyEditorConfigCollection,
  UmbPropertyEditorUiElement,
} from "@umbraco-cms/backoffice/property-editor";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { ArticulateService } from "../api/core";

@customElement("articulate-theme-picker-element")
export class ArticulateThemePickerElement
  extends UmbElementMixin(UmbLitElement)
  implements UmbPropertyEditorUiElement
{
  @property()
  value?: string;

  @property({ attribute: false })
  config?: UmbPropertyEditorConfigCollection;

  @state()
  private _themes: string[] = [];

  @state()
  private _loading = false;

  @state()
  private _error = "";

  #notificationContext?: UmbNotificationContext;

  constructor() {
    super();
    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (instance) => {
      this.#notificationContext = instance;
    });
    this._fetchThemes();
  }

  private _showErrorNotification(message: string) {
    const data: UmbNotificationDefaultData = { message };
    this.#notificationContext?.peek("danger", { data });
  }

  private async _fetchThemes() {
    this._loading = true;
    this._error = "";
    try {
      const { data } = await ArticulateService.getUmbracoManagementApiV1ArticulateThemeThemes();
      this._themes = data?.map((theme) => theme.name) ?? [];
    } catch {
      const userFriendlyMessage = "Failed to load themes. Please try again later.";
      this._error = userFriendlyMessage;
      this._showErrorNotification(userFriendlyMessage);
    } finally {
      this._loading = false;
    }
  }

  private _handleInput(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.dispatchEvent(new UmbChangeEvent());
  }

  override render() {
    if (this._loading) {
      return html`<uui-loader-bar></uui-loader-bar>`;
    }

    if (this._error) {
      return html`
        <uui-box headline="Error" style="color: var(--uui-color-danger-emphasis);">
          <p>Could not load themes:</p>
          <p>${this._error}</p>
        </uui-box>
      `;
    }

    return html`
      <uui-select .value=${this.value} @change=${this._handleInput} label="Select a theme">
        ${this._themes.map(
          (theme) =>
            html`<uui-select-option .value=${theme} .displayValue=${theme}
              >${theme}</uui-select-option
            >`,
        )}
      </uui-select>
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

export default ArticulateThemePickerElement;

declare global {
  interface HTMLElementTagNameMap {
    "articulate-theme-picker-element": ArticulateThemePickerElement;
  }
}
