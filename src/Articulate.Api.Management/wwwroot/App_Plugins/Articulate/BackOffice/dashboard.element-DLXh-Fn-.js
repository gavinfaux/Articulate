import { html as p, nothing as Se, css as T, property as Z, state as d, query as _e, customElement as L } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as W } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as E } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as Ue } from "@umbraco-cms/backoffice/modal";
import { UmbValidationContext as ve } from "@umbraco-cms/backoffice/validation";
import { UMB_AUTH_CONTEXT as Fe } from "@umbraco-cms/backoffice/auth";
import { f as nt, B as Y, T as Re } from "./error-utils-SMIT1h0e.js";
import { UMB_DOCUMENT_PICKER_MODAL as lt } from "@umbraco-cms/backoffice/document";
import { DocumentService as ut } from "@umbraco-cms/backoffice/external/backend-api";
import { UMB_NOTIFICATION_CONTEXT as ct } from "@umbraco-cms/backoffice/notification";
async function He(t) {
  try {
    const e = { id: t };
    return (await ut.getDocumentById(e))?.variants?.[0] ?? null;
  } catch (e) {
    return console.error(e, "Failed to fetch node"), null;
  }
}
async function qe(t) {
  try {
    const i = t.getOpenApiConfiguration()?.token;
    if (typeof i != "function")
      throw new Error("Could not get authorization token function.");
    const o = await i(), s = `/umbraco/management/api/v1/item/document-type/search?${new URLSearchParams({
      query: "Articulate",
      skip: "0",
      take: "1",
      isElement: "false"
    }).toString()}`, a = await fetch(s, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${o}`
      }
    });
    if (!a.ok)
      throw new Error(`API request failed with status ${a.status}`);
    return (await a.json()).items?.[0]?.id ?? void 0;
  } catch (e) {
    console.error("Failed to fetch Articulate document type with custom fetch", e);
    return;
  }
}
async function Le(t, e, i) {
  try {
    const r = await t.open(i, lt, {
      data: {
        multiple: !1,
        pickableFilter: (s) => s.documentType?.unique === e
      }
    }).onSubmit();
    return !r || !r.selection || !r.selection[0] ? null : r.selection[0];
  } catch (o) {
    return console.error(o, "Node picker failed"), null;
  }
}
function f(t, e, i) {
  t._formState = "failed", t._formError = nt(e, i), t.resetState();
}
async function be(t, e, i, o = !1) {
  const r = await t.getContext(ct);
  if (!r) {
    console.error("UMB_NOTIFICATION_CONTEXT not found. Could not display notification.", {
      contextHost: t,
      message: e
    });
    return;
  }
  o ? r.stay(i, {
    data: { message: e }
  }) : r.peek(i, {
    data: { message: e }
  });
}
function ye(t) {
  return p`
    <div slot="header-actions">
      <uui-button
        label="Back to Articulate dashboard options"
        look="outline"
        compact
        href=${t || "/umbraco/section/settings/dashboard/articulate"}>
        ← Back
      </uui-button>
    </div>
  `;
}
function $e(t) {
  if (!t)
    return console.info("At validation event: renderErrorMessage returning nothing as errors object is null"), Se;
  const { title: e, details: i } = t;
  return p`
    <div class="articulate-error-box">
      <strong>${e}</strong>
      ${i.length > 0 ? p`
            <ul class="articulate-error-list">
              ${i.map((o) => p` <li>${o}</li> `)}
            </ul>
          ` : Se}
    </div>
  `;
}
const J = T`
  uui-box {
    margin-top: var(--uui-size-space-6);
    max-width: var(--uui-size-content);
    margin-inline: auto;
  }
`, we = T`
  .container {
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
  uui-input {
    width: auto;
  }
  .form-actions {
    margin-top: var(--uui-size-space-6);
    text-align: right;
  }
`, We = T`
  .node-picker-container {
    display: flex;
    align-items: center;
    gap: var(--uui-size-space-3);
  }
`, xe = T`
  .articulate-error-box {
    padding: var(--uui-size-space-4);
    margin-block: 1rem;
    border: 1px solid var(--uui-color-danger-standalone);
    color: var(--uui-color-danger);
    border-radius: var(--uui-border-radius);
  }

  .articulate-error-list {
    margin: 0;
    padding-left: 20px;
    list-style-position: inside;
  }
`, j = T`
  :host {
    display: block;
    padding: var(--uui-size-space-5);
  }
  @media (max-width: 768px) {
    :host {
      padding: var(--uui-size-space-3);
    }
  }
`;
var ht = Object.defineProperty, dt = Object.getOwnPropertyDescriptor, je = (t) => {
  throw TypeError(t);
}, D = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? dt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && ht(e, i, r), r;
}, mt = (t, e, i) => e.has(t) || je("Cannot " + i), O = (t, e, i) => (mt(t, e, "read from private field"), i ? i.call(t) : e.get(t)), z = (t, e, i) => e.has(t) ? je("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), ie, oe, re, se, ae;
let b = class extends W {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateBlogNode = void 0, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = void 0, z(this, ie, new ve(this)), z(this, oe, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), z(this, re, (t) => t instanceof Blob), z(this, se, async (t) => {
      if (t.preventDefault(), !!this._form) {
        try {
          await O(this, ie).validate();
        } catch (e) {
          f(this, e, "Validation Failed");
          return;
        }
        if (!this._articulateBlogNode) {
          const e = new Error("A blog node must be selected before exporting.");
          e.name = "Validation Error", f(this, e, e.name);
          return;
        }
        if (this._formState !== "waiting") {
          this._formState = "waiting", this._formError = null;
          try {
            await O(this, ae).call(this), this._formState = "success", await be(this, "BlogML exported successfully!", "positive"), this.resetState(!0);
          } catch (e) {
            f(this, e, "Export Failed");
          }
        }
      }
    }), z(this, ae, async () => {
      const e = new FormData(this._form).get("embedImages") === "on", i = {
        articulateBlogNode: this._articulateBlogNode,
        exportImagesAsBase64: e
      }, o = await Y.postArticulateBlogmlExport({ body: i });
      if (!o.response.ok || !o.data)
        throw o.error || new Error("The server returned an invalid response during export.");
      const r = o.data;
      if (!O(this, re).call(this, r))
        throw new Error("The server did not return a file. Please check the server logs.");
      const s = o.response.headers.get("content-disposition");
      let a = "blog-export.xml";
      if (s) {
        const u = s.match(/filename\*="UTF-8''([^"]+)"/);
        if (u && u.length > 1 && u[1])
          a = u[1];
        else {
          const n = s.match(/filename="?([^"]+)"?/);
          n && n.length > 1 && n[1] && (a = n[1]);
        }
      }
      O(this, oe).call(this, r, a);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(Ue, (t) => {
      this._modalManagerContext = t;
    }), this.consumeContext(Fe, (t) => {
      this._authContext = t;
    });
  }
  /**
   * Fetches the Articulate Archive doctype UDI when the component connects.
   * @async
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await qe(this._authContext), this._archiveDoctypeUdi === null) {
      const t = new Error(
        "Could not find the Articulate Archive document type. Please ensure Articulate is installed correctly."
      );
      t.name = "Configuration Error", f(this, t, t.name);
    }
  }
  /**
   * Resets the component's state.
   * @param {boolean} [fullReset=false] If true, performs a full reset of the form and its state.
   */
  resetState(t = !1) {
    t && (this._form?.reset(), this._formState = void 0, this._formError = null, this._articulateBlogNode = void 0, this._selectedBlogNodeName = "");
  }
  /**
   * Opens the Umbraco node picker to select an Articulate blog node.
   * @private
   * @async
   */
  async _openNodePicker() {
    if (!this._archiveDoctypeUdi) return;
    this._formError = null;
    const t = await Le(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await He(t);
      if (!e) {
        f(this, new Error(`Could not find a node with UDI: ${t}`), "Node Not Found");
        return;
      }
      this._articulateBlogNode = t, this._selectedBlogNodeName = e.name;
    }
  }
  get _submitButtonColor() {
    return this._articulateBlogNode ? "positive" : "primary";
  }
  render() {
    return p`
      <uui-box headline="BlogML Exporter" headlinevariant="h2">
        ${ye(this.routerPath)}
        <uui-form>
          <form
            id="blogMlExportForm"
            @submit=${O(this, se)}
            @input=${() => {
      this._formError = null, this._formState = void 0;
    }}>
            <uui-form-validation-message>
              <uui-form-layout-item>
                <div class="node-picker-container">
                  <uui-label for="articulateBlogNode" slot="label" required>Articulate blog node</uui-label>
                  <uui-input
                    id="articulateBlogNode"
                    name="articulateBlogNode"
                    placeholder="No node selected"
                    .value=${this._selectedBlogNodeName}
                    readonly
                    required
                    required-message="You must select a blog node"
                    style="flex-grow: 1;"></uui-input>
                  <uui-button
                    look="outline"
                    label=${this._articulateBlogNode ? "Change" : "Choose"}
                    @click=${this._openNodePicker}></uui-button>
                </div>
                <div slot="description">Choose the Articulate blog node to export from</div>
              </uui-form-layout-item>
              <uui-form-layout-item>
                <uui-label slot="label" for="embedImages">Embed images?</uui-label>
                <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
                <div slot="description">
                  Check if you want to embed images as base64 data in the output file. Useful if your site isn't going
                  to be HTTP accessible to the site you will be importing on.
                </div>
              </uui-form-layout-item>
            </uui-form-validation-message>

            <div class="form-actions">
              <uui-button
                type="submit"
                look="primary"
                .color=${this._submitButtonColor}
                .state=${this._formState}
                label="Submit"></uui-button>
              <uui-button type="reset" look="secondary" label="Reset" @click=${this._handleReset}></uui-button>
            </div>
          </form>
        </uui-form>
        ${this._formError ? $e(this._formError) : ""}
      </uui-box>
    `;
  }
};
ie = /* @__PURE__ */ new WeakMap();
oe = /* @__PURE__ */ new WeakMap();
re = /* @__PURE__ */ new WeakMap();
se = /* @__PURE__ */ new WeakMap();
ae = /* @__PURE__ */ new WeakMap();
b.styles = [
  E,
  E,
  E,
  j,
  J,
  xe,
  we,
  We
];
D([
  Z({ type: String })
], b.prototype, "routerPath", 2);
D([
  d()
], b.prototype, "_formState", 2);
D([
  d()
], b.prototype, "_formError", 2);
D([
  d()
], b.prototype, "_articulateBlogNode", 2);
D([
  d()
], b.prototype, "_selectedBlogNodeName", 2);
D([
  _e("#blogMlExportForm")
], b.prototype, "_form", 2);
b = D([
  L("blogml-exporter")
], b);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ae = globalThis, G = Ae.trustedTypes, Me = G ? G.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Ve = "$lit$", N = `lit$${Math.random().toFixed(9).slice(2)}$`, Xe = "?" + N, pt = `<${Xe}>`, M = document, K = () => M.createComment(""), F = (t) => t === null || typeof t != "object" && typeof t != "function", Ce = Array.isArray, ft = (t) => Ce(t) || typeof t?.[Symbol.iterator] == "function", te = `[ 	
\f\r]`, U = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, De = /-->/g, Pe = />/g, B = RegExp(`>|${te}(?:([^\\s"'>=/]+)(${te}*=${te}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ie = /'/g, Oe = /"/g, Ye = /^(?:script|style|textarea|title)$/i, R = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), ze = /* @__PURE__ */ new WeakMap(), S = M.createTreeWalker(M, 129);
function Ge(t, e) {
  if (!Ce(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Me !== void 0 ? Me.createHTML(e) : e;
}
const gt = (t, e) => {
  const i = t.length - 1, o = [];
  let r, s = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = U;
  for (let u = 0; u < i; u++) {
    const n = t[u];
    let h, m, l = -1, y = 0;
    for (; y < n.length && (a.lastIndex = y, m = a.exec(n), m !== null); ) y = a.lastIndex, a === U ? m[1] === "!--" ? a = De : m[1] !== void 0 ? a = Pe : m[2] !== void 0 ? (Ye.test(m[2]) && (r = RegExp("</" + m[2], "g")), a = B) : m[3] !== void 0 && (a = B) : a === B ? m[0] === ">" ? (a = r ?? U, l = -1) : m[1] === void 0 ? l = -2 : (l = a.lastIndex - m[2].length, h = m[1], a = m[3] === void 0 ? B : m[3] === '"' ? Oe : Ie) : a === Oe || a === Ie ? a = B : a === De || a === Pe ? a = U : (a = B, r = void 0);
    const C = a === B && t[u + 1].startsWith("/>") ? " " : "";
    s += a === U ? n + pt : l >= 0 ? (o.push(h), n.slice(0, l) + Ve + n.slice(l) + N + C) : n + N + (l === -2 ? u : C);
  }
  return [Ge(t, s + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), o];
};
class H {
  constructor({ strings: e, _$litType$: i }, o) {
    let r;
    this.parts = [];
    let s = 0, a = 0;
    const u = e.length - 1, n = this.parts, [h, m] = gt(e, i);
    if (this.el = H.createElement(h, o), S.currentNode = this.el.content, i === 2 || i === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (r = S.nextNode()) !== null && n.length < u; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const l of r.getAttributeNames()) if (l.endsWith(Ve)) {
          const y = m[a++], C = r.getAttribute(l).split(N), V = /([.?@])?(.*)/.exec(y);
          n.push({ type: 1, index: s, name: V[2], strings: C, ctor: V[1] === "." ? vt : V[1] === "?" ? bt : V[1] === "@" ? yt : ee }), r.removeAttribute(l);
        } else l.startsWith(N) && (n.push({ type: 6, index: s }), r.removeAttribute(l));
        if (Ye.test(r.tagName)) {
          const l = r.textContent.split(N), y = l.length - 1;
          if (y > 0) {
            r.textContent = G ? G.emptyScript : "";
            for (let C = 0; C < y; C++) r.append(l[C], K()), S.nextNode(), n.push({ type: 2, index: ++s });
            r.append(l[y], K());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Xe) n.push({ type: 2, index: s });
      else {
        let l = -1;
        for (; (l = r.data.indexOf(N, l + 1)) !== -1; ) n.push({ type: 7, index: s }), l += N.length - 1;
      }
      s++;
    }
  }
  static createElement(e, i) {
    const o = M.createElement("template");
    return o.innerHTML = e, o;
  }
}
function P(t, e, i = t, o) {
  if (e === R) return e;
  let r = o !== void 0 ? i._$Co?.[o] : i._$Cl;
  const s = F(e) ? void 0 : e._$litDirective$;
  return r?.constructor !== s && (r?._$AO?.(!1), s === void 0 ? r = void 0 : (r = new s(t), r._$AT(t, i, o)), o !== void 0 ? (i._$Co ??= [])[o] = r : i._$Cl = r), r !== void 0 && (e = P(t, r._$AS(t, e.values), r, o)), e;
}
class _t {
  constructor(e, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: i }, parts: o } = this._$AD, r = (e?.creationScope ?? M).importNode(i, !0);
    S.currentNode = r;
    let s = S.nextNode(), a = 0, u = 0, n = o[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let h;
        n.type === 2 ? h = new Q(s, s.nextSibling, this, e) : n.type === 1 ? h = new n.ctor(s, n.name, n.strings, this, e) : n.type === 6 && (h = new $t(s, this, e)), this._$AV.push(h), n = o[++u];
      }
      a !== n?.index && (s = S.nextNode(), a++);
    }
    return S.currentNode = M, r;
  }
  p(e) {
    let i = 0;
    for (const o of this._$AV) o !== void 0 && (o.strings !== void 0 ? (o._$AI(e, o, i), i += o.strings.length - 2) : o._$AI(e[i])), i++;
  }
}
class Q {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, o, r) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = o, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && e?.nodeType === 11 && (e = i.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, i = this) {
    e = P(this, e, i), F(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== R && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ft(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && F(this._$AH) ? this._$AA.nextSibling.data = e : this.T(M.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: o } = e, r = typeof o == "number" ? this._$AC(e) : (o.el === void 0 && (o.el = H.createElement(Ge(o.h, o.h[0]), this.options)), o);
    if (this._$AH?._$AD === r) this._$AH.p(i);
    else {
      const s = new _t(r, this), a = s.u(this.options);
      s.p(i), this.T(a), this._$AH = s;
    }
  }
  _$AC(e) {
    let i = ze.get(e.strings);
    return i === void 0 && ze.set(e.strings, i = new H(e)), i;
  }
  k(e) {
    Ce(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let o, r = 0;
    for (const s of e) r === i.length ? i.push(o = new Q(this.O(K()), this.O(K()), this, this.options)) : o = i[r], o._$AI(s), r++;
    r < i.length && (this._$AR(o && o._$AB.nextSibling, r), i.length = r);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
      const o = e.nextSibling;
      e.remove(), e = o;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class ee {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, i, o, r, s) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = i, this._$AM = r, this.options = s, o.length > 2 || o[0] !== "" || o[1] !== "" ? (this._$AH = Array(o.length - 1).fill(new String()), this.strings = o) : this._$AH = c;
  }
  _$AI(e, i = this, o, r) {
    const s = this.strings;
    let a = !1;
    if (s === void 0) e = P(this, e, i, 0), a = !F(e) || e !== this._$AH && e !== R, a && (this._$AH = e);
    else {
      const u = e;
      let n, h;
      for (e = s[0], n = 0; n < s.length - 1; n++) h = P(this, u[o + n], i, n), h === R && (h = this._$AH[n]), a ||= !F(h) || h !== this._$AH[n], h === c ? e = c : e !== c && (e += (h ?? "") + s[n + 1]), this._$AH[n] = h;
    }
    a && !r && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class vt extends ee {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class bt extends ee {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class yt extends ee {
  constructor(e, i, o, r, s) {
    super(e, i, o, r, s), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = P(this, e, i, 0) ?? c) === R) return;
    const o = this._$AH, r = e === c && o !== c || e.capture !== o.capture || e.once !== o.once || e.passive !== o.passive, s = e !== c && (o === c || r);
    r && this.element.removeEventListener(this.name, this, o), s && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class $t {
  constructor(e, i, o) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = o;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    P(this, e);
  }
}
const wt = Ae.litHtmlPolyfillSupport;
wt?.(H, Q), (Ae.litHtmlVersions ??= []).push("3.3.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xt = (t) => (...e) => ({ _$litDirective$: t, values: e });
let At = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, i, o) {
    this._$Ct = e, this._$AM = i, this._$Ci = o;
  }
  _$AS(e, i) {
    return this.update(e, i);
  }
  update(e, i) {
    return this.render(...i);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ct = {}, Nt = (t, e = Ct) => t._$AH = e;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Et = xt(class extends At {
  constructor() {
    super(...arguments), this.key = c;
  }
  render(t, e) {
    return this.key = t, e;
  }
  update(t, [e, i]) {
    return e !== this.key && (Nt(t), this.key = e), i;
  }
});
var Tt = Object.defineProperty, kt = Object.getOwnPropertyDescriptor, Ke = (t) => {
  throw TypeError(t);
}, A = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? kt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && Tt(e, i, r), r;
}, Bt = (t, e, i) => e.has(t) || Ke("Cannot " + i), $ = (t, e, i) => (Bt(t, e, "read from private field"), i ? i.call(t) : e.get(t)), w = (t, e, i) => e.has(t) ? Ke("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), ne, le, ue, ce, he, de, me, pe, fe;
let g = class extends W {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateBlogNode = void 0, this._selectedBlogNodeName = "", this._postCount = void 0, this._formRenderKey = 0, this._archiveDoctypeUdi = void 0, w(this, ne, new ve(this)), w(this, le, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), w(this, ue, (t) => t instanceof Blob), w(this, ce, (t) => typeof t == "object" && t !== null && "temporaryFileName" in t && typeof t.temporaryFileName == "string" && "postCount" in t && typeof t.postCount == "number"), w(this, he, (t) => typeof t == "object" && t !== null && "postCount" in t && "authorCount" in t && "commentCount" in t && "completed" in t), w(this, de, async (t) => {
      if (t.preventDefault(), !this._form) return;
      try {
        await $(this, ne).validate();
      } catch (s) {
        f(this, s, "Validation Failed");
        return;
      }
      const e = new FormData(this._form), i = e.get("importFile"), r = [
        {
          isValid: !!this._articulateBlogNode,
          message: "A blog node must be selected before importing."
        },
        {
          isValid: i && i.size > 0,
          message: "A BlogML file must be selected for import."
        }
      ].find((s) => !s.isValid);
      if (r) {
        const s = new Error(r.message);
        s.name = "Validation Error", f(this, s, s.name);
        return;
      }
      if (this._formState !== "waiting") {
        this._formState = "waiting", this._formError = null, this._postCount = void 0;
        try {
          const s = await $(this, me).call(this, i);
          this._postCount = s.postCount, this.requestUpdate("_postCount");
          const a = await $(this, pe).call(this, e, s.temporaryFileName);
          e.get("exportDisqusXml") === "on" && a.commentCount > 0 && await $(this, fe).call(this), this._formState = "success";
          const u = e.get("exportDisqusXml") === "on" && a.commentCount > 0 ? `${a.commentCount} comments exported.` : e.get("exportDisqusXml") === "on" ? "No comments found to export." : "";
          await be(
            this,
            `BlogML imported successfully! ${a.authorCount} authors, ${this._postCount} posts imported. ${u}`,
            "positive",
            !0
          ), this.resetState(!0);
        } catch (s) {
          f(this, s, "Import Failed");
        }
      }
    }), w(this, me, async (t) => {
      const e = await Y.postArticulateBlogmlImportFile({ body: { importFile: t } });
      if (!e.response.ok || !$(this, ce).call(this, e.data))
        throw e.error || new Error("The server returned an invalid response when uploading the file.");
      if (!e.data.temporaryFileName || e.data.postCount <= 0)
        throw new Error("The blog import file appears to be empty or invalid.");
      return e.data;
    }), w(this, pe, async (t, e) => {
      const i = {
        articulateBlogNode: this._articulateBlogNode,
        overwrite: t.get("overwrite") === "on",
        publish: t.get("publish") === "on",
        regexMatch: t.get("regexMatch") || "",
        regexReplace: t.get("regexReplace") || "",
        tempFile: e,
        exportDisqusXml: t.get("exportDisqusXml") === "on",
        importFirstImage: t.get("importFirstImage") === "on"
      }, o = await Y.postArticulateBlogmlImport({ body: i });
      if (!o.response.ok || !$(this, he).call(this, o.data))
        throw o.error || new Error("The server returned an invalid response when finalizing the import.");
      if (!o.data.completed)
        throw new Error("The server indicated that the import failed to complete.");
      return o.data;
    }), w(this, fe, async () => {
      const t = await Y.getArticulateBlogmlExportDisqus();
      if (!t.response.ok || !t.data)
        throw t.error || new Error("Failed to export Disqus comments.");
      const e = t.data;
      if (!$(this, ue).call(this, e))
        throw new Error("Invalid file received for Disqus export.");
      const i = t.response.headers.get("content-disposition");
      let o = "disqus-comments.xml";
      if (i) {
        const r = i.match(/filename\*="UTF-8''([^"]+)"/);
        if (r && r.length > 1 && r[1])
          o = r[1];
        else {
          const s = i.match(/filename="?([^"]+)"?/);
          s && s.length > 1 && s[1] && (o = s[1]);
        }
      }
      $(this, le).call(this, e, o);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(Ue, (t) => {
      this._modalManagerContext = t;
    }), this.consumeContext(Fe, (t) => {
      this._authContext = t;
    });
  }
  /**
   * Fetches the Articulate Archive doctype UDI when the component connects.
   * @async
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await qe(this._authContext), this._archiveDoctypeUdi === null) {
      const t = new Error(
        "Could not find the Articulate Archive document type. Please ensure Articulate is installed correctly."
      );
      t.name = "Configuration Error", f(this, t, t.name);
    }
  }
  /**
   * Resets the component's state.
   * @param {boolean} [fullReset=false] If true, performs a full reset of the form and its state.
   */
  resetState(t = !1) {
    this._postCount = void 0, t && (this._formState = void 0, this._formError = null, this._articulateBlogNode = void 0, this._selectedBlogNodeName = "", this._formRenderKey++);
  }
  /**
   * Opens the Umbraco node picker to select an Articulate blog node.
   * @private
   * @async
   */
  async _openNodePicker() {
    if (!this._archiveDoctypeUdi) return;
    this._formError = null;
    const t = await Le(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await He(t);
      if (!e) {
        f(this, new Error(`Could not find a node with UDI: ${t}`), "Node Not Found");
        return;
      }
      this._articulateBlogNode = t, this._selectedBlogNodeName = e.name;
    }
  }
  render() {
    return p`
      <uui-box headline="BlogML Importer" headlinevariant="h2">
        ${ye(this.routerPath)}
        <uui-form>
          ${Et(
      this._formRenderKey,
      p`
              <form
                id="blogMlImportForm"
                @submit=${$(this, de)}
                @input=${() => {
        this._formError = null, this._formState = void 0;
      }}>
                <uui-form-validation-message>
                  <uui-form-layout-item>
                    <div class="node-picker-container">
                      <uui-label for="articulateBlogNode" slot="label" required>Articulate blog node</uui-label>
                      <uui-input
                        id="articulateBlogNode"
                        name="articulateBlogNode"
                        placeholder="No node selected"
                        .value=${this._selectedBlogNodeName}
                        readonly
                        required
                        required-message="You must select a blog node"
                        style="flex-grow: 1;"></uui-input>
                      <uui-button
                        look="outline"
                        label=${this._articulateBlogNode ? "Change" : "Choose"}
                        @click=${this._openNodePicker}></uui-button>
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
                      tabindex="0"></uui-input-file>
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
                      placeholder="Example to match: (@example.old)"></uui-input>
                    <div slot="description">
                      Regex statement used to match content in the blog post to be replaced by the match statement. See
                      the Articulate Wiki Importing page for more information.
                    </div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label for="regexReplace" slot="label">Regex replacement statement</uui-label>
                    <uui-input
                      id="regexReplace"
                      style="--auto-width-text-margin-right: 20px"
                      name="regexReplace"
                      auto-width
                      placeholder="Example replacement: @example.new"></uui-input>
                    <div slot="description">Replacement statement used with the above match statement</div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="exportDisqusXml">Export Disqus Xml</uui-label>
                    <uui-toggle id="exportDisqusXml" name="exportDisqusXml"></uui-toggle>
                    <div slot="description">
                      If you would like Articulate to output an XML file that you can use to import the comments found
                      in this file in to Disqus
                    </div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="importFirstImage">Import First Image from Post Attachments</uui-label>
                    <uui-toggle id="importFirstImage" name="importFirstImage"></uui-toggle>
                    <div slot="description">
                      If you would like Articulate to try and import the first image url in the post attachments
                    </div>
                  </uui-form-layout-item>
                </uui-form-validation-message>
                <div class="form-actions">
                  ${this._postCount !== void 0 && this._postCount > 0 ? p`
                        <uui-tag look="secondary" color="positive" style="margin-right: 1em;">
                          ${this._postCount} posts in uploaded file.
                        </uui-tag>
                      ` : ""}
                  <uui-button type="submit" look="primary" .state=${this._formState} color="primary" label="Submit">
                    Submit
                  </uui-button>
                  <uui-button type="button" look="secondary" @click=${this._handleReset} label="Reset">
                    Reset
                  </uui-button>
                </div>
              </form>
            `
    )}
        </uui-form>

        ${this._formError ? $e(this._formError) : ""}
      </uui-box>
    `;
  }
};
ne = /* @__PURE__ */ new WeakMap();
le = /* @__PURE__ */ new WeakMap();
ue = /* @__PURE__ */ new WeakMap();
ce = /* @__PURE__ */ new WeakMap();
he = /* @__PURE__ */ new WeakMap();
de = /* @__PURE__ */ new WeakMap();
me = /* @__PURE__ */ new WeakMap();
pe = /* @__PURE__ */ new WeakMap();
fe = /* @__PURE__ */ new WeakMap();
g.styles = [
  E,
  E,
  j,
  J,
  xe,
  we,
  We
];
A([
  Z({ type: String })
], g.prototype, "routerPath", 2);
A([
  d()
], g.prototype, "_formState", 2);
A([
  d()
], g.prototype, "_formError", 2);
A([
  d()
], g.prototype, "_articulateBlogNode", 2);
A([
  d()
], g.prototype, "_selectedBlogNodeName", 2);
A([
  d()
], g.prototype, "_postCount", 2);
A([
  d()
], g.prototype, "_formRenderKey", 2);
A([
  _e("#blogMlImportForm")
], g.prototype, "_form", 2);
g = A([
  L("blogml-importer")
], g);
var St = Object.defineProperty, Mt = Object.getOwnPropertyDescriptor, Ze = (t) => {
  throw TypeError(t);
}, k = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Mt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && St(e, i, r), r;
}, Je = (t, e, i) => e.has(t) || Ze("Cannot " + i), ge = (t, e, i) => (Je(t, e, "read from private field"), i ? i.call(t) : e.get(t)), X = (t, e, i) => e.has(t) ? Ze("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), x = (t, e, i) => (Je(t, e, "access private method"), i), Ne, v, Qe, Ee, et, tt, it, Te, ot, ke, rt, st;
let _ = class extends W {
  constructor() {
    super(...arguments), X(this, v), this._formState = void 0, this._formError = null, this._themes = [], this._selectedTheme = void 0, this._themeName = void 0, X(this, Ne, new ve(this)), X(this, Te, (t) => {
      this._formError = null, this._formState = void 0, this._themeName = t.target.value;
    }), X(this, ke, (t) => {
      t.preventDefault(), this.resetState(!0);
    });
  }
  /**
   * Loads the list of themes when the component is connected to the DOM.
   * @async
   */
  async connectedCallback() {
    super.connectedCallback(), await x(this, v, Qe).call(this);
  }
  /**
   * Resets the component's state.
   * @param {boolean} [fullReset=false] If true, performs a full reset, clearing the selected theme and form state.
   */
  resetState(t = !1) {
    t && (this._formState = void 0, this._formError = null, this._selectedTheme = void 0, this._themeName = void 0);
  }
  get _submitButtonColor() {
    return this._selectedTheme && this._themeName ? "positive" : "primary";
  }
  render() {
    return p`
      <uui-box headline="Theme Options">
        ${ye(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customise them yourself. The duplicated theme will
            be copied to the ~/Views/Articulate folder where you can edit it. Then you can select this theme from the
            themes drop down on your Articulate root node to use it.
          </p>
        </div>
        <div class="container">${x(this, v, rt).call(this)} ${x(this, v, st).call(this)}</div>
        ${this._formError ? $e(this._formError) : ""}
      </uui-box>
    `;
  }
};
Ne = /* @__PURE__ */ new WeakMap();
v = /* @__PURE__ */ new WeakSet();
Qe = async function() {
  try {
    const t = await Re.getArticulateThemeDefault();
    if (!t.response.ok || !t.data)
      throw t.error || new Error("The list of themes could not be retrieved from the server.");
    this._themes = t.data?.map((e) => e) ?? [];
  } catch (t) {
    f(this, t, "Could not load themes");
  }
};
Ee = function(t) {
  this.resetState(!0), this._selectedTheme = t, this._themeName = `Custom${t}Theme`;
};
et = function(t, e) {
  t.stopPropagation(), x(this, v, Ee).call(this, e);
};
tt = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && x(this, v, Ee).call(this, i);
};
it = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && i === this._selectedTheme && this.resetState(!0);
};
Te = /* @__PURE__ */ new WeakMap();
ot = async function(t) {
  if (t.preventDefault(), !!this._form) {
    try {
      await ge(this, Ne).validate();
    } catch (e) {
      f(this, e, "Validation Failed");
      return;
    }
    if (!this._selectedTheme || !this._themeName) {
      const e = new Error("Please select a theme to copy and provide the theme name.");
      e.name = "Validation Error", f(this, e, e.name);
      return;
    }
    if (this._formState !== "waiting") {
      this._formState = "waiting", this._formError = null;
      try {
        const e = await Re.postArticulateThemeCopy({
          body: {
            themeName: this._selectedTheme,
            newThemeName: this._themeName
          }
        });
        if (!e.response.ok)
          throw e.error || new Error("Failed to copy theme.");
        this._formState = "success", await be(this, "Theme copied successfully!", "positive"), this.resetState(!0);
      } catch (e) {
        f(this, e, "Copy Failed");
      }
    }
  }
};
ke = /* @__PURE__ */ new WeakMap();
rt = function() {
  return p`
      <div class="theme-grid">
        ${(this._themes ?? []).map(
    (t) => p`
            <uui-card-media
              class="theme-card"
              .name=${t}
              ?selectable=${this._formState !== "waiting"}
              ?selected=${this._selectedTheme === t}
              selectOnly
              @selected=${x(this, v, tt)}
              @deselected=${x(this, v, it)}
              data-theme=${t}
              role="radio"
              aria-checked=${this._selectedTheme === t}
              aria-label=${`Select theme ${t}`}
              tabindex="0">
              <img
                class="theme-preview-img"
                src="/App_Plugins/Articulate/BackOffice/assets/theme-${t.toLowerCase()}.png"
                alt="${t} theme preview"
                loading="lazy"
                @error=${(e) => {
      const i = e.target;
      i.style.display = "none";
      const o = i.parentElement;
      if (o && !o.querySelector(":scope > .theme-fallback-initial")) {
        const r = document.createElement("span");
        r.className = "theme-fallback-initial", r.textContent = t.charAt(0).toUpperCase(), o.appendChild(r);
      }
    }} />
              <div slot="actions">
                <uui-button
                  look="primary"
                  label="Select Theme ${t}"
                  @click=${(e) => x(this, v, et).call(this, e, t)}>
                  Select
                </uui-button>
              </div>
            </uui-card-media>
          `
  )}
      </div>
    `;
};
st = function() {
  return this._selectedTheme ? p`
      <div class="duplicate-form">
        <h3>Copy '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customise.</p>
        <uui-form>
          <form
            @submit=${x(this, v, ot)}
            @input=${() => {
    this._formError = null, this._formState = void 0;
  }}>
            <uui-form-validation-message>
              <uui-form-layout-item>
                <uui-label for="themeName" slot="label" required>Theme name</uui-label>
                <uui-input
                  id="themeName"
                  name="themeName"
                  .value=${this._themeName ?? ""}
                  @input=${ge(this, Te)}
                  required
                  required-message="You must provide a name for the theme."
                  label="Theme name"></uui-input>
              </uui-form-layout-item>
            </uui-form-validation-message>
            <div class="form-actions">
              <uui-button
                id="duplicateButton"
                type="submit"
                look="primary"
                .color=${this._submitButtonColor}
                .state=${this._formState}>
                Create Theme
              </uui-button>
              <uui-button id="cancelButton" type="reset" look="secondary" @click=${ge(this, ke)}>
                Cancel
              </uui-button>
            </div>
          </form>
        </uui-form>
      </div>
    ` : p``;
};
_.styles = [
  E,
  j,
  J,
  xe,
  we,
  T`
      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--uui-size-space-6);
        margin-bottom: var(--uui-size-space-6);
      }
      .theme-card {
        cursor: pointer;
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 250px;
        aspect-ratio: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .theme-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
        transition: all 0.2s ease;
      }
      .theme-preview-img {
        border-bottom: 1px solid var(--uui-color-border);
        object-fit: none;
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
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
        margin-top: var(--uui-size-space-6);
        border-top: 1px solid var(--uui-color-divider);
        padding: var(--uui-size-space-3);
      }

      .duplicate-form h3 {
        margin-top: 0;
      }
    `
];
k([
  Z({ type: String })
], _.prototype, "routerPath", 2);
k([
  d()
], _.prototype, "_formState", 2);
k([
  d()
], _.prototype, "_formError", 2);
k([
  d()
], _.prototype, "_themes", 2);
k([
  d()
], _.prototype, "_selectedTheme", 2);
k([
  d()
], _.prototype, "_themeName", 2);
k([
  _e("form")
], _.prototype, "_form", 2);
_ = k([
  L("theme-options")
], _);
var Dt = Object.defineProperty, Pt = Object.getOwnPropertyDescriptor, at = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Pt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && Dt(e, i, r), r;
};
const It = [
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
    path: "theme/options",
    name: "Theme Options",
    icon: "icon-color-bucket",
    description: "Create or customise Articulate themes"
  }
];
let I = class extends W {
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
      <uui-box headline="Articulate Options" headlinevariant="h2">
        <div slot="header-actions">
          <uui-button look="default" compact href="https://github.com/Shazwazza/Articulate/wiki" label="Wiki">
            <uui-icon name="icon-help-alt" label="Wiki"></uui-icon>
          </uui-button>
        </div>
        <div class="tools-grid">
          ${It.map((t) => {
      const i = `${this.routerPath?.replace(/\/$/, "")}/${t.path}`;
      return p`
              <uui-card-block-type class="tool-card" name="${t.name}" description="${t.description}" href=${i}>
                <uui-icon name="${t.icon}"></uui-icon>
              </uui-card-block-type>
            `;
    })}
        </div>
      </uui-box>
    `;
  }
};
I.styles = [
  E,
  j,
  J,
  T`
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--uui-size-space-4);
      }

      [slot='header-actions'] {
        display: flex;
        gap: var(--uui-size-space-2);
      }

      [slot='header-actions'] > uui-button {
        font-size: var(--uui-size-6, 18px);
      }

      .tool-card {
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 250px;
        aspect-ratio: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .tool-card uui-icon {
        font-size: var(--uui-size-12, 36px);
        margin-top: var(--uui-size-space-6);
      }
      .tool-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
        transition: all 0.2s ease;
      }
    `
];
at([
  Z({ type: String })
], I.prototype, "routerPath", 2);
I = at([
  L("dashboard-options")
], I);
var Ot = Object.defineProperty, zt = Object.getOwnPropertyDescriptor, Be = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? zt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && Ot(e, i, r), r;
};
let q = class extends W {
  constructor() {
    super();
    const t = (e) => (i) => {
      this._routerBasePath && i instanceof e && (i.routerPath = this._routerBasePath);
    };
    this._routes = [
      {
        path: "blogml/import",
        component: g,
        setup: t(g)
      },
      {
        path: "blogml/export",
        component: b,
        setup: t(b)
      },
      {
        path: "theme/options",
        component: _,
        setup: t(_)
      },
      {
        path: "",
        component: I,
        setup: t(I)
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
            <h1 class="header-title">Articulate Management</h1>
            <div class="header-logo">ã</div>
          </div>
        </div>
        <div class="dashboard-container">
          <umb-router-slot
            .routes=${this._routes}
            @init=${(t) => {
      this._routerBasePath = t.target.absoluteRouterPath;
    }}></umb-router-slot>
        </div>
        <footer slot="footer">
          <p slot="footer-info" class="articulate-footer-info">Articulate | Version: ${"6.0.0-g7d1e78c87c"}</p>
        </footer>
      </umb-body-layout>
    `;
  }
};
q.styles = [
  E,
  j,
  T`
      .dashboard-container {
        max-width: var(--uui-size-content-large);
        margin: 0 auto;
        padding: 0 var(--uui-size-space-3);
      }

      .header-container {
        width: 100%;
        padding: 0 var(--uui-size-space-3);
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
      .articulate-footer-info {
        text-align: right;
        font-size: 0.8em;
        color: var(--uui-color-border-standalone);
      }

      @media (max-width: 768px) {
        .articulate-header {
          padding: 1rem 0.7rem;
        }
      }
    `
];
Be([
  d()
], q.prototype, "_routerBasePath", 2);
Be([
  d()
], q.prototype, "_routes", 2);
q = Be([
  L("articulate-dashboard")
], q);
export {
  q as default
};
//# sourceMappingURL=dashboard.element-DLXh-Fn-.js.map
