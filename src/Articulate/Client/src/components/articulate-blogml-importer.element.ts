import {
  css,
  customElement,
  html,
  nothing,
  property,
  state,
  TemplateResult,
} from "@umbraco-cms/backoffice/external/lit";
import { UUIButtonState } from "@umbraco-cms/backoffice/external/uui";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { umbBindToValidation, UmbValidationContext } from "@umbraco-cms/backoffice/validation";
import { Articulate } from "../api/articulate/sdk.gen";
import type {
  ImportBlogMlModel,
  ImportModel,
  PostResponseModel,
} from "../api/articulate/types.gen";
import {
  fetchArchiveDoctypeUdi,
  fetchNodeByUdi,
  openNodePicker,
} from "../utils/document-node-utils";
import { handleApiError } from "../utils/error-utils";
import { showUmbracoNotification } from "../utils/notification-utils";
import { renderHeaderActions } from "../utils/template-utils";
import { formStyles } from "./form-styles";

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

  @state() private _formState: UUIButtonState = undefined;
  @state() private _formError = "";

  @state() private _articulateNodeId: string | null = null;
  @state() private _selectedBlogNodeName = "";

  @state() private _postCount: number | null = null;

  private _modalManagerContext?: UmbModalManagerContext;
  private _archiveDoctypeUdi: string | null = null;

  #validation = new UmbValidationContext(this);

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
      this._formState = "failed";
      this._formError = "Failed to retrieve Articulate Archive document type.";
      return;
    }
  }

  /**
   * Opens the Umbraco document picker to select a blog node.
   * Updates the selected node UDI and fetches its name.
   * @private
   * @returns {Promise<void>}
   */
  private async _openNodePicker() {
    if (!this._archiveDoctypeUdi) {
      return;
    }
    const udi = await openNodePicker(this._modalManagerContext!, this._archiveDoctypeUdi, this);
    if (udi) {
      const variant = await fetchNodeByUdi(udi);
      if (!variant) {
        this._formError = "Selected node not found.";
        return;
      }
      this._articulateNodeId = udi;
      this._selectedBlogNodeName = variant.name;
    }
  }

  #downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  #isBlob = (value: unknown): value is Blob => {
    return value instanceof Blob;
  };

  /**
   * Handles the form submission for importing blog content.
   * Validates the form and initiates the import process.
   * @private
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  #handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    if (!form) return;

    try {
      await this.#validation.validate();
    } catch {
      this._formError = "Please select a blog node.";
      return;
    }
    const formData = new FormData(form);

    const importFile = formData.get("importFile") as File | null;

    if (!importFile) {
      this._formError = "Please select a file to import.";
      return;
    }

    // Step 1: Initialize the import (upload file)
    const formDataUpload = new FormData();
    formDataUpload.append(importFile!.name, importFile!);

    this._formState = "waiting";
    this._formError = "";

    const initResult = await Articulate.postUmbracoManagementApiV1ArticulateBlogImportBegin({
      body: formDataUpload as any, // hey-api handles FormData directly
    });

    if (!initResult.response.ok) {
      this._formError = await handleApiError(initResult.response, "Failed to upload blog content.");
      this._formState = "failed";
      return;
    }

    const initData = initResult.data as PostResponseModel;

    if (!initData || !initData.temporaryFileName) {
      this._formState = "failed";
      this._formError = "Failed to upload blog content.";
      return;
    }

    if (this._postCount === 0) {
      this._formError = "No posts found in the file.";
      this._formState = "failed";
      return;
    }

    this._postCount = initData.postCount;

    // Step 2: Import the BlogML data using the temporary file name
    const importPayload: ImportBlogMlModel = {
      articulateNodeId: this._articulateNodeId!,
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
      this._formError = await handleApiError(
        importCallResult.response,
        "Failed to import blog content.",
      );
      this._formState = "failed";
      return;
    }

    const responseData = importCallResult.data as ImportModel;

    if (!responseData) {
      this._formState = "failed";
      this._formError = "Failed to import blog content.";
      return;
    }

    if (
      formData.get("disqusExport") === "on" &&
      (!responseData.downloadUrl || responseData.downloadUrl === "")
    ) {
      this._formState = "failed";
      this._formError = "Import reported success but no Disqus comments XML file was returned.";
      return;
    }

    if (formData.get("disqusExport") === "on" && responseData.downloadUrl) {
      const disqusResponseData =
        await Articulate.getUmbracoManagementApiV1ArticulateBlogExportDisqus();
      if (!disqusResponseData.response.ok) {
        this._formError = await handleApiError(
          disqusResponseData.response,
          "Failed to export Disqus comments.",
        );
        this._formState = "failed";
        return;
      }

      const blob = disqusResponseData.data;
      if (!this.#isBlob(blob)) {
        this._formState = "failed";
        this._formError = "Failed to receive a valid file from the server.";
        return;
      }
      const contentDisposition = disqusResponseData.response.headers.get("content-disposition");
      let fileName = "disqus-comments.xml"; // Default filename
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=\"?([^\"]+)\"?/);
        if (fileNameMatch && fileNameMatch.length > 1 && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }
      this.#downloadFile(blob, fileName);
    }
    this._formState = "success";
    await showUmbracoNotification(this, "BlogML imported successfully!", "positive");
    form.reset();
    this._articulateNodeId = null;
    this._selectedBlogNodeName = "";
    this._postCount = null;
  };

  override render() {
    return html`
      <uui-box headline="BlogML Importer">
        ${renderHeaderActions(this.routerPath)}
        <uui-form-validation-message>
        <uui-form>
        <form id="blogMlImportForm" @submit=${this.#handleSubmit}>
        <uui-form-layout-item>
                <div class="node-picker-container">
                  <uui-label for="articulateNodeId" slot="label" required
                    >Articulate blog node</uui-label
                  >
                  <uui-input
                    id="articulateNodeId"
                    name="articulateNodeId"
                    placeholder="No node selected"
                    .value=${this._selectedBlogNodeName}
                    ${umbBindToValidation(this, "$.articulateNodeId", this._articulateNodeId || "")}
                    readonly
                    required
                    required-message="You must select a blog node"
                    style="flex-grow: 1;"
                  ></uui-input>
                  <uui-button
                    look="outline"
                    label=${this._articulateNodeId ? "Change" : "Choose"}
                    @click=${this._openNodePicker}
                  ></uui-button>
                </div>
                <div slot="description">Choose the Articulate blog node to export from</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label slot="label" for="importFile" required>BlogML import file</uui-label>
            <uui-input-file
              id="importFile"
              accept="text/xml"
              required
              required-message="You must select a BlogML file to import"
              name="importFile"
            ></uui-input-file>
            <div slot="description">The XML file to upload for import</div>
            <div slot="messages">${this._postCount ? `Found ${this._postCount} posts in the file.` : ""}</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label slot="label" for="overwrite">Overwrite imported posts?</uui-label>
            <uui-toggle id="overwrite" name="overwrite"></uui-toggle>
            <div slot="description">Check if you want to overwrite posts already imported</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label slot="label" for="publishAll">Publish all posts?</uui-label>
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
            <uui-label slot="label" for="disqusExport">Export Disqus Xml</uui-label>
            <uui-toggle id="disqusExport" name="disqusExport"></uui-toggle>
            <div slot="description">
              If you would like Articulate to output an XML file that you can use to import the
              comments found in this file in to Disqus
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label slot="label" for="importImage">Import First Image from Post Attachments</uui-label>
            <uui-toggle id="importImage" name="importImage"></uui-toggle>
            <div slot="description">
              If you would like Articulate to try and import the first image url in the post
              attachments
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>${this.#renderErrorMessage()}</uui-form-layout-item>
          <uui-button-group>
          <uui-button type="submit" look="primary" .state=${this._formState} ?disabled=${this._formState === "waiting"}
          >Submit</uui-button>
          </uui-button-group>
          </form>
        </uui-form-validation-message>
        </uui-form>
      </uui-box>
    `;
  }

  #renderErrorMessage(): TemplateResult | typeof nothing {
    if (!this._formError || this._formState !== "failed") return nothing;
    return html`<p class="text-danger">${this._formError}</p>`;
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
      .text-danger {
        color: var(--uui-color-danger);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "articulate-blogml-importer": ArticulateBlogMlImporterElement;
  }
}
