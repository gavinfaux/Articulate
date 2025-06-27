import { css as U, html as p, nothing as St, property as vt, state as f, query as Rt, customElement as Z } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as j } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as W } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as Bt } from "@umbraco-cms/backoffice/modal";
import { A as S, f as C } from "./error-utils-DkyN1ORi.js";
import { UMB_DOCUMENT_PICKER_MODAL as oe } from "@umbraco-cms/backoffice/document";
import { DocumentService as re } from "@umbraco-cms/backoffice/external/backend-api";
import { UMB_NOTIFICATION_CONTEXT as se } from "@umbraco-cms/backoffice/notification";
async function zt() {
  const i = await S.getArticulateBlogArticulateGuidV1();
  if (i.response.ok && i.data)
    return i.data;
  console.error(C(i.error, "API request failed for Articulate Archive UDI"));
}
async function Ft(i) {
  var t;
  try {
    const e = await re.getDocumentById({ id: i });
    return ((t = e == null ? void 0 : e.variants) == null ? void 0 : t[0]) ?? null;
  } catch (e) {
    return console.error(C(e, "Failed to fetch node")), null;
  }
}
async function qt(i, t, e) {
  try {
    const r = await i.open(
      e,
      oe,
      {
        data: {
          multiple: !1,
          pickableFilter: (s) => {
            var a;
            return ((a = s.documentType) == null ? void 0 : a.unique) === t;
          }
        }
      }
    ).onSubmit();
    return !r || !r.selection || !r.selection[0] ? null : r.selection[0];
  } catch (o) {
    return console.error(C(o, "Node picker failed")), null;
  }
}
const Lt = U`
  uui-box {
    margin-top: var(--uui-size-space-6);
    max-width: var(--uui-size-content);
    margin-inline: auto;
  }

  uui-form-layout-item {
    margin-bottom: var(--uui-size-space-4);
  }

  uui-label {
    min-width: var(--uui-size-input-medium);
    font-weight: var(--uui-weight-medium);
  }

  .form-actions {
    margin-top: var(--uui-size-space-6);
    text-align: right;
  }
`;
async function yt(i, t, e, o = !1) {
  const r = await i.getContext(se);
  if (!r) {
    console.error("UMB_NOTIFICATION_CONTEXT not found. Could not display notification.", {
      contextHost: i,
      message: t
    });
    return;
  }
  o ? r.stay(e, {
    data: { message: t }
  }) : r.peek(e, {
    data: { message: t }
  });
}
function $t(i) {
  return p`
    <div slot="header-actions">
      <uui-button
        label="Back to Articulate dashboard options"
        look="outline"
        compact
        href=${i || "/umbraco/section/settings/dashboard/articulate"}
      >
        ← Back
      </uui-button>
    </div>
  `;
}
function bt(i) {
  if (!i)
    return St;
  const { title: t, details: e } = i;
  return p`
    <div
      style="padding: var(--uui-size-space-4); margin-block: 1rem; border: 1px solid var(--uui-color-danger-standalone); color: var(--uui-color-danger); border-radius: var(--uui-border-radius);"
    >
      <strong>${t}</strong>
      ${e.length > 0 ? p`
            <ul style="margin: 0; padding-left: 20px; list-style-position: inside;">
              ${e.map(
    (o) => p`
                  <li>${o}</li>
                `
  )}
            </ul>
          ` : St}
    </div>
  `;
}
var ae = Object.defineProperty, ne = Object.getOwnPropertyDescriptor, Ht = (i) => {
  throw TypeError(i);
}, P = (i, t, e, o) => {
  for (var r = o > 1 ? void 0 : o ? ne(t, e) : t, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(t, e, r) : a(r)) || r);
  return o && r && ae(t, e, r), r;
}, jt = (i, t, e) => t.has(i) || Ht("Cannot " + e), X = (i, t, e) => (jt(i, t, "read from private field"), e ? e.call(i) : t.get(i)), D = (i, t, e) => t.has(i) ? Ht("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(i) : t.set(i, e), le = (i, t, e) => (jt(i, t, "access private method"), e), st, at, nt, Wt, lt, ut;
let _ = class extends j {
  /**
   * Creates an instance of ArticulateBlogMlExporterElement.
   * Sets up the modal manager context.
   */
  constructor() {
    super(), D(this, nt), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = void 0, D(this, st, (i, t) => {
      const e = window.URL.createObjectURL(i), o = document.createElement("a");
      o.style.display = "none", o.href = e, o.download = t, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(e), o.remove();
    }), D(this, at, (i) => i instanceof Blob), D(this, lt, async (i) => {
      if (i.preventDefault(), !!this._form && this._formState !== "waiting") {
        if (this._formState = "waiting", this._formError = null, !this._articulateNodeId) {
          this._formError = { title: "Please select a blog node before exporting.", details: [] }, this._formState = "failed";
          return;
        }
        try {
          await X(this, ut).call(this), this._formState = "success", await yt(this, "BlogML exported successfully!", "positive"), this._handleReset(i);
        } catch (t) {
          this._formError = C(t, "Failed to export blog content."), this._formState = "failed";
        }
      }
    }), D(this, ut, async () => {
      const t = new FormData(this._form).get("embedImages") === "on", e = {
        articulateNodeId: this._articulateNodeId,
        exportImagesAsBase64: t
      }, o = await S.postArticulateBlogExportV1({ body: e });
      if (!o.response.ok || !o.data)
        throw o.error || new Error("Failed to export blog content.");
      const r = o.data;
      if (!X(this, at).call(this, r))
        throw new Error("Failed to receive a valid file from the server.");
      const s = o.response.headers.get("content-disposition");
      let a = "blog-export.xml";
      if (s) {
        const l = s.match(/filename="?([^\"]+)"?/);
        l && l.length > 1 && l[1] && (a = l[1]);
      }
      X(this, st).call(this, r, a);
    }), this._handleReset = (i) => {
      i.preventDefault(), this._form.reset(), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "";
    }, this.consumeContext(Bt, (i) => {
      this._modalManagerContext = i;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await zt(), this._archiveDoctypeUdi === null) {
      this._formState = "failed", this._formError = { title: "Failed to retrieve Articulate Archive document type.", details: [] };
      return;
    }
  }
  /**
   * Opens the Umbraco document picker to select a blog node.
   * Updates the selected node UDI and fetches its name.
   * @private
   * @returns {Promise<void>}
   */
  async _openNodePicker() {
    if (!this._archiveDoctypeUdi)
      return;
    this._formError = null;
    const i = await qt(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (i) {
      const t = await Ft(i);
      if (!t) {
        this._formError = { title: "Selected node not found.", details: [] };
        return;
      }
      this._articulateNodeId = i, this._selectedBlogNodeName = t.name;
    }
  }
  render() {
    return p`
      <uui-box headline="BlogML Exporter">
        ${$t(this.routerPath)}
        <uui-form>
          <form id="blogMlExportForm" @submit=${X(this, lt)} @input=${le(this, nt, Wt)}>
            <uui-form-layout-item>
              <div class="node-picker-container">
                <uui-label for="articulateNodeId" slot="label" required>Articulate blog node</uui-label>
                <uui-input
                  id="articulateNodeId"
                  name="articulateNodeId"
                  placeholder="No node selected"
                  .value=${this._selectedBlogNodeName}
                  readonly
                  required
                  required-message="You must select a blog node"
                  style="flex-grow: 1;"
                ></uui-input>
                <uui-button
                  look="outline"
                  label=${this._articulateNodeId !== "" ? "Change" : "Choose"}
                  @click=${this._openNodePicker}
                ></uui-button>
              </div>
              <div slot="description">Choose the Articulate blog node to export from</div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="embedImages">Embed images?</uui-label>
              <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
              <div slot="description">
                Check if you want to embed images as base64 data in the output file. Useful if your site isn't going to
                be HTTP accessible to the site you will be importing on.
              </div>
            </uui-form-layout-item>
            <uui-button type="submit" look="primary" .state=${this._formState}>Submit</uui-button>
            <uui-button type="button" look="secondary" @click=${this._handleReset}>Reset</uui-button>
          </form>
        </uui-form>
        ${bt(this._formError)}
      </uui-box>
    `;
  }
};
st = /* @__PURE__ */ new WeakMap();
at = /* @__PURE__ */ new WeakMap();
nt = /* @__PURE__ */ new WeakSet();
Wt = function() {
  this._formError = null;
};
lt = /* @__PURE__ */ new WeakMap();
ut = /* @__PURE__ */ new WeakMap();
_.styles = [
  W,
  Lt,
  U`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
    `
];
P([
  vt({ type: String })
], _.prototype, "routerPath", 2);
P([
  f()
], _.prototype, "_formState", 2);
P([
  f()
], _.prototype, "_formError", 2);
P([
  f()
], _.prototype, "_articulateNodeId", 2);
P([
  f()
], _.prototype, "_selectedBlogNodeName", 2);
P([
  Rt("#blogMlExportForm")
], _.prototype, "_form", 2);
_ = P([
  Z("blogml-exporter")
], _);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const B = globalThis, K = B.trustedTypes, Ct = K ? K.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, Vt = "$lit$", b = `lit$${Math.random().toFixed(9).slice(2)}$`, Xt = "?" + b, ue = `<${Xt}>`, N = document, Y = () => N.createComment(""), F = (i) => i === null || typeof i != "object" && typeof i != "function", wt = Array.isArray, ce = (i) => wt(i) || typeof (i == null ? void 0 : i[Symbol.iterator]) == "function", it = `[ 	
\f\r]`, I = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Nt = /-->/g, Pt = />/g, A = RegExp(`>|${it}(?:([^\\s"'>=/]+)(${it}*=${it}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Tt = /'/g, Mt = /"/g, Gt = /^(?:script|style|textarea|title)$/i, q = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), kt = /* @__PURE__ */ new WeakMap(), E = N.createTreeWalker(N, 129);
function Kt(i, t) {
  if (!wt(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ct !== void 0 ? Ct.createHTML(t) : t;
}
const he = (i, t) => {
  const e = i.length - 1, o = [];
  let r, s = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = I;
  for (let l = 0; l < e; l++) {
    const n = i[l];
    let h, d, u = -1, v = 0;
    for (; v < n.length && (a.lastIndex = v, d = a.exec(n), d !== null); ) v = a.lastIndex, a === I ? d[1] === "!--" ? a = Nt : d[1] !== void 0 ? a = Pt : d[2] !== void 0 ? (Gt.test(d[2]) && (r = RegExp("</" + d[2], "g")), a = A) : d[3] !== void 0 && (a = A) : a === A ? d[0] === ">" ? (a = r ?? I, u = -1) : d[1] === void 0 ? u = -2 : (u = a.lastIndex - d[2].length, h = d[1], a = d[3] === void 0 ? A : d[3] === '"' ? Mt : Tt) : a === Mt || a === Tt ? a = A : a === Nt || a === Pt ? a = I : (a = A, r = void 0);
    const $ = a === A && i[l + 1].startsWith("/>") ? " " : "";
    s += a === I ? n + ue : u >= 0 ? (o.push(h), n.slice(0, u) + Vt + n.slice(u) + b + $) : n + b + (u === -2 ? l : $);
  }
  return [Kt(i, s + (i[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), o];
};
class L {
  constructor({ strings: t, _$litType$: e }, o) {
    let r;
    this.parts = [];
    let s = 0, a = 0;
    const l = t.length - 1, n = this.parts, [h, d] = he(t, e);
    if (this.el = L.createElement(h, o), E.currentNode = this.el.content, e === 2 || e === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (r = E.nextNode()) !== null && n.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const u of r.getAttributeNames()) if (u.endsWith(Vt)) {
          const v = d[a++], $ = r.getAttribute(u).split(b), V = /([.?@])?(.*)/.exec(v);
          n.push({ type: 1, index: s, name: V[2], strings: $, ctor: V[1] === "." ? pe : V[1] === "?" ? me : V[1] === "@" ? fe : tt }), r.removeAttribute(u);
        } else u.startsWith(b) && (n.push({ type: 6, index: s }), r.removeAttribute(u));
        if (Gt.test(r.tagName)) {
          const u = r.textContent.split(b), v = u.length - 1;
          if (v > 0) {
            r.textContent = K ? K.emptyScript : "";
            for (let $ = 0; $ < v; $++) r.append(u[$], Y()), E.nextNode(), n.push({ type: 2, index: ++s });
            r.append(u[v], Y());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Xt) n.push({ type: 2, index: s });
      else {
        let u = -1;
        for (; (u = r.data.indexOf(b, u + 1)) !== -1; ) n.push({ type: 7, index: s }), u += b.length - 1;
      }
      s++;
    }
  }
  static createElement(t, e) {
    const o = N.createElement("template");
    return o.innerHTML = t, o;
  }
}
function M(i, t, e = i, o) {
  var a, l;
  if (t === q) return t;
  let r = o !== void 0 ? (a = e._$Co) == null ? void 0 : a[o] : e._$Cl;
  const s = F(t) ? void 0 : t._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== s && ((l = r == null ? void 0 : r._$AO) == null || l.call(r, !1), s === void 0 ? r = void 0 : (r = new s(i), r._$AT(i, e, o)), o !== void 0 ? (e._$Co ?? (e._$Co = []))[o] = r : e._$Cl = r), r !== void 0 && (t = M(i, r._$AS(i, t.values), r, o)), t;
}
class de {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: o } = this._$AD, r = ((t == null ? void 0 : t.creationScope) ?? N).importNode(e, !0);
    E.currentNode = r;
    let s = E.nextNode(), a = 0, l = 0, n = o[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let h;
        n.type === 2 ? h = new Q(s, s.nextSibling, this, t) : n.type === 1 ? h = new n.ctor(s, n.name, n.strings, this, t) : n.type === 6 && (h = new _e(s, this, t)), this._$AV.push(h), n = o[++l];
      }
      a !== (n == null ? void 0 : n.index) && (s = E.nextNode(), a++);
    }
    return E.currentNode = N, r;
  }
  p(t) {
    let e = 0;
    for (const o of this._$AV) o !== void 0 && (o.strings !== void 0 ? (o._$AI(t, o, e), e += o.strings.length - 2) : o._$AI(t[e])), e++;
  }
}
class Q {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, o, r) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = o, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = M(this, t, e), F(t) ? t === c || t == null || t === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : t !== this._$AH && t !== q && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : ce(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== c && F(this._$AH) ? this._$AA.nextSibling.data = t : this.T(N.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var s;
    const { values: e, _$litType$: o } = t, r = typeof o == "number" ? this._$AC(t) : (o.el === void 0 && (o.el = L.createElement(Kt(o.h, o.h[0]), this.options)), o);
    if (((s = this._$AH) == null ? void 0 : s._$AD) === r) this._$AH.p(e);
    else {
      const a = new de(r, this), l = a.u(this.options);
      a.p(e), this.T(l), this._$AH = a;
    }
  }
  _$AC(t) {
    let e = kt.get(t.strings);
    return e === void 0 && kt.set(t.strings, e = new L(t)), e;
  }
  k(t) {
    wt(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let o, r = 0;
    for (const s of t) r === e.length ? e.push(o = new Q(this.O(Y()), this.O(Y()), this, this.options)) : o = e[r], o._$AI(s), r++;
    r < e.length && (this._$AR(o && o._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var o;
    for ((o = this._$AP) == null ? void 0 : o.call(this, !1, !0, e); t && t !== this._$AB; ) {
      const r = t.nextSibling;
      t.remove(), t = r;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class tt {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, o, r, s) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = s, o.length > 2 || o[0] !== "" || o[1] !== "" ? (this._$AH = Array(o.length - 1).fill(new String()), this.strings = o) : this._$AH = c;
  }
  _$AI(t, e = this, o, r) {
    const s = this.strings;
    let a = !1;
    if (s === void 0) t = M(this, t, e, 0), a = !F(t) || t !== this._$AH && t !== q, a && (this._$AH = t);
    else {
      const l = t;
      let n, h;
      for (t = s[0], n = 0; n < s.length - 1; n++) h = M(this, l[o + n], e, n), h === q && (h = this._$AH[n]), a || (a = !F(h) || h !== this._$AH[n]), h === c ? t = c : t !== c && (t += (h ?? "") + s[n + 1]), this._$AH[n] = h;
    }
    a && !r && this.j(t);
  }
  j(t) {
    t === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class pe extends tt {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === c ? void 0 : t;
  }
}
class me extends tt {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== c);
  }
}
class fe extends tt {
  constructor(t, e, o, r, s) {
    super(t, e, o, r, s), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = M(this, t, e, 0) ?? c) === q) return;
    const o = this._$AH, r = t === c && o !== c || t.capture !== o.capture || t.once !== o.once || t.passive !== o.passive, s = t !== c && (o === c || r);
    r && this.element.removeEventListener(this.name, this, o), s && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class _e {
  constructor(t, e, o) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = o;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    M(this, t);
  }
}
const ot = B.litHtmlPolyfillSupport;
ot == null || ot(L, Q), (B.litHtmlVersions ?? (B.litHtmlVersions = [])).push("3.3.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ge = (i) => (...t) => ({ _$litDirective$: i, values: t });
let ve = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, o) {
    this._$Ct = t, this._$AM = e, this._$Ci = o;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ye = {}, $e = (i, t = ye) => i._$AH = t;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const be = ge(class extends ve {
  constructor() {
    super(...arguments), this.key = c;
  }
  render(i, t) {
    return this.key = i, t;
  }
  update(i, [t, e]) {
    return t !== this.key && ($e(i), this.key = t), e;
  }
});
var we = Object.defineProperty, Ae = Object.getOwnPropertyDescriptor, Yt = (i) => {
  throw TypeError(i);
}, y = (i, t, e, o) => {
  for (var r = o > 1 ? void 0 : o ? Ae(t, e) : t, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(t, e, r) : a(r)) || r);
  return o && r && we(t, e, r), r;
}, Jt = (i, t, e) => t.has(i) || Yt("Cannot " + e), T = (i, t, e) => (Jt(i, t, "read from private field"), e ? e.call(i) : t.get(i)), x = (i, t, e) => t.has(i) ? Yt("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(i) : t.set(i, e), xe = (i, t, e) => (Jt(i, t, "access private method"), e), ct, ht, dt, Zt, pt, mt, ft, _t;
let m = class extends j {
  /**
   * Creates an instance of ArticulateBlogMlImporterElement.
   * Sets up the modal manager context and file reader event handlers.
   */
  constructor() {
    super(), x(this, dt), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._postCount = void 0, this._formRenderKey = 0, this._archiveDoctypeUdi = void 0, x(this, ct, (i, t) => {
      const e = window.URL.createObjectURL(i), o = document.createElement("a");
      o.style.display = "none", o.href = e, o.download = t, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(e), o.remove();
    }), x(this, ht, (i) => i instanceof Blob), x(this, pt, async (i) => {
      if (i.preventDefault(), this._formState === "waiting")
        return;
      if (this._formState = "waiting", this._formError = null, this._postCount = void 0, !this._articulateNodeId) {
        this._formError = { title: "Please select a blog node before importing.", details: [] }, this._formState = "failed";
        return;
      }
      if (!this._form) return;
      const t = new FormData(this._form), e = t.get("importFile");
      if (!e) {
        this._formError = { title: "Please select a file to import.", details: [] }, this._formState = "failed";
        return;
      }
      try {
        const o = await T(this, mt).call(this, e);
        this._postCount = o.postCount;
        const r = await T(this, ft).call(this, t, o.temporaryFileName);
        t.get("exportDisqusXml") === "on" && r.commentCount > 0 && await T(this, _t).call(this), this._formState = "success";
        const s = t.get("exportDisqusXml") === "on" && r.commentCount > 0 ? `${r.commentCount} comments exported.` : t.get("exportDisqusXml") === "on" ? "No comments found to export." : "";
        await yt(
          this,
          `BlogML imported successfully! ${r.authorCount} authors, ${this._postCount} posts imported. ${s}`,
          "positive",
          !0
        ), this._handleReset(i);
      } catch (o) {
        this._formError = C(o, "An unexpected error occurred during import."), this._formState = "failed", this._postCount = void 0;
      }
    }), x(this, mt, async (i) => {
      var e, o;
      const t = await S.postArticulateBlogImportBeginV1({ body: { importFile: i } });
      if (!t.response.ok || !((e = t.data) != null && e.temporaryFileName) || !((o = t.data) != null && o.postCount))
        throw t.error || new Error("Failed to upload blog content.");
      return t.data;
    }), x(this, ft, async (i, t) => {
      var r;
      const e = {
        articulateNodeId: this._articulateNodeId,
        overwrite: i.get("overwrite") === "on",
        publish: i.get("publish") === "on",
        regexMatch: i.get("regexMatch") || "",
        regexReplace: i.get("regexReplace") || "",
        tempFile: t,
        exportDisqusXml: i.get("exportDisqusXml") === "on",
        importFirstImage: i.get("importFirstImage") === "on"
      }, o = await S.postArticulateBlogImportV1({ body: e });
      if (!o.response.ok || !((r = o.data) != null && r.completed))
        throw o.error || new Error("Failed to import blog content.");
      return o.data;
    }), x(this, _t, async () => {
      const i = await S.getArticulateBlogExportDisqusV1();
      if (!i.response.ok || !i.data)
        throw i.error || new Error("Failed to export Disqus comments.");
      const t = i.data;
      if (!T(this, ht).call(this, t))
        throw new Error("Invalid file received for Disqus export.");
      const e = i.response.headers.get("content-disposition");
      let o = "disqus-comments.xml";
      if (e) {
        const r = e.match(/filename="?([^\"]+)"?/);
        r && r.length > 1 && r[1] && (o = r[1]);
      }
      T(this, ct).call(this, t, o);
    }), this._handleReset = (i) => {
      i.preventDefault(), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._postCount = void 0, this._formRenderKey++;
    }, this.consumeContext(Bt, (i) => {
      this._modalManagerContext = i;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await zt(), this._archiveDoctypeUdi === null) {
      this._formState = "failed", this._formError = { title: "Failed to retrieve Articulate Archive document type.", details: [] };
      return;
    }
  }
  /**
   * Opens the Umbraco document picker to select a blog node.
   * Updates the selected node UDI and fetches its name.
   * @private
   * @returns {Promise<void>}
   */
  async _openNodePicker() {
    if (!this._archiveDoctypeUdi)
      return;
    this._formError = null;
    const i = await qt(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (i) {
      const t = await Ft(i);
      if (!t) {
        this._formError = { title: "Selected node not found.", details: [] };
        return;
      }
      this._articulateNodeId = i, this._selectedBlogNodeName = t.name;
    }
  }
  render() {
    return p`
      <uui-box headline="BlogML Importer">
        ${$t(this.routerPath)}
        <uui-form>
          ${be(
      this._formRenderKey,
      p`
              <form id="blogMlImportForm" @submit=${T(this, pt)} @input=${xe(this, dt, Zt).call(this)}>
                <uui-form-layout-item>
                  <div class="node-picker-container">
                    <uui-label for="articulateNodeId" slot="label" required>Articulate blog node</uui-label>
                    <uui-input
                      id="articulateNodeId"
                      name="articulateNodeId"
                      placeholder="No node selected"
                      .value=${this._selectedBlogNodeName}
                      readonly
                      required
                      required-message="You must select a blog node"
                      style="flex-grow: 1;"
                    ></uui-input>
                    <uui-button
                      look="outline"
                      label=${this._articulateNodeId ? "Change" : "Choose"}
                      @click=${this._openNodePicker}
                    ></uui-button>
                  </div>
                  <div slot="description">Choose the Articulate blog node to export from</div>
                </uui-form-layout-item>
                <uui-form-layout-item>
                  <uui-label slot="label" for="importFile" required>BlogML import file</uui-label>
                  <uui-input-file
                    id="importFile"
                    accept="text/xml"
                    required
                    required-message="You must select a BlogML file to import"
                    name="importFile"
                  ></uui-input-file>
                  <div slot="description">The XML file to upload for import</div>
                </uui-form-layout-item>
                <uui-form-layout-item>
                  <uui-label slot="label" for="overwrite">Overwrite imported posts?</uui-label>
                  <uui-toggle id="overwrite" name="overwrite"></uui-toggle>
                  <div slot="description">Check if you want to overwrite posts already imported</div>
                </uui-form-layout-item>
                <uui-form-layout-item>
                  <uui-label slot="label" for="publish">Publish all posts?</uui-label>
                  <uui-toggle id="publish" name="publish"></uui-toggle>
                  <div slot="description">Check if you want all imported posts to be published</div>
                </uui-form-layout-item>
                <uui-form-layout-item>
                  <uui-label for="regexMatch" slot="label">Regex match expression</uui-label>
                  <uui-input
                    id="regexMatch"
                    style="--auto-width-text-margin-right: 20px"
                    name="regexMatch"
                    auto-width
                    placeholder="Example to match: (@example.old)"
                  ></uui-input>
                  <div slot="description">
                    Regex statement used to match content in the blog post to be replaced by the match statement. See
                    the Articulate Wiki
                    <a
                      href="https://github.com/Shazwazza/Articulate/wiki/Importing#options"
                      rel="noopener noreferrer nofollow"
                    >
                      Importing
                    </a>
                    page for more information.
                  </div>
                </uui-form-layout-item>
                <uui-form-layout-item>
                  <uui-label for="regexReplace" slot="label">Regex replacement statement</uui-label>
                  <uui-input
                    id="regexReplace"
                    style="--auto-width-text-margin-right: 20px"
                    name="regexReplace"
                    auto-width
                    placeholder="Example replacement: @example.new"
                  ></uui-input>
                  <div slot="description">Replacement statement used with the above match statement</div>
                </uui-form-layout-item>
                <uui-form-layout-item>
                  <uui-label slot="label" for="exportDisqusXml">Export Disqus Xml</uui-label>
                  <uui-toggle id="exportDisqusXml" name="exportDisqusXml"></uui-toggle>
                  <div slot="description">
                    If you would like Articulate to output an XML file that you can use to import the comments found in
                    this file in to Disqus
                  </div>
                </uui-form-layout-item>
                <uui-form-layout-item>
                  <uui-label slot="label" for="importFirstImage">Import First Image from Post Attachments</uui-label>
                  <uui-toggle id="importFirstImage" name="importFirstImage"></uui-toggle>
                  <div slot="description">
                    If you would like Articulate to try and import the first image url in the post attachments
                  </div>
                </uui-form-layout-item>
                <uui-button type="submit" look="primary" .state=${this._formState}>Submit</uui-button>
                <uui-button type="button" look="secondary" @click=${this._handleReset}>Reset</uui-button>
              </form>
            `
    )}
        </uui-form>
        ${this._postCount !== void 0 && this._postCount > 0 ? p`
              <div slot="message">
                <uui-tag look="secondary" color="positive">${this._postCount} posts in uploaded file.</uui-tag>
              </div>
            ` : ""}
        ${bt(this._formError)}
      </uui-box>
    `;
  }
};
ct = /* @__PURE__ */ new WeakMap();
ht = /* @__PURE__ */ new WeakMap();
dt = /* @__PURE__ */ new WeakSet();
Zt = function() {
  this._formError = null;
};
pt = /* @__PURE__ */ new WeakMap();
mt = /* @__PURE__ */ new WeakMap();
ft = /* @__PURE__ */ new WeakMap();
_t = /* @__PURE__ */ new WeakMap();
m.styles = [
  W,
  Lt,
  U`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
    `
];
y([
  vt({ type: String })
], m.prototype, "routerPath", 2);
y([
  f()
], m.prototype, "_formState", 2);
y([
  f()
], m.prototype, "_formError", 2);
y([
  f()
], m.prototype, "_articulateNodeId", 2);
y([
  f()
], m.prototype, "_selectedBlogNodeName", 2);
y([
  f()
], m.prototype, "_postCount", 2);
y([
  f()
], m.prototype, "_formRenderKey", 2);
y([
  Rt("#blogMlImportForm")
], m.prototype, "_form", 2);
m = y([
  Z("blogml-importer")
], m);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ee = (i) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(i, t);
  }) : customElements.define(i, t);
};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const G = globalThis, At = G.ShadowRoot && (G.ShadyCSS === void 0 || G.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Qt = Symbol(), Ut = /* @__PURE__ */ new WeakMap();
let Se = class {
  constructor(t, e, o) {
    if (this._$cssResult$ = !0, o !== Qt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (At && t === void 0) {
      const o = e !== void 0 && e.length === 1;
      o && (t = Ut.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), o && Ut.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Ce = (i) => new Se(typeof i == "string" ? i : i + "", void 0, Qt), Ne = (i, t) => {
  if (At) i.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const o = document.createElement("style"), r = G.litNonce;
    r !== void 0 && o.setAttribute("nonce", r), o.textContent = e.cssText, i.appendChild(o);
  }
}, Ot = At ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const o of t.cssRules) e += o.cssText;
  return Ce(e);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Pe, defineProperty: Te, getOwnPropertyDescriptor: Me, getOwnPropertyNames: ke, getOwnPropertySymbols: Ue, getPrototypeOf: Oe } = Object, w = globalThis, Dt = w.trustedTypes, De = Dt ? Dt.emptyScript : "", rt = w.reactiveElementPolyfillSupport, z = (i, t) => i, J = { toAttribute(i, t) {
  switch (t) {
    case Boolean:
      i = i ? De : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, t) {
  let e = i;
  switch (t) {
    case Boolean:
      e = i !== null;
      break;
    case Number:
      e = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(i);
      } catch {
        e = null;
      }
  }
  return e;
} }, xt = (i, t) => !Pe(i, t), It = { attribute: !0, type: String, converter: J, reflect: !1, useDefault: !1, hasChanged: xt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), w.litPropertyMetadata ?? (w.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class R extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = It) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const o = Symbol(), r = this.getPropertyDescriptor(t, o, e);
      r !== void 0 && Te(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, o) {
    const { get: r, set: s } = Me(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: r, set(a) {
      const l = r == null ? void 0 : r.call(this);
      s == null || s.call(this, a), this.requestUpdate(t, l, o);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? It;
  }
  static _$Ei() {
    if (this.hasOwnProperty(z("elementProperties"))) return;
    const t = Oe(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(z("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(z("properties"))) {
      const e = this.properties, o = [...ke(e), ...Ue(e)];
      for (const r of o) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [o, r] of e) this.elementProperties.set(o, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, o] of this.elementProperties) {
      const r = this._$Eu(e, o);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const o = new Set(t.flat(1 / 0).reverse());
      for (const r of o) e.unshift(Ot(r));
    } else t !== void 0 && e.push(Ot(t));
    return e;
  }
  static _$Eu(t, e) {
    const o = e.attribute;
    return o === !1 ? void 0 : typeof o == "string" ? o : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const o of e.keys()) this.hasOwnProperty(o) && (t.set(o, this[o]), delete this[o]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Ne(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var o;
      return (o = e.hostConnected) == null ? void 0 : o.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var o;
      return (o = e.hostDisconnected) == null ? void 0 : o.call(e);
    });
  }
  attributeChangedCallback(t, e, o) {
    this._$AK(t, o);
  }
  _$ET(t, e) {
    var s;
    const o = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, o);
    if (r !== void 0 && o.reflect === !0) {
      const a = (((s = o.converter) == null ? void 0 : s.toAttribute) !== void 0 ? o.converter : J).toAttribute(e, o.type);
      this._$Em = t, a == null ? this.removeAttribute(r) : this.setAttribute(r, a), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var s, a;
    const o = this.constructor, r = o._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const l = o.getPropertyOptions(r), n = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((s = l.converter) == null ? void 0 : s.fromAttribute) !== void 0 ? l.converter : J;
      this._$Em = r, this[r] = n.fromAttribute(e, l.type) ?? ((a = this._$Ej) == null ? void 0 : a.get(r)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(t, e, o) {
    var r;
    if (t !== void 0) {
      const s = this.constructor, a = this[t];
      if (o ?? (o = s.getPropertyOptions(t)), !((o.hasChanged ?? xt)(a, e) || o.useDefault && o.reflect && a === ((r = this._$Ej) == null ? void 0 : r.get(t)) && !this.hasAttribute(s._$Eu(t, o)))) return;
      this.C(t, e, o);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: o, reflect: r, wrapped: s }, a) {
    o && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), s !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || o || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var o;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [s, a] of this._$Ep) this[s] = a;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [s, a] of r) {
        const { wrapped: l } = a, n = this[s];
        l !== !0 || this._$AL.has(s) || n === void 0 || this.C(s, void 0, a, n);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (o = this._$EO) == null || o.forEach((r) => {
        var s;
        return (s = r.hostUpdate) == null ? void 0 : s.call(r);
      }), this.update(e)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((o) => {
      var r;
      return (r = o.hostUpdated) == null ? void 0 : r.call(o);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
}
R.elementStyles = [], R.shadowRootOptions = { mode: "open" }, R[z("elementProperties")] = /* @__PURE__ */ new Map(), R[z("finalized")] = /* @__PURE__ */ new Map(), rt == null || rt({ ReactiveElement: R }), (w.reactiveElementVersions ?? (w.reactiveElementVersions = [])).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ie = { attribute: !0, type: String, converter: J, reflect: !1, hasChanged: xt }, Re = (i = Ie, t, e) => {
  const { kind: o, metadata: r } = e;
  let s = globalThis.litPropertyMetadata.get(r);
  if (s === void 0 && globalThis.litPropertyMetadata.set(r, s = /* @__PURE__ */ new Map()), o === "setter" && ((i = Object.create(i)).wrapped = !0), s.set(e.name, i), o === "accessor") {
    const { name: a } = e;
    return { set(l) {
      const n = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(a, n, i);
    }, init(l) {
      return l !== void 0 && this.C(a, void 0, i, l), l;
    } };
  }
  if (o === "setter") {
    const { name: a } = e;
    return function(l) {
      const n = this[a];
      t.call(this, l), this.requestUpdate(a, n, i);
    };
  }
  throw Error("Unsupported decorator location: " + o);
};
function te(i) {
  return (t, e) => typeof e == "object" ? Re(i, t, e) : ((o, r, s) => {
    const a = r.hasOwnProperty(s);
    return r.constructor.createProperty(s, o), a ? Object.getOwnPropertyDescriptor(r, s) : void 0;
  })(i, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function et(i) {
  return te({ ...i, state: !0, attribute: !1 });
}
var Be = Object.defineProperty, ze = Object.getOwnPropertyDescriptor, ee = (i) => {
  throw TypeError(i);
}, O = (i, t, e, o) => {
  for (var r = o > 1 ? void 0 : o ? ze(t, e) : t, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(t, e, r) : a(r)) || r);
  return o && r && Be(t, e, r), r;
}, Fe = (i, t, e) => t.has(i) || ee("Cannot " + e), qe = (i, t, e) => (Fe(i, t, "read from private field"), e ? e.call(i) : t.get(i)), Le = (i, t, e) => t.has(i) ? ee("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(i) : t.set(i, e), gt;
let g = class extends j {
  constructor() {
    super(...arguments), this._formState = void 0, this._formError = null, this._themes = [], this._selectedTheme = void 0, this._newThemeName = void 0, Le(this, gt, (i) => {
      this._formError = null, this._newThemeName = i.target.value;
    }), this._handleReset = (i) => {
      i.preventDefault(), this._formState = void 0, this._formError = null, this._selectedTheme = void 0, this._newThemeName = void 0;
    };
  }
  /**
   * Fetches the list of available themes.
   * @private
   */
  async connectedCallback() {
    super.connectedCallback(), await this._loadThemes();
  }
  async _loadThemes() {
    var i;
    try {
      const t = await S.getArticulateThemesDefaultV1();
      if (!t.response.ok || !t.data)
        throw t.error || new Error("Failed to load themes.");
      this._themes = ((i = t.data) == null ? void 0 : i.map((e) => e)) ?? [];
    } catch (t) {
      this._formError = C(t, "Failed to load themes."), this._formState = "failed";
    }
  }
  /**
   * Selects a theme to duplicate.
   * @private
   * @param {string} theme - The name of the theme to select.
   */
  _selectTheme(i) {
    this._formError = null, this._selectedTheme = i, this._newThemeName = `${i} - Copy`;
  }
  _handleSelectThemeButtonClick(i, t) {
    i.stopPropagation(), this._selectTheme(t);
  }
  _onCardSelected(i) {
    const e = i.target.getAttribute("data-theme");
    e && this._selectTheme(e);
  }
  _onCardDeselected(i) {
    const e = i.target.getAttribute("data-theme");
    e && e === this._selectedTheme && (this._selectedTheme = void 0);
  }
  /**
   * Handles form submission for duplicating a theme.
   * @private
   */
  async _duplicateTheme(i) {
    if (this._formState !== "waiting") {
      if (this._formState = "waiting", this._formError = null, !this._selectedTheme || !this._newThemeName) {
        this._formError = { title: "Please select a theme and enter a new theme name.", details: [] };
        return;
      }
      try {
        const t = await S.postArticulateThemesCopyV1({
          body: {
            themeName: this._selectedTheme,
            newThemeName: this._newThemeName
          }
        });
        if (!t.response.ok)
          throw t.error || new Error("Failed to duplicate theme.");
        this._formState = "success", await yt(this, "Theme duplicated successfully!", "positive"), this._handleReset(i);
      } catch (t) {
        this._formError = C(t, "Failed to duplicate theme."), this._formState = "failed";
      }
    }
  }
  /**
   * Renders the theme grid.
   * @private
   * @returns {TemplateResult} The theme grid template.
   */
  _renderThemeGrid() {
    return p`
      <div class="theme-grid">
        ${(this._themes ?? []).map(
      (i) => p`
            <uui-card-media
              class="theme-card"
              .name=${i}
              ?selectable=${this._formState !== "waiting"}
              ?selected=${this._selectedTheme === i}
              selectOnly
              @selected=${this._onCardSelected}
              @deselected=${this._onCardDeselected}
              data-theme=${i}
            >
              <img
                class="theme-preview-img"
                src="/App_Plugins/Articulate/BackOffice/assets/theme-${i.toLowerCase()}.png"
                alt="${i} theme preview"
                loading="lazy"
                @error=${(t) => {
        const e = t.target;
        e.style.display = "none";
        const o = e.parentElement;
        if (o && !o.querySelector(":scope > .theme-fallback-initial")) {
          const r = document.createElement("span");
          r.className = "theme-fallback-initial", r.textContent = i.charAt(0).toUpperCase(), o.appendChild(r);
        }
      }}
              />
              <div slot="actions">
                <uui-button
                  look="primary"
                  label="Select Theme ${i}"
                  @click=${(t) => this._handleSelectThemeButtonClick(t, i)}
                >
                  Select
                </uui-button>
              </div>
            </uui-card-media>
          `
    )}
      </div>
    `;
  }
  /**
   * Renders the duplicate form.
   * @private
   * @returns {TemplateResult} The duplicate form template.
   */
  _renderDuplicateForm() {
    if (!this._selectedTheme)
      return p``;
    const i = this._formState === "waiting" ? "Duplicating..." : "Duplicate";
    return p`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>
        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            id="newThemeName"
            .value=${this._newThemeName}
            @input=${qe(this, gt)}
            required
          ></uui-input>
        </uui-form-layout-item>
        <div class="form-actions">
          <uui-button
            look="primary"
            label=${i}
            type="button"
            @click=${this._duplicateTheme}
            .state=${this._formState}
          >
            ${i}
          </uui-button>
          <uui-button type="button" look="secondary" @click=${this._handleReset}>Reset</uui-button>
        </div>
      </div>
    `;
  }
  render() {
    return p`
      <uui-box headline="Theme Duplication">
        ${$t(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customize them yourself. The duplicated theme will
            be copied to the ~/Views/Articulate folder where you can edit it. Then you can select this theme from the
            themes drop down on your Articulate root node to use it.
          </p>
        </div>
        <div class="container">${this._renderThemeGrid()} ${this._renderDuplicateForm()}</div>
        ${bt(this._formError)}
      </uui-box>
    `;
  }
};
gt = /* @__PURE__ */ new WeakMap();
g.styles = [
  W,
  U`
      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--uui-size-space-4);
        margin: var(--uui-size-space-5) 0;
        justify-content: center;
      }
      .theme-card {
        cursor: pointer;
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 170px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .theme-preview-img {
        width: 100px;
        height: 100px;
        object-fit: contain;
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
        margin-bottom: var(--uui-size-space-2);
      }
      .theme-fallback-initial {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-size: 3rem;
        font-weight: bold;
        color: var(--uui-color-text-alt);
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
      }
      .duplicate-form {
        background: var(--uui-color-surface);
        padding: var(--uui-size-space-4);
        border-radius: var(--uui-border-radius);
        margin-top: var(--uui-size-space-4);
      }
      .form-actions {
        display: flex;
        gap: var(--uui-size-space-3);
        margin-top: var(--uui-size-space-3);
      }
      .container {
        padding-block-start: var(--uui-size-space-3);
      }
      @media (max-width: var(--uui-breakpoint-sm)) {
        :host {
          padding: var(--uui-size-space-3);
        }
        .theme-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
      }
      .no-themes-message {
        color: var(--uui-color-text-danger);
        text-align: center;
        margin-block: var(--uui-size-layout-1);
      }
    `
];
O([
  te({ type: String })
], g.prototype, "routerPath", 2);
O([
  et()
], g.prototype, "_formState", 2);
O([
  et()
], g.prototype, "_formError", 2);
O([
  et()
], g.prototype, "_themes", 2);
O([
  et()
], g.prototype, "_selectedTheme", 2);
g = O([
  Ee("copy-theme")
], g);
var He = Object.defineProperty, je = Object.getOwnPropertyDescriptor, ie = (i, t, e, o) => {
  for (var r = o > 1 ? void 0 : o ? je(t, e) : t, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(t, e, r) : a(r)) || r);
  return o && r && He(t, e, r), r;
};
const We = [
  {
    path: "blogml/import",
    name: "BlogML Import",
    icon: "icon-download-alt",
    description: "Import content from any BlogML compatible platform"
  },
  {
    path: "blogml/export",
    name: "BlogML Export",
    icon: "icon-out",
    description: "Export content to any BlogML compatible platform"
  },
  {
    path: "theme/copy",
    name: "Copy Theme",
    icon: "icon-color-bucket",
    description: "Copy Articulate themes for customization"
  }
];
let k = class extends j {
  constructor() {
    super(...arguments), this.routerPath = "";
  }
  /**
   * Renders the dashboard options grid with navigation cards.
   * @override
   * @returns {TemplateResult} The rendered dashboard options template.
   */
  render() {
    return p`
      <uui-box headline="Options">
        <div class="tools-grid">
          ${We.map((i) => {
      var o;
      const e = `${(o = this.routerPath) == null ? void 0 : o.replace(/\/$/, "")}/${i.path}`;
      return p`
              <uui-card-block-type class="tool-card" name="${i.name}" description="${i.description}" href=${e}>
                <uui-icon name="${i.icon}"></uui-icon>
              </uui-card-block-type>
            `;
    })}
        </div>
      </uui-box>
    `;
  }
};
k.styles = [
  W,
  U`
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--uui-size-space-6);
      }
      .tool-card {
        min-width: 0;
        height: 170px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
      }
      uui-card,
      uui-card-block-type {
        transition: var(--uui-animation-duration) var(--uui-animation-easing);
      }
      @media (max-width: 768px) {
        .tools-grid {
          gap: var(--uui-size-space-4);
        }
      }
    `
];
ie([
  vt({ type: String })
], k.prototype, "routerPath", 2);
k = ie([
  Z("dashboard-options")
], k);
var Ve = Object.defineProperty, Xe = Object.getOwnPropertyDescriptor, Et = (i, t, e, o) => {
  for (var r = o > 1 ? void 0 : o ? Xe(t, e) : t, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(t, e, r) : a(r)) || r);
  return o && r && Ve(t, e, r), r;
};
let H = class extends j {
  constructor() {
    super();
    const i = (t) => (e) => {
      this._routerBasePath && e instanceof t && (e.routerPath = this._routerBasePath);
    };
    this._routes = [
      {
        path: "blogml/import",
        component: m,
        setup: i(m)
      },
      {
        path: "blogml/export",
        component: _,
        setup: i(_)
      },
      {
        path: "theme/copy",
        component: g,
        setup: i(g)
      },
      {
        path: "",
        component: k,
        setup: i(k)
      },
      {
        path: "**",
        component: async () => (await import("@umbraco-cms/backoffice/router")).UmbRouteNotFoundElement
      }
    ];
  }
  render() {
    return p`
      <umb-body-layout>
        <div slot="header" class="header-container">
          <div class="articulate-header">
            <h3 class="header-title">Articulate Management</h3>
            <div class="header-logo">ã</div>
          </div>
        </div>
        <div class="dashboard-container">
          <umb-router-slot
            .routes=${this._routes}
            @init=${(i) => {
      this._routerBasePath = i.target.absoluteRouterPath;
    }}
          ></umb-router-slot>
        </div>
      </umb-body-layout>
    `;
  }
};
H.styles = [
  W,
  U`
      :host {
        display: block;
        padding: var(--uui-size-space-5);
      }

      .header-container {
        width: 100%;
        padding: 0 var(--uui-size-space-3);
      }

      .articulate-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 69px;
        background: var(--uui-color-surface);
        border-radius: var(--uui-border-radius);
        box-shadow: var(--uui-shadow-1);
        box-sizing: border-box;
        padding: 0 2rem;
        margin: 0;
        position: relative;
      }
      .header-title {
        font-size: var(--uui-type-h3-size);
        font-weight: 700;
        letter-spacing: 0.01em;
        color: var(--uui-color-text);
        display: flex;
        align-items: center;
        height: 100%;
      }
      .header-logo {
        font-weight: 900;
        font-size: var(--uui-type-h1-size);
        color: #c44;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
      }
      @media (max-width: 768px) {
        :host {
          padding: var(--uui-size-space-3);
        }
        .articulate-header {
          padding: 1rem 0.7rem;
        }
      }
      .dashboard-container {
        max-width: var(--uui-size-content-large);
        margin: 0 auto;
        padding: 0 var(--uui-size-space-3);
      }
    `
];
Et([
  f()
], H.prototype, "_routerBasePath", 2);
Et([
  f()
], H.prototype, "_routes", 2);
H = Et([
  Z("articulate-dashboard")
], H);
export {
  H as default
};
//# sourceMappingURL=dashboard.element-Yk1XUcTV.js.map
