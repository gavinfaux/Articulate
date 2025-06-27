import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import {
  UMB_DOCUMENT_PICKER_MODAL,
  UmbDocumentPickerModalData,
  UmbDocumentPickerModalValue,
  type UmbDocumentItemModel,
} from "@umbraco-cms/backoffice/document";
import type { UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { Articulate } from "../api";

import type { DocumentVariantResponseModel } from "@umbraco-cms/backoffice/external/backend-api";
import { DocumentService } from "@umbraco-cms/backoffice/external/backend-api";
import { formatApiError } from "./error-utils";

/**
 * Fetches the UDI of the Articulate blog archive document type.
 * @returns A promise that resolves to the UDI string of the blog archive document type.
 * @throws {Error} If the API request fails, an error is thrown with details from the response.
 */
export async function fetchArchiveDoctypeUdi(): Promise<string | undefined> {
  const result = await Articulate.getArticulateBlogArticulateGuidV1();
  if (result.response.ok && result.data) {
    return result.data;
  }
  console.error(formatApiError(result.error, "API request failed for Articulate Archive UDI"));
  return undefined;
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
    console.error(formatApiError(error, "Failed to fetch node"));
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
    // TODO: filter: no longer works? using pickableFilter as a workaround
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
    console.error(formatApiError(error, "Node picker failed"));
    return null;
  }
}
