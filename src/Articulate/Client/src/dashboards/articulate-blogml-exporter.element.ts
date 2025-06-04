import {
  UMB_DOCUMENT_PICKER_MODAL,
  UmbDocumentItemModel,
  UmbDocumentPickerModalData,
  UmbDocumentPickerModalValue,
} from "@umbraco-cms/backoffice/document";
import type { DocumentResponseModel } from "@umbraco-cms/backoffice/external/backend-api";
import { DocumentService } from "@umbraco-cms/backoffice/external/backend-api";
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
import { ArticulateService } from "../api/core";
import type {
  ExportBlogMlModel,
  ImportModel,
  PagedProblemDetailsModel,
} from "../api/core/types.gen";
import { formStyles } from "./form-styles";

const ARTICULATE_ARCHIVE_DOCTYPE_UDI = "umb://document-type/ce9e1f75-6428-46b1-8711-84829b9b3d1c";

@customElement("articulate-blogml-exporter")
export default class ArticulateBlogMlExporterElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  @state() private _isSubmitting = false;
  @state() private _formMessageType: "positive" | "error" | "" = "";
  @state() private _formMessageText = "";
  @state() private _selectedBlogNodeUdi: string | null = null;
  @state() private _selectedBlogNodeName = "No node selected";

  private _modalManagerContext?: UmbModalManagerContext;

  constructor() {
    super();
    this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (instance) => {
      this._modalManagerContext = instance;
    });
  }

  private _showMessage(type: "positive" | "error" | "", message: string) {
    this._formMessageType = type;
    this._formMessageText = message;
  }

  private async _openNodePicker() {
    if (!this._modalManagerContext) return;

    const modalContext = this._modalManagerContext.open<
      UmbDocumentPickerModalData,
      UmbDocumentPickerModalValue
    >(this, UMB_DOCUMENT_PICKER_MODAL, {
      data: {
        multiple: false,
        // Only allow selection of 'ArticulateArchive' document type nodes
        filter: (doc: UmbDocumentItemModel): boolean => {
          return doc.documentType.unique === ARTICULATE_ARCHIVE_DOCTYPE_UDI;
        },
      },
    });

    try {
      const result = await modalContext.onSubmit();
      if (result && result.selection.length > 0) {
        const selectedNodeUnique = result.selection[0];
        if (selectedNodeUnique) {
          this._selectedBlogNodeUdi = selectedNodeUnique;
          await this._fetchNodeName(selectedNodeUnique);
          this.requestUpdate("_selectedBlogNodeName");
          this.requestUpdate("_selectedBlogNodeUdi");
        }
      }
    } catch (error) {
      console.info("Document picker modal closed without selection or with error:", error);
    }
  }

  private async _fetchNodeName(udi: string) {
    if (!udi) {
      this._selectedBlogNodeName = "No node selected";
      this.requestUpdate("_selectedBlogNodeName");
      return;
    }
    try {
      const response: DocumentResponseModel = await DocumentService.getDocumentById({ id: udi });
      if (
        response &&
        response.variants &&
        response.variants.length > 0 &&
        response.variants[0].name
      ) {
        this._selectedBlogNodeName = response.variants[0].name;
      } else {
        this._selectedBlogNodeName = `Node (UDI: ${udi.substring(udi.lastIndexOf("/") + 1)})`;
        console.warn("Could not determine node name from response for UDI:", udi, response);
      }
    } catch (error) {
      console.error(`Error fetching node name for UDI ${udi}:`, error);
      this._selectedBlogNodeName = `Error fetching name`;
    }
    this.requestUpdate("_selectedBlogNodeName");
  }

  private async _handleSubmit(e: Event) {
    e.preventDefault();
    if (this._isSubmitting) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const submitButton = form.querySelector<HTMLElement>('uui-button[look="primary"]');

    if (!submitButton) return;
    this._showMessage("", "");

    if (!this._selectedBlogNodeUdi) {
      this._showMessage("error", "Please select an Articulate blog node to export from.");
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

      const response = await ArticulateService.postUmbracoManagementApiV1ArticulateBlogPostExport({
        body: payload,
      });

      const responseData = response.data as ImportModel;
      let successMessage = "BlogML export completed successfully.";
      if (responseData && responseData.downloadUrl) {
        const downloadLink = responseData.downloadUrl.startsWith("http")
          ? responseData.downloadUrl
          : `${window.location.origin}${responseData.downloadUrl}`;
        successMessage = `BlogML export completed. <a href="${downloadLink}" target="_blank">Download exported file</a>.`;
      }

      this._showMessage("positive", successMessage);
      // Optionally reset form fields or selections here if desired
      // form.reset();
      // this._selectedBlogNodeUdi = null;
      // this._selectedBlogNodeName = "No node selected";
      // this.requestUpdate();
    } catch (error: any) {
      console.error("BlogML Export Error:", error);
      let errorMessage = "Export failed. Please check the console for details.";
      if (error && typeof error.status === "number" && error.body) {
        const problemDetails = error.body as PagedProblemDetailsModel | undefined;
        if (problemDetails && typeof (problemDetails as any).detail === "string") {
          errorMessage = (problemDetails as any).detail;
        } else if (problemDetails && typeof (problemDetails as any).title === "string") {
          errorMessage = (problemDetails as any).title;
        }
      }
      this._showMessage("error", errorMessage);
    } finally {
      this._isSubmitting = false;
      submitButton.setAttribute("state", "default");
    }
  }

  override render() {
    if (!this.routerPath) {
      return html`<uui-loader></uui-loader>`;
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
