import { css, customElement, html, property, query, state } from "@umbraco-cms/backoffice/external/lit";
import { UUIButtonState } from "@umbraco-cms/backoffice/external/uui";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { keyed } from "lit-html/directives/keyed.js";
import { Articulate } from "../api/sdk.gen";
import type { ImportBlogMlModel, ImportModel, PostResponseModel } from "../api/types.gen";
import { fetchArchiveDoctypeUdi, fetchNodeByUdi, openNodePicker } from "../utils/document-node-utils";
import { formatApiError } from "../utils/error-utils";
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
  @state() private _formError: { title: string; details: string[] } | null = null;
  @state() private _articulateNodeId: string | undefined = undefined;
  @state() private _selectedBlogNodeName: string = "";
  @state() private _postCount: number | undefined = undefined;
  @state() private _formRenderKey = 0;

  @query("#blogMlImportForm")
  private _form!: HTMLFormElement;

  private _modalManagerContext?: UmbModalManagerContext;
  private _archiveDoctypeUdi: string | undefined = undefined;

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
      this._formError = { title: "Failed to retrieve Articulate Archive document type.", details: [] };
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
    this._formError = null;
    const udi = await openNodePicker(this._modalManagerContext!, this._archiveDoctypeUdi, this);
    if (udi) {
      const variant = await fetchNodeByUdi(udi);
      if (!variant) {
        this._formError = { title: "Selected node not found.", details: [] };
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
    this._formError = null;
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
    if (this._formState === "waiting") {
      return;
    }
    this._formState = "waiting";
    this._formError = null;
    this._postCount = undefined;
    if (!this._articulateNodeId) {
      this._formError = { title: "Please select a blog node before importing.", details: [] };
      this._formState = "failed";
      return;
    }
    if (!this._form) return;
    const formData = new FormData(this._form);
    const importFile = formData.get("importFile") as File | null;
    if (!importFile) {
      this._formError = { title: "Please select a file to import.", details: [] };
      this._formState = "failed";
      return;
    }
    try {
      // Step 1: Upload the file and get post count
      const initData = await this.#beginImport(importFile);
      this._postCount = initData.postCount;
      // Step 2: Perform import and get results
      const importData = await this.#finalizeImport(formData, initData.temporaryFileName!);
      // Step 3: (Optional) Export Disqus comments if requested and available
      if (formData.get("exportDisqusXml") === "on" && importData.commentCount > 0) {
        await this.#exportDisqusComments();
      }
      // All steps succeeded
      this._formState = "success";
      const disqusMessage =
        formData.get("exportDisqusXml") === "on" && importData.commentCount > 0
          ? `${importData.commentCount} comments exported.`
          : formData.get("exportDisqusXml") === "on"
            ? "No comments found to export."
            : "";
      await showUmbracoNotification(
        this,
        `BlogML imported successfully! ${importData.authorCount} authors, ${this._postCount} posts imported. ${disqusMessage}`,
        "positive",
        true,
      );
      this._handleReset(e);
    } catch (error) {
      this._formError = formatApiError(error, "An unexpected error occurred during import.");
      this._formState = "failed";
      this._postCount = undefined;
    }
  };

  #beginImport = async (importFile: File): Promise<PostResponseModel> => {
    const result = await Articulate.postArticulateBlogImportBeginV1({ body: { importFile } });
    if (!result.response.ok || !result.data?.temporaryFileName || !result.data?.postCount) {
      throw result.error || new Error("Failed to upload blog content.");
    }
    return result.data;
  };

  #finalizeImport = async (formData: FormData, tempFile: string): Promise<ImportModel> => {
    const payload: ImportBlogMlModel = {
      articulateNodeId: this._articulateNodeId!,
      overwrite: formData.get("overwrite") === "on",
      publish: formData.get("publish") === "on",
      regexMatch: (formData.get("regexMatch") as string) || "",
      regexReplace: (formData.get("regexReplace") as string) || "",
      tempFile: tempFile,
      exportDisqusXml: formData.get("exportDisqusXml") === "on",
      importFirstImage: formData.get("importFirstImage") === "on",
    };
    const result = await Articulate.postArticulateBlogImportV1({ body: payload });
    if (!result.response.ok || !result.data?.completed) {
      throw result.error || new Error("Failed to import blog content.");
    }
    return result.data;
  };

  #exportDisqusComments = async () => {
    const result = await Articulate.getArticulateBlogExportDisqusV1();
    if (!result.response.ok || !result.data) {
      throw result.error || new Error("Failed to export Disqus comments.");
    }
    const blob = result.data;
    if (!this.#isBlob(blob)) {
      throw new Error("Invalid file received for Disqus export.");
    }
    const contentDisposition = result.response.headers.get("content-disposition");
    let fileName = "disqus-comments.xml"; // Default filename
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?([^\"]+)"?/);
      if (fileNameMatch && fileNameMatch.length > 1 && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      }
    }
    this.#downloadFile(blob, fileName);
  };

  private _handleReset = (e: Event) => {
    e.preventDefault();
    this._formState = undefined;
    this._formError = null;
    this._articulateNodeId = undefined;
    this._selectedBlogNodeName = "";
    this._postCount = undefined;
    this._formRenderKey++;
  };

  override render() {
    return html`
      <uui-box headline="BlogML Importer">
        ${renderHeaderActions(this.routerPath)}
        <uui-form>
          ${keyed(
            this._formRenderKey,
            html`
              <form id="blogMlImportForm" @submit=${this.#handleSubmit} @input=${this.#clearError()}>
                <uui-validation-message>
                  <uui-form-layout-item>
                    <div class="node-picker-container">
                      <uui-label for="articulateNodeId" slot="label" required>Articulate blog node</uui-label>
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
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="overwrite">Overwrite imported posts?</uui-label>
                    <uui-toggle id="overwrite" name="overwrite"></uui-toggle>
                    <div slot="description">Check if you want to overwrite posts already imported</div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="publish">Publish all posts?</uui-label>
                    <uui-toggle id="publish" name="publish"></uui-toggle>
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
                    ></uui-input>
                    <div slot="description">
                      Regex statement used to match content in the blog post to be replaced by the match statement. See
                      the Articulate Wiki
                      <a
                        href="https://github.com/Shazwazza/Articulate/wiki/Importing#options"
                        rel="noopener noreferrer nofollow"
                      >
                        Importing
                      </a>
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
                    ></uui-input>
                    <div slot="description">Replacement statement used with the above match statement</div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="exportDisqusXml">Export Disqus Xml</uui-label>
                    <uui-toggle id="exportDisqusXml" name="exportDisqusXml"></uui-toggle>
                    <div slot="description">
                      If you would like Articulate to output an XML file that you can use to import the comments found
                      in this file in to Disqus
                    </div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="importFirstImage">Import First Image from Post Attachments</uui-label>
                    <uui-toggle id="importFirstImage" name="importFirstImage"></uui-toggle>
                    <div slot="description">
                      If you would like Articulate to try and import the first image url in the post attachments
                    </div>
                  </uui-form-layout-item>
                </uui-validation-message>

                <uui-button type="submit" look="primary" .state=${this._formState}>Submit</uui-button>
                <uui-button type="button" look="secondary" @click=${this._handleReset}>Reset</uui-button>
              </form>
            `,
          )}
        </uui-form>
        ${this._postCount !== undefined && this._postCount > 0
          ? html`
              <div slot="message">
                <uui-tag look="secondary" color="positive">${this._postCount} posts in uploaded file.</uui-tag>
              </div>
            `
          : ""}
        ${renderErrorMessage(this._formError)}
      </uui-box>
    `;
  }

  static override readonly styles = [
    UmbTextStyles,
    css`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "blogml-importer": BlogMlImporterElement;
  }
}
