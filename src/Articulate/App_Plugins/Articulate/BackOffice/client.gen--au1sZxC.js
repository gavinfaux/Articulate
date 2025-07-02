const C = {
  bodySerializer: (n) => JSON.stringify(
    n,
    (r, e) => typeof e == "bigint" ? e.toString() : e
  )
}, q = async (n, r) => {
  const e = typeof r == "function" ? await r(n) : r;
  if (e)
    return n.scheme === "bearer" ? `Bearer ${e}` : n.scheme === "basic" ? `Basic ${btoa(e)}` : e;
}, I = (n) => {
  switch (n) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, _ = (n) => {
  switch (n) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
}, U = (n) => {
  switch (n) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, w = ({
  allowReserved: n,
  explode: r,
  name: e,
  style: o,
  value: a
}) => {
  if (!r) {
    const t = (n ? a : a.map((c) => encodeURIComponent(c))).join(_(o));
    switch (o) {
      case "label":
        return `.${t}`;
      case "matrix":
        return `;${e}=${t}`;
      case "simple":
        return t;
      default:
        return `${e}=${t}`;
    }
  }
  const i = I(o), s = a.map((t) => o === "label" || o === "simple" ? n ? t : encodeURIComponent(t) : g({
    allowReserved: n,
    name: e,
    value: t
  })).join(i);
  return o === "label" || o === "matrix" ? i + s : s;
}, g = ({
  allowReserved: n,
  name: r,
  value: e
}) => {
  if (e == null)
    return "";
  if (typeof e == "object")
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these."
    );
  return `${r}=${n ? e : encodeURIComponent(e)}`;
}, A = ({
  allowReserved: n,
  explode: r,
  name: e,
  style: o,
  value: a,
  valueOnly: i
}) => {
  if (a instanceof Date)
    return i ? a.toISOString() : `${e}=${a.toISOString()}`;
  if (o !== "deepObject" && !r) {
    let c = [];
    Object.entries(a).forEach(([d, b]) => {
      c = [
        ...c,
        d,
        n ? b : encodeURIComponent(b)
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
  const s = U(o), t = Object.entries(a).map(
    ([c, l]) => g({
      allowReserved: n,
      name: o === "deepObject" ? `${e}[${c}]` : c,
      value: l
    })
  ).join(s);
  return o === "label" || o === "matrix" ? s + t : t;
}, E = /\{[^{}]+\}/g, T = ({ path: n, url: r }) => {
  let e = r;
  const o = r.match(E);
  if (o)
    for (const a of o) {
      let i = !1, s = a.substring(1, a.length - 1), t = "simple";
      s.endsWith("*") && (i = !0, s = s.substring(0, s.length - 1)), s.startsWith(".") ? (s = s.substring(1), t = "label") : s.startsWith(";") && (s = s.substring(1), t = "matrix");
      const c = n[s];
      if (c == null)
        continue;
      if (Array.isArray(c)) {
        e = e.replace(
          a,
          w({ explode: i, name: s, style: t, value: c })
        );
        continue;
      }
      if (typeof c == "object") {
        e = e.replace(
          a,
          A({
            explode: i,
            name: s,
            style: t,
            value: c,
            valueOnly: !0
          })
        );
        continue;
      }
      if (t === "matrix") {
        e = e.replace(
          a,
          `;${g({
            name: s,
            value: c
          })}`
        );
        continue;
      }
      const l = encodeURIComponent(
        t === "label" ? `.${c}` : c
      );
      e = e.replace(a, l);
    }
  return e;
}, $ = ({
  allowReserved: n,
  array: r,
  object: e
} = {}) => (a) => {
  const i = [];
  if (a && typeof a == "object")
    for (const s in a) {
      const t = a[s];
      if (t != null)
        if (Array.isArray(t)) {
          const c = w({
            allowReserved: n,
            explode: !0,
            name: s,
            style: "form",
            value: t,
            ...r
          });
          c && i.push(c);
        } else if (typeof t == "object") {
          const c = A({
            allowReserved: n,
            explode: !0,
            name: s,
            style: "deepObject",
            value: t,
            ...e
          });
          c && i.push(c);
        } else {
          const c = g({
            allowReserved: n,
            name: s,
            value: t
          });
          c && i.push(c);
        }
    }
  return i.join("&");
}, P = (n) => {
  var e;
  if (!n)
    return "stream";
  const r = (e = n.split(";")[0]) == null ? void 0 : e.trim();
  if (r) {
    if (r.startsWith("application/json") || r.endsWith("+json"))
      return "json";
    if (r === "multipart/form-data")
      return "formData";
    if (["application/", "audio/", "image/", "video/"].some(
      (o) => r.startsWith(o)
    ))
      return "blob";
    if (r.startsWith("text/"))
      return "text";
  }
}, W = async ({
  security: n,
  ...r
}) => {
  for (const e of n) {
    const o = await q(e, r.auth);
    if (!o)
      continue;
    const a = e.name ?? "Authorization";
    switch (e.in) {
      case "query":
        r.query || (r.query = {}), r.query[a] = o;
        break;
      case "cookie":
        r.headers.append("Cookie", `${a}=${o}`);
        break;
      case "header":
      default:
        r.headers.set(a, o);
        break;
    }
    return;
  }
}, x = (n) => k({
  baseUrl: n.baseUrl,
  path: n.path,
  query: n.query,
  querySerializer: typeof n.querySerializer == "function" ? n.querySerializer : $(n.querySerializer),
  url: n.url
}), k = ({
  baseUrl: n,
  path: r,
  query: e,
  querySerializer: o,
  url: a
}) => {
  const i = a.startsWith("/") ? a : `/${a}`;
  let s = (n ?? "") + i;
  r && (s = T({ path: r, url: s }));
  let t = e ? o(e) : "";
  return t.startsWith("?") && (t = t.substring(1)), t && (s += `?${t}`), s;
}, S = (n, r) => {
  var o;
  const e = { ...n, ...r };
  return (o = e.baseUrl) != null && o.endsWith("/") && (e.baseUrl = e.baseUrl.substring(0, e.baseUrl.length - 1)), e.headers = z(n.headers, r.headers), e;
}, z = (...n) => {
  const r = new Headers();
  for (const e of n) {
    if (!e || typeof e != "object")
      continue;
    const o = e instanceof Headers ? e.entries() : Object.entries(e);
    for (const [a, i] of o)
      if (i === null)
        r.delete(a);
      else if (Array.isArray(i))
        for (const s of i)
          r.append(a, s);
      else i !== void 0 && r.set(
        a,
        typeof i == "object" ? JSON.stringify(i) : i
      );
  }
  return r;
};
class j {
  constructor() {
    this._fns = [];
  }
  clear() {
    this._fns = [];
  }
  getInterceptorIndex(r) {
    return typeof r == "number" ? this._fns[r] ? r : -1 : this._fns.indexOf(r);
  }
  exists(r) {
    const e = this.getInterceptorIndex(r);
    return !!this._fns[e];
  }
  eject(r) {
    const e = this.getInterceptorIndex(r);
    this._fns[e] && (this._fns[e] = null);
  }
  update(r, e) {
    const o = this.getInterceptorIndex(r);
    return this._fns[o] ? (this._fns[o] = e, r) : !1;
  }
  use(r) {
    return this._fns = [...this._fns, r], this._fns.length - 1;
  }
}
const V = () => ({
  error: new j(),
  request: new j(),
  response: new j()
}), D = $({
  allowReserved: !1,
  array: {
    explode: !0,
    style: "form"
  },
  object: {
    explode: !0,
    style: "deepObject"
  }
}), H = {
  "Content-Type": "application/json"
}, O = (n = {}) => ({
  ...C,
  headers: H,
  parseAs: "auto",
  querySerializer: D,
  ...n
}), N = (n = {}) => {
  let r = S(O(), n);
  const e = () => ({ ...r }), o = (s) => (r = S(r, s), e()), a = V(), i = async (s) => {
    const t = {
      ...r,
      ...s,
      fetch: s.fetch ?? r.fetch ?? globalThis.fetch,
      headers: z(r.headers, s.headers)
    };
    t.security && await W({
      ...t,
      security: t.security
    }), t.requestValidator && await t.requestValidator(t), t.body && t.bodySerializer && (t.body = t.bodySerializer(t.body)), (t.body === void 0 || t.body === "") && t.headers.delete("Content-Type");
    const c = x(t), l = {
      redirect: "follow",
      ...t
    };
    let d = new Request(c, l);
    for (const u of a.request._fns)
      u && (d = await u(d, t));
    const b = t.fetch;
    let f = await b(d);
    for (const u of a.response._fns)
      u && (f = await u(f, d, t));
    const m = {
      request: d,
      response: f
    };
    if (f.ok) {
      if (f.status === 204 || f.headers.get("Content-Length") === "0")
        return t.responseStyle === "data" ? {} : {
          data: {},
          ...m
        };
      const u = (t.parseAs === "auto" ? P(f.headers.get("Content-Type")) : t.parseAs) ?? "json";
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
          return t.responseStyle === "data" ? f.body : {
            data: f.body,
            ...m
          };
      }
      return u === "json" && (t.responseValidator && await t.responseValidator(h), t.responseTransformer && (h = await t.responseTransformer(h))), t.responseStyle === "data" ? h : {
        data: h,
        ...m
      };
    }
    let y = await f.text();
    try {
      y = JSON.parse(y);
    } catch {
    }
    let p = y;
    for (const u of a.error._fns)
      u && (p = await u(y, f, d, t));
    if (p = p || {}, t.throwOnError)
      throw p;
    return t.responseStyle === "data" ? void 0 : {
      error: p,
      ...m
    };
  };
  return {
    buildUrl: x,
    connect: (s) => i({ ...s, method: "CONNECT" }),
    delete: (s) => i({ ...s, method: "DELETE" }),
    get: (s) => i({ ...s, method: "GET" }),
    getConfig: e,
    head: (s) => i({ ...s, method: "HEAD" }),
    interceptors: a,
    options: (s) => i({ ...s, method: "OPTIONS" }),
    patch: (s) => i({ ...s, method: "PATCH" }),
    post: (s) => i({ ...s, method: "POST" }),
    put: (s) => i({ ...s, method: "PUT" }),
    request: i,
    setConfig: o,
    trace: (s) => i({ ...s, method: "TRACE" })
  };
}, R = N(O({
  baseUrl: "https://localhost:44366"
}));
export {
  R as c
};
