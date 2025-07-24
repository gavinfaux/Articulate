const w = (s, t, e) => {
  typeof e == "string" || e instanceof Blob ? s.append(t, e) : s.append(t, JSON.stringify(e));
}, F = {
  bodySerializer: (s) => {
    const t = new FormData();
    return Object.entries(s).forEach(([e, o]) => {
      o != null && (Array.isArray(o) ? o.forEach((a) => w(t, e, a)) : w(t, e, o));
    }), t;
  }
}, I = {
  bodySerializer: (s) => JSON.stringify(
    s,
    (t, e) => typeof e == "bigint" ? e.toString() : e
  )
}, _ = async (s, t) => {
  const e = typeof t == "function" ? await t(s) : t;
  if (e)
    return s.scheme === "bearer" ? `Bearer ${e}` : s.scheme === "basic" ? `Basic ${btoa(e)}` : e;
}, U = (s) => {
  switch (s) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, T = (s) => {
  switch (s) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
}, P = (s) => {
  switch (s) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, O = ({
  allowReserved: s,
  explode: t,
  name: e,
  style: o,
  value: a
}) => {
  if (!t) {
    const r = (s ? a : a.map((c) => encodeURIComponent(c))).join(T(o));
    switch (o) {
      case "label":
        return `.${r}`;
      case "matrix":
        return `;${e}=${r}`;
      case "simple":
        return r;
      default:
        return `${e}=${r}`;
    }
  }
  const i = U(o), n = a.map((r) => o === "label" || o === "simple" ? s ? r : encodeURIComponent(r) : m({
    allowReserved: s,
    name: e,
    value: r
  })).join(i);
  return o === "label" || o === "matrix" ? i + n : n;
}, m = ({
  allowReserved: s,
  name: t,
  value: e
}) => {
  if (e == null)
    return "";
  if (typeof e == "object")
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these."
    );
  return `${t}=${s ? e : encodeURIComponent(e)}`;
}, $ = ({
  allowReserved: s,
  explode: t,
  name: e,
  style: o,
  value: a,
  valueOnly: i
}) => {
  if (a instanceof Date)
    return i ? a.toISOString() : `${e}=${a.toISOString()}`;
  if (o !== "deepObject" && !t) {
    let c = [];
    Object.entries(a).forEach(([d, b]) => {
      c = [
        ...c,
        d,
        s ? b : encodeURIComponent(b)
      ];
    });
    const l = c.join(",");
    switch (o) {
      case "form":
        return `${e}=${l}`;
      case "label":
        return `.${l}`;
      case "matrix":
        return `;${e}=${l}`;
      default:
        return l;
    }
  }
  const n = P(o), r = Object.entries(a).map(
    ([c, l]) => m({
      allowReserved: s,
      name: o === "deepObject" ? `${e}[${c}]` : c,
      value: l
    })
  ).join(n);
  return o === "label" || o === "matrix" ? n + r : r;
}, D = /\{[^{}]+\}/g, W = ({ path: s, url: t }) => {
  let e = t;
  const o = t.match(D);
  if (o)
    for (const a of o) {
      let i = !1, n = a.substring(1, a.length - 1), r = "simple";
      n.endsWith("*") && (i = !0, n = n.substring(0, n.length - 1)), n.startsWith(".") ? (n = n.substring(1), r = "label") : n.startsWith(";") && (n = n.substring(1), r = "matrix");
      const c = s[n];
      if (c == null)
        continue;
      if (Array.isArray(c)) {
        e = e.replace(
          a,
          O({ explode: i, name: n, style: r, value: c })
        );
        continue;
      }
      if (typeof c == "object") {
        e = e.replace(
          a,
          $({
            explode: i,
            name: n,
            style: r,
            value: c,
            valueOnly: !0
          })
        );
        continue;
      }
      if (r === "matrix") {
        e = e.replace(
          a,
          `;${m({
            name: n,
            value: c
          })}`
        );
        continue;
      }
      const l = encodeURIComponent(
        r === "label" ? `.${c}` : c
      );
      e = e.replace(a, l);
    }
  return e;
}, C = ({
  allowReserved: s,
  array: t,
  object: e
} = {}) => (a) => {
  const i = [];
  if (a && typeof a == "object")
    for (const n in a) {
      const r = a[n];
      if (r != null)
        if (Array.isArray(r)) {
          const c = O({
            allowReserved: s,
            explode: !0,
            name: n,
            style: "form",
            value: r,
            ...t
          });
          c && i.push(c);
        } else if (typeof r == "object") {
          const c = $({
            allowReserved: s,
            explode: !0,
            name: n,
            style: "deepObject",
            value: r,
            ...e
          });
          c && i.push(c);
        } else {
          const c = m({
            allowReserved: s,
            name: n,
            value: r
          });
          c && i.push(c);
        }
    }
  return i.join("&");
}, V = (s) => {
  var e;
  if (!s)
    return "stream";
  const t = (e = s.split(";")[0]) == null ? void 0 : e.trim();
  if (t) {
    if (t.startsWith("application/json") || t.endsWith("+json"))
      return "json";
    if (t === "multipart/form-data")
      return "formData";
    if (["application/", "audio/", "image/", "video/"].some(
      (o) => t.startsWith(o)
    ))
      return "blob";
    if (t.startsWith("text/"))
      return "text";
  }
}, H = async ({
  security: s,
  ...t
}) => {
  for (const e of s) {
    const o = await _(e, t.auth);
    if (!o)
      continue;
    const a = e.name ?? "Authorization";
    switch (e.in) {
      case "query":
        t.query || (t.query = {}), t.query[a] = o;
        break;
      case "cookie":
        t.headers.append("Cookie", `${a}=${o}`);
        break;
      case "header":
      default:
        t.headers.set(a, o);
        break;
    }
    return;
  }
}, A = (s) => N({
  baseUrl: s.baseUrl,
  path: s.path,
  query: s.query,
  querySerializer: typeof s.querySerializer == "function" ? s.querySerializer : C(s.querySerializer),
  url: s.url
}), N = ({
  baseUrl: s,
  path: t,
  query: e,
  querySerializer: o,
  url: a
}) => {
  const i = a.startsWith("/") ? a : `/${a}`;
  let n = (s ?? "") + i;
  t && (n = W({ path: t, url: n }));
  let r = e ? o(e) : "";
  return r.startsWith("?") && (r = r.substring(1)), r && (n += `?${r}`), n;
}, z = (s, t) => {
  var o;
  const e = { ...s, ...t };
  return (o = e.baseUrl) != null && o.endsWith("/") && (e.baseUrl = e.baseUrl.substring(0, e.baseUrl.length - 1)), e.headers = q(s.headers, t.headers), e;
}, q = (...s) => {
  const t = new Headers();
  for (const e of s) {
    if (!e || typeof e != "object")
      continue;
    const o = e instanceof Headers ? e.entries() : Object.entries(e);
    for (const [a, i] of o)
      if (i === null)
        t.delete(a);
      else if (Array.isArray(i))
        for (const n of i)
          t.append(a, n);
      else i !== void 0 && t.set(
        a,
        typeof i == "object" ? JSON.stringify(i) : i
      );
  }
  return t;
};
class g {
  constructor() {
    this._fns = [];
  }
  clear() {
    this._fns = [];
  }
  getInterceptorIndex(t) {
    return typeof t == "number" ? this._fns[t] ? t : -1 : this._fns.indexOf(t);
  }
  exists(t) {
    const e = this.getInterceptorIndex(t);
    return !!this._fns[e];
  }
  eject(t) {
    const e = this.getInterceptorIndex(t);
    this._fns[e] && (this._fns[e] = null);
  }
  update(t, e) {
    const o = this.getInterceptorIndex(t);
    return this._fns[o] ? (this._fns[o] = e, t) : !1;
  }
  use(t) {
    return this._fns = [...this._fns, t], this._fns.length - 1;
  }
}
const k = () => ({
  error: new g(),
  request: new g(),
  response: new g()
}), B = C({
  allowReserved: !1,
  array: {
    explode: !0,
    style: "form"
  },
  object: {
    explode: !0,
    style: "deepObject"
  }
}), R = {
  "Content-Type": "application/json"
}, E = (s = {}) => ({
  ...I,
  headers: R,
  parseAs: "auto",
  querySerializer: B,
  ...s
}), J = (s = {}) => {
  let t = z(E(), s);
  const e = () => ({ ...t }), o = (n) => (t = z(t, n), e()), a = k(), i = async (n) => {
    const r = {
      ...t,
      ...n,
      fetch: n.fetch ?? t.fetch ?? globalThis.fetch,
      headers: q(t.headers, n.headers)
    };
    r.security && await H({
      ...r,
      security: r.security
    }), r.requestValidator && await r.requestValidator(r), r.body && r.bodySerializer && (r.body = r.bodySerializer(r.body)), (r.body === void 0 || r.body === "") && r.headers.delete("Content-Type");
    const c = A(r), l = {
      redirect: "follow",
      ...r
    };
    let d = new Request(c, l);
    for (const u of a.request._fns)
      u && (d = await u(d, r));
    const b = r.fetch;
    let f = await b(d);
    for (const u of a.response._fns)
      u && (f = await u(f, d, r));
    const y = {
      request: d,
      response: f
    };
    if (f.ok) {
      if (f.status === 204 || f.headers.get("Content-Length") === "0")
        return r.responseStyle === "data" ? {} : {
          data: {},
          ...y
        };
      const u = (r.parseAs === "auto" ? V(f.headers.get("Content-Type")) : r.parseAs) ?? "json";
      let h;
      switch (u) {
        case "arrayBuffer":
        case "blob":
        case "formData":
        case "json":
        case "text":
          h = await f[u]();
          break;
        case "stream":
          return r.responseStyle === "data" ? f.body : {
            data: f.body,
            ...y
          };
      }
      return u === "json" && (r.responseValidator && await r.responseValidator(h), r.responseTransformer && (h = await r.responseTransformer(h))), r.responseStyle === "data" ? h : {
        data: h,
        ...y
      };
    }
    const j = await f.text();
    let S;
    try {
      S = JSON.parse(j);
    } catch {
    }
    const x = S ?? j;
    let p = x;
    for (const u of a.error._fns)
      u && (p = await u(x, f, d, r));
    if (p = p || {}, r.throwOnError)
      throw p;
    return r.responseStyle === "data" ? void 0 : {
      error: p,
      ...y
    };
  };
  return {
    buildUrl: A,
    connect: (n) => i({ ...n, method: "CONNECT" }),
    delete: (n) => i({ ...n, method: "DELETE" }),
    get: (n) => i({ ...n, method: "GET" }),
    getConfig: e,
    head: (n) => i({ ...n, method: "HEAD" }),
    interceptors: a,
    options: (n) => i({ ...n, method: "OPTIONS" }),
    patch: (n) => i({ ...n, method: "PATCH" }),
    post: (n) => i({ ...n, method: "POST" }),
    put: (n) => i({ ...n, method: "PUT" }),
    request: i,
    setConfig: o,
    trace: (n) => i({ ...n, method: "TRACE" })
  };
}, L = J(E({
  baseUrl: "https://localhost:44366"
}));
export {
  L as c,
  F as f
};
