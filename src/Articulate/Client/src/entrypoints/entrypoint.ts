import type { UmbEntryPointOnInit } from "@umbraco-cms/backoffice/extension-api";
import { manifest } from "../dashboards/manifests";

export const onInit: UmbEntryPointOnInit = (_host, extensionRegistry) => {
  extensionRegistry.register(manifest);
};
