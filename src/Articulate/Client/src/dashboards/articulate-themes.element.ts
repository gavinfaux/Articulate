import { LitElement, html, css } from '@umbraco-cms/backoffice/external/lit';
import { customElement, property, state } from 'lit/decorators.js';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { UMB_NOTIFICATION_CONTEXT } from '@umbraco-cms/backoffice/notification';

// TODO: auto-generated service when API is ready
import { ThemeService } from '../services/theme.service';

// TODO: generated type from API
interface Theme {
  name: string;
  path: string;
}

@customElement('articulate-themes')
export default class ArticulateThemesElement extends UmbElementMixin(LitElement) {
  @property({ type: String }) parentRoutePath = '';

  //TODO: review if state is needed here
  @state() private _isLoading = false;
  @state() private _themes: Theme[] = [];
  @state() private _newThemeName = '';
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
      console.error('Failed to load themes:', error);
      this._themes = [];
      this._showNotification('Failed to load themes', 'error');
    } finally {
      this._isLoading = false;
    }
  }

  private async _showNotification(message: string, type: 'positive' | 'error') {
    const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
    if (notificationContext) {
      notificationContext.peek(
        type === 'positive' ? 'positive' : 'danger',
        { data: { message } }
      );
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
        this._newThemeName
      );

      await this._showNotification(
        `Theme '${this._selectedTheme.name}' duplicated to '${newTheme.name}'`,
        'positive'
      );

      // Reset form and reload themes
      this._selectedTheme = null;
      this._newThemeName = '';
      await this.#loadThemes();
    } catch (error) {
      await this._showNotification(
        error instanceof Error ? error.message : 'Failed to duplicate theme',
        'error'
      );
    } finally {
      this._isLoading = false;
    }
  }

  static styles = css`
    :host {
      display: block;
      padding: var(--uui-size-space-5);
      max-width: var(--uui-size-content);
      margin: 0 auto;
    }

    h2 {
      margin-top: 0;
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--uui-size-space-4);
      margin: var(--uui-size-space-5) 0;
    }

    .theme-card {
      border: 1px solid var(--uui-color-border);
      border-radius: var(--uui-border-radius);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .theme-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .theme-card.selected {
      border-color: var(--uui-color-selected);
      box-shadow: 0 0 0 2px var(--uui-color-selected);
    }

    .theme-preview {
      aspect-ratio: 4/3;
      background-color: var(--uui-color-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: var(--uui-color-text-alt);
    }

    .theme-name {
      padding: var(--uui-size-space-3);
      text-align: center;
      font-weight: bold;
      border-top: 1px solid var(--uui-color-border);
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

    .theme-name {
      font-weight: var(--uui-weight-bold);
      margin-block: var(--uui-size-space-2);
    }

    .back-link {
      text-decoration: none;
      margin-bottom: var(--uui-size-space-4);
      display: inline-block;
    }

    @media (max-width: var(--uui-breakpoint-sm)) {
      :host {
        padding: var(--uui-size-space-3);
      }
    }
  `;

  render() {
    return html`
      <umb-body-layout>
        <a href="${this.parentRoutePath}" class="back-link"
          @click=${(e: MouseEvent) => {
            e.preventDefault();
            window.history.pushState({}, '', this.parentRoutePath);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        >
          <uui-button look="secondary">← Back to overview</uui-button>
        </a>
        <uui-box>
          <h1 slot="headline">Articulate Themes</h1>
          <div class="container">
            <p>
              You can duplicate any of Articulate's built-in themes to customize them yourself.
              The duplicated theme will be copied to the ~/Views/Articulate folder where you can edit it.
              Then you can select this theme from the themes drop down on your Articulate root node to use it.
            </p>

            <h2>Available Themes</h2>
            
            ${this._isLoading
        ? html`<uui-loader></uui-loader>`
        : html`
                  <div class="theme-grid">
                    ${this._themes.map(
          (theme) => html`
                        <div 
                          class="theme-card ${this._selectedTheme?.name === theme.name ? 'selected' : ''}"
                          @click=${() => this._selectTheme(theme)}>
                          <div class="theme-preview">
                            ${theme.name.charAt(0).toUpperCase()}
                          </div>
                          <div class="theme-name">${theme.name}</div>
                        </div>
                      `
        )}
                  </div>
                `
      }

            ${this._selectedTheme ? html`
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
                    ?disabled=${this._isLoading}>
                  </uui-input>
                </uui-form-layout-item>

                <div class="form-actions">
                  <uui-button 
                    look="primary" 
                    label="Duplicate"
                    @click=${this._duplicateTheme}
                    ?disabled=${!this._newThemeName || this._isLoading}
                    .state=${this._isLoading ? 'waiting' : 'default'}>
                    ${this._isLoading ? 'Duplicating...' : 'Duplicate'}
                  </uui-button>
                  
                  <uui-button 
                    look="secondary" 
                    label="Cancel"
                    @click=${this.#onCancelClick}
                    ?disabled=${this._isLoading}>
                    Cancel
                  </uui-button>
                </div>
              </div>
            ` : ''}
          </div>
        </uui-box>
      </umb-body-layout>
    `;
  }
}
