var O = Object.defineProperty;
var T = (r, e, t) => e in r ? O(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var A = (r, e, t) => T(r, typeof e != "symbol" ? e + "" : e, t);
var I = async (r, e) => {
  let t = typeof e == "function" ? await e(r) : e;
  if (t) return r.scheme === "bearer" ? `Bearer ${t}` : r.scheme === "basic" ? `Basic ${btoa(t)}` : t;
}, R = { bodySerializer: (r) => JSON.stringify(r, (e, t) => typeof t == "bigint" ? t.toString() : t) }, _ = (r) => {
  switch (r) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, E = (r) => {
  switch (r) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
}, z = (r) => {
  switch (r) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, $ = ({ allowReserved: r, explode: e, name: t, style: n, value: s }) => {
  if (!e) {
    let a = (r ? s : s.map((u) => encodeURIComponent(u))).join(E(n));
    switch (n) {
      case "label":
        return `.${a}`;
      case "matrix":
        return `;${t}=${a}`;
      case "simple":
        return a;
      default:
        return `${t}=${a}`;
    }
  }
  let i = _(n), l = s.map((a) => n === "label" || n === "simple" ? r ? a : encodeURIComponent(a) : v({ allowReserved: r, name: t, value: a })).join(i);
  return n === "label" || n === "matrix" ? i + l : l;
}, v = ({ allowReserved: r, name: e, value: t }) => {
  if (t == null) return "";
  if (typeof t == "object") throw new Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");
  return `${e}=${r ? t : encodeURIComponent(t)}`;
}, S = ({ allowReserved: r, explode: e, name: t, style: n, value: s, valueOnly: i }) => {
  if (s instanceof Date) return i ? s.toISOString() : `${t}=${s.toISOString()}`;
  if (n !== "deepObject" && !e) {
    let u = [];
    Object.entries(s).forEach(([d, y]) => {
      u = [...u, d, r ? y : encodeURIComponent(y)];
    });
    let m = u.join(",");
    switch (n) {
      case "form":
        return `${t}=${m}`;
      case "label":
        return `.${m}`;
      case "matrix":
        return `;${t}=${m}`;
      default:
        return m;
    }
  }
  let l = z(n), a = Object.entries(s).map(([u, m]) => v({ allowReserved: r, name: n === "deepObject" ? `${t}[${u}]` : u, value: m })).join(l);
  return n === "label" || n === "matrix" ? l + a : a;
}, V = /\{[^{}]+\}/g, D = ({ path: r, url: e }) => {
  let t = e, n = e.match(V);
  if (n) for (let s of n) {
    let i = !1, l = s.substring(1, s.length - 1), a = "simple";
    l.endsWith("*") && (i = !0, l = l.substring(0, l.length - 1)), l.startsWith(".") ? (l = l.substring(1), a = "label") : l.startsWith(";") && (l = l.substring(1), a = "matrix");
    let u = r[l];
    if (u == null) continue;
    if (Array.isArray(u)) {
      t = t.replace(s, $({ explode: i, name: l, style: a, value: u }));
      continue;
    }
    if (typeof u == "object") {
      t = t.replace(s, S({ explode: i, name: l, style: a, value: u, valueOnly: !0 }));
      continue;
    }
    if (a === "matrix") {
      t = t.replace(s, `;${v({ name: l, value: u })}`);
      continue;
    }
    let m = encodeURIComponent(a === "label" ? `.${u}` : u);
    t = t.replace(s, m);
  }
  return t;
}, U = ({ allowReserved: r, array: e, object: t } = {}) => (n) => {
  let s = [];
  if (n && typeof n == "object") for (let i in n) {
    let l = n[i];
    if (l != null) if (Array.isArray(l)) {
      let a = $({ allowReserved: r, explode: !0, name: i, style: "form", value: l, ...e });
      a && s.push(a);
    } else if (typeof l == "object") {
      let a = S({ allowReserved: r, explode: !0, name: i, style: "deepObject", value: l, ...t });
      a && s.push(a);
    } else {
      let a = v({ allowReserved: r, name: i, value: l });
      a && s.push(a);
    }
  }
  return s.join("&");
}, W = (r) => {
  var t;
  if (!r) return "stream";
  let e = (t = r.split(";")[0]) == null ? void 0 : t.trim();
  if (e) {
    if (e.startsWith("application/json") || e.endsWith("+json")) return "json";
    if (e === "multipart/form-data") return "formData";
    if (["application/", "audio/", "image/", "video/"].some((n) => e.startsWith(n))) return "blob";
    if (e.startsWith("text/")) return "text";
  }
}, B = async ({ security: r, ...e }) => {
  for (let t of r) {
    let n = await I(t, e.auth);
    if (!n) continue;
    let s = t.name ?? "Authorization";
    switch (t.in) {
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
}, j = (r) => M({ baseUrl: r.baseUrl, path: r.path, query: r.query, querySerializer: typeof r.querySerializer == "function" ? r.querySerializer : U(r.querySerializer), url: r.url }), M = ({ baseUrl: r, path: e, query: t, querySerializer: n, url: s }) => {
  let i = s.startsWith("/") ? s : `/${s}`, l = (r ?? "") + i;
  e && (l = D({ path: e, url: l }));
  let a = t ? n(t) : "";
  return a.startsWith("?") && (a = a.substring(1)), a && (l += `?${a}`), l;
}, x = (r, e) => {
  var n;
  let t = { ...r, ...e };
  return (n = t.baseUrl) != null && n.endsWith("/") && (t.baseUrl = t.baseUrl.substring(0, t.baseUrl.length - 1)), t.headers = q(r.headers, e.headers), t;
}, q = (...r) => {
  let e = new Headers();
  for (let t of r) {
    if (!t || typeof t != "object") continue;
    let n = t instanceof Headers ? t.entries() : Object.entries(t);
    for (let [s, i] of n) if (i === null) e.delete(s);
    else if (Array.isArray(i)) for (let l of i) e.append(s, l);
    else i !== void 0 && e.set(s, typeof i == "object" ? JSON.stringify(i) : i);
  }
  return e;
}, w = class {
  constructor() {
    A(this, "_fns");
    this._fns = [];
  }
  clear() {
    this._fns = [];
  }
  getInterceptorIndex(r) {
    return typeof r == "number" ? this._fns[r] ? r : -1 : this._fns.indexOf(r);
  }
  exists(r) {
    let e = this.getInterceptorIndex(r);
    return !!this._fns[e];
  }
  eject(r) {
    let e = this.getInterceptorIndex(r);
    this._fns[e] && (this._fns[e] = null);
  }
  update(r, e) {
    let t = this.getInterceptorIndex(r);
    return this._fns[t] ? (this._fns[t] = e, r) : !1;
  }
  use(r) {
    return this._fns = [...this._fns, r], this._fns.length - 1;
  }
}, k = () => ({ error: new w(), request: new w(), response: new w() }), N = U({ allowReserved: !1, array: { explode: !0, style: "form" }, object: { explode: !0, style: "deepObject" } }), P = { "Content-Type": "application/json" }, C = (r = {}) => ({ ...R, headers: P, parseAs: "auto", querySerializer: N, ...r }), H = (r = {}) => {
  let e = x(C(), r), t = () => ({ ...e }), n = (l) => (e = x(e, l), t()), s = k(), i = async (l) => {
    let a = { ...e, ...l, fetch: l.fetch ?? e.fetch ?? globalThis.fetch, headers: q(e.headers, l.headers) };
    a.security && await B({ ...a, security: a.security }), a.body && a.bodySerializer && (a.body = a.bodySerializer(a.body)), (a.body === void 0 || a.body === "") && a.headers.delete("Content-Type");
    let u = j(a), m = { redirect: "follow", ...a }, d = new Request(u, m);
    for (let o of s.request._fns) o && (d = await o(d, a));
    let y = a.fetch, c = await y(d);
    for (let o of s.response._fns) o && (c = await o(c, d, a));
    let b = { request: d, response: c };
    if (c.ok) {
      if (c.status === 204 || c.headers.get("Content-Length") === "0") return a.responseStyle === "data" ? {} : { data: {}, ...b };
      let o = (a.parseAs === "auto" ? W(c.headers.get("Content-Type")) : a.parseAs) ?? "json";
      if (o === "stream") return a.responseStyle === "data" ? c.body : { data: c.body, ...b };
      let p = await c[o]();
      return o === "json" && (a.responseValidator && await a.responseValidator(p), a.responseTransformer && (p = await a.responseTransformer(p))), a.responseStyle === "data" ? p : { data: p, ...b };
    }
    let g = await c.text();
    try {
      g = JSON.parse(g);
    } catch {
    }
    let f = g;
    for (let o of s.error._fns) o && (f = await o(g, c, d, a));
    if (f = f || {}, a.throwOnError) throw f;
    return a.responseStyle === "data" ? void 0 : { error: f, ...b };
  };
  return { buildUrl: j, connect: (l) => i({ ...l, method: "CONNECT" }), delete: (l) => i({ ...l, method: "DELETE" }), get: (l) => i({ ...l, method: "GET" }), getConfig: t, head: (l) => i({ ...l, method: "HEAD" }), interceptors: s, options: (l) => i({ ...l, method: "OPTIONS" }), patch: (l) => i({ ...l, method: "PATCH" }), post: (l) => i({ ...l, method: "POST" }), put: (l) => i({ ...l, method: "PUT" }), request: i, setConfig: n, trace: (l) => i({ ...l, method: "TRACE" }) };
};
const h = H(C({
  baseUrl: "https://localhost:44366"
}));
class G {
  /**
   * Gets the Guid for the Articulate content type.
   * This endpoint is used to retrieve the Guid for the back office import and export features.
   */
  static getUmbracoManagementApiV1ArticulateBlogArticulateGuid(e) {
    return ((e == null ? void 0 : e.client) ?? h).get({
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
    return ((e == null ? void 0 : e.client) ?? h).post({
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
   * Downloads the exported Disqus comment XML file, if one was generated by the BlogML import.
   * This endpoint should be called after importing the BlogML file with the articulate/blog/import endpoint.
   */
  static getUmbracoManagementApiV1ArticulateBlogExportDisqus(e) {
    return ((e == null ? void 0 : e.client) ?? h).get({
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
    return ((e == null ? void 0 : e.client) ?? h).post({
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
    return ((e == null ? void 0 : e.client) ?? h).post({
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
   * Gets the list of all available Articulate themes, both default and user-defined.
   * This endpoint returns the names of all available themes, including both default and user-defined themes.
   */
  static getUmbracoManagementApiV1ArticulateEditorsThemes(e) {
    return ((e == null ? void 0 : e.client) ?? h).get({
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
    return ((e == null ? void 0 : e.client) ?? h).post({
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
  static getUmbracoManagementApiV1ArticulateThemesDefault(e) {
    return ((e == null ? void 0 : e.client) ?? h).get({
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
async function L(r, e) {
  let t;
  try {
    t = await r.json();
  } catch {
    t = { title: `${r.status} ${r.statusText}` };
  }
  return t.title && t.detail ? `${t.title}: ${t.detail}` : t.title || e;
}
export {
  G as A,
  h as c,
  L as h
};
//# sourceMappingURL=error-utils-BqJ7wuVX.js.map
