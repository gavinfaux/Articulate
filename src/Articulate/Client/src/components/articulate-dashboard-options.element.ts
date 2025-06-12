import type { TemplateResult } from "@umbraco-cms/backoffice/external/lit";
import { css, customElement, html, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";

const dashboards = [
  {
    path: "blogml/import",
    name: "BlogML Import",
    icon: "add",
    description: "Import content from any BlogML compatible platform",
  },
  {
    path: "blogml/export",
    name: "BlogML Export",
    icon: "download",
    description: "Export content to any BlogML compatible platform",
  },
  {
    path: "theme/copy",
    name: "Copy Theme",
    icon: "copy",
    description: "Copy Articulate themes for customization",
  },
];

/**
 * A dashboard component that displays navigation options for Articulate features.
 * Provides a grid of cards for accessing different Articulate management sections.
 *
 * @element articulate-dashboard-options
 * @extends UmbLitElement
 */
@customElement("articulate-dashboard-options")
export default class ArticulateDashboardOptionsElement extends UmbLitElement {
  @property({ type: String })
  routerPath = "";

  /**
   * Renders a navigation card with the specified details.
   * @private
   * @param {string} name - The name of the card.
   * @param {string} description - The description text for the card.
   * @param {string} icon - The icon to display on the card.
   * @param {string} fullHref - The path to navigate to when the card is clicked.
   * @returns {TemplateResult} The rendered card template.
   */
  private _renderCards(): TemplateResult {
    return html`
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
    `;
  }

  /**
   * Renders the dashboard options grid with navigation cards.
   * @override
   * @returns {TemplateResult} The rendered dashboard options template.
   */
  render() {
    return html`
      <uui-box headline="Options">
        <div class="tools-grid">${this._renderCards()}</div>
      </uui-box>
    `;
  }

  static readonly styles = [
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
