import { css, customElement, html, property, query, state } from "@umbraco-cms/backoffice/external/lit";
import type { UUIButtonState } from "@umbraco-cms/backoffice/external/uui";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";

import { UmbValidationContext } from "@umbraco-cms/backoffice/validation";
import { ThemeOptions } from '../api/sdk.gen.js';
import { type IFormController, setFormError } from '../utils/form-utils.js';
import { showUmbracoNotification } from '../utils/notification-utils.js';
import {
  BoxStyles,
  ErrorBoxStyles,
  FormStyles,
  HostStyles,
  renderErrorMessage,
  renderHeaderActions,
} from '../utils/template-utils.js';

/**
 * A LitElement-based component for copying an existing theme.
 *
 * @element copy-theme
 * @extends UmbLitElement
 * @implements {IFormController}
 */
@customElement("theme-options")
export default class ThemeOptionsElement extends UmbLitElement implements IFormController {
  /**
   * Optional router path for the back button.
   * @type {string | undefined}
   */
  @property({ type: String })
  routerPath?: string;

  /**
   * The current state of the form button.
   * @type {UUIButtonState}
   */
  @state() _formState: UUIButtonState = undefined;
  /**
   * Holds an error object if a form operation fails.
   * @type {{ title: string; details: string[] } | null}
   */
  @state() _formError: { title: string; details: string[] } | null = null;
  /**
   * A list of available themes.
   * @private
   * @type {string[]}
   */
  @state() private _themes: string[] = [];
  /**
   * The name of the theme currently selected for duplication.
   * @private
   * @type {string | undefined}
   */
  @state() private _selectedTheme: string | undefined = undefined;
  /**
   * The name for the copied theme.
   * @private
   * @type {string | undefined}
   */
  @state() private _themeName: string | undefined = undefined;

  /**
   * The form element for duplicating a theme.
   * @private
   * @type {HTMLFormElement}
   */
  @query("form") private _form!: HTMLFormElement;

  #validation = new UmbValidationContext(this);

  /**
   * Loads the list of themes when the component is connected to the DOM.
   * @async
   */
  async connectedCallback() {
    super.connectedCallback();
    await this.#loadThemes();
  }

  /**
   * Resets the component's state.
   * @param {boolean} [fullReset=false] If true, performs a full reset, clearing the selected theme and form state.
   */
  resetState(fullReset = false) {
    if (fullReset) {
      this._formState = undefined;
      this._formError = null;
      this._selectedTheme = undefined;
      this._themeName = undefined;
    }
  }

  /**
   * Fetches the list of available themes from the server.
   * @private
   * @async
   */
  async #loadThemes() {
    try {
      const result = await ThemeOptions.getArticulateThemeDefault();
      if (!result.response.ok || !result.data) {
        throw result.error || new Error("The list of themes could not be retrieved from the server.");
      }
      this._themes = result.data?.map((theme) => theme) ?? [];
    } catch (error) {
      setFormError(this, error, "Could not load themes");
    }
  }

  /**
   * Sets the selected theme and pre-fills the theme name.
   * @param {string} theme The name of the theme to select.
   * @private
   */
  #selectTheme(theme: string) {
    this.resetState(true);
    this._selectedTheme = theme;
    this._themeName = `Custom${theme}Theme`;
  }

  /**
   * Handles the click event for the select button on a theme card.
   * @param {Event} event The click event.
   * @param {string} themeName The name of the theme to select.
   * @private
   */
  #handleSelectThemeButtonClick(event: Event, themeName: string) {
    event.stopPropagation();
    this.#selectTheme(themeName);
  }

  /**
   * Handles the selection of a theme card.
   * @param {Event} event The selection event.
   * @private
   */
  #onCardSelected(event: Event) {
    const card = event.target as HTMLElement;
    const theme = card.getAttribute("data-theme");
    if (theme) {
      this.#selectTheme(theme);
    }
  }

  /**
   * Handles the deselection of a theme card.
   * @param {Event} event The deselection event.
   * @private
   */
  #onCardDeselected(event: Event) {
    const card = event.target as HTMLElement;
    const theme = card.getAttribute("data-theme");
    if (theme && theme === this._selectedTheme) {
      this.resetState(true);
    }
  }

  /**
   * Handles changes to the theme name input field.
   * @param {Event} e The input event.
   * @private
   */
  #onThemeNameChange = (e: Event) => {
    this._formError = null;
    this._formState = undefined;
    this._themeName = (e.target as HTMLInputElement).value;
  };

  /**
   * Handles the form submission for duplicating a theme.
   * @param {Event} e The submit event.
   * @private
   * @async
   */
  async #handleSubmit(e: Event) {
    e.preventDefault();
    if (!this._form) return;

    try {
      await this.#validation.validate();
    } catch (error) {
      setFormError(this, error, "Validation Failed");
      return;
    }

    // validate() does not appear to work with other some uui elements, so backup validation, likely un-needed for a input box...
    if (!this._selectedTheme || !this._themeName) {
      const validationError = new Error("Please select a theme to copy and provide the theme name.");
      validationError.name = "Validation Error";
      setFormError(this, validationError, validationError.name);
      return;
    }

    if (this._formState === "waiting") return;

    this._formState = "waiting";
    this._formError = null;

    try {
      const result = await ThemeOptions.postArticulateThemeCopy({
        body: {
          themeName: this._selectedTheme!,
          newThemeName: this._themeName!,
        },
      });
      if (!result.response.ok) {
        throw result.error || new Error("Failed to copy theme.");
      }

      this._formState = "success";
      await showUmbracoNotification(this, "Theme copied successfully!", "positive");
      this.resetState(true);
    } catch (error) {
      setFormError(this, error, "Copy Failed");
    }
  }

  /**
   * Handles the reset/cancel button click event.
   * @param {Event} e The click event.
   * @private
   */
  #handleReset = (e: Event) => {
    e.preventDefault();
    this.resetState(true);
  };

  private get _submitButtonColor(): "positive" | "primary" {
    return this._selectedTheme && this._themeName ? "positive" : "primary";
  }

  /**
   * Renders the grid of available themes.
   * @returns {TemplateResult} The rendered HTML template.
   * @private
   */
  #renderThemeGrid() {
    return html`
      <div class="theme-grid">
        ${(this._themes ?? []).map(
          (theme: string) => html`
            <uui-card-media
              class="theme-card"
              .name=${theme}
              ?selectable=${this._formState !== "waiting"}
              ?selected=${this._selectedTheme === theme}
              selectOnly
              @selected=${this.#onCardSelected}
              @deselected=${this.#onCardDeselected}
              data-theme=${theme}
              role="radio"
              aria-checked=${this._selectedTheme === theme}
              aria-label=${`Select theme ${theme}`}
              tabindex="0"
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
                  @click=${(e: Event) => this.#handleSelectThemeButtonClick(e, theme)}
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

  /**
   * Renders the form for entering the theme name.
   * @returns {TemplateResult} The rendered HTML template.
   * @private
   */
  #renderDuplicateForm() {
    if (!this._selectedTheme) {
      return html``;
    }

    return html`
      <div class="duplicate-form">
        <h3>Copy '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customise.</p>
        <uui-form>
          <form
            @submit=${this.#handleSubmit}
            @input=${() => {
              this._formError = null;
              this._formState = undefined;
            }}
          >
            <uui-form-validation-message>
              <uui-form-layout-item>
                <uui-label for="themeName" slot="label" required>Theme name</uui-label>
                <uui-input
                  id="themeName"
                  name="themeName"
                  .value=${this._themeName ?? ""}
                  @input=${this.#onThemeNameChange}
                  required
                  required-message="You must provide a name for the theme."
                  label="Theme name"
                ></uui-input>
              </uui-form-layout-item>
            </uui-form-validation-message>
            <div class="form-actions">
              <uui-button
                id="duplicateButton"
                type="submit"
                look="primary"
                .color=${this._submitButtonColor}
                .state=${this._formState}
              >
                Create Theme
              </uui-button>
              <uui-button id="cancelButton" type="reset" look="secondary" @click=${this.#handleReset}>
                Cancel
              </uui-button>
            </div>
          </form>
        </uui-form>
      </div>
    `;
  }

  override render() {
    return html`
      <uui-box headline="Theme Options">
        ${renderHeaderActions(this.routerPath)}
        <div class="container">
          <h3>Creating and Customising Themes</h3>
          <p>
            Articulate's theming engine allows you to either create a brand new theme or make small, safe customisations
            to a built-in one.
          </p>
          <hr />

          <h4>Option 1: Creating a Brand New Theme</h4>
          <p>
            Use this option if you want a complete copy of a theme to use as a starting point for heavy customisation.
          </p>
          <ol>
            <li>
              Select a built-in theme from the
              <strong>Template</strong>
              options (e.g., "VAPOR").
            </li>
            <li>Enter a <em>new, unique name</em> for your theme (e.g., "CustomVaporTheme").</li>
            <li>
              Click
              <strong>Create Theme</strong>
              .
            </li>
          </ol>
          <p>
            A full copy of the template's files will be created in your
            <code>~/Views/ArticulateThemes/</code>
            folder. You can now edit any file in this new theme. Once you are ready, select it from the "Theme" dropdown
            on your Articulate root node.
          </p>

          <hr />

          <h4>Option 2: Customising a Built-in Theme</h4>
          <p>
            Use this option if you like a built-in theme but just want to change one or two things, like the layout of
            the post page or the site's colours. This method ensures your customisations are safe from package upgrades.
          </p>

          <h5>Step 1: Create the Override Folder</h5>
          <p>First, you need to create a local copy of the theme you wish to customise.</p>
          <ol>
            <li>
              Select the built-in theme you want to change from the
              <strong>Template</strong>
              options (e.g., "VAPOR").
            </li>
            <li>
              In the
              <strong>Theme Name</strong>
              field, enter the
              <strong>exact same name</strong>
              ("VAPOR").
            </li>
            <li>
              Click
              <strong>Create Theme</strong>
              .
            </li>
          </ol>
          <p>
            This will create a full copy of all the original "VAPOR" theme files in
            <code>~/Views/ArticulateThemes/VAPOR/</code>
            . This folder now has the highest priority.
          </p>

          <h5>Step 2: Create the Override Folder</h5>

          <h5>Step 2: Delete Untouched Files to Enable Fallback</h5>
          <p>
            This next step is the most important part. To get the benefits of easy maintenance and automatic updates,
            you should <em>delete any files from your new theme folder that you do not intend to change.</em>
          </p>
          <p>
            This might seem unusual, but it's very powerful. When you delete a file from your folder (for example,
            <code>List.cshtml</code>
            ), you are telling Articulate: "For this file, please use the built-in version from the original theme."
          </p>
          <p>
            <strong>Example: To only change the Post page layout.</strong>
            <br />
            After creating your "VAPOR" override folder in Step 1, go into that folder and <em>delete everything except
            for</em> <code>Post.cshtml</code>. Now you can edit <code>Post.cshtml</code> to make your changes. Your website will use your custom
            post page, but will automatically fall back to the built-in, up-to-date versions for the List page, Pager,
            Tags, and everything else.
          </p>
        </div>
        <div class="container">${this.#renderThemeGrid()} ${this.#renderDuplicateForm()}</div>
        ${this._formError ? renderErrorMessage(this._formError) : ""}
      </uui-box>
    `;
  }

  /**
   * The styles for the component.
   * @static
   * @readonly
   */
  static override readonly styles = [
    UmbTextStyles,
    HostStyles,
    BoxStyles,
    ErrorBoxStyles,
    FormStyles,
    css`
      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--uui-size-space-6);
        margin-bottom: var(--uui-size-space-6);
      }
      .theme-card {
        cursor: pointer;
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 250px;
        aspect-ratio: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .theme-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
        transition: all 0.2s ease;
      }
      .theme-preview-img {
        border-bottom: 1px solid var(--uui-color-border);
        object-fit: none;
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
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
        margin-top: var(--uui-size-space-6);
        border-top: 1px solid var(--uui-color-divider);
        padding: var(--uui-size-space-3);
      }

      .duplicate-form h3 {
        margin-top: 0;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "theme-options": ThemeOptionsElement;
  }
}
