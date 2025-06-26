import { css, customElement, html, property, state } from "@umbraco-cms/backoffice/external/lit";
import { UUIButtonState } from "@umbraco-cms/backoffice/external/uui";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { Articulate } from "../api/sdk.gen";
import type { ImportBlogMlModel, ImportModel, PostResponseModel } from "../api/types.gen";
import {
  fetchArchiveDoctypeUdi,
  fetchNodeByUdi,
  openNodePicker,
} from "../utils/document-node-utils";
import { formatApiError } from "../utils/error-utils";
import { formStyles } from "../utils/form-styles";
import { showUmbracoNotification } from "../utils/notification-utils";
import { renderErrorMessage, renderHeaderActions } from "../utils/template-utils";

/**
 * A LitElement-based component for importing blog content from BlogML format.
 * Provides a form to upload a BlogML file and select a target blog node.
 *
 * @element blogml-importer
 * @extends UmbLitElement
 */
@customElement("blogml-importer")
export default class BlogMlImporterElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  @state() private _formState: UUIButtonState = undefined;
  @state() private _formError: string[] = [];

  @state() private _articulateNodeId: string | null = null;
  @state() private _selectedBlogNodeName = "";

  @state() private _postCount: number | null = null;

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
      this._formState = "failed";
      this._formError = ["Failed to retrieve Articulate Archive document type."];
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
    this._formError = [];
    const udi = await openNodePicker(this._modalManagerContext!, this._archiveDoctypeUdi, this);
    if (udi) {
      const variant = await fetchNodeByUdi(udi);
      if (!variant) {
        this._formError = ["Selected node not found."];
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

  #clearError() {
    this._formError = [];
  }

  /**
   * Handles the form submission for importing blog content.
   * Validates the form and initiates the import process.
   * @private
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  #handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    this._formState = "waiting";
    this._formError = [];
    this._postCount = null;
    if (!this._articulateNodeId) {
      this._formError = ["Please select a blog node before importing."];
      this._formState = "failed";
      return;
    }
    const form = e.target as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);

    const importFile = formData.get("importFile") as File | null;

    if (!importFile) {
      this._formError = ["Please select a file to import."];
      return;
    }
    // Step 1: Initialize the import (upload file)
    const initResult = await Articulate.postArticulateBlogImportBeginV1({
      body: {
        importFile: importFile,
      },
    });

    if (
      !initResult.response.ok ||
      !initResult.data?.temporaryFileName ||
      !initResult.data?.postCount
    ) {
      this._formError = formatApiError(initResult.error, "Failed to upload blog content.");
      this._formState = "failed";
      return;
    }
    const initData: PostResponseModel = initResult.data;

    this._postCount = initData.postCount;

    // Step 2: Import the BlogML data using the temporary file name
    const importPayload: ImportBlogMlModel = {
      articulateNodeId: this._articulateNodeId!,
      overwrite: formData.get("overwrite") === "on",
      publish: formData.get("publish") === "on",
      regexMatch: (formData.get("regexMatch") as string) || "",
      regexReplace: (formData.get("regexReplace") as string) || "",
      tempFile: initData.temporaryFileName!,
      exportDisqusXml: formData.get("disqusExport") === "on",
      importFirstImage: formData.get("importImage") === "on",
    };

    const importCallResult = await Articulate.postArticulateBlogImportV1({
      body: importPayload,
    });

    if (
      !importCallResult.response.ok ||
      !importCallResult.data ||
      !importCallResult.data.completed
    ) {
      this._formError = formatApiError(importCallResult.error, "Failed to import blog content.");
      this._formState = "failed";
      this._postCount = null;
      return;
    }

    const responseData: ImportModel = importCallResult.data;

    if (formData.get("disqusExport") === "on" && responseData.commentCount > 0) {
      const disqusResponseData = await Articulate.getArticulateBlogExportDisqusV1();
      if (!disqusResponseData.response.ok || !disqusResponseData.data) {
        this._formError = formatApiError(
          disqusResponseData.error,
          "Import reported success but failed to export Disqus comments.",
        );
        await showUmbracoNotification(
          this,
          `BlogML imported successfully. ${responseData.authorCount} authors, ${this._postCount} posts imported. Failed to export ${responseData.commentCount} comments.`,
          "warning",
          true,
        );
        this._formState = "failed";
        this._postCount = null;
        return;
      }

      const blob = disqusResponseData.data;
      if (!this.#isBlob(blob)) {
        this._formState = "failed";
        this._postCount = null;
        this._formError = [
          "Import reported success but failed to receive a valid file Disqus file from the server.",
        ];
        await showUmbracoNotification(
          this,
          `BlogML imported successfully. ${responseData.authorCount} authors, ${this._postCount} posts imported. Failed to export ${responseData.commentCount} comments.`,
          "warning",
          true,
        );
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
    await showUmbracoNotification(
      this,
      `BlogML imported successfully! ${responseData.authorCount} authors, ${this._postCount} posts imported. ${formData.get("disqusExport") === "on" && responseData.commentCount > 0 ? ` ${responseData.commentCount} comments exported.` : formData.get("disqusExport") === "on" && responseData.commentCount === 0 ? "No comments found to export." : ""}`,
      "positive",
      true,
    );
    form.reset();
    this._articulateNodeId = null;
    this._selectedBlogNodeName = "";
    this._postCount = null;
  };

  override render() {
    return html`
      <uui-box headline="BlogML Importer">
        ${renderHeaderActions(this.routerPath)}
        <uui-form>
          <form
            enctype="multipart/form-data"
            id="blogMlImportForm"
            @submit=${this.#handleSubmit}
            @input=${this.#clearError}
          >
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
                  readonly
                  required
                  required-message="You must select a blog node"
                  style="flex-grow: 1;"
                ></uui-input>
                <uui-button
                  look="outline"
                  label=${this._articulateNodeId ? "Change" : "Choose"}
                  @click=${this._openNodePicker}
                  ?disabled=${this._formState === "waiting"}
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
                ?disabled=${this._formState === "waiting"}
              >
              </uui-input-file>
              <div slot="description">The XML file to upload for import</div>
              ${this._postCount !== null && this._postCount > 0
                ? html`
                    <div slot="message">
                      <uui-tag look="secondary" color="positive"
                        >${this._postCount} posts in uploaded file.</uui-tag
                      >
                    </div>
                  `
                : ""}
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="overwrite">Overwrite imported posts?</uui-label>
              <uui-toggle
                id="overwrite"
                name="overwrite"
                ?disabled=${this._formState === "waiting"}
              ></uui-toggle>
              <div slot="description">Check if you want to overwrite posts already imported</div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="publishAll">Publish all posts?</uui-label>
              <uui-toggle
                id="publishAll"
                name="publishAll"
                ?disabled=${this._formState === "waiting"}
              ></uui-toggle>
              <div slot="description">Check if you want all imported posts to be published</div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label for="regexMatch" slot="label">Regex match expression</uui-label>
              <uui-input
                id="regexMatch"
                style="--auto-width-text-margin-right: 20px"
                name="regexMatch"
                auto-width
                placeholder="Example to match: (@example.old)"
                ?disabled=${this._formState === "waiting"}
              ></uui-input>
              <div slot="description">
                Regex statement used to match content in the blog post to be replaced by the match
                statement. See the Articulate Wiki
                <a
                  href="https://github.com/Shazwazza/Articulate/wiki/Importing#options"
                  rel="noopener noreferrer nofollow"
                  >Importing</a
                >
                page for more information.
              </div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label for="regexReplace" slot="label">Regex replacement statement</uui-label>
              <uui-input
                id="regexReplace"
                style="--auto-width-text-margin-right: 20px"
                name="regexReplace"
                auto-width
                placeholder="Example replacement: @example.new"
                ?disabled=${this._formState === "waiting"}
              ></uui-input>
              <div slot="description">
                Replacement statement used with the above match statement
              </div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="disqusExport">Export Disqus Xml</uui-label>
              <uui-toggle
                id="disqusExport"
                name="disqusExport"
                ?disabled=${this._formState === "waiting"}
              ></uui-toggle>
              <div slot="description">
                If you would like Articulate to output an XML file that you can use to import the
                comments found in this file in to Disqus
              </div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="importImage"
                >Import First Image from Post Attachments</uui-label
              >
              <uui-toggle id="importImage" name="importImage"></uui-toggle>
              <div slot="description">
                If you would like Articulate to try and import the first image url in the post
                attachments
              </div>
            </uui-form-layout-item>
            <uui-button-group>
              <uui-button
                type="submit"
                look="primary"
                .state=${this._formState}
                ?disabled=${this._formState === "waiting"}
                >Submit</uui-button
              >
            </uui-button-group>
          </form>
        </uui-form>
        ${renderErrorMessage(this._formError)}
      </uui-box>
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
    "blogml-importer": BlogMlImporterElement;
  }
}
