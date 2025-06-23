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
import type { ExportBlogMlModel } from "../api/articulate/types.gen";
import { ProblemDetails } from "../api/articulate/types.gen";
import {
  fetchArchiveDoctypeUdi,
  fetchNodeByUdi,
  openNodePicker,
} from "../utils/document-node-utils";
import { renderHeaderActions } from "../utils/template-utils";
import { formStyles } from "./form-styles";

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

  @state() private _formState: UUIButtonState = undefined;
  @state() private _formError = "";

  @state() private _articulateNodeId: string | null = null;
  @state() private _selectedBlogNodeName = "";

  private _modalManagerContext?: UmbModalManagerContext;
  private _archiveDoctypeUdi: string | null = null;

  #validation = new UmbValidationContext(this);

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
   * Handles the form submission for exporting blog content.
   * Validates the form and initiates the export process.
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
    } catch (error) {
      console.error("Validation error:", error);
      this._formError = "Please select a blog node.";
      return;
    }

    const formData = new FormData(form);
    const embedImages = formData.get("embedImages") === "on";

    const payload: ExportBlogMlModel = {
      articulateNodeId: this._articulateNodeId!,
      exportImagesAsBase64: embedImages,
    };
    this._formState = "waiting";
    this._formError = "";
    try {
      const result = await Articulate.postUmbracoManagementApiV1ArticulateBlogExport({
        body: payload,
      });
      if (!result.response.ok) {
        let errorDetails: ProblemDetails | { title: string; detail?: string };
        try {
          errorDetails = (await result.response.json()) as ProblemDetails;
          console.error(
            errorDetails.title && errorDetails.detail
              ? `${errorDetails.title}: ${errorDetails.detail}`
              : errorDetails.title,
          );
        } catch {
          errorDetails = { title: `${result.response.status} ${result.response.statusText}` };
        }
        this._formError =
          (errorDetails.title && errorDetails.detail
            ? `${errorDetails.title}: ${errorDetails.detail}`
            : errorDetails.title) ?? "Failed to export blog content.";
        this._formState = "failed";
        return;
      }
      // The API now returns the file content directly.
      const blob = result.data;
      if (!this.#isBlob(blob)) {
        this._formState = "failed";
        this._formError = "Failed to receive a valid file from the server.";
        console.error("API response was not a valid file blob.");
        return;
      }
      const contentDisposition = result.response.headers.get("content-disposition");
      let fileName = "export.xml"; // Default filename
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=\"?([^\"]+)\"?/);
        if (fileNameMatch && fileNameMatch.length > 1 && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }
      this._formState = "success";
      this.#downloadFile(blob, fileName);
      form.reset();
      this._articulateNodeId = null;
      this._selectedBlogNodeName = "";
    } catch (error) {
      this._formState = "failed";
      this._formError = `An unexpected error occurred: ${
        error instanceof Error ? error.message : String(error)
      }`;
      console.error(error);
    }
  };

  override render() {
    return html`
      <uui-box headline="BlogML Exporter">
        ${renderHeaderActions(this.routerPath)}
        <uui-form-validation-message>
          <uui-form>
            <form id="blogMlExportForm" @submit=${this.#handleSubmit}>
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
                <uui-label slot="label" for="embedImages">Embed images?</uui-label>
                <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
                <div slot="description">
                  Check if you want to embed images as base64 data in the output file. Useful if
                  your site isn't going to be HTTP accessible to the site you will be importing on.
                </div>
              </uui-form-layout-item>
              <uui-form-layout-item>${this.#renderErrorMessage()}</uui-form-layout-item>
              <uui-button-group>
                <uui-button type="submit" look="primary" .state=${this._formState}
                  >Submit</uui-button
                >
              </uui-button-group>
            </form>
          </uui-form>
        </uui-form-validation-message>
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
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "articulate-blogml-exporter": ArticulateBlogMlExporterElement;
  }
}
