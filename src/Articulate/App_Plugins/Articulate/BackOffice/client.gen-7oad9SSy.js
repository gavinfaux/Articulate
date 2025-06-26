const S = (s, t, e) => {
  typeof e == "string" || e instanceof Blob ? s.append(t, e) : s.append(t, JSON.stringify(e));
}, R = {
  bodySerializer: (s) => {
    const t = new FormData();
    return Object.entries(s).forEach(([e, a]) => {
      a != null && (Array.isArray(a) ? a.forEach((o) => S(t, e, o)) : S(t, e, a));
    }), t;
  }
}, q = {
  bodySerializer: (s) => JSON.stringify(
    s,
    (t, e) => typeof e == "bigint" ? e.toString() : e
  )
}, I = async (s, t) => {
  const e = typeof t == "function" ? await t(s) : t;
  if (e)
    return s.scheme === "bearer" ? `Bearer ${e}` : s.scheme === "basic" ? `Basic ${btoa(e)}` : e;
}, E = (s) => {
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
}, _ = (s) => {
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
}, A = ({
  allowReserved: s,
  explode: t,
  name: e,
  style: a,
  value: o
}) => {
  if (!t) {
    const r = (s ? o : o.map((c) => encodeURIComponent(c))).join(_(a));
    switch (a) {
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
  const i = E(a), n = o.map((r) => a === "label" || a === "simple" ? s ? r : encodeURIComponent(r) : g({
    allowReserved: s,
    name: e,
    value: r
  })).join(i);
  return a === "label" || a === "matrix" ? i + n : n;
}, g = ({
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
}, z = ({
  allowReserved: s,
  explode: t,
  name: e,
  style: a,
  value: o,
  valueOnly: i
}) => {
  if (o instanceof Date)
    return i ? o.toISOString() : `${e}=${o.toISOString()}`;
  if (a !== "deepObject" && !t) {
    let c = [];
    Object.entries(o).forEach(([d, b]) => {
      c = [
        ...c,
        d,
        s ? b : encodeURIComponent(b)
      ];
    });
    const l = c.join(",");
    switch (a) {
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
  const n = U(a), r = Object.entries(o).map(
    ([c, l]) => g({
      allowReserved: s,
      name: a === "deepObject" ? `${e}[${c}]` : c,
      value: l
    })
  ).join(n);
  return a === "label" || a === "matrix" ? n + r : r;
}, T = /\{[^{}]+\}/g, P = ({ path: s, url: t }) => {
  let e = t;
  const a = t.match(T);
  if (a)
    for (const o of a) {
      let i = !1, n = o.substring(1, o.length - 1), r = "simple";
      n.endsWith("*") && (i = !0, n = n.substring(0, n.length - 1)), n.startsWith(".") ? (n = n.substring(1), r = "label") : n.startsWith(";") && (n = n.substring(1), r = "matrix");
      const c = s[n];
      if (c == null)
        continue;
      if (Array.isArray(c)) {
        e = e.replace(
          o,
          A({ explode: i, name: n, style: r, value: c })
        );
        continue;
      }
      if (typeof c == "object") {
        e = e.replace(
          o,
          z({
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
          o,
          `;${g({
            name: n,
            value: c
          })}`
        );
        continue;
      }
      const l = encodeURIComponent(
        r === "label" ? `.${c}` : c
      );
      e = e.replace(o, l);
    }
  return e;
}, O = ({
  allowReserved: s,
  array: t,
  object: e
} = {}) => (o) => {
  const i = [];
  if (o && typeof o == "object")
    for (const n in o) {
      const r = o[n];
      if (r != null)
        if (Array.isArray(r)) {
          const c = A({
            allowReserved: s,
            explode: !0,
            name: n,
            style: "form",
            value: r,
            ...t
          });
          c && i.push(c);
        } else if (typeof r == "object") {
          const c = z({
            allowReserved: s,
            explode: !0,
            name: n,
            style: "deepObject",
            value: r,
            ...e
          });
          c && i.push(c);
        } else {
          const c = g({
            allowReserved: s,
            name: n,
            value: r
          });
          c && i.push(c);
        }
    }
  return i.join("&");
}, D = (s) => {
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
      (a) => t.startsWith(a)
    ))
      return "blob";
    if (t.startsWith("text/"))
      return "text";
  }
}, W = async ({
  security: s,
  ...t
}) => {
  for (const e of s) {
    const a = await I(e, t.auth);
    if (!a)
      continue;
    const o = e.name ?? "Authorization";
    switch (e.in) {
      case "query":
        t.query || (t.query = {}), t.query[o] = a;
        break;
      case "cookie":
        t.headers.append("Cookie", `${o}=${a}`);
        break;
      case "header":
      default:
        t.headers.set(o, a);
        break;
    }
    return;
  }
}, x = (s) => V({
  baseUrl: s.baseUrl,
  path: s.path,
  query: s.query,
  querySerializer: typeof s.querySerializer == "function" ? s.querySerializer : O(s.querySerializer),
  url: s.url
}), V = ({
  baseUrl: s,
  path: t,
  query: e,
  querySerializer: a,
  url: o
}) => {
  const i = o.startsWith("/") ? o : `/${o}`;
  let n = (s ?? "") + i;
  t && (n = P({ path: t, url: n }));
  let r = e ? a(e) : "";
  return r.startsWith("?") && (r = r.substring(1)), r && (n += `?${r}`), n;
}, w = (s, t) => {
  var a;
  const e = { ...s, ...t };
  return (a = e.baseUrl) != null && a.endsWith("/") && (e.baseUrl = e.baseUrl.substring(0, e.baseUrl.length - 1)), e.headers = $(s.headers, t.headers), e;
}, $ = (...s) => {
  const t = new Headers();
  for (const e of s) {
    if (!e || typeof e != "object")
      continue;
    const a = e instanceof Headers ? e.entries() : Object.entries(e);
    for (const [o, i] of a)
      if (i === null)
        t.delete(o);
      else if (Array.isArray(i))
        for (const n of i)
          t.append(o, n);
      else i !== void 0 && t.set(
        o,
        typeof i == "object" ? JSON.stringify(i) : i
      );
  }
  return t;
};
class j {
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
    const a = this.getInterceptorIndex(t);
    return this._fns[a] ? (this._fns[a] = e, t) : !1;
  }
  use(t) {
    return this._fns = [...this._fns, t], this._fns.length - 1;
  }
}
const H = () => ({
  error: new j(),
  request: new j(),
  response: new j()
}), N = O({
  allowReserved: !1,
  array: {
    explode: !0,
    style: "form"
  },
  object: {
    explode: !0,
    style: "deepObject"
  }
}), k = {
  "Content-Type": "application/json"
}, C = (s = {}) => ({
  ...q,
  headers: k,
  parseAs: "auto",
  querySerializer: N,
  ...s
}), B = (s = {}) => {
  let t = w(C(), s);
  const e = () => ({ ...t }), a = (n) => (t = w(t, n), e()), o = H(), i = async (n) => {
    const r = {
      ...t,
      ...n,
      fetch: n.fetch ?? t.fetch ?? globalThis.fetch,
      headers: $(t.headers, n.headers)
    };
    r.security && await W({
      ...r,
      security: r.security
    }), r.requestValidator && await r.requestValidator(r), r.body && r.bodySerializer && (r.body = r.bodySerializer(r.body)), (r.body === void 0 || r.body === "") && r.headers.delete("Content-Type");
    const c = x(r), l = {
      redirect: "follow",
      ...r
    };
    let d = new Request(c, l);
    for (const u of o.request._fns)
      u && (d = await u(d, r));
    const b = r.fetch;
    let f = await b(d);
    for (const u of o.response._fns)
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
      const u = (r.parseAs === "auto" ? D(f.headers.get("Content-Type")) : r.parseAs) ?? "json";
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
    let m = await f.text();
    try {
      m = JSON.parse(m);
    } catch {
    }
    let p = m;
    for (const u of o.error._fns)
      u && (p = await u(m, f, d, r));
    if (p = p || {}, r.throwOnError)
      throw p;
    return r.responseStyle === "data" ? void 0 : {
      error: p,
      ...y
    };
  };
  return {
    buildUrl: x,
    connect: (n) => i({ ...n, method: "CONNECT" }),
    delete: (n) => i({ ...n, method: "DELETE" }),
    get: (n) => i({ ...n, method: "GET" }),
    getConfig: e,
    head: (n) => i({ ...n, method: "HEAD" }),
    interceptors: o,
    options: (n) => i({ ...n, method: "OPTIONS" }),
    patch: (n) => i({ ...n, method: "PATCH" }),
    post: (n) => i({ ...n, method: "POST" }),
    put: (n) => i({ ...n, method: "PUT" }),
    request: i,
    setConfig: a,
    trace: (n) => i({ ...n, method: "TRACE" })
  };
}, J = B(C({
  baseUrl: "https://localhost:44366"
}));
export {
  J as c,
  R as f
};
//# sourceMappingURL=client.gen-7oad9SSy.js.map
