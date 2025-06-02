import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import type { UmbEntryPointOnInit } from "@umbraco-cms/backoffice/extension-api";
import { client } from "../api/core/client.gen";
import { manifest } from "../dashboards/manifests";

export const onInit: UmbEntryPointOnInit = (host, extensionRegistry) => {
  extensionRegistry.register(manifest);
  host.consumeContext(UMB_AUTH_CONTEXT, (authContext) => {
    const config = authContext?.getOpenApiConfiguration();

    client.setConfig({
      auth: config?.token ?? undefined,
      baseUrl: config?.base ?? "",
      credentials: config?.credentials ?? "same-origin",
    });
  });
};
