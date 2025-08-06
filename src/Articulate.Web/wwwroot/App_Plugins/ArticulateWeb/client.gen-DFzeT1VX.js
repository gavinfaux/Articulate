var C = Object.defineProperty;
var U = (t, r, e) => r in t ? C(t, r, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[r] = e;
var j = (t, r, e) => U(t, typeof r != "symbol" ? r + "" : r, e);
var T = async (t, r) => {
  let e = typeof r == "function" ? await r(t) : r;
  if (e) return t.scheme === "bearer" ? `Bearer ${e}` : t.scheme === "basic" ? `Basic ${btoa(e)}` : e;
}, A = { bodySerializer: (t) => JSON.stringify(t, (r, e) => typeof e == "bigint" ? e.toString() : e) }, _ = (t) => {
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
}, E = (t) => {
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
}, x = ({ allowReserved: t, explode: r, name: e, style: l, value: n }) => {
  if (!r) {
    let s = (t ? n : n.map((i) => encodeURIComponent(i))).join(z(l));
    switch (l) {
      case "label":
        return `.${s}`;
      case "matrix":
        return `;${e}=${s}`;
      case "simple":
        return s;
      default:
        return `${e}=${s}`;
    }
  }
  let o = _(l), a = n.map((s) => l === "label" || l === "simple" ? t ? s : encodeURIComponent(s) : b({ allowReserved: t, name: e, value: s })).join(o);
  return l === "label" || l === "matrix" ? o + a : a;
}, b = ({ allowReserved: t, name: r, value: e }) => {
  if (e == null) return "";
  if (typeof e == "object") throw new Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");
  return `${r}=${t ? e : encodeURIComponent(e)}`;
}, $ = ({ allowReserved: t, explode: r, name: e, style: l, value: n }) => {
  if (n instanceof Date) return `${e}=${n.toISOString()}`;
  if (l !== "deepObject" && !r) {
    let s = [];
    Object.entries(n).forEach(([d, f]) => {
      s = [...s, d, t ? f : encodeURIComponent(f)];
    });
    let i = s.join(",");
    switch (l) {
      case "form":
        return `${e}=${i}`;
      case "label":
        return `.${i}`;
      case "matrix":
        return `;${e}=${i}`;
      default:
        return i;
    }
  }
  let o = E(l), a = Object.entries(n).map(([s, i]) => b({ allowReserved: t, name: l === "deepObject" ? `${e}[${s}]` : s, value: i })).join(o);
  return l === "label" || l === "matrix" ? o + a : a;
}, W = /\{[^{}]+\}/g, D = ({ path: t, url: r }) => {
  let e = r, l = r.match(W);
  if (l) for (let n of l) {
    let o = !1, a = n.substring(1, n.length - 1), s = "simple";
    a.endsWith("*") && (o = !0, a = a.substring(0, a.length - 1)), a.startsWith(".") ? (a = a.substring(1), s = "label") : a.startsWith(";") && (a = a.substring(1), s = "matrix");
    let i = t[a];
    if (i == null) continue;
    if (Array.isArray(i)) {
      e = e.replace(n, x({ explode: o, name: a, style: s, value: i }));
      continue;
    }
    if (typeof i == "object") {
      e = e.replace(n, $({ explode: o, name: a, style: s, value: i }));
      continue;
    }
    if (s === "matrix") {
      e = e.replace(n, `;${b({ name: a, value: i })}`);
      continue;
    }
    let d = encodeURIComponent(s === "label" ? `.${i}` : i);
    e = e.replace(n, d);
  }
  return e;
}, q = ({ allowReserved: t, array: r, object: e } = {}) => (l) => {
  let n = [];
  if (l && typeof l == "object") for (let o in l) {
    let a = l[o];
    if (a != null) {
      if (Array.isArray(a)) {
        n = [...n, x({ allowReserved: t, explode: !0, name: o, style: "form", value: a, ...r })];
        continue;
      }
      if (typeof a == "object") {
        n = [...n, $({ allowReserved: t, explode: !0, name: o, style: "deepObject", value: a, ...e })];
        continue;
      }
      n = [...n, b({ allowReserved: t, name: o, value: a })];
    }
  }
  return n.join("&");
}, I = (t) => {
  var e;
  if (!t) return "stream";
  let r = (e = t.split(";")[0]) == null ? void 0 : e.trim();
  if (r) {
    if (r.startsWith("application/json") || r.endsWith("+json")) return "json";
    if (r === "multipart/form-data") return "formData";
    if (["application/", "audio/", "image/", "video/"].some((l) => r.startsWith(l))) return "blob";
    if (r.startsWith("text/")) return "text";
  }
}, k = async ({ security: t, ...r }) => {
  for (let e of t) {
    let l = await T(e, r.auth);
    if (!l) continue;
    let n = e.name ?? "Authorization";
    switch (e.in) {
      case "query":
        r.query || (r.query = {}), r.query[n] = l;
        break;
      case "cookie":
        r.headers.append("Cookie", `${n}=${l}`);
        break;
      case "header":
      default:
        r.headers.set(n, l);
        break;
    }
    return;
  }
}, v = (t) => N({ baseUrl: t.baseUrl, path: t.path, query: t.query, querySerializer: typeof t.querySerializer == "function" ? t.querySerializer : q(t.querySerializer), url: t.url }), N = ({ baseUrl: t, path: r, query: e, querySerializer: l, url: n }) => {
  let o = n.startsWith("/") ? n : `/${n}`, a = (t ?? "") + o;
  r && (a = D({ path: r, url: a }));
  let s = e ? l(e) : "";
  return s.startsWith("?") && (s = s.substring(1)), s && (a += `?${s}`), a;
}, g = (t, r) => {
  var l;
  let e = { ...t, ...r };
  return (l = e.baseUrl) != null && l.endsWith("/") && (e.baseUrl = e.baseUrl.substring(0, e.baseUrl.length - 1)), e.headers = O(t.headers, r.headers), e;
}, O = (...t) => {
  let r = new Headers();
  for (let e of t) {
    if (!e || typeof e != "object") continue;
    let l = e instanceof Headers ? e.entries() : Object.entries(e);
    for (let [n, o] of l) if (o === null) r.delete(n);
    else if (Array.isArray(o)) for (let a of o) r.append(n, a);
    else o !== void 0 && r.set(n, typeof o == "object" ? JSON.stringify(o) : o);
  }
  return r;
}, w = class {
  constructor() {
    j(this, "_fns");
    this._fns = [];
  }
  clear() {
    this._fns = [];
  }
  exists(t) {
    return this._fns.indexOf(t) !== -1;
  }
  eject(t) {
    let r = this._fns.indexOf(t);
    r !== -1 && (this._fns = [...this._fns.slice(0, r), ...this._fns.slice(r + 1)]);
  }
  use(t) {
    this._fns = [...this._fns, t];
  }
}, P = () => ({ error: new w(), request: new w(), response: new w() }), H = q({ allowReserved: !1, array: { explode: !0, style: "form" }, object: { explode: !0, style: "deepObject" } }), J = { "Content-Type": "application/json" }, S = (t = {}) => ({ ...A, headers: J, parseAs: "auto", querySerializer: H, ...t }), B = (t = {}) => {
  let r = g(S(), t), e = () => ({ ...r }), l = (a) => (r = g(r, a), e()), n = P(), o = async (a) => {
    let s = { ...r, ...a, fetch: a.fetch ?? r.fetch ?? globalThis.fetch, headers: O(r.headers, a.headers) };
    s.security && await k({ ...s, security: s.security }), s.body && s.bodySerializer && (s.body = s.bodySerializer(s.body)), (s.body === void 0 || s.body === "") && s.headers.delete("Content-Type");
    let i = v(s), d = { redirect: "follow", ...s }, f = new Request(i, d);
    for (let c of n.request._fns) f = await c(f, s);
    let R = s.fetch, u = await R(f);
    for (let c of n.response._fns) u = await c(u, f, s);
    let h = { request: f, response: u };
    if (u.ok) {
      if (u.status === 204 || u.headers.get("Content-Length") === "0") return { data: {}, ...h };
      let c = (s.parseAs === "auto" ? I(u.headers.get("Content-Type")) : s.parseAs) ?? "json";
      if (c === "stream") return { data: u.body, ...h };
      let m = await u[c]();
      return c === "json" && (s.responseValidator && await s.responseValidator(m), s.responseTransformer && (m = await s.responseTransformer(m))), { data: m, ...h };
    }
    let y = await u.text();
    try {
      y = JSON.parse(y);
    } catch {
    }
    let p = y;
    for (let c of n.error._fns) p = await c(y, u, f, s);
    if (p = p || {}, s.throwOnError) throw p;
    return { error: p, ...h };
  };
  return { buildUrl: v, connect: (a) => o({ ...a, method: "CONNECT" }), delete: (a) => o({ ...a, method: "DELETE" }), get: (a) => o({ ...a, method: "GET" }), getConfig: e, head: (a) => o({ ...a, method: "HEAD" }), interceptors: n, options: (a) => o({ ...a, method: "OPTIONS" }), patch: (a) => o({ ...a, method: "PATCH" }), post: (a) => o({ ...a, method: "POST" }), put: (a) => o({ ...a, method: "PUT" }), request: o, setConfig: l, trace: (a) => o({ ...a, method: "TRACE" }) };
};
const V = B(S({
  baseUrl: "https://localhost:44389"
}));
export {
  V as c
};
//# sourceMappingURL=client.gen-DFzeT1VX.js.map
