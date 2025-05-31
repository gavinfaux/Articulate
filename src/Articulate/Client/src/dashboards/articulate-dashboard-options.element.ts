import {
  css,
  customElement,
  html,
  property,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";

const dashboards = [
  {
    path: "import",
    name: "BlogML Importer",
    icon: "sync",
    description: "Import blog content from BlogML format",
  },
  {
    path: "export",
    name: "BlogML Exporter",
    icon: "download",
    description: "Export blog content to BlogML format",
  },
  {
    path: "themes",
    name: "Themes",
    icon: "wand",
    description: "Manage and customize Articulate themes",
  },
];

@customElement("articulate-dashboard-options")
export class ArticulateDashboardOptionsElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  override render() {
    if (!this.routerPath) {
      return html`<uui-loader></uui-loader>`;
    }
    return html`
      <uui-box headline="Settings" headline-variant="h2">
      <div class="tools-grid">
          ${dashboards.map((d) => {
            const basePath = this.routerPath?.endsWith("/")
              ? this.routerPath?.slice(0, -1)
              : this.routerPath;
            const fullHref = `${basePath}/${d.path}`;
            return html`
                <uui-card-block-type
                  class="tool-card"
                  name="${d.name}"
                  description="${d.description}"
                  href=${fullHref}>
                  <uui-icon name="${d.icon}"></uui-icon>
                </uui-card-block-type>
              `;
          })}
        </div>
      </uui-box>
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    css`
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
      gap: var(--uui-size-space-5);
    }

    .tool-card {
      min-width: 0;
      cursor: pointer;
    }
    uui-card,
    uui-card-block-type {
      transition: var(--uui-animation-duration) var(--uui-animation-easing);
    }

    a { text-decoration: none; color: inherit; display: block;}
    @media (max-width: 768px) {
      .tools-grid {
        gap: var(--uui-size-space-4);
      }
    }
  `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "articulate-dashboard-options": ArticulateDashboardOptionsElement;
  }
}
