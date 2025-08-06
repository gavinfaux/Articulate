import { c as r, f as p } from "./client.gen-D3fYl9Hx.js";
class g {
  /**
   * Exports blog data as a BlogML XML file.
   */
  static postArticulateBlogmlExport(e) {
    return (e?.client ?? r).post({
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
        ...e?.headers
      }
    });
  }
  /**
   * Downloads the exported Disqus comment XML file.
   */
  static getArticulateBlogmlExportDisqus(e) {
    return (e?.client ?? r).get({
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
    return (e?.client ?? r).post({
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
        ...e?.headers
      }
    });
  }
  /**
   * Begins the BlogML import process by accepting an uploaded XML file.
   * The name specified in the form's element or FormData must match the name of the parameter, e.g., <input type="file" name="importFile">
   */
  static postArticulateBlogmlImportFile(e) {
    return (e?.client ?? r).post({
      ...p,
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
        ...e?.headers
      }
    });
  }
}
class d {
  static postArticulateThemeCopy(e) {
    return (e?.client ?? r).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/theme/copy",
      ...e,
      headers: {
        "Content-Type": "application/json",
        ...e?.headers
      }
    });
  }
  static getArticulateThemeDefault(e) {
    return (e?.client ?? r).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/theme/default",
      ...e
    });
  }
}
class y {
  /**
   * Gets the list of all available Articulate themes, both default and user-defined.
   * This endpoint returns the names of all available themes, including both default and user-defined themes.
   */
  static getArticulateEditorsThemePickerThemes(e) {
    return (e?.client ?? r).get({
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
function o(t) {
  return (t.startsWith("$.") ? t.substring(2) : t).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (a) => a.toUpperCase());
}
function b(t, e) {
  if (console.warn("[formatApiError] Received error:", t), t !== null && typeof t == "object" && "title" in t && typeof t.title == "string") {
    const a = t;
    if (a.errors) {
      const i = Object.entries(a.errors).flatMap(([s, n]) => {
        const m = o(s);
        return n.filter((c) => !!c).map((c) => {
          const u = c.split(" Path: $.")[0] || c;
          return `${m}: ${u}`;
        });
      });
      if (i.length > 0)
        return {
          title: a.title || "One or more validation errors occurred",
          details: i
        };
    }
    const l = [];
    return a.detail && l.push(a.detail), a.errors && l.push(...Object.values(a.errors).flatMap((i) => i)), {
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
  g as B,
  d as T,
  y as a,
  b as f
};
//# sourceMappingURL=error-utils-SMIT1h0e.js.map
