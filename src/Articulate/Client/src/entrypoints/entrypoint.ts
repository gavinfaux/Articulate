import type {
  UmbEntryPointOnInit,
  UmbEntryPointOnUnload,
} from "@umbraco-cms/backoffice/extension-api";
import { manifests as dashboardManifests } from '../dashboards/manifest';

// load up the manifests here
export const onInit: UmbEntryPointOnInit = (_host, extensionRegistry) => {
  console.log("Articulate extension is initializing...");
  
  // Register all manifests
  extensionRegistry.registerMany([
    ...dashboardManifests
  ]);
};

export const onUnload: UmbEntryPointOnUnload = (_host, _extensionRegistry) => {
  console.log("Articulate extension is unloading...");
};
