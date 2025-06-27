import { css, customElement, html, property, query, state } from "@umbraco-cms/backoffice/external/lit";
import { UUIButtonState } from "@umbraco-cms/backoffice/external/uui";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT, UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import { Articulate } from "../api/sdk.gen";
import type { ExportBlogMlModel } from "../api/types.gen";
import { fetchArchiveDoctypeUdi, fetchNodeByUdi, openNodePicker } from "../utils/document-node-utils";
import { formatApiError } from "../utils/error-utils";
import { formStyles } from "../utils/form-styles";
import { showUmbracoNotification } from "../utils/notification-utils";
import { renderErrorMessage, renderHeaderActions } from "../utils/template-utils";

/**
 * A LitElement-based component for exporting blog content in BlogML format.
 * Provides a form to select a blog node and export its content.
 *
 * @element blogml-exporter
 * @extends UmbLitElement
 */
@customElement("blogml-exporter")
export default class BlogMlExporterElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  @state() private _formState: UUIButtonState = undefined;
  @state() private _formError: { title: string; details: string[] } | null = null;
  @state() private _articulateNodeId: string | undefined = undefined;
  @state() private _selectedBlogNodeName: string = "";

  @query("#blogMlExportForm")
  private _form!: HTMLFormElement;

  private _modalManagerContext?: UmbModalManagerContext;
  private _archiveDoctypeUdi: string | undefined = undefined;

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
   * Handles the form submission for exporting blog content.
   * Validates the form and initiates the export process.
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  #handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!this._form) return;
    if (this._formState === "waiting") {
      return;
    }
    this._formState = "waiting";
    this._formError = null;
    if (!this._articulateNodeId) {
      this._formError = { title: "Please select a blog node before exporting.", details: [] };
      this._formState = "failed";
      return;
    }
    try {
      await this.#performExport();
      this._formState = "success";
      await showUmbracoNotification(this, "BlogML exported successfully!", "positive");
      this._handleReset(e);
    } catch (error) {
      this._formError = formatApiError(error, "Failed to export blog content.");
      this._formState = "failed";
    }
  };

  #performExport = async () => {
    const formData = new FormData(this._form);
    const embedImages = formData.get("embedImages") === "on";
    const payload: ExportBlogMlModel = {
      articulateNodeId: this._articulateNodeId!,
      exportImagesAsBase64: embedImages,
    };
    const result = await Articulate.postArticulateBlogExportV1({ body: payload });
    if (!result.response.ok || !result.data) {
      throw result.error || new Error("Failed to export blog content.");
    }
    const blob = result.data;
    if (!this.#isBlob(blob)) {
      throw new Error("Failed to receive a valid file from the server.");
    }
    const contentDisposition = result.response.headers.get("content-disposition");
    let fileName = "blog-export.xml"; // Default filename
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
    this._form.reset();
    this._formState = undefined;
    this._formError = null;
    this._articulateNodeId = undefined;
    this._selectedBlogNodeName = "";
  };

  override render() {
    return html`
      <uui-box headline="BlogML Exporter">
        ${renderHeaderActions(this.routerPath)}
        <uui-form>
          <form id="blogMlExportForm" @submit=${this.#handleSubmit} @input=${this.#clearError}>
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
                  label=${this._articulateNodeId !== "" ? "Change" : "Choose"}
                  @click=${this._openNodePicker}
                ></uui-button>
              </div>
              <div slot="description">Choose the Articulate blog node to export from</div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="embedImages">Embed images?</uui-label>
              <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
              <div slot="description">
                Check if you want to embed images as base64 data in the output file. Useful if your site isn't going to
                be HTTP accessible to the site you will be importing on.
              </div>
            </uui-form-layout-item>
            <uui-button type="submit" look="primary" .state=${this._formState}>Submit</uui-button>
            <uui-button type="button" look="secondary" @click=${this._handleReset}>Reset</uui-button>
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
    "blogml-exporter": BlogMlExporterElement;
  }
}
