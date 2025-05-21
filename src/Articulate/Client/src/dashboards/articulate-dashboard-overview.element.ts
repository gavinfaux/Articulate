import { html, css, LitElement } from '@umbraco-cms/backoffice/external/lit';
import { customElement } from 'lit/decorators.js';
import type { UmbRoute } from '@umbraco-cms/backoffice/router';
import { UMB_APP_CONTEXT } from '@umbraco-cms/backoffice/app';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import type { ManifestDashboard, UmbDashboardElement } from '@umbraco-cms/backoffice/dashboard';
import './articulate-blogml-importer.element';
import './articulate-blogml-exporter.element';
import './articulate-themes.element';

export const formStyles = css`
uui-box {
  margin-top: var(--uui-size-space-6);
  max-width: var(--uui-size-content);
  margin-inline: auto;
}

uui-form-layout-item {
  margin-bottom: var(--uui-size-space-4);
}

uui-label {
  min-width: var(--uui-size-input-medium);
  font-weight: var(--uui-weight-medium);
}

.back-link {
  text-decoration: none;
  margin-bottom: var(--uui-size-space-4);
  display: inline-block;
}

.form-actions {
  margin-top: var(--uui-size-space-6);
  text-align: right;
}
`;

@customElement('articulate-dashboard-overview')
export class ArticulateDashboardOverviewElement extends UmbElementMixin(LitElement) implements UmbDashboardElement {
  manifest?: ManifestDashboard;
  private _basePath = '/umbraco';
  private _path = 'articulate';

  connectedCallback() {
    super.connectedCallback();
    this.getContext(UMB_APP_CONTEXT).then(appContext => {
      this._basePath = appContext.getBackofficePath();
      if (this.manifest?.meta?.pathname) {
        this._path = this.manifest.meta.pathname
      }
    });
  }

  private _childDashboards = [
    { path: 'import', alias: 'articulate-blogml-importer', name: 'BlogML Importer', icon: 'cloud-upload', description: 'Import blog content from BlogML format' },
    { path: 'export', alias: 'articulate-blogml-exporter', name: 'BlogML Exporter', icon: 'download', description: 'Export blog content to BlogML format' },
    { path: 'themes', alias: 'articulate-themes', name: 'Themes', icon: 'palette', description: 'Manage and customize Articulate themes' }
  ];

  private get _parentRoutePath() {
    if (!this._basePath || !this._path) return '';
    return `${this._basePath}/section/settings/dashboard/${this._path}`;
  }

  private _routes: UmbRoute[] = [
    ...this._childDashboards.map(({ path, alias }) => ({
      path,
      component: () => {
        const element = document.createElement(alias) as UmbDashboardElement & { parentRoutePath?: string };
        element.parentRoutePath = this._parentRoutePath;
        return element;
      }
    })),
    {
      // Route for the overview dashboard (empty path)
      path: '',
      component: () => this,
    },
    {
      //Catch other routes and return to not Found
      path: "**",
      component: async () => (await import('@umbraco-cms/backoffice/router')).UmbRouteNotFoundElement,
    }
  ];

  static styles = css`
    :host {
      display: block;
      padding: var(--uui-size-space-5);
    }

    @media (max-width: 768px) {
      :host {
        padding: var(--uui-size-space-3);
      }
    }

    .dashboard-container {
      max-width: var(--uui-size-content-large);
      margin: 0 auto;
      padding: 0 var(--uui-size-space-3);
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
      gap: var(--uui-size-space-5);
    }

    @media (max-width: 768px) {
      .tools-grid {
        gap: var(--uui-size-space-4);
      }
    }

    .tool-card {
      text-decoration: none;
      color: var(--uui-color-text);
      min-width: 0; /* Prevent overflow in flex/grid */
    }

    uui-card-content-node {
      transition: var(--uui-animation-duration) var(--uui-animation-easing);
    }

    @media (hover: hover) {
      .tool-card:hover uui-card-content-node {
        transform: translateY(calc(-1 * var(--uui-size-space-1)));
      }
    }
  `;

  render() {
    return html`
      <div class="dashboard-container">
        <uui-box headline="Articulate Management">
          <div class="tools-grid">
            ${this._childDashboards.map(
              d => html`
              <a href="${this._parentRoutePath}/${d.path}" class="tool-card" 
                @click=${(e: MouseEvent) => {
                  e.preventDefault();
                  window.history.pushState({}, '', `${this._parentRoutePath}/${d.path}`);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}>
                <uui-card-content-node name="${d.name}">
                  <uui-icon name="${d.icon}" slot="icon"></uui-icon>
                  <span slot="description">
                    ${d.description}
                  </span>
                </uui-card-content-node>
              </a>`
            )}
          </div>
        </uui-box>
        <umb-router-slot .routes=${this._routes}></umb-router-slot>
      </div>
    `;
  }
}
