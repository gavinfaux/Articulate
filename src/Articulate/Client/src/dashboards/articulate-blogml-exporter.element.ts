import { css, customElement, html, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { formStyles } from "./form-styles";

@customElement("articulate-blogml-exporter")
export default class ArticulateBlogMlExporterElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  private _isSubmitting = false;

  private _showMessage(element: HTMLElement, type: string, message: string) {
    element.setAttribute("data-type", type);
    element.textContent = message;
  }

  private async _handleSubmit(e: Event) {
    e.preventDefault();
    if (this._isSubmitting) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const formMessage = form.querySelector<HTMLElement>("#formMessage");
    const submitButton = form.querySelector<HTMLElement>('uui-button[look="primary"]');

    if (!formMessage || !submitButton) return;

    const blogNode = formData.get("blogNode");
    if (!blogNode) {
      this._showMessage(formMessage, "error", "Please select a blog node");
      return;
    }

    try {
      this._isSubmitting = true;
      submitButton.setAttribute("state", "waiting");

      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this._showMessage(formMessage, "positive", "Export successful!");
    } catch (error) {
      this._showMessage(
        formMessage,
        "error",
        error instanceof Error ? error.message : "Export failed",
      );
    } finally {
      this._isSubmitting = false;
      submitButton.setAttribute("state", "default");
    }
  }

  override render() {
    if (!this.routerPath) {
      return html`<uui-loader></uui-loader>`;
    }

    return html`
      <uui-box>
        <div slot="headline">
          <h2 class="headline">BlogML Exporter</h2>
          <span class="header"
            >Export content you can import to any BlogML compatible platform.</span
          >
        </div>
        <div slot="header-actions">
          <uui-button
            label="Back to Articulate dashboard options"
            look="outline"
            compact
            href=${this.routerPath || "/umbraco/section/settings/dashboard/articulate"}
          >
            ← Back
          </uui-button>
        </div>
        <uui-form @submit=${this._handleSubmit}>
          <uui-form-layout-item>
            <uui-label for="blogNode" required>Articulate blog node</uui-label>
            <uui-input id="blogNode" name="blogNode" placeholder="Choose node..."></uui-input>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="embedImages">Embed images?</uui-label>
            <uui-boolean-input id="embedImages" name="embedImages"></uui-boolean-input>
          </uui-form-layout-item>
          <uui-form-validation-message id="formMessage"></uui-form-validation-message>
          <div class="form-actions">
            <uui-button look="primary" label="Submit">Submit</uui-button>
          </div>
        </uui-form>
      </uui-box>
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    formStyles,
    css`
  h2.headline { 
    margin: 0; /
    font-size: 1.4rem;
    font-weight: 600;
    line-height: 1.2; 
    display: block; 
  }


span.header { 
  font-size: 0.85rem; 
  color: var(--uui-color-text-alt)
  display: block; 
  margin-top: 4px; 
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
`,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "articulate-blogml-exporter": ArticulateBlogMlExporterElement;
  }
}
