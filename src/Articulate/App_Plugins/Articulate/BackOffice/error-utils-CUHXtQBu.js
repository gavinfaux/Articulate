import { c as r, f as n } from "./client.gen-BDEIDh_1.js";
class y {
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
  static postArticulateThemeCopy(e) {
    return ((e == null ? void 0 : e.client) ?? r).post({
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
        ...e == null ? void 0 : e.headers
      }
    });
  }
  static getArticulateThemeDefault(e) {
    return ((e == null ? void 0 : e.client) ?? r).get({
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
class f {
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
  b as T,
  f as a,
  p as f
};
