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
  private _themeSelectOptions: Array<{ name: string; value: string; selected?: boolean }> = [];

  @state()
  private _themeData: Array<{ name: string; value: string }> = [];

  @state()
  private _loading = false;

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
      this._themeData =
        data?.map((apiTheme) => ({
          name: apiTheme.name,
          value: apiTheme.name,
        })) ?? [];
      this._rebuildAndSetSelectOptions();
    } catch (error: unknown) {
      const extractedMessage = extractErrorMessage(
        error,
        "Could not load themes. Please check the logs for details.",
      );
      this._error = extractedMessage;
      await showUmbracoNotification(this, extractedMessage, "danger");
    } finally {
      this._loading = false;
    }
  }

  private _rebuildAndSetSelectOptions() {
    if (this._themeData.length === 0) {
      if (this._themeSelectOptions.length > 0) {
        this._themeSelectOptions = [];
      }
      return;
    }

    const valueToSelect = this.value;
    const newProposedOptions = this._themeData.map((theme) => ({
      name: theme.name,
      value: theme.value,
      selected: !!valueToSelect && theme.value === valueToSelect,
    }));

    let needsReassignment = false;
    if (this._themeSelectOptions.length !== newProposedOptions.length) {
      needsReassignment = true;
    } else {
      for (let i = 0; i < newProposedOptions.length; i++) {
        const currentOpt = this._themeSelectOptions[i];
        const proposedOpt = newProposedOptions[i];

        if (!currentOpt || !proposedOpt) {
          needsReassignment = true;
          break;
        }

        if (
          currentOpt.value !== proposedOpt.value ||
          !!currentOpt.selected !== proposedOpt.selected
        ) {
          needsReassignment = true;
          break;
        }
      }
    }

    if (needsReassignment) {
      this._themeSelectOptions = newProposedOptions;
    }
  }

  private _handleInput(event: Event) {
    const newValue = (event.target as any).value as string | undefined;

    if (this.value !== newValue) {
      this.value = newValue;
      this.dispatchEvent(new UmbChangeEvent());
    }
  }

  override render() {
    if (this._loading) {
      return html`<uui-loader-bar></uui-loader-bar>`;
    }

    if (this._error) {
      return html` <uui-tag color="danger">Could not load themes: ${this._error}</uui-tag> `;
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

export default ArticulateThemePickerElement;

declare global {
  interface HTMLElementTagNameMap {
    "articulate-theme-picker-element": ArticulateThemePickerElement;
  }
}
