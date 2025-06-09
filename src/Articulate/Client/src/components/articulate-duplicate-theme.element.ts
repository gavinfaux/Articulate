import { css, html } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { customElement, property, state } from "lit/decorators.js";
import { Articulate } from "../api/articulate/sdk.gen";
import { extractErrorMessage } from "../utils/error-utils.ts";
import { showUmbracoNotification } from "../utils/notification-utils.ts";

/**
 * A component for duplicating Articulate themes with a new name.
 * Provides a form to select an existing theme and specify a new name for the duplicate.
 *
 * @element articulate-duplicate-theme
 * @extends UmbLitElement
 */
@customElement("articulate-duplicate-theme")
export default class ArticulateDuplicateThemeElement extends UmbLitElement {
  /**
   * The base router path for navigation. Used to construct navigation links.
   * @type {string}
   */
  @property({ type: String })
  routerPath?: string;

  /**
   * Indicates if the component is currently loading theme data.
   * @type {boolean}
   */
  @state() private _isLoading = false;

  /**
   * Indicates if the form is currently being submitted.
   * @type {boolean}
   */
  @state()
  private _isSubmitting = false;

  /**
   * List of available theme names.
   * @type {string[]}
   */
  @state() private _themes: string[] = [];

  /**
   * The name for the new duplicated theme.
   * @type {string}
   */
  @state() private _newThemeName = "";

  /**
   * The name of the currently selected theme to duplicate.
   * @type {string}
   */
  @state() private _selectedTheme: string | null = null;

  /**
   * Resets the form to its initial state.
   * @private
   */
  private _onCancelClick() {
    this._selectedTheme = null;
    this._newThemeName = "";
  }

  /**
   * Fetches the list of available themes.
   * @private
   */
  async connectedCallback() {
    super.connectedCallback();
    await this._loadThemes();
  }

  private async _loadThemes() {
    this._isLoading = true;
    try {
      const result = await Articulate.getUmbracoManagementApiV1ArticulateThemesAll({
        throwOnError: true,
      });

      if (!result.response.ok) {
        throw new Error(`Failed to load themes: ${result.response.statusText}`);
      }

      this._themes = result.data || [];
    } catch (error) {
      console.error("Error loading themes:", error);
      await showUmbracoNotification(
        this,
        "Failed to load themes. Please try again later.",
        "danger",
      );
    } finally {
      this._isLoading = false;
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

  /**
   * Handles theme selection from the dropdown.
   * @private
   * @param {Event} e - The input change event.
   */
  private _handleThemeSelect(e: Event) {
    const card = e.target as HTMLElement;
    const theme = card.getAttribute("data-theme");
    if (theme) {
      this._selectTheme(theme);
    }
  }

  /**
   * Handles new theme name input change.
   * @private
   * @param {Event} e - The input change event.
   */
  private _onNewThemeNameChange(e: Event) {
    this._newThemeName = (e.target as HTMLInputElement).value;
  }

  /**
   * Handles form submission for duplicating a theme.
   * @private
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  private async _duplicateTheme() {
    if (!this._selectedTheme || !this._newThemeName) return;

    this._isSubmitting = true;
    try {
      const result = await Articulate.postUmbracoManagementApiV1ArticulateThemesCopy({
        body: {
          themeName: this._selectedTheme,
          newThemeName: this._newThemeName,
        },
        throwOnError: true,
      });

      if (!result.response.ok) {
        throw new Error(`Failed to duplicate theme: ${result.response.statusText}`);
      }

      await showUmbracoNotification(this, "Theme duplicated successfully!", "positive");
      this._resetForm();
    } catch (error) {
      console.error("Error duplicating theme:", error);
      const errorMessage = extractErrorMessage(
        error,
        "Failed to duplicate theme. Please try again.",
      );
      await showUmbracoNotification(this, errorMessage, "danger");
    } finally {
      this._isSubmitting = false;
    }
  }

  /**
   * Resets the form to its initial state.
   * @private
   */
  private _resetForm() {
    this._selectedTheme = null;
    this._newThemeName = "";
  }

  /**
   * Renders the theme grid.
   * @private
   * @returns {TemplateResult} The theme grid template.
   */
  private _renderThemeGrid() {
    if (this._isLoading && !(this._themes?.length ?? 0)) {
      return html`<uui-loader-bar animationDuration="1.5" style="color: blue"></uui-loader-bar>`;
    }

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
                @selected=${this._handleThemeSelect}
                @deselected=${this._handleThemeSelect}
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
                    @click=${(e: Event) => this._handleThemeSelect(e)}
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

    const duplicateButtonLabel = this._isLoading ? "Duplicating..." : "Duplicate";

    return html`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>

        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            @input=${(e: Event) => this._onNewThemeNameChange(e)}
            .value=${this._newThemeName || ""}
            required
            ?disabled=${this._isLoading}
          ></uui-input>
        </uui-form-layout-item>

        <div class="form-actions">
          <uui-button
            look="primary"
            color="positive"
            label="Duplicate"
            type="button"
            @click=${() => this._duplicateTheme()}
            ?disabled=${!this._newThemeName || this._isLoading}
            .state=${this._isLoading ? "waiting" : ""}
          >
            ${duplicateButtonLabel}
          </uui-button>

          <uui-button
            look="secondary"
            label="Cancel"
            @click=${() => this._onCancelClick()}
            ?disabled=${this._isLoading}
          >
            Cancel
          </uui-button>
        </div>
      </div>
    `;
  }

  override render() {
    if (!this.routerPath) {
      return html`<uui-loader></uui-loader>`;
    }

    return html`
      <uui-box headline="Theme Customization">
        <div slot="header-actions">
          <uui-button
            label="Back to Articulate dashboard options"
            look="outline"
            compact
            .href=${this.routerPath || "/umbraco/section/settings/dashboard/articulate"}
          >
            ← Back
          </uui-button>
        </div>
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
    "articulate-duplicate-theme": ArticulateDuplicateThemeElement;
  }
}
