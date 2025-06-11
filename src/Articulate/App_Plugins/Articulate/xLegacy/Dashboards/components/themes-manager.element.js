import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
export default class ThemesManagerElement extends UmbLitElement {
    static styles = css`
        :host {
            display: block;
        }
        
        .description {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
            color: #6c757d;
        }
        
        .description a {
            color: #1976d2;
            text-decoration: underline;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-label {
            display: block;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        
        .form-description {
            font-size: 14px;
            color: #666;
            margin-bottom: 15px;
        }
        
        /* Use the original Umbraco package styling but adapted */
        .themes-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .theme-package {
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
            text-align: center;
            min-width: 140px;
        }
        
        .theme-package:hover {
            border-color: #1976d2;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .theme-package.selected {
            border-color: #2152a3;
            border-width: 2px;
            background: #f8f9ff;
        }
        
        .theme-package-content {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .theme-icon {
            margin-bottom: 10px;
        }
        
        /* Original theme styles adapted for the new component */
        .articulate-theme {
            width: 100px;
            height: 100px;
            background-color: transparent;
            background-repeat: no-repeat;
            background-size: auto 100px;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        
        .articulate-theme-Material {
            background-image: url('../BackOffice/assets/theme-material.png');
        }
        
        .articulate-theme-Mini {
            background-image: url('../BackOffice/assets/theme-mini.png');
        }
        
        .articulate-theme-Phantom {
            background-image: url('../BackOffice/assets/theme-phantom.png');
        }
        
        .articulate-theme-VAPOR {
            background-image: url('../BackOffice/assets/theme-vapor.png');
        }
        
        /* Fallback for themes without images */
        .articulate-theme-fallback {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        
        .theme-name {
            font-weight: 500;
            color: #333;
            font-size: 14px;
        }
        
        .form-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #1976d2;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }
        
        .form-input.error {
            border-color: #dc3545;
        }
        
        .error-message {
            color: #dc3545;
            font-size: 12px;
            margin-top: 5px;
        }
        
        .submit-button {
            background: #1976d2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .submit-button:hover {
            background: #1565c0;
        }
        
        .submit-button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .status-message {
            padding: 15px;
            border-radius: 4px;
            margin-top: 15px;
            font-weight: 500;
        }
        
        .status-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .status-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
    `;

    static properties = {
        themes: { type: Array },
        selectedTheme: { type: Object },
        newThemeName: { type: String },
        status: { type: String },
        isLoading: { type: Boolean },
        isSubmitting: { type: Boolean },
        validationError: { type: String }
    };

    constructor() {
        super();
        this.themes = [];
        this.selectedTheme = null;
        this.newThemeName = '';
        this.status = '';
        this.isLoading = true;
        this.isSubmitting = false;
        this.validationError = '';
        this.loadThemes();
    }

    async loadThemes() {
        try {
            // Get the base URL from server variables or fallback
          const baseUrl = window.Umbraco?.Sys?.ServerVariables?.articulate?.articulateThemeEditorBaseUrl || '/umbraco/management/api/v1/articulate/themes/';
            
            const response = await fetch(`${baseUrl}GetThemes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.themes = await response.json();
            } else {
                console.error('Failed to load themes:', response.statusText);
                this.themes = [];
            }
        } catch (error) {
            console.error('Error loading themes:', error);
            this.themes = [];
        } finally {
            this.isLoading = false;
        }
    }

    selectTheme(theme) {
        // Deselect all themes
        this.themes.forEach(t => t.selected = false);
        
        // Select the clicked theme
        theme.selected = true;
        this.selectedTheme = theme;
        
        // Trigger re-render
        this.requestUpdate();
    }

    handleThemeNameInput(e) {
        this.newThemeName = e.target.value;
        this.validationError = '';
    }

    validateForm() {
        if (!this.selectedTheme) {
            this.validationError = 'Please select a theme to copy';
            return false;
        }
        
        if (!this.newThemeName.trim()) {
            this.validationError = 'Please enter a name for your new theme';
            return false;
        }
        
        // Check for valid theme name (no special characters)
        if (!/^[a-zA-Z0-9_-]+$/.test(this.newThemeName.trim())) {
            this.validationError = 'Theme name can only contain letters, numbers, hyphens, and underscores';
            return false;
        }
        
        return true;
    }

    async copyTheme() {
        if (!this.validateForm()) {
            return;
        }

        this.isSubmitting = true;
        this.status = '';

        try {
          const baseUrl = window.Umbraco?.Sys?.ServerVariables?.articulate?.articulateThemeEditorBaseUrl || '/umbraco/management/api/v1/articulate/themes/';
            
            const response = await fetch(`${baseUrl}PostCopyTheme`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    themeName: this.selectedTheme.name,
                    newThemeName: this.newThemeName.trim()
                })
            });

            if (response.ok) {
                this.status = 'success';
                // Reset form
                this.newThemeName = '';
                this.selectedTheme = null;
                this.themes.forEach(t => t.selected = false);
                this.requestUpdate();
            } else {
                this.status = 'error';
                const errorText = await response.text();
                console.error('Failed to copy theme:', errorText);
            }
        } catch (error) {
            console.error('Error copying theme:', error);
            this.status = 'error';
        } finally {
            this.isSubmitting = false;
        }
    }

    hasThemeImage(themeName) {
        const supportedThemes = ['Material', 'Mini', 'Phantom', 'VAPOR'];
        return supportedThemes.includes(themeName);
    }

    getThemeIconLetter(themeName) {
        return themeName.charAt(0).toUpperCase();
    }

    renderThemeIcon(theme) {
        if (this.hasThemeImage(theme.name)) {
            return html`
                <div class="articulate-theme articulate-theme-${theme.name}"></div>
            `;
        } else {
            return html`
                <div class="articulate-theme articulate-theme-fallback">
                    ${this.getThemeIconLetter(theme.name)}
                </div>
            `;
        }
    }

    render() {
        if (this.isLoading) {
            return html`<div class="loading">Loading themes...</div>`;
        }

        return html`
            <div>
                <div class="description">
                    You can duplicate any of Articulate's built in 
                    <a href="https://github.com/Shazwazza/Articulate/wiki/Installed-Themes" target="_blank">themes</a>
                    to customize them yourself.
                    The duplicated theme will be copied to the ~/Views/Articulate folder where you can edit it.
                    Then you can select this theme from the themes drop down on your Articulate root node to use it.
                </div>

                <div class="form-group">
                    <label class="form-label">Choose a theme to copy</label>
                    <div class="form-description">What theme do you want to copy?</div>
                    
                    <div class="themes-grid">
                        ${this.themes.map(theme => html`
                            <div 
                                class="theme-package ${theme.selected ? 'selected' : ''}"
                                @click=${() => this.selectTheme(theme)}
                            >
                                <div class="theme-package-content">
                                    <div class="theme-icon">
                                        ${this.renderThemeIcon(theme)}
                                    </div>
                                    <div class="theme-name">${theme.name}</div>
                                </div>
                            </div>
                        `)}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Your new theme name</label>
                    <div class="form-description">Your new theme name</div>
                    <input 
                        type="text" 
                        class="form-input ${this.validationError ? 'error' : ''}" 
                        .value=${this.newThemeName}
                        @input=${this.handleThemeNameInput}
                        placeholder="Enter theme name..."
                        ?disabled=${this.isSubmitting}
                    />
                    ${this.validationError ? html`
                        <div class="error-message">${this.validationError}</div>
                    ` : ''}
                </div>

                <div class="form-group">
                    <button 
                        class="submit-button" 
                        @click=${this.copyTheme}
                        ?disabled=${this.isSubmitting}
                    >
                        ${this.isSubmitting ? 'Copying...' : 'Copy'}
                    </button>
                </div>

                ${this.status === 'success' ? html`
                    <div class="status-message status-success">
                        <h4>Your theme has been created at ~/Views/Articulate/${this.newThemeName}</h4>
                    </div>
                ` : ''}
                
                ${this.status === 'error' ? html`
                    <div class="status-message status-error">
                        Failed to copy theme. Please check the console for details.
                    </div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('articulate-themes-manager', ThemesManagerElement);
