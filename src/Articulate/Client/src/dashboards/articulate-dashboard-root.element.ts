import {
  css,
  customElement,
  html,
  state,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import {
  UMB_ROUTE_CONTEXT,
  type UmbRoute,
  type UmbRouterSlotChangeEvent,
  type UmbRouterSlotInitEvent,
} from "@umbraco-cms/backoffice/router";

import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import ArticulateBlogMlExporterElement from "./articulate-blogml-exporter.element.js";
import ArticulateBlogMlImporterElement from "./articulate-blogml-importer.element.js";
import { ArticulateDashboardOptionsElement } from "./articulate-dashboard-options.element.js";
import ArticulateThemesElement from "./articulate-themes.element.js";

interface UmbSubscription {
  unsubscribe: () => void;
}

console.log("ARTICULATE DASHBOARD ROOT JS LOADED (click handler test v1)");

@customElement("articulate-dashboard-root")
export class ArticulateDashboardRootElement extends UmbLitElement {
  @state() private _activeSubPath = "";
  @state() private _routerBasePath?: string;
  @state() private _routes: UmbRoute[];
  private _parentContextSubscriptions: Array<UmbSubscription> = [];
  private _isSlotInitialized = false;

  constructor() {
    super();
    console.log("ArticulateDashboardRootElement: constructor");
    this._routes = [
      {
        path: "import",
        component: ArticulateBlogMlImporterElement,
        setup: (el) => {
          if (
            this._routerBasePath &&
            el instanceof ArticulateBlogMlImporterElement
          )
            el.routerPath = this._routerBasePath;
        },
      },
      {
        path: "export",
        component: ArticulateBlogMlExporterElement,
        setup: (el) => {
          if (
            this._routerBasePath &&
            el instanceof ArticulateBlogMlExporterElement
          )
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
          if (
            this._routerBasePath &&
            el instanceof ArticulateDashboardOptionsElement
          )
            el.routerPath = this._routerBasePath;
        },
      },
      {
        path: "**",
        component: async () =>
          (await import("@umbraco-cms/backoffice/router"))
            .UmbRouteNotFoundElement,
      },
    ];
    this.consumeContext(UMB_ROUTE_CONTEXT, (context) => {
      console.log(
        "ArticulateDashboardRootElement: Consumed UMB_ROUTE_CONTEXT from parent:",
        context,
      );
      for (const sub of this._parentContextSubscriptions) {
        sub.unsubscribe();
      }
      this._parentContextSubscriptions = [];
      if (context && typeof context.basePath?.subscribe === "function") {
        const s = context.basePath.subscribe((p: string | undefined) =>
          console.log("Parent ctx basePath:", p),
        );
        this._parentContextSubscriptions.push(s);
      }
      if (context && typeof context.activePath?.subscribe === "function") {
        const s = context.activePath.subscribe((p: string | undefined) =>
          console.log("Parent ctx activePath:", p),
        );
        this._parentContextSubscriptions.push(s);
      }
      if (context && typeof context.activeLocalPath?.subscribe === "function") {
        const s = context.activeLocalPath.subscribe((p: string | undefined) =>
          console.log("Parent ctx activeLocalPath:", p),
        );
        this._parentContextSubscriptions.push(s);
      }
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    console.log("ArticulateDashboardRootElement: connectedCallback");
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    console.log("ArticulateDashboardRootElement: disconnectedCallback");
    for (const sub of this._parentContextSubscriptions) {
      sub.unsubscribe();
    }
  }
  private _updateActiveSubPath(urlCandidate: string, source: string) {
    const routerBase = this._routerBasePath
      ? this._routerBasePath.endsWith("/")
        ? this._routerBasePath.slice(0, -1)
        : this._routerBasePath
      : undefined;
    let currentPath = urlCandidate.split(/[?#]/)[0];
    if (currentPath.length > 1 && currentPath.endsWith("/"))
      currentPath = currentPath.slice(0, -1);

    let newActiveSubPath = "";
    if (routerBase && currentPath.startsWith(routerBase)) {
      let local = currentPath.substring(routerBase.length);
      if (local.startsWith("/")) local = local.substring(1);
      newActiveSubPath = local;
    } else if (routerBase === currentPath) newActiveSubPath = "";

    if (this._activeSubPath !== newActiveSubPath) {
      this._activeSubPath = newActiveSubPath;
      console.log(
        `RootEl (${source}): Updated active SUB path: '${this._activeSubPath}' from URL: '${currentPath}', base: '${routerBase}'`,
      );
      this.requestUpdate();
    }
  }

  override render() {
    console.log(
      "ArticulateDashboardRootElement: render. Active SUB path:",
      this._activeSubPath,
      "My Base path:",
      this._routerBasePath,
    );
    return html`
      <umb-body-layout>
        <div slot="header" class="header-container"><div class="articulate-header"><div class="header-title">Articulate Management</div><div class="header-logo">ã</div></div></div>
        <div class="dashboard-container">
          <umb-router-slot
            .routes=${this._routes}
            @init=${(event: UmbRouterSlotInitEvent) => {
              this._routerBasePath = event.target.absoluteRouterPath;
              console.log(
                "RootEl: umb-router-slot @init. Base path:",
                this._routerBasePath,
              );
              this._updateActiveSubPath(
                window.location.pathname +
                  window.location.search +
                  window.location.hash,
                "@init/window",
              );
              Promise.resolve().then(() => {
                this._isSlotInitialized = true;
                console.log("RootEl: Slot initialized flag SET.");
              });
            }}
            @change=${(event: UmbRouterSlotChangeEvent) => {
              if (!this._isSlotInitialized) {
                console.log(
                  "RootEl: umb-router-slot @change IGNORED (slot not fully initialized).",
                );
                return;
              }
              const path = event.target.absoluteActiveViewPath;
              if (path) {
                console.log("RootEl: umb-router-slot @change. Path:", path);
                this._updateActiveSubPath(path, "@change");
              } else console.warn("RootEl: @change event with no path.");
            }}>
          </umb-router-slot>
        </div>
      </umb-body-layout>
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    css`
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

    /* Styles for .tools-grid, .tool-card were moved to articulate-dashboard-options.element.ts */
    
  `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "articulate-dashboard-root": ArticulateDashboardRootElement;
  }
}
