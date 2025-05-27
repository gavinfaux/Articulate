import { ArticulateDashboardRootElement } from "./articulate-dashboard-root.element";

const dashboardManifest: UmbExtensionManifest = {
  type: "dashboard",
  alias: "Articulate.Dashboard",
  name: "Articulate Dashboard",
  element: ArticulateDashboardRootElement,
  weight: 100,
  meta: {
    label: "Articulate",
    pathname: "articulate",
  },
  conditions: [
    {
      alias: "Umb.Condition.SectionAlias",
      match: "Umb.Section.Settings",
    },
  ],
};

export const manifest = dashboardManifest;
