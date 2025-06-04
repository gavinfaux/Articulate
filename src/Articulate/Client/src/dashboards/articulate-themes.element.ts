import { css, html } from "@umbraco-cms/backoffice/external/lit";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { customElement, property, state } from "lit/decorators.js";

import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import {
  ArticulateService,
  PostUmbracoManagementApiV1ArticulateThemeCopyData,
  ProblemDetails,
} from "../api/core";

@customElement("articulate-themes")
export default class ArticulateThemesElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  @state() private _isLoading = false;
  @state() private _themes: string[] = [];
  private _newThemeName = "";
  @state() private _selectedTheme: string | null = null;

  async connectedCallback() {
    super.connectedCallback();
    await this.#loadThemes();
  }

  async #loadThemes() {
    this._isLoading = true;
    try {
      const { data } = await ArticulateService.getUmbracoManagementApiV1ArticulateThemeThemes();
      this._themes = data?.map((theme) => theme.name) ?? [];
    } catch {
      this._themes = [];
      this._showNotification("Failed to load themes. Please try again later.", "error");
    } finally {
      this._isLoading = false;
      this.requestUpdate();
    }
  }

  private async _showNotification(message: string, type: "positive" | "error") {
    const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
    if (notificationContext) {
      notificationContext.peek(type === "positive" ? "positive" : "danger", {
        data: { message },
      });
    }
  }

  private _selectTheme(theme: string) {
    this._selectedTheme = theme;
    this.requestUpdate();
  }

  private _handleSelectThemeButtonClick(event: Event, themeName: string) {
    event.stopPropagation();
    this._selectTheme(themeName);
  }

  private _onCardSelected(event: Event) {
    const card = event.target as HTMLElement;
    const theme = card.getAttribute("data-theme");
    if (theme) {
      this._selectTheme(theme);
    }
  }

  private _onCardDeselected(event: Event) {
    const card = event.target as HTMLElement;
    const theme = card.getAttribute("data-theme");
    if (theme && theme === this._selectedTheme) {
      this._selectedTheme = null;
    }
  }

  #onNewThemeNameChange = (e: Event) => {
    this._newThemeName = (e.target as HTMLInputElement).value;
  };

  #onCancelClick = () => {
    this._selectedTheme = null;
  };

  private async _duplicateTheme() {
    if (this._isLoading || !this._selectedTheme || !this._newThemeName) return;
    const payload: PostUmbracoManagementApiV1ArticulateThemeCopyData = {
      body: {
        themeName: this._selectedTheme,
        newThemeName: this._newThemeName,
      },
      url: "/umbraco/management/api/v1/articulate/theme/copy",
    };
    try {
      this._isLoading = true;
      const { data: newTheme } =
        await ArticulateService.postUmbracoManagementApiV1ArticulateThemeCopy({
          ...payload,
          throwOnError: true,
        });

      if (!newTheme) {
        throw new Error("Failed to duplicate theme. Review back office logs for more details.");
      }

      await this._showNotification(
        `Theme '${this._selectedTheme}' duplicated to 'wwwroot/Views/Articulate/${newTheme.name}'`,
        "positive",
      );

      this._selectedTheme = null;
      this._newThemeName = "";
    } catch (error: unknown) {
      await this._extractAndNotifyError(
        error,
        "Failed to duplicate theme. Review back office logs for more details.",
      );
    } finally {
      this._isLoading = false;
    }
  }

  private async _extractAndNotifyError(error: unknown, defaultMessage: string) {
    let message = defaultMessage;

    if (error && typeof error === "object" && "response" in error) {
      const response = (error as any).response;
      if (response?.data) {
        const problem = response.data as ProblemDetails;
        message = problem.title || message;
        if (problem.detail) {
          message += `: ${problem.detail}`;
        }
      }
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }

    await this._showNotification(message, "error");
  }

  private _renderThemeGrid() {
    if (this._isLoading && !(this._themes?.length ?? 0)) {
      return html`<uui-loader></uui-loader>`;
    }

    if ((this._themes?.length ?? 0) > 0) {
      return html`
        <div class="theme-grid">
          ${(this._themes ?? []).map(
            (theme: string) => html`
              <uui-card-media
                class="theme-card"
                .name=${theme}
                ?selectable=${true}
                ?selected=${this._selectedTheme === theme}
                selectOnly
                @selected=${this._onCardSelected}
                @deselected=${this._onCardDeselected}
                data-theme=${theme}
              >
                <img
                  class="theme-preview-img"
                  src="/App_Plugins/Articulate/BackOffice/assets/theme-${theme.toLowerCase()}.png"
                  alt="${theme} theme preview"
                  loading="lazy"
                  @error=${(e: Event) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = "none";

                    const parent = img.parentElement;
                    if (!parent) return;

                    if (!parent.querySelector(":scope > .theme-fallback-initial")) {
                      const span = document.createElement("span");
                      span.className = "theme-fallback-initial";
                      span.textContent = theme.charAt(0).toUpperCase();
                      parent.appendChild(span);
                    }
                  }}
                />
                <div slot="actions">
                  <uui-button
                    look="primary"
                    label="Select Theme ${theme}"
                    @click=${(e: Event) => this._handleSelectThemeButtonClick(e, theme)}
                  >
                    Select
                  </uui-button>
                </div>
              </uui-card-media>
            `,
          )}
        </div>
      `;
    }

    return html`
      <p
        class="no-themes-message"
        style="text-align: center; margin-block: var(--uui-size-space-5);"
      >
        No themes available.
      </p>
    `;
  }

  private _renderDuplicateForm() {
    if (!this._selectedTheme) {
      return html``;
    }

    const duplicateButtonLabel = this._isLoading ? "Duplicating..." : "Duplicate";

    return html`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>

        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            id="newThemeName"
            .value=${this._newThemeName}
            @input=${this.#onNewThemeNameChange}
            required
            ?disabled=${this._isLoading}
          ></uui-input>
        </uui-form-layout-item>

        <div class="form-actions">
          <uui-button
            look="primary"
            color="positive"
            label="Duplicate"
            type="button"
            @click=${this._duplicateTheme}
            ?disabled=${!this._newThemeName || this._isLoading}
            .state=${this._isLoading ? "waiting" : ""}
          >
            ${duplicateButtonLabel}
          </uui-button>

          <uui-button
            look="secondary"
            label="Cancel"
            @click=${this.#onCancelClick}
            ?disabled=${this._isLoading}
          >
            Cancel
          </uui-button>
        </div>
      </div>
    `;
  }

  override render() {
    if (!this.routerPath) {
      return html`<uui-loader></uui-loader>`;
    }

    return html`
      <uui-box headline="Theme Customization">
        <div slot="header-actions">
          <uui-button
            label="Back to Articulate dashboard options"
            look="outline"
            compact
            .href=${this.routerPath || "/umbraco/section/settings/dashboard/articulate"}
          >
            ← Back
          </uui-button>
        </div>
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customize them yourself. The
            duplicated theme will be copied to the ~/Views/Articulate folder where you can edit it.
            Then you can select this theme from the themes drop down on your Articulate root node to
            use it.
          </p>
        </div>
        <div class="container">${this._renderThemeGrid()} ${this._renderDuplicateForm()}</div>
      </uui-box>
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    css`
      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--uui-size-space-4);
        margin: var(--uui-size-space-5) 0;
        justify-content: center;
      }
      .theme-card {
        cursor: pointer;
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 170px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .theme-preview-img {
        width: 100px;
        height: 100px;
        object-fit: contain;
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
        margin-bottom: var(--uui-size-space-2);
      }
      .theme-fallback-initial {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-size: 3rem;
        font-weight: bold;
        color: var(--uui-color-text-alt);
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
      }
      .duplicate-form {
        background: var(--uui-color-surface);
        padding: var(--uui-size-space-4);
        border-radius: var(--uui-border-radius);
        margin-top: var(--uui-size-space-4);
      }
      .form-actions {
        display: flex;
        gap: var(--uui-size-space-3);
        margin-top: var(--uui-size-space-3);
      }
      .container {
        padding-block-start: var(--uui-size-space-3);
      }
      @media (max-width: var(--uui-breakpoint-sm)) {
        :host {
          padding: var(--uui-size-space-3);
        }
        .theme-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
      }
      .no-themes-message {
        color: var(--uui-color-text-alt);
        text-align: center;
        margin-block: var(--uui-size-layout-1);
      }
    `,
  ];
}
declare global {
  interface HTMLElementTagNameMap {
    "articulate-themes": ArticulateThemesElement;
  }
}
