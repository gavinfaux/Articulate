import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import {
  UMB_DOCUMENT_PICKER_MODAL,
  UmbDocumentPickerModalData,
  UmbDocumentPickerModalValue,
  type UmbDocumentItemModel,
} from "@umbraco-cms/backoffice/document";
import type { UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { Articulate } from "../api/articulate/sdk.gen";

import type {
  DocumentVariantResponseModel,
  ProblemDetails,
} from "@umbraco-cms/backoffice/external/backend-api";
import { DocumentService } from "@umbraco-cms/backoffice/external/backend-api";

/**
 * Fetches the UDI of the Articulate blog archive document type.
 * @returns A promise that resolves to the UDI string of the blog archive document type.
 * @throws {Error} If the API request fails, an error is thrown with details from the response.
 */
export async function fetchArchiveDoctypeUdi(): Promise<string | null> {
  const result = await Articulate.getUmbracoManagementApiV1ArticulateBlogArticulateGuid();
  if (result.response.ok && result.data) {
    return result.data;
  } else if (!result.data) {
    console.error("API returned no data for Articulate Archive UDI");
    return null;
  }
  try {
    let errorDetails = (await result.response.json()) as ProblemDetails;
    console.error(
      errorDetails.title && errorDetails.detail
        ? `${errorDetails.title}: ${errorDetails.detail}`
        : errorDetails.title,
    );
  } catch {
    console.error(`${result.response.status} ${result.response.statusText}`);
  }
  return null;
}

/**
 * Fetches the node by its UDI.
 * @param udi - The UDI (Unique Data Identifier) of the node to fetch.
 * @returns A promise that resolves to the node or null if the node is not found.
 */
export async function fetchNodeByUdi(udi: string): Promise<DocumentVariantResponseModel | null> {
  try {
    const response = await DocumentService.getDocumentById({ id: udi });
    return response?.variants?.[0] ?? null;
  } catch (error) {
    console.error(
      `Failed to fetch node: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/**
 * Opens a document picker modal and returns the selected node's UDI.
 * @param modalManager - The Umbraco modal manager context.
 * @param doctypeUdi - The UDI of the document type to filter the picker by.
 * @param host - The controller host instance.
 * @returns A promise that resolves to the selected node's UDI, or null if no node was selected.
 */
export async function openNodePicker(
  modalManager: UmbModalManagerContext,
  doctypeUdi: string,
  host: UmbControllerHost,
): Promise<string | null> {
  try {
    // TODO: filter no longer works?
    const modalContext = modalManager.open<UmbDocumentPickerModalData, UmbDocumentPickerModalValue>(
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
    console.error(`Node picker failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
