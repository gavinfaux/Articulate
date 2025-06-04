import { css, customElement, html, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";

const dashboards = [
  {
    path: "blogml/import",
    name: "BlogML Importer",
    icon: "sync",
    description: "Import content from any BlogML compatible platform",
  },
  {
    path: "blogml/export",
    name: "BlogML Exporter",
    icon: "download",
    description: "Export content to any BlogML compatible platform",
  },
  {
    path: "theme/collection",
    name: "Themes",
    icon: "wand",
    description: "Manage customization of Articulate themes",
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
      <uui-box headline="Options">
        <div class="tools-grid">
          ${dashboards.map((d) => {
            const basePath = this.routerPath?.replace(/\/$/, "");
            const fullHref = `${basePath}/${d.path}`;
            return html`
              <uui-card-block-type
                class="tool-card"
                name="${d.name}"
                description="${d.description}"
                href=${fullHref}
              >
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
        grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
        gap: var(--uui-size-space-5);
      }

      .tool-card {
        min-width: 0;
        height: 128px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
      }

      uui-card,
      uui-card-block-type {
        transition: var(--uui-animation-duration) var(--uui-animation-easing);
      }
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
