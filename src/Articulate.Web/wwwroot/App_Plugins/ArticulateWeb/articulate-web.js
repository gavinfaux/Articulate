const a = [
  {
    name: "Articulate Web Entrypoint",
    alias: "Articulate.Web.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-CQs6WTUY.js")
  }
], t = [
  {
    name: "Articulate Web Dashboard",
    alias: "Articulate.Web.Dashboard",
    type: "dashboard",
    js: () => import("./dashboard.element-CI9QFPbd.js"),
    meta: {
      label: "Example Dashboard",
      pathname: "example-dashboard"
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "Umb.Section.Content"
      }
    ]
  }
], e = [
  ...a,
  ...t
];
export {
  e as manifests
};
//# sourceMappingURL=articulate-web.js.map
