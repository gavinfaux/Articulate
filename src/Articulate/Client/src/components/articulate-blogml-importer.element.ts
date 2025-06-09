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
import type {
  ImportBlogMlModel,
  ImportModel,
  PostResponseModel,
} from "../api/articulate/types.gen";
import { ProblemDetails } from "../api/articulate/types.gen";
import {
  fetchArchiveDoctypeUdi,
  fetchNodeByUdi,
  openNodePicker,
} from "../utils/document-node-utils";
import { extractErrorMessage } from "../utils/error-utils";
import { reviewLogsMessage, setFormMessage, showUmbracoNotification } from "../utils/notification-utils";
import { formStyles } from "./form-styles";

// TODO: Import tests
// TODO: Polish UX / CSS

// TODO: You are here - reviewing patterns for exception handling - refer to export for patterns

/**
 * A LitElement-based component for importing blog content from BlogML format.
 * Provides a form to upload a BlogML file and select a target blog node.
 *
 * @element articulate-blogml-importer
 * @extends UmbLitElement
 */
@customElement("articulate-blogml-importer")
export default class ArticulateBlogMlImporterElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  @state() private _isSubmitting = false;

  @state() public _formMessageType: "positive" | "error" | "" = "";
  @state() public _formMessageText = "";

  @state() private _selectedBlogNodeUdi: string | null = null;
  @state() private _selectedBlogNodeName: string | null = "No node selected";

  @state() private _archiveDoctypeUdi = "";

  private _modalManagerContext?: UmbModalManagerContext;

  /**
   * Creates an instance of ArticulateBlogMlImporterElement.
   * Sets up the modal manager context and file reader event handlers.
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
   * Opens the Umbraco document picker to select a target blog node.
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
        await this._fetchNodeName(selectedNodeUnique);
        this.requestUpdate("_selectedBlogNodeName");
        this.requestUpdate("_selectedBlogNodeUdi");
      }
    } catch (error) {
      console.error("Error opening node picker:", error);
      const errorMessage = extractErrorMessage(
        error,
        "Could not open node picker. Please check logs.",
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
  private async _fetchNodeName(udi: string) {
    try {
      this._selectedBlogNodeName = await fetchNodeByUdi(udi);
      this.requestUpdate("_selectedBlogNodeName");
    } catch (error) {
      console.error("Error fetching node name:", error);
      const errorMessage = extractErrorMessage(
        error,
        "Could not fetch node name. Please check logs.",
      );
      setFormMessage(this, "error", errorMessage);
    }
  }

  /**
   * Handles the form submission for importing blog content.
   * Validates the form and initiates the import process.
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

    const blogNodeUdi = this._selectedBlogNodeUdi;
    const importFileField = form.elements.namedItem("importFile") as HTMLInputElement;
    const importFile = importFileField && importFileField.files ? importFileField.files[0] : null;

    if (!blogNodeUdi) {
      setFormMessage(this, "error", "Please select an Articulate blog node to import to.");
      return;
    }

    if (!importFile || importFile.size === 0) {
      setFormMessage(this, "error", "Please select a BlogML file to import.");
      return;
    }

    try {
      this._isSubmitting = true;
      submitButton.setAttribute("state", "waiting");

      // Step 1: Initialize the import (upload file)
      setFormMessage(this, "", "Uploading file, please wait...");
      const formDataUpload = new FormData();
      formDataUpload.append(importFile.name, importFile);

      const initResult = await Articulate.postUmbracoManagementApiV1ArticulateBlogImportBegin({
        body: formDataUpload as any, // hey-api handles FormData directly
        throwOnError: true,
      });

      if (!initResult.response.ok) {
        let errorToThrow;
        try {
          const problemDetails: ProblemDetails = await initResult.response.json();
          errorToThrow = problemDetails;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          // Explicitly ignore the caught error object from response.json() parsing,
          // as we create a new generic error based on HTTP status instead.
          errorToThrow = new Error(
            `File Upload API Error: ${initResult.response.status} ${initResult.response.statusText}`,
          );
        }
        throw errorToThrow;
      }

      const initData = initResult.data as PostResponseModel;

      if (!initData || !initData.temporaryFileName) {
        throw new Error("File upload initialization failed: No temporary file name returned.");
      }

      setFormMessage(this, "", `File uploaded. Importing ${initData.postCount} posts...`);

      // Step 2: Import the BlogML data using the temporary file name
      const importPayload: ImportBlogMlModel = {
        articulateNodeId: blogNodeUdi,
        overwrite: formData.get("overwrite") === "on",
        publish: formData.get("publish") === "on",
        regexMatch: (formData.get("regexMatch") as string) || "",
        regexReplace: (formData.get("regexReplace") as string) || "",
        tempFile: initData.temporaryFileName,
        exportDisqusXml: formData.get("disqusExport") === "on",
        importFirstImage: formData.get("importImage") === "on",
      };

      const importCallResult = await Articulate.postUmbracoManagementApiV1ArticulateBlogImport({
        body: importPayload,
        throwOnError: true,
      });

      if (!importCallResult.response.ok) {
        let errorToThrow;
        try {
          const problemDetails: ProblemDetails = await importCallResult.response.json();
          errorToThrow = problemDetails;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          // Explicitly ignore the caught error object from response.json() parsing,
          // as we create a new generic error based on HTTP status instead.
          errorToThrow = new Error(
            `Import API Error: ${importCallResult.response.status} ${importCallResult.response.statusText}`,
          );
        }
        throw errorToThrow;
      }

      const importResponseData = importCallResult.data as ImportModel;

      let successMessage = "BlogML import completed successfully.";
      if (importResponseData && importResponseData.downloadUrl) {
        const downloadLink = importResponseData.downloadUrl.startsWith("http")
          ? importResponseData.downloadUrl
          : `${window.location.origin}${importResponseData.downloadUrl}`;
        successMessage = `BlogML import completed. <a href="${downloadLink}" target="_blank">Download import log/status</a>.`;
      }

      setFormMessage(this, "positive", successMessage);
      // reset form fields or selections here?
      form.reset();
      this._selectedBlogNodeUdi = null;
      this._selectedBlogNodeName = null;
      this.requestUpdate();
    } catch (error: unknown) {
      console.error("BlogML Import Error:", error);
      const errorMessage = extractErrorMessage(
        error,
        "Import failed. Please check the logs for more details.",
      );
      await showUmbracoNotification(this, errorMessage, "danger");
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
      <uui-box headline="BlogML Importer">
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
            <uui-label for="blogNodeDisplay" slot="label" required>Articulate blog node</uui-label>
            <div class="node-picker-container">
              <uui-input
                id="blogNodeDisplay"
                .value=${this._selectedBlogNodeName || "No node selected. Click 'Add' to choose."}
                readonly
                style="flex-grow: 1;"
              ></uui-input>
              <uui-button
                look="outline"
                .label=${this._selectedBlogNodeUdi ? "Change" : "Add"}
                @click=${this._openNodePicker}
                style="margin-left: var(--uui-size-space-3);"
              ></uui-button>
            </div>
            <input type="hidden" name="blogNodeValue" .value=${this._selectedBlogNodeUdi || ""} />
            <div slot="description">Choose the Articulate blog node to import to</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="importFile">BlogML import file</uui-label>
            <uui-input-file id="importFile" name="importFile"></uui-input-file>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="overwrite">Overwrite imported posts?</uui-label>
            <uui-toggle id="overwrite" name="overwrite"></uui-toggle>
            <div slot="description">Check if you want to overwrite posts already imported</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="publishAll">Publish all posts?</uui-label>
            <uui-toggle id="publishAll" name="publishAll"></uui-toggle>
            <div slot="description">Check if you want all imported posts to be published</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="regexMatch" slot="label">Regex match expression</uui-label>
            <uui-input id="regexMatch" name="regexMatch"></uui-input>
            <div slot="description">
              Regex statement used to match content in the blog post to be replaced by the match
              statement
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="regexReplace" slot="label">Regex replacement statement</uui-label>
            <uui-input id="regexReplace" name="regexReplace"></uui-input>
            <div slot="description">Replacement statement used with the above match statement</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="disqusExport">Export Disqus Xml</uui-label>
            <uui-toggle id="disqusExport" name="disqusExport"></uui-toggle>
            <div slot="description">
              If you would like Articulate to output an XML file that you can use to import the
              comments found in this file in to Disqus
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="importImage">Import First Image from Post Attachments</uui-label>
            <uui-toggle id="importImage" name="importImage"></uui-toggle>
            <div slot="description">
              If you would like Articulate to try and import the first image url in the post
              attachments
            </div>
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
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "articulate-blogml-importer": ArticulateBlogMlImporterElement;
  }
}
