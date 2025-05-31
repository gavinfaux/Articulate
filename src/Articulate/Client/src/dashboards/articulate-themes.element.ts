import { css, html } from "@umbraco-cms/backoffice/external/lit";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { customElement, property, state } from "lit/decorators.js";

import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";

// TODO: auto-generated service when API is ready
import { ThemeService } from "../services/theme.service";

// TODO: generated type from API
interface Theme {
  name: string;
  path: string;
}

@customElement("articulate-themes")
export default class ArticulateThemesElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  //TODO: review if state is needed here
  @state() private _isLoading = false;
  @state() private _themes: Theme[] = [];
  @state() private _newThemeName = "";
  @state() private _selectedTheme: Theme | null = null;

  #themeService = new ThemeService(this);

  async connectedCallback() {
    super.connectedCallback();
    await this.#loadThemes();
  }

  async #loadThemes() {
    this._isLoading = true;
    try {
      this._themes = await this.#themeService.getThemes();
    } catch (error) {
      console.error("Error fetching themes:", error);
      this._themes = [];
      this._showNotification(
        "Failed to load themes. Please try again later.",
        "error",
      );
    } finally {
      this._isLoading = false;
      this.requestUpdate();
    }
  }

  private async _showNotification(message: string, type: "positive" | "error") {
    const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
    if (notificationContext) {
      notificationContext.peek(type === "positive" ? "positive" : "danger", {
        data: { message },
      });
    }
  }

  private _selectTheme(theme: Theme) {
    this._selectedTheme = theme;
    this._newThemeName = `${theme.name} - Copy`;
  }

  #onNewThemeNameChange = (e: Event) => {
    this._newThemeName = (e.target as HTMLInputElement).value;
  };

  #onCancelClick = () => {
    this._selectedTheme = null;
  };

  private async _duplicateTheme() {
    if (this._isLoading || !this._selectedTheme || !this._newThemeName) return;

    try {
      this._isLoading = true;
      const newTheme = await this.#themeService.duplicateTheme(
        this._selectedTheme.name,
        this._newThemeName,
      );

      await this._showNotification(
        `Theme '${this._selectedTheme.name}' duplicated to '${newTheme.name}'`,
        "positive",
      );

      // Reset form and reload themes
      this._selectedTheme = null;
      this._newThemeName = "";
      await this.#loadThemes();
    } catch (error) {
      console.error("Error duplicating theme:", error);
      await this._showNotification(
        "Failed to duplicate theme. Please try again later.",
        "error",
      );
    } finally {
      this._isLoading = false;
    }
  }

  override render() {
    if (!this.routerPath) {
      return html`<uui-loader></uui-loader>`;
    }
    return html`
    <uui-box>
      <div slot="headline">
        <h2 class="headline">Themes</h2>
        <span class="header">Manage Articulate themes and create your own</span>
      </div>
      <div slot="header-actions">
        <uui-button
          label="Back to Articulate dashboard options"
          look="outline"
          compact
          .href=${this.routerPath || "/umbraco/section/settings/dashboard/articulate"}>
          ← Back
        </uui-button>
      </div> 

      <div class="container"> 
        <p>
          You can duplicate any of Articulate's built-in themes to customize them yourself.
          The duplicated theme will be copied to the ~/Views/Articulate folder where you can edit it.
          Then you can select this theme from the themes drop down on your Articulate root node to use it.
        </p>
        ${
          this._isLoading && !this._themes.length
            ? html`<uui-loader></uui-loader>`
            : this._themes.length > 0
              ? html`
            <div class="theme-grid">
              ${this._themes.map(
                (theme) => html`
                  <uui-card-block-type
                    class="theme-card"
                    name="${theme.name}"
                    description="" 
                    ?selectable=${true}
                    ?selected=${this._selectedTheme?.name === theme.name}
                    @click=${() => this._selectTheme(theme)}
                  >
                    <div class="theme-initial-display">
                      ${theme.name.charAt(0).toUpperCase()}
                    </div>
                  </uui-card-block-type>
                `,
              )}
            </div>
          `
              : html`
            <p class="no-themes-message" style="text-align: center; margin-block: var(--uui-size-space-5);">
              No themes available.
            </p>
          `
        }
        
        ${
          this._selectedTheme
            ? html`
              <div class="duplicate-form">
                <h3>Duplicate '${this._selectedTheme.name}' Theme</h3>
                <p>Create a copy of this theme that you can customize.</p>
                
                <uui-form-layout-item>
                  <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
                  <uui-input 
                    id="newThemeName"
                    .value=${this._newThemeName}
                    @input=${this.#onNewThemeNameChange}
                    required
                    ?disabled=${this._isLoading && this._selectedTheme?.name === this._selectedTheme.name} 
                  ></uui-input>
                </uui-form-layout-item>

                <div class="form-actions"> 
                  <uui-button 
                    look="primary" 
                    label="Duplicate"
                    @click=${this._duplicateTheme}
                    ?disabled=${!this._newThemeName || (this._isLoading && this._selectedTheme?.name === this._selectedTheme.name)}
                    .state=${this._isLoading && this._selectedTheme?.name === this._selectedTheme.name ? "waiting" : "default"}>
                    ${this._isLoading && this._selectedTheme?.name === this._selectedTheme.name ? "Duplicating..." : "Duplicate"}
                  </uui-button>
                  
                  <uui-button 
                    look="secondary" 
                    label="Cancel"
                    @click=${this.#onCancelClick}
                    ?disabled=${this._isLoading && this._selectedTheme?.name === this._selectedTheme.name}>
                    Cancel
                  </uui-button>
                </div> 

              </div> 
            `
            : ""
        }
      </div> 
    </uui-box> 
  `;
  }

  static override readonly styles = [
    UmbTextStyles,
    css`
      
      h2.headline { 
        margin: 0;
        font-size: 1.4rem;
        font-weight: 600;
        line-height: 1.2; 
        display: block; 
      }
      span.header { 
        font-size: 0.85rem; 
        color: var(--uui-color-text-alt);
        display: block; 
        margin-top: 4px; 
      }

      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--uui-size-space-4);
        margin: var(--uui-size-space-5) 0;
      }

      .theme-card { 
        cursor: pointer;
        border: 1px solid var(--uui-color-border-emphasis); 
        min-height: 120px; 
      }

      .theme-initial-display { 
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box; 
        width: 100%; 
        height: 80px; 
        font-size: 2.2rem;
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

      .back-link {
    position: absolute;
    left: 2rem;
    bottom: -2.2rem;
    text-decoration: none;
    font-size: 0.98rem;
    color: var(--uui-color-interactive-emphasis);
    background: #fff;
    border-radius: var(--uui-border-radius);
    box-shadow: var(--uui-shadow-1);
    padding: 0.3rem 1.1rem;
    transition: background 0.2s;
    z-index: 1;
  }
  .back-link:hover {
    background: var(--uui-color-surface-alt);
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
  }
  `,
  ];
}
declare global {
  interface HTMLElementTagNameMap {
    "articulate-themes": ArticulateThemesElement;
  }
}
