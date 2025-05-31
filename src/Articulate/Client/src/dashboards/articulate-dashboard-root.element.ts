import { css, customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import type { UmbRoute } from "@umbraco-cms/backoffice/router";

import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import ArticulateBlogMlExporterElement from "./articulate-blogml-exporter.element.js";
import ArticulateBlogMlImporterElement from "./articulate-blogml-importer.element.js";
import { ArticulateDashboardOptionsElement } from "./articulate-dashboard-options.element.js";
import ArticulateThemesElement from "./articulate-themes.element.js";

@customElement("articulate-dashboard-root")
export class ArticulateDashboardRootElement extends UmbLitElement {
  @state() private _routerBasePath?: string;
  @state() private _routes: UmbRoute[];

  constructor() {
    super();
    this._routes = [
      {
        path: "import",
        component: ArticulateBlogMlImporterElement,
        setup: (el) => {
          if (this._routerBasePath && el instanceof ArticulateBlogMlImporterElement)
            el.routerPath = this._routerBasePath;
        },
      },
      {
        path: "export",
        component: ArticulateBlogMlExporterElement,
        setup: (el) => {
          if (this._routerBasePath && el instanceof ArticulateBlogMlExporterElement)
            el.routerPath = this._routerBasePath;
        },
      },
      {
        path: "themes",
        component: ArticulateThemesElement,
        setup: (el) => {
          if (this._routerBasePath && el instanceof ArticulateThemesElement)
            el.routerPath = this._routerBasePath;
        },
      },
      {
        path: "",
        component: ArticulateDashboardOptionsElement,
        setup: (el) => {
          if (this._routerBasePath && el instanceof ArticulateDashboardOptionsElement)
            el.routerPath = this._routerBasePath;
        },
      },
      {
        path: "**",
        component: async () =>
          (await import("@umbraco-cms/backoffice/router")).UmbRouteNotFoundElement,
      },
    ];
  }

  override render() {
    return html`
      <umb-body-layout>
        <div slot="header" class="header-container">
          <div class="articulate-header">
            <h1 class="header-title">Articulate Management</h1>
            <div class="header-logo">ã</div>
          </div>
        </div>
        <div class="dashboard-container">
          <umb-router-slot .routes=${this._routes}></umb-router-slot>
        </div>
      </umb-body-layout>
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    css`
      :host {
        display: block;
        padding: var(--uui-size-space-5);
      }

      .header-container {
        width: 100%;
        padding: 0 var(--uui-size-space-3);
      }

      .articulate-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 69px; /* Match slot height */
        background: #fff;
        border-radius: var(--uui-border-radius);
        box-shadow: var(--uui-shadow-1);
        box-sizing: border-box;
        padding: 0 2rem;
        margin: 0;
        position: relative;
      }
      .header-title {
        font-size: 2.25rem;
        font-weight: 900;
        letter-spacing: 0.01em;
        color: #222;
        display: flex;
        align-items: center;
        height: 100%;
      }
      .header-logo {
        font-weight: 900;
        font-size: 3.25rem;
        color: #c44;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
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
      @media (max-width: 768px) {
        :host {
          padding: var(--uui-size-space-3);
        }
        .articulate-header {
          padding: 1rem 0.7rem;
        }
        .back-link {
          left: 0.7rem;
        }
      }
      .dashboard-container {
        max-width: var(--uui-size-content-large);
        margin: 0 auto;
        padding: 0 var(--uui-size-space-3);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "articulate-dashboard-root": ArticulateDashboardRootElement;
  }
}
