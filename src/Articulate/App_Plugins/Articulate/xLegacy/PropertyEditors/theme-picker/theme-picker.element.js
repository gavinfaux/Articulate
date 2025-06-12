import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

// should maybe implement UmbPropertyEditorUiElement

export default class ArticulateThemePickerElement extends UmbElementMixin(UmbLitElement)  {
    static styles = css`
        :host {
            display: block;
        }
        
        select {
            width: 100%;
            padding: 8px;
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            font-size: 14px;
        }
        
        select:focus {
            outline: none;
            border-color: #1976d2;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }
    `;

    static properties = {
        value: { type: String },
        themes: { type: Array },
        loading: { type: Boolean }
    };

    constructor() {
        super();
        this.value = '';
        this.themes = [];
        this.loading = true;
        this.loadThemes();
    }

    async loadThemes() {
        try {
            // Get the base URL from server variables or fallback
          const baseUrl = window.Umbraco?.Sys?.ServerVariables?.articulate?.articulatePropertyEditorsBaseUrl || '/umbraco/management/api/v1/articulate/editors/';
            
            const response = await fetch(`${baseUrl}GetThemes`);
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
            this.loading = false;
        }
    }

    handleChange(e) {
        this.value = e.target.value;
        this.dispatchEvent(new CustomEvent('property-value-change', {
            detail: { value: this.value }
        }));
    }

    render() {
        if (this.loading) {
            return html`<div>Loading themes...</div>`;
        }

        return html`
            <select 
                @change=${this.handleChange} 
                .value=${this.value || ''}
            >
                <option value="">Select a theme...</option>
                ${this.themes.map(theme => html`
                    <option value=${theme} ?selected=${theme === this.value}>
                        ${theme}
                    </option>
                `)}
            </select>
        `;
    }
}

customElements.define('articulate-theme-picker', ArticulateThemePickerElement);