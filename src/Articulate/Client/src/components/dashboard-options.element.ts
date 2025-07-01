import { css, customElement, html, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";

const dashboards = [
  {
    path: "blogml/import",
    name: "BlogML Import",
    icon: "icon-download-alt",
    description: "Import content from any BlogML compatible platform",
  },
  {
    path: "blogml/export",
    name: "BlogML Export",
    icon: "icon-out",
    description: "Export content to any BlogML compatible platform",
  },
  {
    path: "theme/copy",
    name: "Copy Theme",
    icon: "icon-color-bucket",
    description: "Copy Articulate themes for customization",
  },
];

/**
 * A dashboard component that displays navigation options for Articulate features.
 * Provides a grid of cards for accessing different Articulate management sections.
 *
 * @element dashboard-options
 * @extends UmbLitElement
 */
@customElement("dashboard-options")
export default class DashboardOptionsElement extends UmbLitElement {
  @property({ type: String })
  routerPath = "";

  /**
   * Renders the dashboard options grid with navigation cards.
   * @override
   * @returns {TemplateResult} The rendered dashboard options template.
   */
  render() {
    return html`
      <uui-box headline="Options">
        <div class="tools-grid">
          ${dashboards.map((d) => {
            const basePath = this.routerPath?.replace(/\/$/, "");
            const fullHref = `${basePath}/${d.path}`;
            return html`
              <uui-card-block-type class="tool-card" name="${d.name}" description="${d.description}" href=${fullHref}>
                <uui-icon name="${d.icon}"></uui-icon>
              </uui-card-block-type>
            `;
          })}
        </div>
      </uui-box>
    `;
  }

  static readonly styles = [
    UmbTextStyles,
    css`
      :host {
        display: block;
      }
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--uui-size-space-6);
      }
      .tool-card {
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 250px;
        aspect-ratio: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .tool-card uui-icon {
        font-size: var(--uui-size-12, 36px);
        margin-top: var(--uui-size-space-6);
      }
      .tool-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
        transition: all 0.2s ease;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "dashboard-options": DashboardOptionsElement;
  }
}
