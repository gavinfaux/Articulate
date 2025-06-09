import {
  css,
  customElement,
  html,
  property,
  state,
  unsafeHTML,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { Articulate } from "../api/articulate/sdk.gen";
import type { ExportBlogMlModel, ImportModel } from "../api/articulate/types.gen"; // Consolidate and remove PagedProblemDetailsModel
import { ProblemDetails } from "../api/articulate/types.gen";
import { fetchArchiveDoctypeUdi, openNodePicker } from "../utils/document-node-utils";
import { extractErrorMessage } from "../utils/error-utils";
import {
  reviewLogsMessage,
  setFormMessage,
  showUmbracoNotification,
} from "../utils/notification-utils";
import { formStyles } from "./form-styles";

import type { DocumentResponseModel } from "@umbraco-cms/backoffice/external/backend-api";
import { DocumentService } from "@umbraco-cms/backoffice/external/backend-api";

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

  @state() private _isSubmitting = false;

  @state() public _formMessageType: "positive" | "error" | "" = "";
  @state() public _formMessageText = "";

  @state() private _archiveDoctypeUdi = "";

  @state() private _selectedBlogNodeUdi: string | null = null;
  @state() private _selectedBlogNodeName = "No node selected";

  private _modalManagerContext?: UmbModalManagerContext;

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
    await this._fetchArchiveDoctypeUdi();
  }

  /**
   * Fetches the UDI of the Articulate Archive document type.
   * @private
   * @returns {Promise<void>}
   */
  private async _fetchArchiveDoctypeUdi() {
    try {
      this._archiveDoctypeUdi = await fetchArchiveDoctypeUdi();
    } catch (error) {
      const errorMessage = extractErrorMessage(
        error,
        `Could not retrieve Articulate Archive document type. ${reviewLogsMessage}`,
      );
      setFormMessage(this, "error", errorMessage);
    }
  }

  /**
   * Opens the Umbraco document picker to select a blog node.
   * Updates the selected node UDI and fetches its name.
   * @private
   * @returns {Promise<void>}
   */
  private async _openNodePicker() {
    if (!this._modalManagerContext) {
      setFormMessage(
        this,
        "error",
        "UMB_MODAL_MANAGER_CONTEXT not found. Unable to open node picker.",
      );
      return;
    }
    try {
      const selectedNodeUnique = await openNodePicker(
        this._modalManagerContext,
        this._archiveDoctypeUdi,
        this,
      );
      if (selectedNodeUnique) {
        this._selectedBlogNodeUdi = selectedNodeUnique;
        await this._fetchNode(selectedNodeUnique);
        this.requestUpdate("_selectedBlogNodeName");
        this.requestUpdate("_selectedBlogNodeUdi");
      }
      // Modal was closed without a selection, no action needed
    } catch (error) {
      const errorMessage = extractErrorMessage(
        error,
        `An error occurred while using the node picker. ${reviewLogsMessage}`,
      );
      setFormMessage(this, "error", errorMessage);
    }
  }

  /**
   * Fetches and updates the display name of a node by its UDI.
   * @private
   * @param {string} udi - The UDI of the node to fetch the name for.
   * @returns {Promise<void>}
   */
  private async _fetchNode(udi: string) {
    try {
      const response: DocumentResponseModel = await DocumentService.getDocumentById({
        id: udi,
      });
      // Check if we have a valid response
      const firstVariant = response?.variants?.[0];
      if (firstVariant) {
        this._selectedBlogNodeName = firstVariant.name;
        this.requestUpdate("_selectedBlogNodeName");
      }
      setFormMessage(this, "error", `Node with id ${udi} not found. ${reviewLogsMessage}`);
      return null;
    } catch (error) {
      const errorMessage = extractErrorMessage(
        error,
        `An error occurred while fetching node with id ${udi}. ${reviewLogsMessage}`,
      );
      setFormMessage(this, "error", errorMessage);
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
    const formData = new FormData(form);
    const submitButton = form.querySelector<HTMLElement>('uui-button[look="primary"]');

    if (!submitButton) return;
    setFormMessage(this, "", "");

    if (!this._selectedBlogNodeUdi) {
      setFormMessage(this, "error", "Please select an Articulate Archive node to export from.");
      return;
    }

    const embedImages = formData.get("embedImages") === "on";

    const payload: ExportBlogMlModel = {
      articulateNodeId: this._selectedBlogNodeUdi,
      exportImagesAsBase64: embedImages,
    };

    try {
      this._isSubmitting = true;
      submitButton.setAttribute("state", "waiting");

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
      let successMessage = "BlogML export completed successfully.";
      if (responseData && responseData.downloadUrl) {
        const downloadLink = responseData.downloadUrl.startsWith("http")
          ? responseData.downloadUrl
          : `${window.location.origin}${responseData.downloadUrl}`;
        successMessage = `BlogML export completed. <a href="${downloadLink}" target="_blank">Download exported file</a>.`;
      }

      setFormMessage(this, "positive", successMessage);
      // reset form fields or selections here?
      form.reset();
      this._selectedBlogNodeUdi = null;
      this._selectedBlogNodeName = "No node selected";
      this.requestUpdate();
    } catch (error: unknown) {
      console.error("BlogML Export Error:", error);
      const errorMessage = extractErrorMessage(error, `Export failed. ${reviewLogsMessage}`);
      await showUmbracoNotification(this, errorMessage, "danger");
      setFormMessage(this, "error", errorMessage);
    } finally {
      this._isSubmitting = false;
      submitButton.setAttribute("state", "default");
    }
  }

  override render() {
    if (!this.routerPath) {
      return html`<uui-loader-bar></uui-loader-bar>`;
    }

    return html`
      <uui-box headline="BlogML Exporter">
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
            <uui-label for="blogNodeDisplay" required slot="label">Articulate blog node</uui-label>
            <div slot="description">Choose the Articulate blog node to export from</div>
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
                label=${this._selectedBlogNodeUdi ? "Change" : "Add"}
                @click=${this._openNodePicker}
              ></uui-button>
            </div>
            <input type="hidden" name="blogNodeId" .value=${this._selectedBlogNodeUdi || ""} />
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="embedImages" slot="label">Embed images?</uui-label>
            <div slot="description">
              Check if you want to embed images as base64 data in the output file. Useful if your
              site isn't going to be HTTP accessible to the site you will be importing on.
            </div>
            <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
          </uui-form-layout-item>
          <uui-form-validation-message
            class="${this._formMessageType === "positive"
              ? "form-message-positive"
              : this._formMessageType === "error"
                ? "form-message-error"
                : ""}"
          >
            ${unsafeHTML(this._formMessageText)}
          </uui-form-validation-message>
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
      .form-message-positive {
        color: var(--uui-color-positive-emphasis);
      }
      .form-message-error {
        color: var(--uui-color-danger-emphasis);
      }
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
