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
import { extractErrorMessage, isErrorWithMessage } from "../utils/error-utils";
import { showUmbracoNotification } from "../utils/notification-utils";
import { renderHeaderActions } from "../utils/template-utils";
import { formStyles } from "./form-styles";

// TODO: Import tests
// TODO: Polish UX / CSS

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

  @state() private _isDisabled: boolean = false;
  @state() private _isLoading: boolean = true;
  @state() private _isSubmitting = false;

  @state() private _selectedBlogNodeUdi: string | null = null;
  @state() private _selectedBlogNodeName: string | null = "No node selected";

  @state() private _downloadUrl: undefined | TemplateResult<1> = undefined;

  private _modalManagerContext?: UmbModalManagerContext;
  private _archiveDoctypeUdi: string | null = null;

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
    this._archiveDoctypeUdi = await fetchArchiveDoctypeUdi();
    if (this._archiveDoctypeUdi === null) {
      this._isDisabled = true;
      this._isLoading = false;
      this.requestUpdate("_isLoading", "_isDisabled");
    }
    this._isLoading = false;
    this.requestUpdate("_isLoading");
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
        this.requestUpdate("_selectedBlogNodeName");
        const variant = await fetchNodeByUdi(udi);
        if (!variant) {
          throw new Error(`Selected node ${udi} not found`);
        }
        this._selectedBlogNodeUdi = udi;
        this._selectedBlogNodeName = variant.name;
        this.requestUpdate("_selectedBlogNodeName", "_selectedBlogNodeUdi");
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
      this.requestUpdate("_selectedBlogNodeName");
      await showUmbracoNotification(this, errorMessage, "danger");
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
    const isValid = form.checkValidity();

    if (!isValid) {
      return;
    }

    const formData = new FormData(form);
    const submitButton = form.querySelector<HTMLElement>('uui-button[look="primary"]');

    const importFileField = form.elements.namedItem("importFile") as HTMLInputElement;
    const importFile = importFileField && importFileField.files ? importFileField.files[0] : null;

    try {
      submitButton?.setAttribute("state", "waiting");
      this._isSubmitting = true;
      this.requestUpdate("_isSubmitting");

      // Step 1: Initialize the import (upload file)
      const formDataUpload = new FormData();
      formDataUpload.append(importFile!.name, importFile!);

      const initResult = await Articulate.postUmbracoManagementApiV1ArticulateBlogImportBegin({
        body: formDataUpload as any, // hey-api handles FormData directly
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
        throw new Error("Upload completed but no response data was returned.");
      }

      // Step 2: Import the BlogML data using the temporary file name
      const importPayload: ImportBlogMlModel = {
        articulateNodeId: this._selectedBlogNodeUdi!,
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

      const responseData = importCallResult.data as ImportModel;

      if (!responseData) {
        throw new Error("Import completed but no response data was returned.");
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
      this.requestUpdate("_selectedBlogNodeUdi", "_selectedBlogNodeName");
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error, "Import failed.");
      await showUmbracoNotification(this, errorMessage, "danger");
    } finally {
      submitButton?.setAttribute("state", "");
      this._isSubmitting = false;
      this.requestUpdate("_isSubmitting");
    }
  }

  private _closeModal() {
    this._downloadUrl = undefined;
    this.requestUpdate("_downloadUrl");
  }

  override render() {
    if (this._isLoading) {
      return html`<uui-loader-bar></uui-loader-bar>`;
    }

    if (this._isDisabled) {
      return html`<uui-box headline="BlogML Importer">
        ${renderHeaderActions(this.routerPath)}
        <span slot="header"><uui-tag look="danger">Disabled</uui-tag></span>
        <p>Could not retrieve Articulate Archive document type.</p>
        <p>Ensure that the Articulate package is installed and configured correctly.</p>
        <p>Check the Articulate documentation for more information.</p>
      </uui-box>`;
    }

    return html`
      <uui-box headline="BlogML Importer">
        ${renderHeaderActions(this.routerPath)}
        <uui-form-validation-message>
        <uui-form @submit=${this._handleSubmit}>
          <uui-form-layout-item>
            <uui-label for="blogNodeDisplay" required>Articulate blog node</uui-label>
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
            <input
              type="hidden"
              name="blogNodeValue"
              required
              .value=${this._selectedBlogNodeUdi || ""}
            />
            <div slot="description">Choose the Articulate blog node to import to</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="importFile" required>BlogML import file</uui-label>
            <uui-input-file
              id="importFile"
              accept="text/xml"
              required
              name="importFile"
            ></uui-input-file>
            <div slot="description">The XML file to upload for import</div>
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
            <uui-input
              id="regexMatch"
              style="--auto-width-text-margin-right: 20px"
              name="regexMatch"  auto-width placeholder="Example to match: (@example\.old)"
            ></uui-input>
            <div slot="description">
              Regex statement used to match content in the blog post to be replaced by the match
              statement
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="regexReplace" slot="label">Regex replacement statement</uui-label>
            <uui-input
              id="regexReplace"
              style="--auto-width-text-margin-right: 20px"
              name="regexReplace"  auto-width placeholder="Example replacement: @example.new"
            ></uui-input>
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
          <uui-button-group>
            <uui-button type="submit" look="primary">Submit</uui-button>
          </uui-button-group>
          </uui-form-validation-message>
        </uui-form>
      </uui-box>
      ${
        this._downloadUrl
          ? html`
              <uui-modal-container>
                <uui-modal-dialog>
                  <uui-dialog>
                    <uui-dialog-layout>
                      <span slot="headline">
                        <uui-icon name="info" style="color: green;"></uui-icon> BlogML import
                        completed</span
                      >
                      <p>Your Disqus XML import is ready to download.</p>
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
          : html``
      }
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
    "articulate-blogml-importer": ArticulateBlogMlImporterElement;
  }
}
