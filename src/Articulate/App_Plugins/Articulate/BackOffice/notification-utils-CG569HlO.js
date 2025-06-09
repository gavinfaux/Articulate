var I = Object.defineProperty;
var S = (t, e, r) => e in t ? I(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var v = (t, e, r) => S(t, typeof e != "symbol" ? e + "" : e, r);
import { UMB_NOTIFICATION_CONTEXT as _ } from "@umbraco-cms/backoffice/notification";
var q = async (t, e) => {
  let r = typeof e == "function" ? await e(t) : e;
  if (r) return t.scheme === "bearer" ? `Bearer ${r}` : t.scheme === "basic" ? `Basic ${btoa(r)}` : r;
}, E = { bodySerializer: (t) => JSON.stringify(t, (e, r) => typeof r == "bigint" ? r.toString() : r) }, R = (t) => {
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
}, N = (t) => {
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
}, M = (t) => {
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
}, j = ({ allowReserved: t, explode: e, name: r, style: n, value: s }) => {
  if (!e) {
    let a = (t ? s : s.map((c) => encodeURIComponent(c))).join(N(n));
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
  let i = R(n), l = s.map((a) => n === "label" || n === "simple" ? t ? a : encodeURIComponent(a) : g({ allowReserved: t, name: r, value: a })).join(i);
  return n === "label" || n === "matrix" ? i + l : l;
}, g = ({ allowReserved: t, name: e, value: r }) => {
  if (r == null) return "";
  if (typeof r == "object") throw new Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");
  return `${e}=${t ? r : encodeURIComponent(r)}`;
}, U = ({ allowReserved: t, explode: e, name: r, style: n, value: s }) => {
  if (s instanceof Date) return `${r}=${s.toISOString()}`;
  if (n !== "deepObject" && !e) {
    let a = [];
    Object.entries(s).forEach(([h, f]) => {
      a = [...a, h, t ? f : encodeURIComponent(f)];
    });
    let c = a.join(",");
    switch (n) {
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
  let i = M(n), l = Object.entries(s).map(([a, c]) => g({ allowReserved: t, name: n === "deepObject" ? `${r}[${a}]` : a, value: c })).join(i);
  return n === "label" || n === "matrix" ? i + l : l;
}, B = /\{[^{}]+\}/g, V = ({ path: t, url: e }) => {
  let r = e, n = e.match(B);
  if (n) for (let s of n) {
    let i = !1, l = s.substring(1, s.length - 1), a = "simple";
    l.endsWith("*") && (i = !0, l = l.substring(0, l.length - 1)), l.startsWith(".") ? (l = l.substring(1), a = "label") : l.startsWith(";") && (l = l.substring(1), a = "matrix");
    let c = t[l];
    if (c == null) continue;
    if (Array.isArray(c)) {
      r = r.replace(s, j({ explode: i, name: l, style: a, value: c }));
      continue;
    }
    if (typeof c == "object") {
      r = r.replace(s, U({ explode: i, name: l, style: a, value: c }));
      continue;
    }
    if (a === "matrix") {
      r = r.replace(s, `;${g({ name: l, value: c })}`);
      continue;
    }
    let h = encodeURIComponent(a === "label" ? `.${c}` : c);
    r = r.replace(s, h);
  }
  return r;
}, T = ({ allowReserved: t, array: e, object: r } = {}) => (n) => {
  let s = [];
  if (n && typeof n == "object") for (let i in n) {
    let l = n[i];
    if (l != null) if (Array.isArray(l)) {
      let a = j({ allowReserved: t, explode: !0, name: i, style: "form", value: l, ...e });
      a && s.push(a);
    } else if (typeof l == "object") {
      let a = U({ allowReserved: t, explode: !0, name: i, style: "deepObject", value: l, ...r });
      a && s.push(a);
    } else {
      let a = g({ allowReserved: t, name: i, value: l });
      a && s.push(a);
    }
  }
  return s.join("&");
}, z = (t) => {
  var r;
  if (!t) return "stream";
  let e = (r = t.split(";")[0]) == null ? void 0 : r.trim();
  if (e) {
    if (e.startsWith("application/json") || e.endsWith("+json")) return "json";
    if (e === "multipart/form-data") return "formData";
    if (["application/", "audio/", "image/", "video/"].some((n) => e.startsWith(n))) return "blob";
    if (e.startsWith("text/")) return "text";
  }
}, W = async ({ security: t, ...e }) => {
  for (let r of t) {
    let n = await q(r, e.auth);
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
}, A = (t) => D({ baseUrl: t.baseUrl, path: t.path, query: t.query, querySerializer: typeof t.querySerializer == "function" ? t.querySerializer : T(t.querySerializer), url: t.url }), D = ({ baseUrl: t, path: e, query: r, querySerializer: n, url: s }) => {
  let i = s.startsWith("/") ? s : `/${s}`, l = (t ?? "") + i;
  e && (l = V({ path: e, url: l }));
  let a = r ? n(r) : "";
  return a.startsWith("?") && (a = a.substring(1)), a && (l += `?${a}`), l;
}, x = (t, e) => {
  var n;
  let r = { ...t, ...e };
  return (n = r.baseUrl) != null && n.endsWith("/") && (r.baseUrl = r.baseUrl.substring(0, r.baseUrl.length - 1)), r.headers = C(t.headers, e.headers), r;
}, C = (...t) => {
  let e = new Headers();
  for (let r of t) {
    if (!r || typeof r != "object") continue;
    let n = r instanceof Headers ? r.entries() : Object.entries(r);
    for (let [s, i] of n) if (i === null) e.delete(s);
    else if (Array.isArray(i)) for (let l of i) e.append(s, l);
    else i !== void 0 && e.set(s, typeof i == "object" ? JSON.stringify(i) : i);
  }
  return e;
}, w = class {
  constructor() {
    v(this, "_fns");
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
}, P = () => ({ error: new w(), request: new w(), response: new w() }), k = T({ allowReserved: !1, array: { explode: !0, style: "form" }, object: { explode: !0, style: "deepObject" } }), H = { "Content-Type": "application/json" }, $ = (t = {}) => ({ ...E, headers: H, parseAs: "auto", querySerializer: k, ...t }), F = (t = {}) => {
  let e = x($(), t), r = () => ({ ...e }), n = (l) => (e = x(e, l), r()), s = P(), i = async (l) => {
    let a = { ...e, ...l, fetch: l.fetch ?? e.fetch ?? globalThis.fetch, headers: C(e.headers, l.headers) };
    a.security && await W({ ...a, security: a.security }), a.body && a.bodySerializer && (a.body = a.bodySerializer(a.body)), (a.body === void 0 || a.body === "") && a.headers.delete("Content-Type");
    let c = A(a), h = { redirect: "follow", ...a }, f = new Request(c, h);
    for (let o of s.request._fns) o && (f = await o(f, a));
    let O = a.fetch, u = await O(f);
    for (let o of s.response._fns) o && (u = await o(u, f, a));
    let p = { request: f, response: u };
    if (u.ok) {
      if (u.status === 204 || u.headers.get("Content-Length") === "0") return a.responseStyle === "data" ? {} : { data: {}, ...p };
      let o = (a.parseAs === "auto" ? z(u.headers.get("Content-Type")) : a.parseAs) ?? "json";
      if (o === "stream") return a.responseStyle === "data" ? u.body : { data: u.body, ...p };
      let b = await u[o]();
      return o === "json" && (a.responseValidator && await a.responseValidator(b), a.responseTransformer && (b = await a.responseTransformer(b))), a.responseStyle === "data" ? b : { data: b, ...p };
    }
    let y = await u.text();
    try {
      y = JSON.parse(y);
    } catch {
    }
    let d = y;
    for (let o of s.error._fns) o && (d = await o(y, u, f, a));
    if (d = d || {}, a.throwOnError) throw d;
    return a.responseStyle === "data" ? void 0 : { error: d, ...p };
  };
  return { buildUrl: A, connect: (l) => i({ ...l, method: "CONNECT" }), delete: (l) => i({ ...l, method: "DELETE" }), get: (l) => i({ ...l, method: "GET" }), getConfig: r, head: (l) => i({ ...l, method: "HEAD" }), interceptors: s, options: (l) => i({ ...l, method: "OPTIONS" }), patch: (l) => i({ ...l, method: "PATCH" }), post: (l) => i({ ...l, method: "POST" }), put: (l) => i({ ...l, method: "PUT" }), request: i, setConfig: n, trace: (l) => i({ ...l, method: "TRACE" }) };
};
const m = F($({
  baseUrl: "https://localhost:44366"
}));
class X {
  static getUmbracoManagementApiV1ArticulateBlogArchiveid(e) {
    return ((e == null ? void 0 : e.client) ?? m).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/archiveid",
      ...e
    });
  }
  static getUmbracoManagementApiV1ArticulateBlogExport(e) {
    return ((e == null ? void 0 : e.client) ?? m).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/export",
      ...e
    });
  }
  static getUmbracoManagementApiV1ArticulateBlogExportDisqus(e) {
    return ((e == null ? void 0 : e.client) ?? m).get({
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
  static getUmbracoManagementApiV1ArticulateBlogNodename(e) {
    return ((e == null ? void 0 : e.client) ?? m).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/nodename",
      ...e
    });
  }
  static postUmbracoManagementApiV1ArticulateBlogPostExport(e) {
    return ((e == null ? void 0 : e.client) ?? m).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/post/export",
      ...e,
      headers: {
        "Content-Type": "application/json",
        ...e == null ? void 0 : e.headers
      }
    });
  }
  static postUmbracoManagementApiV1ArticulateBlogPostImport(e) {
    return ((e == null ? void 0 : e.client) ?? m).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/post/import",
      ...e,
      headers: {
        "Content-Type": "application/json",
        ...e == null ? void 0 : e.headers
      }
    });
  }
  static postUmbracoManagementApiV1ArticulateBlogPostInit(e) {
    return ((e == null ? void 0 : e.client) ?? m).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/blog/post/init",
      ...e
    });
  }
  static getUmbracoManagementApiV1ArticulateEditorsThemes(e) {
    return ((e == null ? void 0 : e.client) ?? m).get({
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
  static getUmbracoManagementApiV1ArticulateThemesAll(e) {
    return ((e == null ? void 0 : e.client) ?? m).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/articulate/themes/all",
      ...e
    });
  }
  static postUmbracoManagementApiV1ArticulateThemesCopy(e) {
    return ((e == null ? void 0 : e.client) ?? m).post({
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
}
function G(t, e) {
  let r = e;
  if (t && typeof t == "object" && "title" in t && "status" in t) {
    const n = t;
    return n.title ? (r = n.title, n.detail && (r += `: ${n.detail}`)) : n.detail && (r = n.detail), r;
  }
  return t instanceof Error ? (r = t.message, r) : (typeof t == "string" && (r = t), r);
}
async function Q(t, e, r) {
  try {
    const n = await t.getContext(_);
    n ? n.peek(r, {
      data: { message: e }
    }) : console.error(
      "showUmbracoNotification: UMB_NOTIFICATION_CONTEXT not found. Unable to show notification."
    );
  } catch (n) {
    console.error("showUmbracoNotification: Failed to show Umbraco notification:", n);
  }
}
function K(t, e, r) {
  t._formMessageType = e, t._formMessageText = r;
}
export {
  X as A,
  K as a,
  m as c,
  G as e,
  Q as s
};
//# sourceMappingURL=notification-utils-CG569HlO.js.map
