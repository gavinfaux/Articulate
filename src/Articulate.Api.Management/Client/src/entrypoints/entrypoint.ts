import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import type { UmbEntryPointOnInit, UmbEntryPointOnUnload } from '@umbraco-cms/backoffice/extension-api';
import { client } from '../api/client.gen.js';

const asBearerOrUndefined = (token?: string | null) => {
  if (!token) return undefined;

  const trimmed = token.trim();
  const lower = trimmed.toLowerCase();

  // Ignore obviously placeholder tokens
  if (!trimmed || lower.includes('redacted') || lower === 'placeholder') return undefined;

  // The @hey-api/client-fetch client applies the Bearer scheme itself. Always return a bare token
  // (strip any existing scheme) to avoid double "Bearer " prefixes in Authorization headers.
  const bareToken = lower.startsWith('bearer ') ? trimmed.substring(7).trim() : trimmed;
  return bareToken || undefined;
};

/**
 * The entry point for the Articulate package extensions.
 * This function is called when the extension is initialized.
 * It configures the API client.
 * @param {UmbEntryPointOnInit} host The host element for the extension.
 * @param {UmbExtensionRegistry} _extensionRegistry The extension registry.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onInit: UmbEntryPointOnInit = (host, _extensionRegistry) => {
  host.consumeContext(UMB_AUTH_CONTEXT, (authContext) => {
    const openApiConfig = authContext?.getOpenApiConfiguration();
    if (openApiConfig) {
      client.setConfig({
        auth: async () => asBearerOrUndefined(openApiConfig?.token ? await openApiConfig.token() : undefined),
        baseUrl: openApiConfig?.base ?? '',
        credentials: openApiConfig?.credentials ?? 'include',
      });
    }
  });
};

/**
 * The function to be called when the extension is unloaded.
 * @param {UmbEntryPointOnInit} _host The host element for the extension.
 * @param {UmbExtensionRegistry} _extensionRegistry The extension registry.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onUnload: UmbEntryPointOnUnload = (_host, _extensionRegistry) => {};
