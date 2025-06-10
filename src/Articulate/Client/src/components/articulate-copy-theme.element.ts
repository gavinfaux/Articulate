import { css, html } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { customElement, property, state } from "lit/decorators.js";
import { Articulate } from "../api/articulate/sdk.gen.ts";
import { ProblemDetails } from "../api/articulate/types.gen.ts";
import { extractErrorMessage } from "../utils/error-utils.ts";
import { showUmbracoNotification } from "../utils/notification-utils.ts";
import { renderHeaderActions } from "../utils/template-utils.ts";

/**
 * A component for duplicating Articulate themes with a new name.
 * Provides a form to select an existing theme and specify a new name for the duplicate.
 *
 * @element articulate-copy-theme
 * @extends UmbLitElement
 */
@customElement("articulate-copy-theme")
export default class ArticulateCopyThemeElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  @state() private _isLoading = true;
  @state() private _isSubmitting = false;
  @state() private _themes: string[] = [];

  private _newThemeName = "";
  @state() private _selectedTheme: string | null = null;

  /**
   * Fetches the list of available themes.
   * @private
   */
  async connectedCallback() {
    super.connectedCallback();
    await this._loadThemes();
    this._isLoading = false;
    this.requestUpdate();
  }

  private async _loadThemes() {
    try {
      const result = await Articulate.getUmbracoManagementApiV1ArticulateThemesList();

      if (!result.response.ok) {
        let errorToThrow: Error | ProblemDetails;
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
        throw new Error("Failed to load themes.");
      }

      this._themes = data?.map((theme) => theme) ?? [];
    } catch (error) {
      this._themes = [];
      const extractedMessage = extractErrorMessage(error, "Could not load themes.");
      await showUmbracoNotification(this, extractedMessage, "danger");
    }
  }

  /**
   * Selects a theme to duplicate.
   * @private
   * @param {string} theme - The name of the theme to select.
   */
  private _selectTheme(theme: string) {
    this._selectedTheme = theme;
    this._newThemeName = `${theme} - Copy`;
    this.requestUpdate();
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
      this._selectedTheme = null;
    }
  }

  #onNewThemeNameChange = (e: Event) => {
    this._newThemeName = (e.target as HTMLInputElement).value;
  };

  #onCancelClick = () => {
    this._selectedTheme = null;
  };

  /**
   * Handles form submission for duplicating a theme.
   * @private
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  private async _duplicateTheme() {
    if (this._isSubmitting || !this._selectedTheme || !this._newThemeName) return;
    try {
      this._isSubmitting = true;
      this.requestUpdate();
      const result = await Articulate.postUmbracoManagementApiV1ArticulateThemesCopy({
        body: {
          themeName: this._selectedTheme,
          newThemeName: this._newThemeName,
        },
      });

      if (!result.response.ok) {
        throw new Error(`Failed to duplicate theme: ${result.response.statusText}`);
      }

      await showUmbracoNotification(this, "Theme duplicated successfully!", "positive");
      this._selectedTheme = null;
      this._newThemeName = "";
      this.requestUpdate();
    } catch (error) {
      console.error("Error duplicating theme:", error);
      const errorMessage = extractErrorMessage(
        error,
        "Failed to duplicate theme. Please try again.",
      );
      await showUmbracoNotification(this, errorMessage, "danger");
    } finally {
      this._isSubmitting = false;
      this.requestUpdate();
    }
  }

  /**
   * Renders the theme grid.
   * @private
   * @returns {TemplateResult} The theme grid template.
   */
  private _renderThemeGrid() {
    if ((this._themes?.length ?? 0) > 0) {
      return html`
        <div class="theme-grid">
          ${(this._themes ?? []).map(
            (theme: string) => html`
              <uui-card-media
                class="theme-card"
                .name=${theme}
                ?selectable=${true}
                ?selected=${this._selectedTheme === theme}
                selectOnly
                @selected=${this._onCardSelected}
                @deselected=${this._onCardDeselected}
                data-theme=${theme}
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

    return html`
      <p
        class="no-themes-message"
        style="text-align: center; margin-block: var(--uui-size-space-5);"
      >
        No themes available.
      </p>
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

    const duplicateButtonLabel = this._isSubmitting ? "Duplicating..." : "Duplicate";

    return html`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>

        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            id="newThemeName"
            .value=${this._newThemeName}
            @input=${this.#onNewThemeNameChange}
            required
            ?disabled=${this._isSubmitting}
          ></uui-input>
        </uui-form-layout-item>

        <div class="form-actions">
          <uui-button
            look="primary"
            color="positive"
            label="Duplicate"
            type="button"
            @click=${() => this._duplicateTheme()}
            ?disabled=${!this._newThemeName || this._isSubmitting}
            .state=${this._isSubmitting ? "waiting" : "undefined"}
          >
            ${duplicateButtonLabel}
          </uui-button>

          <uui-button
            look="secondary"
            label="Cancel"
            @click=${this.#onCancelClick}
            ?disabled=${this._isSubmitting}
          >
            Cancel
          </uui-button>
        </div>
      </div>
    `;
  }

  override render() {
    if (this._isLoading) {
      return html`<uui-loader-bar></uui-loader-bar>`;
    }

    return html`
      <uui-box headline="Theme Duplication">
        ${renderHeaderActions(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customize them yourself. The
            duplicated theme will be copied to the ~/Views/Articulate folder where you can edit it.
            Then you can select this theme from the themes drop down on your Articulate root node to
            use it.
          </p>
        </div>
        <div class="container">${this._renderThemeGrid()} ${this._renderDuplicateForm()}</div>
      </uui-box>
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    css`
      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--uui-size-space-4);
        margin: var(--uui-size-space-5) 0;
        justify-content: center;
      }
      .theme-card {
        cursor: pointer;
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 170px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .theme-preview-img {
        width: 100px;
        height: 100px;
        object-fit: contain;
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
        margin-bottom: var(--uui-size-space-2);
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
        margin-top: var(--uui-size-space-4);
      }
      .form-actions {
        display: flex;
        gap: var(--uui-size-space-3);
        margin-top: var(--uui-size-space-3);
      }
      .container {
        padding-block-start: var(--uui-size-space-3);
      }
      @media (max-width: var(--uui-breakpoint-sm)) {
        :host {
          padding: var(--uui-size-space-3);
        }
        .theme-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
      }
      .no-themes-message {
        color: var(--uui-color-text-alt);
        text-align: center;
        margin-block: var(--uui-size-layout-1);
      }
    `,
  ];
}
declare global {
  interface HTMLElementTagNameMap {
    "articulate-copy-theme": ArticulateCopyThemeElement;
  }
}
