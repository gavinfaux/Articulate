import { customElement, html, property, query, state } from "@umbraco-cms/backoffice/external/lit";
import { UUIButtonState } from "@umbraco-cms/backoffice/external/uui";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { UmbValidationContext } from "@umbraco-cms/backoffice/validation";
import { keyed } from "lit-html/directives/keyed.js";
import { BlogMl } from "../api/sdk.gen";
import type { ImportModel, ImportResponse, PostArticulateBlogmlImportFileResponse } from "../api/types.gen";
import { ArticulateDocumentTypeKey, DocumentById, openNodePicker } from "../utils/document-node-utils";
import { IFormController, setFormError } from "../utils/form-utils";
import { showUmbracoNotification } from "../utils/notification-utils";
import {
  BoxStyles,
  ErrorBoxStyles,
  FormStyles,
  HostStyles,
  NodePickerStyles,
  renderErrorMessage,
  renderHeaderActions,
} from "../utils/template-utils";

/**
 * A LitElement-based component for importing blog content from a BlogML file.
 *
 * @element blogml-importer
 * @extends UmbLitElement
 * @implements {IFormController}
 */
@customElement("blogml-importer")
export default class BlogMlImporterElement extends UmbLitElement implements IFormController {
  /**
   * Optional router path for the back button.
   * @type {string | undefined}
   */
  @property({ type: String })
  routerPath?: string;

  /**
   * The current state of the form button.
   * @type {UUIButtonState}
   */
  @state() _formState: UUIButtonState = undefined;
  /**
   * Holds an error object if a form operation fails.
   * @type {{ title: string; details: string[] } | null}
   */
  @state() _formError: { title: string; details: string[] } | null = null;
  /**
   * The UDI of the selected Articulate blog node for import.
   * @private
   * @type {string | undefined}
   */
  @state() private _articulateBlogNode: string | undefined = undefined;
  /**
   * The name of the selected blog node, displayed in the input.
   * @private
   * @type {string}
   */
  @state() private _selectedBlogNodeName: string = "";
  /**
   * The number of posts found in the uploaded BlogML file.
   * @private
   * @type {number | undefined}
   */
  @state() private _postCount: number | undefined = undefined;
  /**
   * A key to force re-rendering of the form, used for resetting the file input.
   * @private
   * @type {number}
   */
  @state() private _formRenderKey = 0;

  /**
   * The main form element.
   * @private
   * @type {HTMLFormElement}
   */
  @query("#blogMlImportForm")
  private _form!: HTMLFormElement;

  /**
   * The modal manager context, used for opening the node picker.
   * @private
   * @type {UmbModalManagerContext | undefined}
   */
  private _modalManagerContext?: UmbModalManagerContext;
  /**
   * The UDI of the Articulate Archive document type.
   * @private
   * @type {string | undefined}
   */
  private _archiveDoctypeUdi: string | undefined = undefined;

  #validation = new UmbValidationContext(this);

  constructor() {
    super();
    this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (instance) => {
      this._modalManagerContext = instance;
    });
  }

  /**
   * Fetches the Articulate Archive doctype UDI when the component connects.
   * @async
   */
  async connectedCallback() {
    super.connectedCallback();
    this._archiveDoctypeUdi = await ArticulateDocumentTypeKey();
    if (this._archiveDoctypeUdi === null) {
      const error = new Error(
        "Could not find the Articulate Archive document type. Please ensure Articulate is installed correctly.",
      );
      error.name = "Configuration Error";
      setFormError(this, error, error.name);
    }
  }

  /**
   * Resets the component's state.
   * @param {boolean} [fullReset=false] If true, performs a full reset of the form and its state.
   */
  resetState(fullReset = false) {
    this._postCount = undefined;

    if (fullReset) {
      this._formState = undefined;
      this._formError = null;
      this._articulateBlogNode = undefined;
      this._selectedBlogNodeName = "";
      // Incrementing the key forces Lit to re-render the form from scratch, effectively resetting it.
      // workaround for dirty uui-input-file after form submission and reset
      this._formRenderKey++;
    }
  }

  /**
   * Opens the Umbraco node picker to select an Articulate blog node.
   * @private
   * @async
   */
  private async _openNodePicker() {
    if (!this._archiveDoctypeUdi) return;

    this._formError = null;
    const udi = await openNodePicker(this._modalManagerContext!, this._archiveDoctypeUdi, this);
    if (udi) {
      const variant = await DocumentById(udi);
      if (!variant) {
        setFormError(this, new Error(`Could not find a node with UDI: ${udi}`), "Node Not Found");
        return;
      }
      this._articulateBlogNode = udi;
      this._selectedBlogNodeName = variant.name;
    }
  }

  /**
   * Triggers a browser download for a given Blob.
   * @param {Blob} blob The file blob to download.
   * @param {string} fileName The name for the downloaded file.
   */
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

  /**
   * Type guard to check if a value is a Blob.
   * @param {unknown} value The value to check.
   * @returns {boolean} True if the value is a Blob.
   */
  #isBlob = (value: unknown): value is Blob => {
    return value instanceof Blob;
  };

  /**
   * Handles the form submission by orchestrating the multi-step import process.
   * @param {SubmitEvent} e The submit event.
   * @private
   * @async
   */
  #handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!this._form) return;

    try {
      await this.#validation.validate();
    } catch (error) {
      setFormError(this, error, "Validation Failed");
      return;
    }

    const formData = new FormData(this._form);
    const importFile = formData.get("importFile") as File;

    // validate() does not appear to work with the uui-file-input form element consistently or the node picker, so backup validation
    const validationRules = [
      {
        isValid: !!this._articulateBlogNode,
        message: "A blog node must be selected before importing.",
      },
      {
        isValid: importFile && importFile.size > 0,
        message: "A BlogML file must be selected for import.",
      },
    ];

    const firstInvalidRule = validationRules.find((rule) => !rule.isValid);

    if (firstInvalidRule) {
      const validationError = new Error(firstInvalidRule.message);
      validationError.name = "Validation Error";
      setFormError(this, validationError, validationError.name);
      return;
    }

    if (this._formState === "waiting") return;

    this._formState = "waiting";
    this._formError = null;
    this._postCount = undefined;

    try {
      // Step 1: Upload the file and get post count
      const initData = await this.#beginImport(importFile);
      this._postCount = initData.postCount;
      this.requestUpdate("_postCount");

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
      this.resetState(true);
    } catch (error) {
      setFormError(this, error, "Import Failed");
    }
  };

  /**
   * Begins the import process by uploading the BlogML file to the server.
   * @param {File} importFile The BlogML file to upload.
   * @returns {Promise<PostArticulateBlogmlImportFileResponse>} A promise that resolves with the initial import data, including the temporary file name and post count.
   * @private
   * @async
   */
  #beginImport = async (importFile: File): Promise<PostArticulateBlogmlImportFileResponse> => {
    const result = await BlogMl.postArticulateBlogmlImportFile({ body: { importFile } });
    if (!result.response.ok || !result.data?.temporaryFileName || !result.data?.postCount) {
      throw result.error || new Error("Failed to upload blog content.");
    }
    return result.data;
  };

  /**
   * Finalizes the import process by sending the import options to the server.
   * @param {FormData} formData The form data containing import options.
   * @param {string} tempFile The temporary file name returned from the beginImport step.
   * @returns {Promise<ImportResponse>} A promise that resolves with the final import results.
   * @private
   * @async
   */
  #finalizeImport = async (formData: FormData, tempFile: string): Promise<ImportResponse> => {
    const payload: ImportModel = {
      articulateBlogNode: this._articulateBlogNode!,
      overwrite: formData.get("overwrite") === "on",
      publish: formData.get("publish") === "on",
      regexMatch: (formData.get("regexMatch") as string) || "",
      regexReplace: (formData.get("regexReplace") as string) || "",
      tempFile: tempFile,
      exportDisqusXml: formData.get("exportDisqusXml") === "on",
      importFirstImage: formData.get("importFirstImage") === "on",
    };
    const result = await BlogMl.postArticulateBlogmlImport({ body: payload });
    if (!result.response.ok || !result.data?.completed) {
      throw result.error || new Error("Failed to import blog content.");
    }
    return result.data;
  };

  /**
   * Exports the Disqus comments to an XML file.
   * @private
   * @async
   */
  #exportDisqusComments = async () => {
    const result = await BlogMl.getArticulateBlogmlExportDisqus();
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
      const fileNameMatch = contentDisposition.match(/filename\*="UTF-8''([^"]+)"/);
      if (fileNameMatch && fileNameMatch.length > 1 && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      } else {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch && fileNameMatch.length > 1 && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }
    }
    this.#downloadFile(blob, fileName);
  };

  /**
   * Handles the reset button click event.
   * @param {Event} e The click event.
   * @private
   */
  private _handleReset = (e: Event) => {
    e.preventDefault();
    this.resetState(true);
  };

  override render() {
    return html`
      <uui-box headline="BlogML Importer">
        ${renderHeaderActions(this.routerPath)}
        <uui-form>
          ${keyed(
            this._formRenderKey,
            html`
              <form
                id="blogMlImportForm"
                @submit=${this.#handleSubmit}
                @input=${() => {
                  this._formError = null;
                  this._formState = undefined;
                }}
              >
                <uui-form-validation-message>
                  <uui-form-layout-item>
                    <div class="node-picker-container">
                      <uui-label for="articulateBlogNode" slot="label" required>Articulate blog node</uui-label>
                      <uui-input
                        id="articulateBlogNode"
                        name="articulateBlogNode"
                        placeholder="No node selected"
                        .value=${this._selectedBlogNodeName}
                        readonly
                        required
                        required-message="You must select a blog node"
                        style="flex-grow: 1;"
                      ></uui-input>
                      <uui-button
                        look="outline"
                        label=${this._articulateBlogNode ? "Change" : "Choose"}
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
                      tabindex="0"
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
                      the Articulate Wiki Importing page for more information.
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
                </uui-form-validation-message>
                <div class="form-actions">
                  ${this._postCount !== undefined && this._postCount > 0
                    ? html`
                        <uui-tag look="secondary" color="positive" style="margin-right: 1em;">
                          ${this._postCount} posts in uploaded file.
                        </uui-tag>
                      `
                    : ""}
                  <uui-button type="submit" look="primary" .state=${this._formState} color="primary" label="Submit">
                    Submit
                  </uui-button>
                  <uui-button type="button" look="secondary" @click=${this._handleReset} label="Reset">
                    Reset
                  </uui-button>
                </div>
              </form>
            `,
          )}
        </uui-form>

        ${this._formError ? renderErrorMessage(this._formError) : ""}
      </uui-box>
    `;
  }

  /**
   * The styles for the component.
   * @static
   * @readonly
   */
  static override readonly styles = [
    UmbTextStyles,
    UmbTextStyles,
    HostStyles,
    BoxStyles,
    ErrorBoxStyles,
    FormStyles,
    NodePickerStyles,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "blogml-importer": BlogMlImporterElement;
  }
}
