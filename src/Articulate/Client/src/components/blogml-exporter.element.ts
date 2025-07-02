import { css, customElement, html, property, query, state } from "@umbraco-cms/backoffice/external/lit";
import { UUIButtonState } from "@umbraco-cms/backoffice/external/uui";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { Blog } from "../api/sdk.gen";
import type { ExportBlogMlModel } from "../api/types.gen";
import { fetchArchiveDoctypeUdi, fetchNodeByUdi, openNodePicker } from "../utils/document-node-utils";
import { IFormController, setFormError } from "../utils/form-utils";
import { showUmbracoNotification } from "../utils/notification-utils";
import { renderErrorMessage, renderHeaderActions } from "../utils/template-utils";

/**
 * A LitElement-based component for exporting blog content in BlogML format.
 * Provides a form to select a blog node and export its content.
 *
 * @element blogml-exporter
 * @extends UmbLitElement
 */
/**
 * A LitElement-based component for exporting blog content in BlogML format.
 * Provides a form to select a blog node and export its content.
 *
 * @element blogml-exporter
 * @extends UmbLitElement
 * @implements {IFormController}
 */
@customElement("blogml-exporter")
export default class BlogMlExporterElement extends UmbLitElement implements IFormController {
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
   * The UDI of the selected Articulate blog node for export.
   * @private
   * @type {string | undefined}
   */
  @state() private _articulateNodeId: string | undefined = undefined;
  /**
   * The name of the selected blog node, displayed in the input.
   * @private
   * @type {string}
   */
  @state() private _selectedBlogNodeName: string = "";

  /**
   * The main form element.
   * @private
   * @type {HTMLFormElement}
   */
  @query("#blogMlExportForm")
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
    this._archiveDoctypeUdi = await fetchArchiveDoctypeUdi();
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
    if (fullReset) {
      this._form?.reset();
      this._formState = undefined;
      this._formError = null;
      this._articulateNodeId = undefined;
      this._selectedBlogNodeName = "";
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
      const variant = await fetchNodeByUdi(udi);
      if (!variant) {
        setFormError(this, new Error(`Could not find a node with UDI: ${udi}`), "Node Not Found");
        return;
      }
      this._articulateNodeId = udi;
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
   * Handles the form submission event.
   * @param {SubmitEvent} e The submit event.
   * @private
   * @async
   */
  #handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!this._form) return;

    console.info("Form submission validity check:", this._form.reportValidity());
    console.info("Current _articulateNodeId:", this._articulateNodeId);

    // Manually validate the articulateNodeId first.
    if (!this._articulateNodeId) {
      const validationError = new Error("A blog node must be selected before exporting.");
      validationError.name = "Validation Error";
      setFormError(this, validationError, validationError.name);
      // Trigger the browser's validation UI on the invalid field(s).
      // Work around for dirty uui-input-file after form submission and reset
      this._form.reportValidity();
      return;
    }

    // Then, let the browser validate the rest of the form.
    if (!this._form.reportValidity()) {
      const validationError = new Error("The form is not valid. Please check the fields marked with an error.");
      validationError.name = "Validation Error";
      setFormError(this, validationError, validationError.name);
      return;
    }

    if (this._formState === "waiting") return;

    this._formState = "waiting";
    this._formError = null;

    try {
      await this.#performExport();
      this._formState = "success";
      await showUmbracoNotification(this, "BlogML exported successfully!", "positive");
      this.resetState(true);
    } catch (error) {
      setFormError(this, error, "Export Failed");
    }
  };

  /**
   * Performs the BlogML export by calling the backend API.
   * @private
   * @async
   */
  #performExport = async () => {
    const formData = new FormData(this._form);
    const embedImages = formData.get("embedImages") === "on";
    const payload: ExportBlogMlModel = {
      articulateNodeId: this._articulateNodeId!,
      exportImagesAsBase64: embedImages,
    };
    const result = await Blog.postArticulateBlogExportV1({ body: payload });
    if (!result.response.ok || !result.data) {
      throw result.error || new Error("The server returned an invalid response during export.");
    }
    const blob = result.data;
    if (!this.#isBlob(blob)) {
      throw new Error("The server did not return a file. Please check the server logs.");
    }
    const contentDisposition = result.response.headers.get("content-disposition");
    let fileName = "blog-export.xml"; // Default filename
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (fileNameMatch && fileNameMatch.length > 1 && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
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
      <uui-box headline="BlogML Exporter">
        ${renderHeaderActions(this.routerPath)}
        <uui-form>
          <form
            id="blogMlExportForm"
            @submit=${this.#handleSubmit}
            @input=${() => {
              this._formError = null;
              this._formState = undefined;
            }}
          >
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
                <uui-label slot="label" for="embedImages">Embed images?</uui-label>
                <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
                <div slot="description">
                  Check if you want to embed images as base64 data in the output file. Useful if your site isn't going
                  to be HTTP accessible to the site you will be importing on.
                </div>
              </uui-form-layout-item>
            </uui-validation-message>

            <uui-button type="submit" look="primary" .state=${this._formState}>Submit</uui-button>
            <uui-button type="button" look="secondary" @click=${this._handleReset}>Reset</uui-button>
          </form>
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
    "blogml-exporter": BlogMlExporterElement;
  }
}
