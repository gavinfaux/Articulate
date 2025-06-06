import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UmbChangeEvent } from "@umbraco-cms/backoffice/event";
import { css, customElement, html, property, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import type {
  UmbPropertyEditorConfigCollection,
  UmbPropertyEditorUiElement,
} from "@umbraco-cms/backoffice/property-editor";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { ArticulateService, ProblemDetails } from "../api/core";
import { extractErrorMessage } from "../utils/error-utils";
import { showUmbracoNotification } from "../utils/notification-utils";

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

  constructor() {
    super();
    this._fetchThemes();
  }

  private async _fetchThemes() {
    this._loading = true;
    this._error = "";
    try {
      const result = await ArticulateService.getUmbracoManagementApiV1ArticulateThemeThemes({
        throwOnError: true,
      });

      if (!result.response.ok) {
        let errorToThrow;
        try {
          const problemDetails: ProblemDetails = await result.response.json();
          errorToThrow = problemDetails;
        } catch {
          errorToThrow = new Error(
            `API Error: ${result.response.status} ${result.response.statusText}`,
          );
        }
        throw errorToThrow;
      }

      const data = await result.data;
      if (!data) {
        throw new Error("Failed to load themes. Review back office logs for more details.");
      }
      this._themes = data?.map((theme) => theme.name) ?? [];
    } catch (error: unknown) {
      const extractedMessage = extractErrorMessage(
        error,
        // Consider using a localization term like this.localize.term("articulate_errorLoadThemesPickerDefault")
        "Could not load themes. Please check the logs for details.",
      );
      this._error = extractedMessage;
      await showUmbracoNotification(this, extractedMessage, "danger");
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
      return html` <uui-tag color="danger">Could not load themes: ${this._error}</uui-tag> `;
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
