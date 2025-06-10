import {
  css,
  customElement,
  html,
  property,
  state,
  TemplateResult,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { Articulate } from "../api/articulate/sdk.gen";
import type { ExportBlogMlModel, ImportModel } from "../api/articulate/types.gen"; // Consolidate and remove PagedProblemDetailsModel
import { ProblemDetails } from "../api/articulate/types.gen";
import {
  fetchArchiveDoctypeUdi,
  fetchNodeByUdi,
  openNodePicker,
} from "../utils/document-node-utils";
import { extractErrorMessage, isErrorWithMessage } from "../utils/error-utils";
import { showUmbracoNotification } from "../utils/notification-utils";
import { renderHeaderActions } from "../utils/template-utils";
import { formStyles } from "./form-styles";

// TODO: Export tests
// TODO: Polish UX / CSS

/**
 * A LitElement-based component for exporting blog content in BlogML format.
 * Provides a form to select a blog node and export its content.
 *
 * @element articulate-blogml-exporter
 * @extends UmbLitElement
 */
@customElement("articulate-blogml-exporter")
export default class ArticulateBlogMlExporterElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  @state() private _isDisabled: boolean = false;
  @state() private _isLoading: boolean = true;
  @state() private _isSubmitting = false;

  @state() private _selectedBlogNodeUdi: string | null = null;
  @state() private _selectedBlogNodeName = "No node selected";

  @state() private _downloadUrl: undefined | TemplateResult<1> = undefined;

  private _modalManagerContext?: UmbModalManagerContext;
  private _archiveDoctypeUdi: string | null = null;

  /**
   * Creates an instance of ArticulateBlogMlExporterElement.
   * Sets up the modal manager context.
   */
  constructor() {
    super();
    this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (instance) => {
      this._modalManagerContext = instance;
    });
  }

  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    super.connectedCallback();
    this._archiveDoctypeUdi = await fetchArchiveDoctypeUdi();
    if (this._archiveDoctypeUdi === null) {
      this._isDisabled = true;
      this._isLoading = false;
      this.requestUpdate();
    }
    this._isLoading = false;
    this.requestUpdate();
  }

  /**
   * Opens the Umbraco document picker to select a blog node.
   * Updates the selected node UDI and fetches its name.
   * @private
   * @returns {Promise<void>}
   */
  private async _openNodePicker() {
    try {
      const udi = await openNodePicker(this._modalManagerContext!, this._archiveDoctypeUdi!, this);
      if (udi) {
        this._selectedBlogNodeName = "Loading...";
        this.requestUpdate();
        const variant = await fetchNodeByUdi(udi);
        if (!variant) {
          throw new Error(`Selected node ${udi} not found`);
        }
        this._selectedBlogNodeUdi = udi;
        this._selectedBlogNodeName = variant.name;
        this.requestUpdate();
      }
      // Modal was closed without a selection, no action needed
    } catch (error: unknown) {
      if (isErrorWithMessage(error) && error.message.includes("No node selected")) {
        return;
      }
      const errorMessage = extractErrorMessage(
        error,
        "An error occurred while using the node picker.",
      );
      this._selectedBlogNodeName = "Error loading node";
      this.requestUpdate();
      await showUmbracoNotification(this, errorMessage, "danger");
    }
  }

  /**
   * Handles the form submission for exporting blog content.
   * Validates the form and initiates the export process.
   * @private
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  private async _handleSubmit(e: Event) {
    e.preventDefault();
    if (this._isSubmitting) return;

    const form = e.target as HTMLFormElement;
    const isValid = form.checkValidity();

    if (!isValid) {
      return;
    }
    const formData = new FormData(form);
    const submitButton = form.querySelector<HTMLElement>('uui-button[look="primary"]');

    const embedImages = formData.get("embedImages") === "on";

    const payload: ExportBlogMlModel = {
      articulateNodeId: this._selectedBlogNodeUdi!,
      exportImagesAsBase64: embedImages,
    };

    try {
      submitButton?.setAttribute("state", "waiting");
      this._isSubmitting = true;
      this.requestUpdate();
      const result = await Articulate.postUmbracoManagementApiV1ArticulateBlogExport({
        body: payload,
      });

      if (!result.response.ok) {
        let errorToThrow;
        try {
          const problemDetails: ProblemDetails = await result.response.json();
          errorToThrow = problemDetails;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          // Explicitly ignore the caught error object from response.json() parsing,
          // as we create a new generic error based on HTTP status instead.
          errorToThrow = new Error(
            `API Error: ${result.response.status} ${result.response.statusText}`,
          );
        }
        throw errorToThrow;
      }

      const responseData = result.data as ImportModel;

      if (!responseData || !responseData.downloadUrl) {
        throw new Error("Export completed but no response data was returned.");
      }

      if (responseData.downloadUrl) {
        const downloadLink = responseData.downloadUrl.startsWith("http")
          ? responseData.downloadUrl
          : `${window.location.origin}${responseData.downloadUrl}`;
        this._downloadUrl = html`<a href="${downloadLink}" target="_blank">Download</a>.`;
      }
      form.reset();
      this._selectedBlogNodeUdi = null;
      this._selectedBlogNodeName = "No node selected";
      this.requestUpdate();
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error, "Export failed.");
      await showUmbracoNotification(this, errorMessage, "danger");
    } finally {
      submitButton?.setAttribute("state", "undefined");
      this._isSubmitting = false;
      this.requestUpdate();
    }
  }

  private _closeModal() {
    this._downloadUrl = undefined;
    this.requestUpdate();
  }

  override render() {
    if (this._isLoading) {
      return html`<uui-loader-bar></uui-loader-bar>`;
    }

    if (this._isDisabled) {
      return html`<uui-box headline="BlogML Exporter">
        ${renderHeaderActions(this.routerPath)}
        <span slot="header"><uui-tag look="danger">Disabled</uui-tag></span>
        <p>Could not retrieve Articulate Archive document type.</p>
        <p>Ensure that the Articulate package is installed and configured correctly.</p>
        <p>Check the Articulate documentation for more information.</p>
      </uui-box>`;
    }

    return html`
      <uui-box headline="BlogML Exporter">
        ${renderHeaderActions(this.routerPath)}
        <uui-form-validation-message>
          <uui-form @submit=${this._handleSubmit}>
            <uui-form-layout-item>
              <uui-label for="blogNodeDisplay" required>Articulate blog node</uui-label>
              <div class="node-picker-container">
                <uui-input
                  id="blogNodeDisplay"
                  name="blogNodeDisplay"
                  .value=${this._selectedBlogNodeName}
                  readonly
                  style="flex-grow: 1;"
                ></uui-input>
                <uui-button
                  look="outline"
                  label=${this._selectedBlogNodeUdi ? "Change" : "Choose"}
                  @click=${this._openNodePicker}
                ></uui-button>
              </div>
              <input
                type="hidden"
                required
                name="blogNodeId"
                .value=${this._selectedBlogNodeUdi || ""}
              />
              <div slot="description">Choose the Articulate blog node to export from</div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label for="embedImages">Embed images?</uui-label>
              <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
              <div slot="description">
                Check if you want to embed images as base64 data in the output file. Useful if your
                site isn't going to be HTTP accessible to the site you will be importing on.
              </div>
            </uui-form-layout-item>
            <uui-button-group>
              <uui-button type="submit" look="primary">Submit</uui-button>
            </uui-button-group>
          </uui-form>
        </uui-form-validation-message>
      </uui-box>
      ${this._downloadUrl
        ? html`
            <uui-modal-container>
              <uui-modal-dialog>
                <uui-dialog>
                  <uui-dialog-layout>
                    <span slot="headline">
                      <uui-icon name="info" style="color: green;"></uui-icon> BlogML export
                      completed</span
                    >
                    <p>Your BlogML export is ready to download.</p>
                    <uui-button slot="actions" look="secondary" @click=${this._closeModal}
                      >Cancel</uui-button
                    >
                    <uui-button
                      slot="actions"
                      look="primary"
                      label="Download"
                      href=${this._downloadUrl}
                      target="_blank"
                      ><uui-icon name="download"></uui-icon> Download</uui-button
                    >
                  </uui-dialog-layout>
                </uui-dialog>
              </uui-modal-dialog>
            </uui-modal-container>
          `
        : html``}
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    formStyles,
    css`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "articulate-blogml-exporter": ArticulateBlogMlExporterElement;
  }
}
