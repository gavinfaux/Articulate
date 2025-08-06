import type { UmbAuthContext } from '@umbraco-cms/backoffice/auth';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import {
  type UmbDocumentItemModel,
  type UmbDocumentPickerModalData,
  type UmbDocumentPickerModalValue,
  UMB_DOCUMENT_PICKER_MODAL,
} from '@umbraco-cms/backoffice/document';
import {
  type DocumentVariantResponseModel,
  type GetDocumentByIdData,
  DocumentService,
} from '@umbraco-cms/backoffice/external/backend-api';
import type { UmbModalContext, UmbModalManagerContext } from '@umbraco-cms/backoffice/modal';

/**
 * Fetches a document variant by its UDI.
 * @param {string} udi The UDI (Unique Data Identifier) of the document to fetch.
 * @returns {Promise<DocumentVariantResponseModel | null>} A promise that resolves to the first document variant, or null if not found or an error occurs.
 */
export async function DocumentById(udi: string): Promise<DocumentVariantResponseModel | null> {
  try {
    const data: GetDocumentByIdData = { id: udi };
    const response = await DocumentService.getDocumentById(data);
    return response?.variants?.[0] ?? null;
  } catch (error) {
    console.error(error, 'Failed to fetch node');
    return null;
  }
}

/**
 * The expected shape of the response from the document-type search API.
 */
interface DocumentTypeSearchResponse {
  total: number;
  items: Array<{ id: string; [key: string]: unknown }>;
}

/**
 * Fetches the UDI of the Articulate blog archive document type.
 * @param {UmbControllerHost} host A reference to a controller host, needed to access the auth context.
 * @returns {Promise<string | undefined>} A promise that resolves to the UDI string of the blog archive document type, or undefined if not found or an error occurs.
 */
export async function ArticulateDocumentTypeKey(authContext: UmbAuthContext): Promise<string | undefined> {
  try {
    // 1. Get the authentication context and bearer token from Umbraco
    const auth = authContext.getOpenApiConfiguration();
    const token = auth?.token;

    if (!token) {
      throw new Error('Could not get authorization token.');
    }

    // 2. Construct the URL with query parameters using URLSearchParams for safety
    const params = new URLSearchParams({
      query: 'Articulate',
      skip: '0',
      take: '1',
      isElement: 'false',
    });
    const url = `/umbraco/management/api/v1/item/document-type/search?${params.toString()}`;

    // 3. Make the fetch request with the required headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // 4. Parse the JSON response and return the document type ID
    const data: DocumentTypeSearchResponse = await response.json();
    return data.items?.[0]?.id ?? undefined;
  } catch (error) {
    console.error('Failed to fetch Articulate document type with custom fetch', error);
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
    const modalContext: UmbModalContext<UmbDocumentPickerModalData, UmbDocumentPickerModalValue> = modalManager.open<
      UmbDocumentPickerModalData,
      UmbDocumentPickerModalValue
    >(host, UMB_DOCUMENT_PICKER_MODAL, {
      data: {
        multiple: false,
        pickableFilter: (doc: UmbDocumentItemModel): boolean => {
          return doc.documentType?.unique === doctypeUdi;
        },
      },
    });
    const result = await modalContext.onSubmit();
    if (!result || !result.selection || !result.selection[0]) {
      return null;
    }
    return result.selection[0];
  } catch (error) {
    console.error(error, 'Node picker failed');
    return null;
  }
}
