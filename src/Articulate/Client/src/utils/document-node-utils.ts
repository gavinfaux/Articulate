import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import type { UmbDocumentItemModel } from "@umbraco-cms/backoffice/document";
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
  try {
    const result = await Articulate.getUmbracoManagementApiV1ArticulateBlogArchiveUdi();

    if (!result.response.ok) {
      let errorDetails: ProblemDetails | string;
      try {
        errorDetails = (await result.response.json()) as ProblemDetails;
      } catch {
        errorDetails = `API Error: ${result.response.status} ${result.response.statusText}`;
      }

      throw typeof errorDetails === "string"
        ? new Error(errorDetails)
        : new Error(errorDetails.title || errorDetails.detail || "Unknown API error");
    }

    if (!result.data) {
      throw new Error("API returned no data for Articulate Archive UDI");
    }
    return result.data;
  } catch (error) {
    throw new Error(
      `Could not retrieve Articulate Archive document type: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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
    throw new Error(
      `Failed to fetch node: ${error instanceof Error ? error.message : String(error)}`,
    );
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
    const modalContext = modalManager.open(host, "UMB_DOCUMENT_PICKER_MODAL", {
      data: {
        multiple: false,
        filter: (doc: UmbDocumentItemModel) => doc.documentType?.unique === doctypeUdi,
      },
    });
    const result = (await modalContext.onSubmit()) as { selection: string[] } | undefined;
    if (!result?.selection?.[0]) {
      throw new Error("No node selected or selection cancelled");
    }
    return result.selection[0];
  } catch (error) {
    throw new Error(
      `Node picker failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
