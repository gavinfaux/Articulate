export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Articulate Entrypoint",
    alias: "Articulate.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
