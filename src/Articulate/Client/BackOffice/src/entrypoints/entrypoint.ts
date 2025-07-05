import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import type { UmbEntryPointOnInit, UmbEntryPointOnUnload } from "@umbraco-cms/backoffice/extension-api";
import { client } from "../api/client.gen";

/**
 * The entry point for the Articulate package extensions.
 * This function is called when the extension is initialized.
 * It injects a custom stylesheet and configures the API clients.
 * @param {UmbEntryPointOnInit} host The host element for the extension.
 * @param {UmbExtensionRegistry} _extensionRegistry The extension registry.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onInit: UmbEntryPointOnInit = (host, _extensionRegistry) => {
  host.consumeContext(UMB_AUTH_CONTEXT, (authContext) => {
    const openApiConfig = authContext?.getOpenApiConfiguration();
    const config = {
      auth: openApiConfig?.token ?? undefined,
      baseUrl: openApiConfig?.base ?? "",
      credentials: openApiConfig?.credentials ?? "same-origin",
    };
    client.setConfig(config);
  });
};

/**
 * The function to be called when the extension is unloaded.
 * @param {UmbEntryPointOnInit} _host The host element for the extension.
 * @param {UmbExtensionRegistry} _extensionRegistry The extension registry.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onUnload: UmbEntryPointOnUnload = (_host, _extensionRegistry) => {};
