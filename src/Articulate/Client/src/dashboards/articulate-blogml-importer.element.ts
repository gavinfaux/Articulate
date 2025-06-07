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
import { ArticulateService, ProblemDetails } from "../api/core";
import type { ImportBlogMlModel, ImportModel, PostResponseModel } from "../api/core/types.gen";
import { extractErrorMessage } from "../utils/error-utils";
import { showUmbracoNotification } from "../utils/notification-utils";
import { formStyles } from "./form-styles";

// TODO: Import tests
// TODO: Polish UX / CSS
// TODO: Use utils error handling and notification patterns
// TODO: See if theres an API to resolve UDI by alias
const ARTICULATE_ARCHIVE_DOCTYPE_UDI = "umb://document-type/ce9e1f75-6428-46b1-8711-84829b9b3d1c";

@customElement("articulate-blogml-importer")
export default class ArticulateBlogMlImporterElement extends UmbLitElement {
  @property({ type: String })
  routerPath?: string;

  @state() private _isSubmitting = false;
  @state() private _formMessageType: "positive" | "error" | "" = "";
  @state() private _formMessageText = "";
  @state() private _selectedBlogNodeUdi: string | null = null;
  @state() private _selectedBlogNodeName: string | null = null;

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
        filter: (doc: UmbDocumentItemModel) =>
          doc.documentType?.unique === ARTICULATE_ARCHIVE_DOCTYPE_UDI,
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
    } catch (error: unknown) {
      // Modal was closed without a selection or an error occurred
      console.info("Document picker modal closed without selection or with error:", error);
      // Optionally, notify the user if this is considered an error scenario needing feedback
      // await showUmbracoNotification(this, "Document selection was cancelled.", "warning");
    }
  }

  private async _fetchNodeName(udi: string) {
    if (!udi) {
      this._selectedBlogNodeName = "No node selected";
      this.requestUpdate("_selectedBlogNodeName");
      return;
    }
    try {
      // Note: DocumentService.getDocumentById does not support throwOnError or return response.ok
      // Can we assume it throws on error or returns a problematic structure we can catch.
      const response: DocumentResponseModel = await DocumentService.getDocumentById({ id: udi });
      // Check if we have a valid response
      const firstVariant = response?.variants?.[0];
      if (firstVariant?.name) {
        this._selectedBlogNodeName = firstVariant.name;
      } else {
        // Should we throw an error here?
        this._selectedBlogNodeName = `Node (UDI: ${udi.substring(udi.lastIndexOf("/") + 1)})`;
        console.warn("Could not determine node name from response for UDI:", udi, response);
      }
    } catch (error: unknown) {
      console.error(`Error fetching node name for UDI ${udi}:`, error);
      this._selectedBlogNodeName = `Error fetching name`;
      const errorMessage = extractErrorMessage(
        error,
        "Could not fetch node name. Please check logs.",
      );
      await showUmbracoNotification(this, errorMessage, "danger");
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

    const blogNodeUdi = this._selectedBlogNodeUdi;
    const importFileField = form.elements.namedItem("importFile") as HTMLInputElement;
    const importFile = importFileField && importFileField.files ? importFileField.files[0] : null;

    if (!blogNodeUdi) {
      this._showMessage("error", "Please select an Articulate blog node to import to.");
      return;
    }

    if (!importFile || importFile.size === 0) {
      this._showMessage("error", "Please select a BlogML file to import.");
      return;
    }

    try {
      this._isSubmitting = true;
      submitButton.setAttribute("state", "waiting");

      // Step 1: Initialize the import (upload file)
      this._showMessage("", "Uploading file, please wait...");
      const formDataUpload = new FormData();
      formDataUpload.append(importFile.name, importFile);

      const initResult = await ArticulateService.postUmbracoManagementApiV1ArticulateBlogPostInit({
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

      this._showMessage("", `File uploaded. Importing ${initData.postCount} posts...`);

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

      const importCallResult =
        await ArticulateService.postUmbracoManagementApiV1ArticulateBlogPostImport({
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

      this._showMessage("positive", successMessage);
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
      return html`<uui-loader-bar animationDuration="1.5" style="color: blue"></uui-loader-bar>`;
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
