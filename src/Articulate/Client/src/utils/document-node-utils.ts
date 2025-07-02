import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import {
  UMB_DOCUMENT_PICKER_MODAL,
  UmbDocumentPickerModalData,
  UmbDocumentPickerModalValue,
  type UmbDocumentItemModel,
} from "@umbraco-cms/backoffice/document";
import type { UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { Blog } from "../api";

import type { DocumentVariantResponseModel } from "@umbraco-cms/backoffice/external/backend-api";
import { DocumentService } from "@umbraco-cms/backoffice/external/backend-api";
import { formatApiError } from "./error-utils";

/**
 * Fetches the UDI of the Articulate blog archive document type.
 * @returns {Promise<string | undefined>} A promise that resolves to the UDI string of the blog archive document type, or undefined if the request fails.
 */
export async function fetchArchiveDoctypeUdi(): Promise<string | undefined> {
  const result = await Blog.getArticulateBlogArticulateGuidV1();
  if (result.response.ok && result.data) {
    return result.data;
  }
  console.error(formatApiError(result.error, "API request failed for Articulate Archive UDI"));
  return undefined;
}

/**
 * Fetches a document variant by its UDI.
 * @param {string} udi The UDI (Unique Data Identifier) of the document to fetch.
 * @returns {Promise<DocumentVariantResponseModel | null>} A promise that resolves to the first document variant, or null if not found or an error occurs.
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
