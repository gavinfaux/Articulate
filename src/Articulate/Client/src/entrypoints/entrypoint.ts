import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import type {
  UmbEntryPointOnInit,
  UmbEntryPointOnUnload,
} from "@umbraco-cms/backoffice/extension-api";
import { client } from "../api/client.gen";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onInit: UmbEntryPointOnInit = (host, _extensionRegistry) => {
  host.consumeContext(UMB_AUTH_CONTEXT, (authContext) => {
    const config = authContext?.getOpenApiConfiguration();

    client.setConfig({
      auth: config?.token ?? undefined,
      baseUrl: config?.base ?? "",
      credentials: config?.credentials ?? "same-origin",
    });
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onUnload: UmbEntryPointOnUnload = (_host, _extensionRegistry) => {};
