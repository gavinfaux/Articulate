export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Articulate Web Entrypoint",
    alias: "Articulate.Web.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
