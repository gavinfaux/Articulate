import { css, customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import type { UmbRoute, UmbRouterSlotInitEvent } from "@umbraco-cms/backoffice/router";

import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import ArticulateBlogMlExporterElement from "../components/articulate-blogml-exporter.element.js";
import ArticulateBlogMlImporterElement from "../components/articulate-blogml-importer.element.js";
import ArticulateDashboardOptionsElement from "../components/articulate-dashboard-options.element.js";
import ArticulateDuplicateThemeElement from "../components/articulate-duplicate-theme.element.js";

@customElement("articulate-dashboard-root")
export default class ArticulateDashboardRootElement extends UmbLitElement {
  @state() private _routerBasePath?: string;
  @state() private _routes: UmbRoute[];

  constructor() {
    super();
    this._routes = [
      {
        path: "blogml/import",
        component: ArticulateBlogMlImporterElement,
        setup: (el) => {
          if (this._routerBasePath && el instanceof ArticulateBlogMlImporterElement)
            el.routerPath = this._routerBasePath;
        },
      },
      {
        path: "blogml/export",
        component: ArticulateBlogMlExporterElement,
        setup: (el) => {
          if (this._routerBasePath && el instanceof ArticulateBlogMlExporterElement)
            el.routerPath = this._routerBasePath;
        },
      },
      {
        path: "theme/collection",
        component: ArticulateDuplicateThemeElement,
        setup: (el) => {
          if (this._routerBasePath && el instanceof ArticulateDuplicateThemeElement)
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
            <h3 class="header-title">Articulate Management</h3>
            <div class="header-logo">ã</div>
          </div>
        </div>
        <div class="dashboard-container">
          <umb-router-slot
            .routes=${this._routes}
            @init=${(event: UmbRouterSlotInitEvent) => {
              this._routerBasePath = event.target.absoluteRouterPath;
            }}
          ></umb-router-slot>
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
        height: 69px;
        background: var(--uui-color-surface);
        border-radius: var(--uui-border-radius);
        box-shadow: var(--uui-shadow-1);
        box-sizing: border-box;
        padding: 0 2rem;
        margin: 0;
        position: relative;
      }
      .header-title {
        font-size: var(--uui-type-h3-size);
        font-weight: 700;
        letter-spacing: 0.01em;
        color: var(--uui-color-text);
        display: flex;
        align-items: center;
        height: 100%;
      }
      .header-logo {
        font-weight: 900;
        font-size: var(--uui-type-h1-size);
        color: #c44;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
      }
      @media (max-width: 768px) {
        :host {
          padding: var(--uui-size-space-3);
        }
        .articulate-header {
          padding: 1rem 0.7rem;
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
