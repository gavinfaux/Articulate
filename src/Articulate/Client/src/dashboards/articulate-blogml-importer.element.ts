import { LitElement, html } from '@umbraco-cms/backoffice/external/lit';
import { customElement, property } from 'lit/decorators.js';
import { formStyles } from './articulate-dashboard-overview.element'

@customElement('articulate-blogml-importer')
export default class ArticulateBlogMlImporterElement extends LitElement {
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
    const importFile = formData.get('importFile');
    if (!blogNode || !importFile) {
      this._showMessage(formMessage, 'error', 'Please fill in all required fields');
      return;
    }

    try {
      this._isSubmitting = true;
      submitButton.setAttribute('state', 'waiting');

      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      this._showMessage(formMessage, 'positive', 'Import successful!');
    } catch (error) {
      this._showMessage(
        formMessage,
        'error',
        error instanceof Error ? error.message : 'Import failed'
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
      <uui-box headline="Articulate BlogML Importer">
        <uui-form @submit=${this._handleSubmit}>
          <uui-form-layout-item>
            <uui-label for="blogNode" required>Articulate blog node</uui-label>
            <uui-input id="blogNode" name="blogNode" placeholder="Choose node..."></uui-input>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="importFile">BlogML import file</uui-label>
            <uui-input-file id="importFile" name="importFile"></uui-input-file>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="overwrite">Overwrite imported posts?</uui-label>
            <uui-boolean-input id="overwrite" name="overwrite"></uui-boolean-input>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="publishAll">Publish all posts?</uui-label>
            <uui-boolean-input id="publishAll" name="publishAll"></uui-boolean-input>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="disqusExport">Export Disqus Xml</uui-label>
            <uui-boolean-input id="disqusExport" name="disqusExport"></uui-boolean-input>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="importImage">Import First Image from Post Attachments</uui-label>
            <uui-boolean-input id="importImage" name="importImage"></uui-boolean-input>
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
