import { css, customElement, html, property, query, state } from "@umbraco-cms/backoffice/external/lit";
import { UUIButtonState } from "@umbraco-cms/backoffice/external/uui";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { Articulate } from "../api/sdk.gen";
import { formatApiError } from "../utils/error-utils";
import { showUmbracoNotification } from "../utils/notification-utils";
import { renderErrorMessage, renderHeaderActions } from "../utils/template-utils";
/**
 * A component for duplicating Articulate themes with a new name.
 * Provides a form to select an existing theme and specify a new name for the duplicate.
 *
 * @element copy-theme
 * @extends UmbLitElement
 */
@customElement("copy-theme")
export default class CopyThemeElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  @state() private _formState: UUIButtonState = undefined;
  @state() private _formError: { title: string; details: string[] } | null = null;
  @state() private _themes: string[] = [];
  @state() private _selectedTheme: string | undefined = undefined;
  @state() private _newThemeName: string | undefined = undefined;

  @query("form") private _form!: HTMLFormElement;

  /**
   * Fetches the list of available themes.
   * @private
   */
  async connectedCallback() {
    super.connectedCallback();
    await this._loadThemes();
  }

  #clearError() {
    this._formError = null;
  }

  private async _loadThemes() {
    try {
      const result = await Articulate.getArticulateThemesDefaultV1();
      if (!result.response.ok || !result.data) {
        throw result.error || new Error("Failed to load themes.");
      }
      this._themes = result.data?.map((theme) => theme) ?? [];
    } catch (error) {
      this._formError = formatApiError(error, "Failed to load themes.");
      this._formState = "failed";
    }
  }

  /**
   * Selects a theme to duplicate.
   * @private
   * @param {string} theme - The name of the theme to select.
   */
  private _selectTheme(theme: string) {
    this.#clearError();
    this._selectedTheme = theme;
    this._newThemeName = `${theme} - Copy`;
  }

  private _handleSelectThemeButtonClick(event: Event, themeName: string) {
    event.stopPropagation();
    this._selectTheme(themeName);
  }

  private _onCardSelected(event: Event) {
    const card = event.target as HTMLElement;
    const theme = card.getAttribute("data-theme");
    if (theme) {
      this._selectTheme(theme);
    }
  }

  private _onCardDeselected(event: Event) {
    const card = event.target as HTMLElement;
    const theme = card.getAttribute("data-theme");
    if (theme && theme === this._selectedTheme) {
      this._selectedTheme = undefined;
      this.#clearError();
    }
  }

  #onNewThemeNameChange = (e: Event) => {
    this.#clearError();
    this._newThemeName = (e.target as HTMLInputElement).value;
  };

  /**
   * Handles form submission for duplicating a theme.
   * @private
   */
  private async _duplicateTheme(e: Event) {
    e.preventDefault();
    if (!this._form) return;
    if (!this._form.reportValidity()) {
      this._formState = "failed"; // Give feedback on the button
      return;
    }

    if (this._formState === "waiting") {
      return;
    }
    this._formState = "waiting";
    this.#clearError();

    if (!this._selectedTheme || !this._newThemeName) {
      this._formError = { title: "Please select a theme and enter a new theme name.", details: [] };
      return;
    }

    try {
      const result = await Articulate.postArticulateThemesCopyV1({
        body: {
          themeName: this._selectedTheme,
          newThemeName: this._newThemeName,
        },
      });
      if (!result.response.ok) {
        throw result.error || new Error("Failed to duplicate theme.");
      }
      this._formState = "success";
      await showUmbracoNotification(this, "Theme duplicated successfully!", "positive");
      this._handleReset();
    } catch (error) {
      this._formError = formatApiError(error, "Failed to duplicate theme.");
      this._formState = "failed";
    }
  }

  private _handleReset = () => {
    this._formState = undefined;
    this.#clearError();
    this._selectedTheme = undefined;
    this._newThemeName = undefined;
  };

  /**
   * Renders the theme grid.
   * @private
   * @returns {TemplateResult} The theme grid template.
   */
  private _renderThemeGrid() {
    return html`
      <div class="theme-grid">
        ${(this._themes ?? []).map(
      (theme: string) => html`
            <uui-card-media
              class="theme-card"
              .name=${theme}
              ?selectable=${this._formState !== "waiting"}
              ?selected=${this._selectedTheme === theme}
              selectOnly
              @selected=${this._onCardSelected}
              @deselected=${this._onCardDeselected}
              data-theme=${theme}
              role="radio"
              aria-checked=${this._selectedTheme === theme}
              aria-label=${`Select theme ${theme}`}
              tabindex="0"
            >
              <img
                class="theme-preview-img"
                src="/App_Plugins/Articulate/BackOffice/assets/theme-${theme.toLowerCase()}.png"
                alt="${theme} theme preview"
                loading="lazy"
                @error=${(e: Event) => {
          const img = e.target as HTMLImageElement;
          img.style.display = "none";

          const parent = img.parentElement;
          if (!parent) return;

          if (!parent.querySelector(":scope > .theme-fallback-initial")) {
            const span = document.createElement("span");
            span.className = "theme-fallback-initial";
            span.textContent = theme.charAt(0).toUpperCase();
            parent.appendChild(span);
          }
        }}
              />
              <div slot="actions">
                <uui-button
                  look="primary"
                  label="Select Theme ${theme}"
                  @click=${(e: Event) => this._handleSelectThemeButtonClick(e, theme)}
                >
                  Select
                </uui-button>
              </div>
            </uui-card-media>
          `,
    )}
      </div>
    `;
  }

  /**
   * Renders the duplicate form.
   * @private
   * @returns {TemplateResult} The duplicate form template.
   */
  private _renderDuplicateForm() {
    if (!this._selectedTheme) {
      return html``;
    }
    const duplicateButtonLabel = this._formState === "waiting" ? "Duplicating..." : "Duplicate";
    return html`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>
        <uui-form>
          <form @submit=${(e: Event) => e.preventDefault()} @input=${this.#clearError}>
            <uui-validation-message>
              <uui-form-layout-item>
                <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
                <uui-input
                  id="newThemeName"
                  name="newThemeName"
                  .value=${this._newThemeName ?? ""}
                  @input=${this.#onNewThemeNameChange}
                  required
                ></uui-input>
              </uui-form-layout-item>
            </uui-validation-message>
          </form>
        </uui-form>
        <div class="form-actions">
          <uui-button
            look="primary"
            label=${duplicateButtonLabel}
            type="button"
            @click=${this._duplicateTheme}
            .state=${this._formState}
          >
            ${duplicateButtonLabel}
          </uui-button>
          <uui-button type="button" look="secondary" @click=${this._handleReset}>Reset</uui-button>
        </div>
      </div>
    `;
  }

  override render() {
    return html`
      <uui-box headline="Theme Duplication">
        ${renderHeaderActions(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customize them yourself. The duplicated theme will
            be copied to the ~/Views/Articulate folder where you can edit it. Then you can select this theme from the
            themes drop down on your Articulate root node to use it.
          </p>
        </div>
        <div class="container">${this._renderThemeGrid()} ${this._renderDuplicateForm()}</div>
        ${renderErrorMessage(this._formError)}
      </uui-box>
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    css`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }
      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--uui-size-space-6);
        margin-bottom: var(--uui-size-space-6);
      }
      .theme-card {
        cursor: pointer;
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 250px;
        aspect-ratio: 1;
        box-sizing: border-box;
        display: flex;
        text-align: center;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .theme-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
        transition: all 0.2s ease;
      }
      .theme-preview-img {
        border-bottom: 1px solid var(--uui-color-border);
        object-fit: none;
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
      }
      .theme-fallback-initial {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-size: 3rem;
        font-weight: bold;
        color: var(--uui-color-text-alt);
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
      }
      .duplicate-form {
        background: var(--uui-color-surface);
        padding: var(--uui-size-space-4);
        border-radius: var(--uui-border-radius);
        margin-top: var(--uui-size-space-6);
        border-top: 1px solid var(--uui-color-divider);
        padding: var(--uui-size-space-3);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "copy-theme": CopyThemeElement;
  }
}
