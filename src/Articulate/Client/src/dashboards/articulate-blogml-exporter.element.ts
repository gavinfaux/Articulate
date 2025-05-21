import { LitElement, html } from '@umbraco-cms/backoffice/external/lit';
import { customElement, property } from 'lit/decorators.js';
import { formStyles } from './articulate-dashboard-overview.element'

@customElement('articulate-blogml-exporter')
export default class ArticulateBlogMlExporterElement extends LitElement {
  @property({ type: String }) parentRoutePath = '';
  private _isSubmitting = false;

  private _showMessage(element: HTMLElement, type: string, message: string) {
    element.setAttribute('data-type', type);
    element.textContent = message;
  }

  private async _handleSubmit(e: Event) {
    e.preventDefault();
    if (this._isSubmitting) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const formMessage = form.querySelector<HTMLElement>('#formMessage');
    const submitButton = form.querySelector<HTMLElement>('uui-button[look="primary"]');

    if (!formMessage || !submitButton) return;

    const blogNode = formData.get('blogNode');
    if (!blogNode) {
      this._showMessage(formMessage, 'error', 'Please select a blog node');
      return;
    }

    try {
      this._isSubmitting = true;
      submitButton.setAttribute('state', 'waiting');

      // TODO: Implement actual API call with embedImages flag
      await new Promise(resolve => setTimeout(resolve, 1000));
      this._showMessage(formMessage, 'positive', 'Export successful!');
    } catch (error) {
      this._showMessage(
        formMessage,
        'error',
        error instanceof Error ? error.message : 'Export failed'
      );
    } finally {
      this._isSubmitting = false;
      submitButton.setAttribute('state', 'default');
    }
  }

  static styles = [
    formStyles
  ];

  render() {
    return html`
      <a href="${this.parentRoutePath}" class="back-link"
        @click=${(e: MouseEvent) => {
          e.preventDefault();
          window.history.pushState({}, '', this.parentRoutePath);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
      >
        <uui-button look="secondary">← Back to overview</uui-button>
      </a>
      <uui-box headline="Articulate BlogML Exporter">
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
}
