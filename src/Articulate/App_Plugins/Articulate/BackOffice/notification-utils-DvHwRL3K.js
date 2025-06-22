var q = Object.defineProperty;
var I = (t, e, r) => e in t ? q(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var j = (t, e, r) => I(t, typeof e != "symbol" ? e + "" : e, r);
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
}, z = (t) => {
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
}, N = (t) => {
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
}, C = ({ allowReserved: t, explode: e, name: r, style: n, value: s }) => {
  if (!e) {
    let a = (t ? s : s.map((u) => encodeURIComponent(u))).join(z(n));
    switch (n) {
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
  let i = M(n), l = s.map((a) => n === "label" || n === "simple" ? t ? a : encodeURIComponent(a) : v({ allowReserved: t, name: r, value: a })).join(i);
  return n === "label" || n === "matrix" ? i + l : l;
}, v = ({ allowReserved: t, name: e, value: r }) => {
  if (r == null) return "";
  if (typeof r == "object") throw new Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");
  return `${e}=${t ? r : encodeURIComponent(r)}`;
}, S = ({ allowReserved: t, explode: e, name: r, style: n, value: s, valueOnly: i }) => {
  if (s instanceof Date) return i ? s.toISOString() : `${r}=${s.toISOString()}`;
  if (n !== "deepObject" && !e) {
    let u = [];
    Object.entries(s).forEach(([m, y]) => {
      u = [...u, m, t ? y : encodeURIComponent(y)];
    });
    let f = u.join(",");
    switch (n) {
      case "form":
        return `${r}=${f}`;
      case "label":
        return `.${f}`;
      case "matrix":
        return `;${r}=${f}`;
      default:
        return f;
    }
  }
  let l = N(n), a = Object.entries(s).map(([u, f]) => v({ allowReserved: t, name: n === "deepObject" ? `${r}[${u}]` : u, value: f })).join(l);
  return n === "label" || n === "matrix" ? l + a : a;
}, V = /\{[^{}]+\}/g, W = ({ path: t, url: e }) => {
  let r = e, n = e.match(V);
  if (n) for (let s of n) {
    let i = !1, l = s.substring(1, s.length - 1), a = "simple";
    l.endsWith("*") && (i = !0, l = l.substring(0, l.length - 1)), l.startsWith(".") ? (l = l.substring(1), a = "label") : l.startsWith(";") && (l = l.substring(1), a = "matrix");
    let u = t[l];
    if (u == null) continue;
    if (Array.isArray(u)) {
      r = r.replace(s, C({ explode: i, name: l, style: a, value: u }));
      continue;
    }
    if (typeof u == "object") {
      r = r.replace(s, S({ explode: i, name: l, style: a, value: u, valueOnly: !0 }));
      continue;
    }
    if (a === "matrix") {
      r = r.replace(s, `;${v({ name: l, value: u })}`);
      continue;
    }
    let f = encodeURIComponent(a === "label" ? `.${u}` : u);
    r = r.replace(s, f);
  }
  return r;
}, U = ({ allowReserved: t, array: e, object: r } = {}) => (n) => {
  let s = [];
  if (n && typeof n == "object") for (let i in n) {
    let l = n[i];
    if (l != null) if (Array.isArray(l)) {
      let a = C({ allowReserved: t, explode: !0, name: i, style: "form", value: l, ...e });
      a && s.push(a);
    } else if (typeof l == "object") {
      let a = S({ allowReserved: t, explode: !0, name: i, style: "deepObject", value: l, ...r });
      a && s.push(a);
    } else {
      let a = v({ allowReserved: t, name: i, value: l });
      a && s.push(a);
    }
  }
  return s.join("&");
}, B = (t) => {
  var r;
  if (!t) return "stream";
  let e = (r = t.split(";")[0]) == null ? void 0 : r.trim();
  if (e) {
    if (e.startsWith("application/json") || e.endsWith("+json")) return "json";
    if (e === "multipart/form-data") return "formData";
    if (["application/", "audio/", "image/", "video/"].some((n) => e.startsWith(n))) return "blob";
    if (e.startsWith("text/")) return "text";
  }
}, k = async ({ security: t, ...e }) => {
  for (let r of t) {
    let n = await R(r, e.auth);
    if (!n) continue;
    let s = r.name ?? "Authorization";
    switch (r.in) {
      case "query":
        e.query || (e.query = {}), e.query[s] = n;
        break;
      case "cookie":
        e.headers.append("Cookie", `${s}=${n}`);
        break;
      case "header":
      default:
        e.headers.set(s, n);
        break;
    }
    return;
  }
}, A = (t) => D({ baseUrl: t.baseUrl, path: t.path, query: t.query, querySerializer: typeof t.querySerializer == "function" ? t.querySerializer : U(t.querySerializer), url: t.url }), D = ({ baseUrl: t, path: e, query: r, querySerializer: n, url: s }) => {
  let i = s.startsWith("/") ? s : `/${s}`, l = (t ?? "") + i;
  e && (l = W({ path: e, url: l }));
  let a = r ? n(r) : "";
  return a.startsWith("?") && (a = a.substring(1)), a && (l += `?${a}`), l;
}, $ = (t, e) => {
  var n;
  let r = { ...t, ...e };
  return (n = r.baseUrl) != null && n.endsWith("/") && (r.baseUrl = r.baseUrl.substring(0, r.baseUrl.length - 1)), r.headers = O(t.headers, e.headers), r;
}, O = (...t) => {
  let e = new Headers();
  for (let r of t) {
    if (!r || typeof r != "object") continue;
    let n = r instanceof Headers ? r.entries() : Object.entries(r);
    for (let [s, i] of n) if (i === null) e.delete(s);
    else if (Array.isArray(i)) for (let l of i) e.append(s, l);
    else i !== void 0 && e.set(s, typeof i == "object" ? JSON.stringify(i) : i);
  }
  return e;
}, x = class {
  constructor() {
    j(this, "_fns");
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
}, L = () => ({ error: new x(), request: new x(), response: new x() }), P = U({ allowReserved: !1, array: { explode: !0, style: "form" }, object: { explode: !0, style: "deepObject" } }), H = { "Content-Type": "application/json" }, T = (t = {}) => ({ ..._, headers: H, parseAs: "auto", querySerializer: P, ...t }), J = (t = {}) => {
  let e = $(T(), t), r = () => ({ ...e }), n = (l) => (e = $(e, l), r()), s = L(), i = async (l) => {
    let a = { ...e, ...l, fetch: l.fetch ?? e.fetch ?? globalThis.fetch, headers: O(e.headers, l.headers) };
    a.security && await k({ ...a, security: a.security }), a.body && a.bodySerializer && (a.body = a.bodySerializer(a.body)), (a.body === void 0 || a.body === "") && a.headers.delete("Content-Type");
    let u = A(a), f = { redirect: "follow", ...a }, m = new Request(u, f);
    for (let o of s.request._fns) o && (m = await o(m, a));
    let y = a.fetch, c = await y(m);
    for (let o of s.response._fns) o && (c = await o(c, m, a));
    let b = { request: m, response: c };
    if (c.ok) {
      if (c.status === 204 || c.headers.get("Content-Length") === "0") return a.responseStyle === "data" ? {} : { data: {}, ...b };
      let o = (a.parseAs === "auto" ? B(c.headers.get("Content-Type")) : a.parseAs) ?? "json";
      if (o === "stream") return a.responseStyle === "data" ? c.body : { data: c.body, ...b };
      let p = await c[o]();
      return o === "json" && (a.responseValidator && await a.responseValidator(p), a.responseTransformer && (p = await a.responseTransformer(p))), a.responseStyle === "data" ? p : { data: p, ...b };
    }
    let g = await c.text();
    try {
      g = JSON.parse(g);
    } catch {
    }
    let h = g;
    for (let o of s.error._fns) o && (h = await o(g, c, m, a));
    if (h = h || {}, a.throwOnError) throw h;
    return a.responseStyle === "data" ? void 0 : { error: h, ...b };
  };
  return { buildUrl: A, connect: (l) => i({ ...l, method: "CONNECT" }), delete: (l) => i({ ...l, method: "DELETE" }), get: (l) => i({ ...l, method: "GET" }), getConfig: r, head: (l) => i({ ...l, method: "HEAD" }), interceptors: s, options: (l) => i({ ...l, method: "OPTIONS" }), patch: (l) => i({ ...l, method: "PATCH" }), post: (l) => i({ ...l, method: "POST" }), put: (l) => i({ ...l, method: "PUT" }), request: i, setConfig: n, trace: (l) => i({ ...l, method: "TRACE" }) };
};
const d = J(T({
  baseUrl: "https://localhost:44366"
}));
class Q {
  /**
   * Gets the Guid for the Articulate content type.
   * This endpoint is used to retrieve the Guid for the back office import and export features.
   */
  static getUmbracoManagementApiV1ArticulateBlogArticulateGuid(e) {
    return ((e == null ? void 0 : e.client) ?? d).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/articulate/guid",
      ...e
    });
  }
  /**
   * Exports blog data as a BlogML XML file.
   */
  static postUmbracoManagementApiV1ArticulateBlogExport(e) {
    return ((e == null ? void 0 : e.client) ?? d).post({
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
    return ((e == null ? void 0 : e.client) ?? d).get({
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
    return ((e == null ? void 0 : e.client) ?? d).post({
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
    return ((e == null ? void 0 : e.client) ?? d).post({
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
    return ((e == null ? void 0 : e.client) ?? d).get({
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
    return ((e == null ? void 0 : e.client) ?? d).post({
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
    return ((e == null ? void 0 : e.client) ?? d).get({
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
const w = "Review back office logs for more details.";
function X(t, e) {
  let r = e;
  if (t && typeof t == "object" && "title" in t && "status" in t) {
    const n = t;
    return n.title ? (r = n.title, n.detail && (r += `: ${n.detail}`)) : n.detail && (r = n.detail), `${r}. ${w}`;
  }
  return t instanceof Error ? (r = t.message, `${r}. ${w}`) : typeof t == "string" ? (r = t, `${r}. ${w}`) : `${r}. ${w}`;
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
  d as c,
  X as e,
  K as i,
  Y as s
};
//# sourceMappingURL=notification-utils-DvHwRL3K.js.map
