var I = Object.defineProperty;
var O = (t, e, r) => e in t ? I(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var x = (t, e, r) => O(t, typeof e != "symbol" ? e + "" : e, r);
import { UMB_NOTIFICATION_CONTEXT as E } from "@umbraco-cms/backoffice/notification";
var R = async (t, e) => {
  let r = typeof e == "function" ? await e(t) : e;
  if (r) return t.scheme === "bearer" ? `Bearer ${r}` : t.scheme === "basic" ? `Basic ${btoa(r)}` : r;
}, _ = { bodySerializer: (t) => JSON.stringify(t, (e, r) => typeof r == "bigint" ? r.toString() : r) }, M = (t) => {
  switch (t) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, V = (t) => {
  switch (t) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
}, z = (t) => {
  switch (t) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, $ = ({ allowReserved: t, explode: e, name: r, style: s, value: i }) => {
  if (!e) {
    let a = (t ? i : i.map((c) => encodeURIComponent(c))).join(V(s));
    switch (s) {
      case "label":
        return `.${a}`;
      case "matrix":
        return `;${r}=${a}`;
      case "simple":
        return a;
      default:
        return `${r}=${a}`;
    }
  }
  let n = M(s), l = i.map((a) => s === "label" || s === "simple" ? t ? a : encodeURIComponent(a) : w({ allowReserved: t, name: r, value: a })).join(n);
  return s === "label" || s === "matrix" ? n + l : l;
}, w = ({ allowReserved: t, name: e, value: r }) => {
  if (r == null) return "";
  if (typeof r == "object") throw new Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");
  return `${e}=${t ? r : encodeURIComponent(r)}`;
}, U = ({ allowReserved: t, explode: e, name: r, style: s, value: i }) => {
  if (i instanceof Date) return `${r}=${i.toISOString()}`;
  if (s !== "deepObject" && !e) {
    let a = [];
    Object.entries(i).forEach(([d, m]) => {
      a = [...a, d, t ? m : encodeURIComponent(m)];
    });
    let c = a.join(",");
    switch (s) {
      case "form":
        return `${r}=${c}`;
      case "label":
        return `.${c}`;
      case "matrix":
        return `;${r}=${c}`;
      default:
        return c;
    }
  }
  let n = z(s), l = Object.entries(i).map(([a, c]) => w({ allowReserved: t, name: s === "deepObject" ? `${r}[${a}]` : a, value: c })).join(n);
  return s === "label" || s === "matrix" ? n + l : l;
}, B = /\{[^{}]+\}/g, N = ({ path: t, url: e }) => {
  let r = e, s = e.match(B);
  if (s) for (let i of s) {
    let n = !1, l = i.substring(1, i.length - 1), a = "simple";
    l.endsWith("*") && (n = !0, l = l.substring(0, l.length - 1)), l.startsWith(".") ? (l = l.substring(1), a = "label") : l.startsWith(";") && (l = l.substring(1), a = "matrix");
    let c = t[l];
    if (c == null) continue;
    if (Array.isArray(c)) {
      r = r.replace(i, $({ explode: n, name: l, style: a, value: c }));
      continue;
    }
    if (typeof c == "object") {
      r = r.replace(i, U({ explode: n, name: l, style: a, value: c }));
      continue;
    }
    if (a === "matrix") {
      r = r.replace(i, `;${w({ name: l, value: c })}`);
      continue;
    }
    let d = encodeURIComponent(a === "label" ? `.${c}` : c);
    r = r.replace(i, d);
  }
  return r;
}, C = ({ allowReserved: t, array: e, object: r } = {}) => (s) => {
  let i = [];
  if (s && typeof s == "object") for (let n in s) {
    let l = s[n];
    if (l != null) if (Array.isArray(l)) {
      let a = $({ allowReserved: t, explode: !0, name: n, style: "form", value: l, ...e });
      a && i.push(a);
    } else if (typeof l == "object") {
      let a = U({ allowReserved: t, explode: !0, name: n, style: "deepObject", value: l, ...r });
      a && i.push(a);
    } else {
      let a = w({ allowReserved: t, name: n, value: l });
      a && i.push(a);
    }
  }
  return i.join("&");
}, W = (t) => {
  var r;
  if (!t) return "stream";
  let e = (r = t.split(";")[0]) == null ? void 0 : r.trim();
  if (e) {
    if (e.startsWith("application/json") || e.endsWith("+json")) return "json";
    if (e === "multipart/form-data") return "formData";
    if (["application/", "audio/", "image/", "video/"].some((s) => e.startsWith(s))) return "blob";
    if (e.startsWith("text/")) return "text";
  }
}, k = async ({ security: t, ...e }) => {
  for (let r of t) {
    let s = await R(r, e.auth);
    if (!s) continue;
    let i = r.name ?? "Authorization";
    switch (r.in) {
      case "query":
        e.query || (e.query = {}), e.query[i] = s;
        break;
      case "cookie":
        e.headers.append("Cookie", `${i}=${s}`);
        break;
      case "header":
      default:
        e.headers.set(i, s);
        break;
    }
    return;
  }
}, A = (t) => D({ baseUrl: t.baseUrl, path: t.path, query: t.query, querySerializer: typeof t.querySerializer == "function" ? t.querySerializer : C(t.querySerializer), url: t.url }), D = ({ baseUrl: t, path: e, query: r, querySerializer: s, url: i }) => {
  let n = i.startsWith("/") ? i : `/${i}`, l = (t ?? "") + n;
  e && (l = N({ path: e, url: l }));
  let a = r ? s(r) : "";
  return a.startsWith("?") && (a = a.substring(1)), a && (l += `?${a}`), l;
}, j = (t, e) => {
  var s;
  let r = { ...t, ...e };
  return (s = r.baseUrl) != null && s.endsWith("/") && (r.baseUrl = r.baseUrl.substring(0, r.baseUrl.length - 1)), r.headers = T(t.headers, e.headers), r;
}, T = (...t) => {
  let e = new Headers();
  for (let r of t) {
    if (!r || typeof r != "object") continue;
    let s = r instanceof Headers ? r.entries() : Object.entries(r);
    for (let [i, n] of s) if (n === null) e.delete(i);
    else if (Array.isArray(n)) for (let l of n) e.append(i, l);
    else n !== void 0 && e.set(i, typeof n == "object" ? JSON.stringify(n) : n);
  }
  return e;
}, v = class {
  constructor() {
    x(this, "_fns");
    this._fns = [];
  }
  clear() {
    this._fns = [];
  }
  getInterceptorIndex(t) {
    return typeof t == "number" ? this._fns[t] ? t : -1 : this._fns.indexOf(t);
  }
  exists(t) {
    let e = this.getInterceptorIndex(t);
    return !!this._fns[e];
  }
  eject(t) {
    let e = this.getInterceptorIndex(t);
    this._fns[e] && (this._fns[e] = null);
  }
  update(t, e) {
    let r = this.getInterceptorIndex(t);
    return this._fns[r] ? (this._fns[r] = e, t) : !1;
  }
  use(t) {
    return this._fns = [...this._fns, t], this._fns.length - 1;
  }
}, L = () => ({ error: new v(), request: new v(), response: new v() }), P = C({ allowReserved: !1, array: { explode: !0, style: "form" }, object: { explode: !0, style: "deepObject" } }), H = { "Content-Type": "application/json" }, S = (t = {}) => ({ ..._, headers: H, parseAs: "auto", querySerializer: P, ...t }), J = (t = {}) => {
  let e = j(S(), t), r = () => ({ ...e }), s = (l) => (e = j(e, l), r()), i = L(), n = async (l) => {
    let a = { ...e, ...l, fetch: l.fetch ?? e.fetch ?? globalThis.fetch, headers: T(e.headers, l.headers) };
    a.security && await k({ ...a, security: a.security }), a.body && a.bodySerializer && (a.body = a.bodySerializer(a.body)), (a.body === void 0 || a.body === "") && a.headers.delete("Content-Type");
    let c = A(a), d = { redirect: "follow", ...a }, m = new Request(c, d);
    for (let o of i.request._fns) o && (m = await o(m, a));
    let q = a.fetch, u = await q(m);
    for (let o of i.response._fns) o && (u = await o(u, m, a));
    let b = { request: m, response: u };
    if (u.ok) {
      if (u.status === 204 || u.headers.get("Content-Length") === "0") return a.responseStyle === "data" ? {} : { data: {}, ...b };
      let o = (a.parseAs === "auto" ? W(u.headers.get("Content-Type")) : a.parseAs) ?? "json";
      if (o === "stream") return a.responseStyle === "data" ? u.body : { data: u.body, ...b };
      let p = await u[o]();
      return o === "json" && (a.responseValidator && await a.responseValidator(p), a.responseTransformer && (p = await a.responseTransformer(p))), a.responseStyle === "data" ? p : { data: p, ...b };
    }
    let y = await u.text();
    try {
      y = JSON.parse(y);
    } catch {
    }
    let h = y;
    for (let o of i.error._fns) o && (h = await o(y, u, m, a));
    if (h = h || {}, a.throwOnError) throw h;
    return a.responseStyle === "data" ? void 0 : { error: h, ...b };
  };
  return { buildUrl: A, connect: (l) => n({ ...l, method: "CONNECT" }), delete: (l) => n({ ...l, method: "DELETE" }), get: (l) => n({ ...l, method: "GET" }), getConfig: r, head: (l) => n({ ...l, method: "HEAD" }), interceptors: i, options: (l) => n({ ...l, method: "OPTIONS" }), patch: (l) => n({ ...l, method: "PATCH" }), post: (l) => n({ ...l, method: "POST" }), put: (l) => n({ ...l, method: "PUT" }), request: n, setConfig: s, trace: (l) => n({ ...l, method: "TRACE" }) };
};
const f = J(S({
  baseUrl: "https://localhost:44366"
}));
class Q {
  /**
   * Gets the UDI (Unique Document Identifier) for the Articulate Archive content type.
   * This endpoint is used to retrieve the UDI for the back office import and export features.
   */
  static getUmbracoManagementApiV1ArticulateBlogArchiveUdi(e) {
    return ((e == null ? void 0 : e.client) ?? f).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/archive/udi",
      ...e
    });
  }
  /**
   * Downloads the exported BlogML XML file.
   * The articulate/blog/export endpoint must be called first to generate the file before downloading.
   */
  static getUmbracoManagementApiV1ArticulateBlogDownload(e) {
    return ((e == null ? void 0 : e.client) ?? f).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/download",
      ...e
    });
  }
  /**
   * Exports blog data as a BlogML XML file.
   * This endpoint must be called to generate the export before downloading it using the articulate/blog/download endpoint.
   */
  static postUmbracoManagementApiV1ArticulateBlogExport(e) {
    return ((e == null ? void 0 : e.client) ?? f).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/export",
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
  static getUmbracoManagementApiV1ArticulateBlogExportDisqus(e) {
    return ((e == null ? void 0 : e.client) ?? f).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/export/disqus",
      ...e
    });
  }
  /**
   * Imports blog data from a previously uploaded BlogML XML file.
   * This endpoint should be called after initializing the import with the articulate/blog/import/begin endpoint.
   */
  static postUmbracoManagementApiV1ArticulateBlogImport(e) {
    return ((e == null ? void 0 : e.client) ?? f).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/import",
      ...e,
      headers: {
        "Content-Type": "application/json",
        ...e == null ? void 0 : e.headers
      }
    });
  }
  /**
   * Begins the BlogML import process by accepting an uploaded XML file, storing it temporarily, and returning a temporary file name along with the detected post count.
   * This endpoint must be called before performing a blog export using the articulate/blog/import endpoint.
   * The request must be a form upload, and the first file must be an XML file.
   */
  static postUmbracoManagementApiV1ArticulateBlogImportBegin(e) {
    return ((e == null ? void 0 : e.client) ?? f).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/import/begin",
      ...e
    });
  }
  /**
   * Gets the list of available Articulate themes, consumed by Articulate Theme Picker property editor.
   * This endpoint returns the names of all available themes, including both default and user-defined themes.
   */
  static getUmbracoManagementApiV1ArticulateEditorsThemes(e) {
    return ((e == null ? void 0 : e.client) ?? f).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/editors/themes",
      ...e
    });
  }
  /**
   * Copies an existing theme to a new theme with a specified name.
   * This endpoint creates a copy of an existing theme under a new name. The new theme name must be unique.
   */
  static postUmbracoManagementApiV1ArticulateThemesCopy(e) {
    return ((e == null ? void 0 : e.client) ?? f).post({
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
  /**
   * Retrieves the list of available default Articulate themes.
   * This endpoint returns the names of default themes available for Articulate.
   */
  static getUmbracoManagementApiV1ArticulateThemesList(e) {
    return ((e == null ? void 0 : e.client) ?? f).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/themes/list",
      ...e
    });
  }
}
const g = "Review back office logs for more details.";
function X(t, e) {
  let r = e;
  if (t && typeof t == "object" && "title" in t && "status" in t) {
    const s = t;
    return s.title ? (r = s.title, s.detail && (r += `: ${s.detail}`)) : s.detail && (r = s.detail), `${r}. ${g}`;
  }
  return t instanceof Error ? (r = t.message, `${r}. ${g}`) : typeof t == "string" ? (r = t, `${r}. ${g}`) : `${r}. ${g}`;
}
function K(t) {
  return t instanceof Error || typeof t == "object" && t !== null && "message" in t;
}
async function Y(t, e, r) {
  (await t.getContext(E)).peek(r, {
    data: { message: e }
  });
}
export {
  Q as A,
  f as c,
  X as e,
  K as i,
  Y as s
};
//# sourceMappingURL=notification-utils-AoMs4ers.js.map
