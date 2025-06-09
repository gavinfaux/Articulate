import type { TemplateResult } from "@umbraco-cms/backoffice/external/lit";
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

/**
 * A dashboard component that displays navigation options for Articulate features.
 * Provides a grid of cards for accessing different Articulate management sections.
 *
 * @element articulate-dashboard-options
 * @extends UmbLitElement
 */
@customElement("articulate-dashboard-options")
export default class ArticulateDashboardOptionsElement extends UmbLitElement {
  /**
   * The base router path for navigation. Used to construct navigation links.
   * @type {string}
   */
  @property({ type: String })
  routerPath = "";

  /**
   * Renders a navigation card with the specified details.
   * @private
   * @param {string} title - The title of the card.
   * @param {string} description - The description text for the card.
   * @param {string} icon - The icon to display on the card.
   * @param {string} route - The path to navigate to when the card is clicked.
   * @param {boolean} [disabled=false] - Whether the card should be disabled.
   * @returns {TemplateResult} The rendered card template.
   */
  private _renderCard(
    title: string,
    description: string,
    icon: string,
    route: string,
    disabled = false,
  ): TemplateResult {
    return html`
      <uui-card-block-type
        class="tool-card"
        ?disabled=${disabled}
        name="${title}"
        description="${description}"
        href=${route}
      >
        <uui-icon name="${icon}"></uui-icon>
      </uui-card-block-type>
    `;
  }

  /**
   * Renders the dashboard options grid with navigation cards.
   * @override
   * @returns {TemplateResult} The rendered dashboard options template.
   */
  render() {
    if (!this.routerPath) {
      return html`<uui-loader-bar></uui-loader-bar>`;
    }
    return html`
      <uui-box headline="" class="dashboard-options">
        <div class="dashboard-options__grid">
          ${this._renderCard(
            "BlogML Import",
            "Import blog posts from a BlogML file",
            "document",
            this.routerPath + "blogml-import",
            false,
          )}
          ${this._renderCard(
            "BlogML Export",
            "Export blog posts to a BlogML file",
            "download-alt",
            this.routerPath + "blogml-export",
            false,
          )}
          ${this._renderCard(
            "Duplicate Theme",
            "Create a copy of an existing theme",
            "copy",
            this.routerPath + "duplicate-theme",
            false,
          )}
        </div>
      </uui-box>
    `;
  }

  static readonly styles = [
    UmbTextStyles,
    css`
      .dashboard-options__grid {
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
