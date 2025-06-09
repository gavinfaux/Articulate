import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import type { UmbDocumentItemModel } from "@umbraco-cms/backoffice/document";
import type { UmbModalManagerContext } from "@umbraco-cms/backoffice/modal";
import { Articulate } from "../api/articulate/sdk.gen";

/**
 * Fetches the UDI of the Articulate blog archive document type.
 * @returns A promise that resolves to the UDI string of the blog archive document type.
 * @throws {Error} If the API request fails, an error is thrown with details from the response.
 */

export async function fetchArchiveDoctypeUdi(): Promise<string> {
  const result = await Articulate.getUmbracoManagementApiV1ArticulateBlogArchiveid({
    throwOnError: true,
  });
  if (!result.response.ok) {
    let errorToThrow;
    try {
      errorToThrow = await result.response.json();
    } catch {
      errorToThrow = new Error(
        `API Error: ${result.response.status} ${result.response.statusText}`,
      );
    }
    throw errorToThrow;
  }
  return result.data;
}

/**
 * Fetches the node by its UDI.
 * @param udi - The UDI (Unique Data Identifier) of the node to fetch.
 * @returns A promise that resolves to the node or null if the node is not found.
 */
export async function fetchNodeByUdi(udi: string) {
  // Note: DocumentService.getDocumentById does not support throwOnError, so if it throws on error, the caller will catch and handle
  const response: DocumentResponseModel = await DocumentService.getDocumentById({
    id: udi,
  });
  // Check if we have a valid response
  const firstVariant = response?.variants?.[0];
  if (firstVariant) {
    return firstVariant;
  }
  return null;
}

/**
 * Fetches the name of a node by its UDI.
 * @param udi - The UDI (Unique Data Identifier) of the node to fetch the name for.
 * @returns A promise that resolves to the node name, or 'No node selected' if UDI is falsy.
 * @throws {Error} If the API request fails, an error is thrown with details from the response.
 */
// export async function fetchNodeNameByUdi(udi: string): Promise<string> {
//   if (!udi) return "No node selected";
//   const result = await Articulate.getUmbracoManagementApiV1ArticulateBlogNodename({
//     query: { id: udi },
//     throwOnError: true,
//   });
//   if (!result.response.ok) {
//     let errorToThrow;
//     try {
//       errorToThrow = await result.response.json();
//     } catch {
//       errorToThrow = new Error(
//         `API Error: ${result.response.status} ${result.response.statusText}`,
//       );
//     }
//     throw errorToThrow;
//   }
//   return result.data;
// }

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
  const modalContext = modalManager.open(host, "UMB_DOCUMENT_PICKER_MODAL", {
    data: {
      multiple: false,
      filter: (doc: UmbDocumentItemModel) => doc.documentType?.unique === doctypeUdi,
    },
  });
  const result = (await modalContext.onSubmit()) as { selection: string[] } | undefined;
  if (result && result.selection && result.selection.length > 0) {
    return result.selection[0] ?? null;
  }
  return null;
}
