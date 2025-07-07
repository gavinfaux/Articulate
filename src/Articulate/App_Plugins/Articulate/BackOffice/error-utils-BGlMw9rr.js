import { c as r, f as n } from "./client.gen-7oad9SSy.js";
class y {
  /**
   * Exports blog data as a BlogML XML file.
   */
  static postArticulateBlogmlExport(e) {
    return ((e == null ? void 0 : e.client) ?? r).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blogml/export",
      ...e,
      headers: {
        "Content-Type": "application/json",
        ...e == null ? void 0 : e.headers
      }
    });
  }
  /**
   * Downloads the exported Disqus comment XML file.
   */
  static getArticulateBlogmlExportDisqus(e) {
    return ((e == null ? void 0 : e.client) ?? r).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blogml/export/disqus",
      ...e
    });
  }
  /**
   * Imports blog data from a previously uploaded BlogML XML file.
   */
  static postArticulateBlogmlImport(e) {
    return ((e == null ? void 0 : e.client) ?? r).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blogml/import",
      ...e,
      headers: {
        "Content-Type": "application/json",
        ...e == null ? void 0 : e.headers
      }
    });
  }
  /**
   * Begins the BlogML import process by accepting an uploaded XML file.
   * The name specified in the form's element or FormData must match the name of the parameter, e.g., <input type="file" name="importFile">
   */
  static postArticulateBlogmlImportFile(e) {
    return ((e == null ? void 0 : e.client) ?? r).post({
      ...n,
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blogml/import-file",
      ...e,
      headers: {
        "Content-Type": null,
        ...e == null ? void 0 : e.headers
      }
    });
  }
}
class b {
  /**
   * Gets the list of all available Articulate themes, both default and user-defined.
   * This endpoint returns the names of all available themes, including both default and user-defined themes.
   */
  static getArticulateEditorsThemePickerThemes(e) {
    return ((e == null ? void 0 : e.client) ?? r).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/editors/theme-picker/themes",
      ...e
    });
  }
}
class f {
  static postArticulateThemesCopy(e) {
    return ((e == null ? void 0 : e.client) ?? r).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/themes/copy",
      ...e,
      headers: {
        "Content-Type": "application/json",
        ...e == null ? void 0 : e.headers
      }
    });
  }
  static getArticulateThemesDefault(e) {
    return ((e == null ? void 0 : e.client) ?? r).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/themes/default",
      ...e
    });
  }
}
function g(t) {
  return (t.startsWith("$.") ? t.substring(2) : t).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (a) => a.toUpperCase());
}
function p(t, e) {
  if (console.warn("[formatApiError] Received error:", t), t !== null && typeof t == "object" && "title" in t && typeof t.title == "string") {
    const a = t;
    if (a.errors) {
      const c = Object.entries(a.errors).flatMap(([u, i]) => {
        const s = g(u);
        return i.filter((m) => !!m).map((m) => {
          const h = m.split(" Path: $.")[0] || m;
          return `${s}: ${h}`;
        });
      });
      if (c.length > 0)
        return {
          title: a.title || "One or more validation errors occurred",
          details: c
        };
    }
    const l = [];
    return a.detail && l.push(a.detail), a.errors && l.push(...Object.values(a.errors).flatMap((c) => c)), {
      title: a.title ?? e,
      details: l
    };
  }
  if (t instanceof Error) {
    const a = t.name !== "Error" ? t.name : e, l = t.message ? [t.message] : [];
    return console.warn(`[${a}] Stack Trace:`, t.stack), { title: a, details: l };
  }
  return typeof t == "string" ? { title: e, details: [t] } : { title: e, details: [] };
}
export {
  y as B,
  f as T,
  b as a,
  p as f
};
