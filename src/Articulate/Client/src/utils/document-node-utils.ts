import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import {
  type UmbDocumentPickerModalData,
  type UmbDocumentPickerModalValue,
  UMB_DOCUMENT_PICKER_MODAL,
  type UmbDocumentItemModel,
} from "@umbraco-cms/backoffice/document";
import { type GetDocumentByIdData , type GetItemDocumentTypeSearchData , type DocumentVariantResponseModel , DocumentService, DocumentTypeService } from "@umbraco-cms/backoffice/external/backend-api";
import type { UmbModalContext, UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";

/**
 * Fetches a document variant by its UDI.
 * @param {string} udi The UDI (Unique Data Identifier) of the document to fetch.
 * @returns {Promise<DocumentVariantResponseModel | null>} A promise that resolves to the first document variant, or null if not found or an error occurs.
 */
export async function DocumentById(udi: string): Promise<DocumentVariantResponseModel | null> {
  try {
    const query:GetDocumentByIdData={ id: udi };
    const response = await DocumentService.getDocumentById(query);
    return response?.variants?.[0] ?? null;
  } catch (error) {
    console.error(error, "Failed to fetch node");
    return null;
  }
}

/**
 * Fetches the UDI of the Articulate blog archive document type.
 * @returns {Promise<string | undefined>} A promise that resolves to the UDI string of the blog archive document type, or undefined if not found or an error occurs.
 */
export async function ArticulateDocumentTypeKey(): Promise<string | undefined> {
  try {
    const query:GetItemDocumentTypeSearchData = {
      query: "Articulate",
      skip: 0,
      take: 1,
      isElement: false,
    };
    const response = await DocumentTypeService.getItemDocumentTypeSearch(query);
    return response?.items?.[0]?.id ?? undefined;
  } catch (error) {
    console.error(error, "Failed to fetch Articulate document type");
    return undefined;
  }
}

/**
 * Opens a document picker modal to select a node and returns its UDI.
 * @param {UmbModalManagerContext} modalManager The Umbraco modal manager context.
 * @param {string} doctypeUdi The UDI of the document type to filter the picker by.
 * @param {UmbControllerHost} host The controller host instance.
 * @returns {Promise<string | null>} A promise that resolves to the selected node's UDI, or null if no node is selected or an error occurs.
 */
export async function openNodePicker(
  modalManager: UmbModalManagerContext,
  doctypeUdi: string,
  host: UmbControllerHost,
): Promise<string | null> {
  try {
    // TODO: filter: no longer works? using pickableFilter as a workaround
    const modalContext:UmbModalContext<UmbDocumentPickerModalData, UmbDocumentPickerModalValue> = modalManager.open<UmbDocumentPickerModalData, UmbDocumentPickerModalValue>(
      host,
      UMB_DOCUMENT_PICKER_MODAL,
      {
        data: {
          multiple: false,
          pickableFilter: (doc: UmbDocumentItemModel): boolean => {
            return doc.documentType?.unique === doctypeUdi;
          },
        },
      },
    );
    const result = await modalContext.onSubmit();
    if (!result || !result.selection || !result.selection[0]) {
      return null;
    }
    return result.selection[0];
  } catch (error) {
    console.error(error, "Node picker failed");
    return null;
  }
}
