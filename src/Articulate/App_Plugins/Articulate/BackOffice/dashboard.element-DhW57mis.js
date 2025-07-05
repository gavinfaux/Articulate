import { html as p, nothing as Ne, css as C, property as Z, state as h, query as pe, customElement as q } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as L } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as N } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as De } from "@umbraco-cms/backoffice/modal";
import { f as tt, B as Y, T as Be } from "./error-utils-BQkI2uUw.js";
import { UMB_DOCUMENT_PICKER_MODAL as it } from "@umbraco-cms/backoffice/document";
import { DocumentTypeService as ot, DocumentService as rt } from "@umbraco-cms/backoffice/external/backend-api";
import { UMB_NOTIFICATION_CONTEXT as st } from "@umbraco-cms/backoffice/notification";
async function Pe(t) {
  var e;
  try {
    const i = await rt.getDocumentById({ id: t });
    return ((e = i == null ? void 0 : i.variants) == null ? void 0 : e[0]) ?? null;
  } catch (i) {
    return console.error(i, "Failed to fetch node"), null;
  }
}
async function ze() {
  var t, e;
  try {
    const i = await ot.getItemDocumentTypeSearch({ query: "Articulate", skip: 0, take: 1, isElement: !1 });
    return ((e = (t = i == null ? void 0 : i.items) == null ? void 0 : t[0]) == null ? void 0 : e.id) ?? void 0;
  } catch (i) {
    console.error(i, "Failed to fetch Articulate document type");
    return;
  }
}
async function Oe(t, e, i) {
  try {
    const r = await t.open(
      i,
      it,
      {
        data: {
          multiple: !1,
          pickableFilter: (s) => {
            var a;
            return ((a = s.documentType) == null ? void 0 : a.unique) === e;
          }
        }
      }
    ).onSubmit();
    return !r || !r.selection || !r.selection[0] ? null : r.selection[0];
  } catch (o) {
    return console.error(o, "Node picker failed"), null;
  }
}
function f(t, e, i) {
  t._formState = "failed", t._formError = tt(e, i), t.resetState();
}
async function fe(t, e, i, o = !1) {
  const r = await t.getContext(st);
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
function _e(t) {
  return p`
    <div slot="header-actions">
      <uui-button
        label="Back to Articulate dashboard options"
        look="outline"
        compact
        href=${t || "/umbraco/section/settings/dashboard/articulate"}
      >
        ← Back
      </uui-button>
    </div>
  `;
}
function ge(t) {
  if (!t)
    return console.info("At validation event: renderErrorMessage returning nothing as errors object is null"), Ne;
  const { title: e, details: i } = t;
  return p`
    <div class="articulate-error-box">
      <strong>${e}</strong>
      ${i.length > 0 ? p`
            <ul class="articulate-error-list">
              ${i.map(
    (o) => p`
                  <li>${o}</li>
                `
  )}
            </ul>
          ` : Ne}
    </div>
  `;
}
const J = C`
  uui-box {
    margin-top: var(--uui-size-space-6);
    max-width: var(--uui-size-content);
    margin-inline: auto;
  }
`, ve = C`
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
`, Re = C`
  .node-picker-container {
    display: flex;
    align-items: center;
    gap: var(--uui-size-space-3);
  }
`, be = C`
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
`, W = C`
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
var at = Object.defineProperty, nt = Object.getOwnPropertyDescriptor, Fe = (t) => {
  throw TypeError(t);
}, M = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? nt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && at(e, i, r), r;
}, lt = (t, e, i) => e.has(t) || Fe("Cannot " + i), j = (t, e, i) => (lt(t, e, "read from private field"), i ? i.call(t) : e.get(t)), X = (t, e, i) => e.has(t) ? Fe("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), re, se, ae, ne;
let b = class extends L {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = void 0, X(this, re, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), X(this, se, (t) => t instanceof Blob), X(this, ae, async (t) => {
      if (t.preventDefault(), !!this._form) {
        if (!this._articulateNodeId) {
          const e = new Error("A blog node must be selected before exporting.");
          e.name = "Validation Error", f(this, e, e.name);
          return;
        }
        if (!this._form.reportValidity()) {
          const e = new Error("The form is not valid. Please check the fields marked with an error.");
          e.name = "Validation Error", f(this, e, e.name);
          return;
        }
        if (this._formState !== "waiting") {
          this._formState = "waiting", this._formError = null;
          try {
            await j(this, ne).call(this), this._formState = "success", await fe(this, "BlogML exported successfully!", "positive"), this.resetState(!0);
          } catch (e) {
            f(this, e, "Export Failed");
          }
        }
      }
    }), X(this, ne, async () => {
      const e = new FormData(this._form).get("embedImages") === "on", i = {
        articulateBlogNode: this._articulateNodeId,
        exportImagesAsBase64: e
      }, o = await Y.postArticulateBlogmlExport({ body: i });
      if (!o.response.ok || !o.data)
        throw o.error || new Error("The server returned an invalid response during export.");
      const r = o.data;
      if (!j(this, se).call(this, r))
        throw new Error("The server did not return a file. Please check the server logs.");
      const s = o.response.headers.get("content-disposition");
      let a = "blog-export.xml";
      if (s) {
        const u = s.match(/filename="?([^"]+)"?/);
        u && u.length > 1 && u[1] && (a = u[1]);
      }
      j(this, re).call(this, r, a);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(De, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Fetches the Articulate Archive doctype UDI when the component connects.
   * @async
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await ze(), this._archiveDoctypeUdi === null) {
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
    var e;
    t && ((e = this._form) == null || e.reset(), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "");
  }
  /**
   * Opens the Umbraco node picker to select an Articulate blog node.
   * @private
   * @async
   */
  async _openNodePicker() {
    if (!this._archiveDoctypeUdi) return;
    this._formError = null;
    const t = await Oe(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await Pe(t);
      if (!e) {
        f(this, new Error(`Could not find a node with UDI: ${t}`), "Node Not Found");
        return;
      }
      this._articulateNodeId = t, this._selectedBlogNodeName = e.name;
    }
  }
  get _submitButtonColor() {
    return this._articulateNodeId ? "positive" : "primary";
  }
  render() {
    return p`
      <uui-box headline="BlogML Exporter">
        ${_e(this.routerPath)}
        <uui-form>
          <form
            id="blogMlExportForm"
            @submit=${j(this, ae)}
            @input=${() => {
      this._formError = null, this._formState = void 0;
    }}
          >
            <uui-validation-message>
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
                <uui-label slot="label" for="embedImages">Embed images?</uui-label>
                <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
                <div slot="description">
                  Check if you want to embed images as base64 data in the output file. Useful if your site isn't going
                  to be HTTP accessible to the site you will be importing on.
                </div>
              </uui-form-layout-item>
            </uui-validation-message>

            <div class="form-actions">
              <uui-button
                type="submit"
                look="primary"
                .color=${this._submitButtonColor}
                .state=${this._formState}
                label="Submit"
              ></uui-button>
              <uui-button type="reset" look="secondary" label="Reset" @click=${this._handleReset}></uui-button>
            </div>
          </form>
        </uui-form>
        ${this._formError ? ge(this._formError) : ""}
      </uui-box>
    `;
  }
};
re = /* @__PURE__ */ new WeakMap();
se = /* @__PURE__ */ new WeakMap();
ae = /* @__PURE__ */ new WeakMap();
ne = /* @__PURE__ */ new WeakMap();
b.styles = [
  N,
  N,
  N,
  W,
  J,
  be,
  ve,
  Re
];
M([
  Z({ type: String })
], b.prototype, "routerPath", 2);
M([
  h()
], b.prototype, "_formState", 2);
M([
  h()
], b.prototype, "_formError", 2);
M([
  h()
], b.prototype, "_articulateNodeId", 2);
M([
  h()
], b.prototype, "_selectedBlogNodeName", 2);
M([
  pe("#blogMlExportForm")
], b.prototype, "_form", 2);
b = M([
  q("blogml-exporter")
], b);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const O = globalThis, K = O.trustedTypes, Ce = K ? K.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Ue = "$lit$", A = `lit$${Math.random().toFixed(9).slice(2)}$`, He = "?" + A, ut = `<${He}>`, k = document, G = () => k.createComment(""), R = (t) => t === null || typeof t != "object" && typeof t != "function", ye = Array.isArray, ct = (t) => ye(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", te = `[ 	
\f\r]`, z = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ee = /-->/g, Te = />/g, T = RegExp(`>|${te}(?:([^\\s"'>=/]+)(${te}*=${te}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Se = /'/g, ke = /"/g, qe = /^(?:script|style|textarea|title)$/i, F = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), Me = /* @__PURE__ */ new WeakMap(), S = k.createTreeWalker(k, 129);
function Le(t, e) {
  if (!ye(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ce !== void 0 ? Ce.createHTML(e) : e;
}
const dt = (t, e) => {
  const i = t.length - 1, o = [];
  let r, s = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = z;
  for (let u = 0; u < i; u++) {
    const n = t[u];
    let d, m, l = -1, y = 0;
    for (; y < n.length && (a.lastIndex = y, m = a.exec(n), m !== null); ) y = a.lastIndex, a === z ? m[1] === "!--" ? a = Ee : m[1] !== void 0 ? a = Te : m[2] !== void 0 ? (qe.test(m[2]) && (r = RegExp("</" + m[2], "g")), a = T) : m[3] !== void 0 && (a = T) : a === T ? m[0] === ">" ? (a = r ?? z, l = -1) : m[1] === void 0 ? l = -2 : (l = a.lastIndex - m[2].length, d = m[1], a = m[3] === void 0 ? T : m[3] === '"' ? ke : Se) : a === ke || a === Se ? a = T : a === Ee || a === Te ? a = z : (a = T, r = void 0);
    const x = a === T && t[u + 1].startsWith("/>") ? " " : "";
    s += a === z ? n + ut : l >= 0 ? (o.push(d), n.slice(0, l) + Ue + n.slice(l) + A + x) : n + A + (l === -2 ? u : x);
  }
  return [Le(t, s + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), o];
};
class U {
  constructor({ strings: e, _$litType$: i }, o) {
    let r;
    this.parts = [];
    let s = 0, a = 0;
    const u = e.length - 1, n = this.parts, [d, m] = dt(e, i);
    if (this.el = U.createElement(d, o), S.currentNode = this.el.content, i === 2 || i === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (r = S.nextNode()) !== null && n.length < u; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const l of r.getAttributeNames()) if (l.endsWith(Ue)) {
          const y = m[a++], x = r.getAttribute(l).split(A), V = /([.?@])?(.*)/.exec(y);
          n.push({ type: 1, index: s, name: V[2], strings: x, ctor: V[1] === "." ? mt : V[1] === "?" ? pt : V[1] === "@" ? ft : ee }), r.removeAttribute(l);
        } else l.startsWith(A) && (n.push({ type: 6, index: s }), r.removeAttribute(l));
        if (qe.test(r.tagName)) {
          const l = r.textContent.split(A), y = l.length - 1;
          if (y > 0) {
            r.textContent = K ? K.emptyScript : "";
            for (let x = 0; x < y; x++) r.append(l[x], G()), S.nextNode(), n.push({ type: 2, index: ++s });
            r.append(l[y], G());
          }
        }
      } else if (r.nodeType === 8) if (r.data === He) n.push({ type: 2, index: s });
      else {
        let l = -1;
        for (; (l = r.data.indexOf(A, l + 1)) !== -1; ) n.push({ type: 7, index: s }), l += A.length - 1;
      }
      s++;
    }
  }
  static createElement(e, i) {
    const o = k.createElement("template");
    return o.innerHTML = e, o;
  }
}
function B(t, e, i = t, o) {
  var a, u;
  if (e === F) return e;
  let r = o !== void 0 ? (a = i._$Co) == null ? void 0 : a[o] : i._$Cl;
  const s = R(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== s && ((u = r == null ? void 0 : r._$AO) == null || u.call(r, !1), s === void 0 ? r = void 0 : (r = new s(t), r._$AT(t, i, o)), o !== void 0 ? (i._$Co ?? (i._$Co = []))[o] = r : i._$Cl = r), r !== void 0 && (e = B(t, r._$AS(t, e.values), r, o)), e;
}
class ht {
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
    const { el: { content: i }, parts: o } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? k).importNode(i, !0);
    S.currentNode = r;
    let s = S.nextNode(), a = 0, u = 0, n = o[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let d;
        n.type === 2 ? d = new Q(s, s.nextSibling, this, e) : n.type === 1 ? d = new n.ctor(s, n.name, n.strings, this, e) : n.type === 6 && (d = new _t(s, this, e)), this._$AV.push(d), n = o[++u];
      }
      a !== (n == null ? void 0 : n.index) && (s = S.nextNode(), a++);
    }
    return S.currentNode = k, r;
  }
  p(e) {
    let i = 0;
    for (const o of this._$AV) o !== void 0 && (o.strings !== void 0 ? (o._$AI(e, o, i), i += o.strings.length - 2) : o._$AI(e[i])), i++;
  }
}
class Q {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, i, o, r) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = o, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = i.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, i = this) {
    e = B(this, e, i), R(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== F && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ct(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && R(this._$AH) ? this._$AA.nextSibling.data = e : this.T(k.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var s;
    const { values: i, _$litType$: o } = e, r = typeof o == "number" ? this._$AC(e) : (o.el === void 0 && (o.el = U.createElement(Le(o.h, o.h[0]), this.options)), o);
    if (((s = this._$AH) == null ? void 0 : s._$AD) === r) this._$AH.p(i);
    else {
      const a = new ht(r, this), u = a.u(this.options);
      a.p(i), this.T(u), this._$AH = a;
    }
  }
  _$AC(e) {
    let i = Me.get(e.strings);
    return i === void 0 && Me.set(e.strings, i = new U(e)), i;
  }
  k(e) {
    ye(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let o, r = 0;
    for (const s of e) r === i.length ? i.push(o = new Q(this.O(G()), this.O(G()), this, this.options)) : o = i[r], o._$AI(s), r++;
    r < i.length && (this._$AR(o && o._$AB.nextSibling, r), i.length = r);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    var o;
    for ((o = this._$AP) == null ? void 0 : o.call(this, !1, !0, i); e && e !== this._$AB; ) {
      const r = e.nextSibling;
      e.remove(), e = r;
    }
  }
  setConnected(e) {
    var i;
    this._$AM === void 0 && (this._$Cv = e, (i = this._$AP) == null || i.call(this, e));
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
    if (s === void 0) e = B(this, e, i, 0), a = !R(e) || e !== this._$AH && e !== F, a && (this._$AH = e);
    else {
      const u = e;
      let n, d;
      for (e = s[0], n = 0; n < s.length - 1; n++) d = B(this, u[o + n], i, n), d === F && (d = this._$AH[n]), a || (a = !R(d) || d !== this._$AH[n]), d === c ? e = c : e !== c && (e += (d ?? "") + s[n + 1]), this._$AH[n] = d;
    }
    a && !r && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class mt extends ee {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class pt extends ee {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class ft extends ee {
  constructor(e, i, o, r, s) {
    super(e, i, o, r, s), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = B(this, e, i, 0) ?? c) === F) return;
    const o = this._$AH, r = e === c && o !== c || e.capture !== o.capture || e.once !== o.once || e.passive !== o.passive, s = e !== c && (o === c || r);
    r && this.element.removeEventListener(this.name, this, o), s && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var i;
    typeof this._$AH == "function" ? this._$AH.call(((i = this.options) == null ? void 0 : i.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class _t {
  constructor(e, i, o) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = o;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    B(this, e);
  }
}
const ie = O.litHtmlPolyfillSupport;
ie == null || ie(U, Q), (O.litHtmlVersions ?? (O.litHtmlVersions = [])).push("3.3.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const gt = (t) => (...e) => ({ _$litDirective$: t, values: e });
let vt = class {
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
const bt = {}, yt = (t, e = bt) => t._$AH = e;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $t = gt(class extends vt {
  constructor() {
    super(...arguments), this.key = c;
  }
  render(t, e) {
    return this.key = t, e;
  }
  update(t, [e, i]) {
    return e !== this.key && (yt(t), this.key = e), i;
  }
});
var wt = Object.defineProperty, xt = Object.getOwnPropertyDescriptor, We = (t) => {
  throw TypeError(t);
}, w = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? xt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && wt(e, i, r), r;
}, At = (t, e, i) => e.has(t) || We("Cannot " + i), I = (t, e, i) => (At(t, e, "read from private field"), i ? i.call(t) : e.get(t)), D = (t, e, i) => e.has(t) ? We("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), le, ue, ce, de, he, me;
let _ = class extends L {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._postCount = void 0, this._formRenderKey = 0, this._archiveDoctypeUdi = void 0, D(this, le, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), D(this, ue, (t) => t instanceof Blob), D(this, ce, async (t) => {
      if (t.preventDefault(), !this._form) return;
      const e = new FormData(this._form), i = e.get("importFile"), r = [
        {
          isValid: !!this._articulateNodeId,
          message: "A blog node must be selected before importing."
        },
        {
          isValid: i && i.size > 0,
          message: "A BlogML file must be selected for import."
        }
      ].find((s) => !s.isValid);
      if (r) {
        const s = new Error(r.message);
        s.name = "Validation Error", f(this, s, s.name), this._form.reportValidity();
        return;
      }
      if (!this._form.reportValidity()) {
        const s = new Error("The form is not valid. Please check the fields marked with an error.");
        s.name = "Validation Error", f(this, s, s.name);
        return;
      }
      if (this._formState !== "waiting") {
        this._formState = "waiting", this._formError = null, this._postCount = void 0;
        try {
          const s = await I(this, de).call(this, i);
          this._postCount = s.postCount;
          const a = await I(this, he).call(this, e, s.temporaryFileName);
          e.get("exportDisqusXml") === "on" && a.commentCount > 0 && await I(this, me).call(this), this._formState = "success";
          const u = e.get("exportDisqusXml") === "on" && a.commentCount > 0 ? `${a.commentCount} comments exported.` : e.get("exportDisqusXml") === "on" ? "No comments found to export." : "";
          await fe(
            this,
            `BlogML imported successfully! ${a.authorCount} authors, ${this._postCount} posts imported. ${u}`,
            "positive",
            !0
          ), this.resetState(!0);
        } catch (s) {
          f(this, s, "Import Failed");
        }
      }
    }), D(this, de, async (t) => {
      var i, o;
      const e = await Y.postArticulateBlogmlImportFile({ body: { importFile: t } });
      if (!e.response.ok || !((i = e.data) != null && i.temporaryFileName) || !((o = e.data) != null && o.postCount))
        throw e.error || new Error("Failed to upload blog content.");
      return e.data;
    }), D(this, he, async (t, e) => {
      var r;
      const i = {
        articulateBlogNode: this._articulateNodeId,
        overwrite: t.get("overwrite") === "on",
        publish: t.get("publish") === "on",
        regexMatch: t.get("regexMatch") || "",
        regexReplace: t.get("regexReplace") || "",
        tempFile: e,
        exportDisqusXml: t.get("exportDisqusXml") === "on",
        importFirstImage: t.get("importFirstImage") === "on"
      }, o = await Y.postArticulateBlogmlImport({ body: i });
      if (!o.response.ok || !((r = o.data) != null && r.completed))
        throw o.error || new Error("Failed to import blog content.");
      return o.data;
    }), D(this, me, async () => {
      const t = await Y.getArticulateBlogmlExportDisqus();
      if (!t.response.ok || !t.data)
        throw t.error || new Error("Failed to export Disqus comments.");
      const e = t.data;
      if (!I(this, ue).call(this, e))
        throw new Error("Invalid file received for Disqus export.");
      const i = t.response.headers.get("content-disposition");
      let o = "disqus-comments.xml";
      if (i) {
        const r = i.match(/filename="?([^"]+)"?/);
        r && r.length > 1 && r[1] && (o = r[1]);
      }
      I(this, le).call(this, e, o);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(De, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Fetches the Articulate Archive doctype UDI when the component connects.
   * @async
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await ze(), this._archiveDoctypeUdi === null) {
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
    this._postCount = void 0, t && (this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._formRenderKey++);
  }
  /**
   * Opens the Umbraco node picker to select an Articulate blog node.
   * @private
   * @async
   */
  async _openNodePicker() {
    if (!this._archiveDoctypeUdi) return;
    this._formError = null;
    const t = await Oe(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await Pe(t);
      if (!e) {
        f(this, new Error(`Could not find a node with UDI: ${t}`), "Node Not Found");
        return;
      }
      this._articulateNodeId = t, this._selectedBlogNodeName = e.name;
    }
  }
  render() {
    return p`
      <uui-box headline="BlogML Importer">
        ${_e(this.routerPath)}
        <uui-form>
          ${$t(
      this._formRenderKey,
      p`
              <form
                id="blogMlImportForm"
                @submit=${I(this, ce)}
                @input=${() => {
        this._formError = null, this._formState = void 0;
      }}
              >
                <uui-validation-message>
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
                      tabindex="0"
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
                      placeholder="Example replacement: @example.new"
                    ></uui-input>
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
                </uui-validation-message>
                <div class="form-actions">
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
        ${this._postCount !== void 0 && this._postCount > 0 ? p`
              <div slot="message">
                <uui-tag look="secondary" color="positive">${this._postCount} posts in uploaded file.</uui-tag>
              </div>
            ` : ""}
        ${this._formError ? ge(this._formError) : ""}
      </uui-box>
    `;
  }
};
le = /* @__PURE__ */ new WeakMap();
ue = /* @__PURE__ */ new WeakMap();
ce = /* @__PURE__ */ new WeakMap();
de = /* @__PURE__ */ new WeakMap();
he = /* @__PURE__ */ new WeakMap();
me = /* @__PURE__ */ new WeakMap();
_.styles = [
  N,
  N,
  W,
  J,
  be,
  ve,
  Re
];
w([
  Z({ type: String })
], _.prototype, "routerPath", 2);
w([
  h()
], _.prototype, "_formState", 2);
w([
  h()
], _.prototype, "_formError", 2);
w([
  h()
], _.prototype, "_articulateNodeId", 2);
w([
  h()
], _.prototype, "_selectedBlogNodeName", 2);
w([
  h()
], _.prototype, "_postCount", 2);
w([
  h()
], _.prototype, "_formRenderKey", 2);
w([
  pe("#blogMlImportForm")
], _.prototype, "_form", 2);
_ = w([
  q("blogml-importer")
], _);
var Nt = Object.defineProperty, Ct = Object.getOwnPropertyDescriptor, Ve = (t) => {
  throw TypeError(t);
}, E = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Ct(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && Nt(e, i, r), r;
}, je = (t, e, i) => e.has(t) || Ve("Cannot " + i), Ie = (t, e, i) => (je(t, e, "read from private field"), i ? i.call(t) : e.get(t)), oe = (t, e, i) => e.has(t) ? Ve("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), $ = (t, e, i) => (je(t, e, "access private method"), i), v, Xe, $e, Ye, Ke, Ge, we, Ze, xe, Je, Qe;
let g = class extends L {
  constructor() {
    super(...arguments), oe(this, v), this._formState = void 0, this._formError = null, this._themes = [], this._selectedTheme = void 0, this._newThemeName = void 0, oe(this, we, (t) => {
      this._formError = null, this._formState = void 0, this._newThemeName = t.target.value;
    }), oe(this, xe, (t) => {
      t.preventDefault(), this.resetState(!0);
    });
  }
  /**
   * Loads the list of themes when the component is connected to the DOM.
   * @async
   */
  async connectedCallback() {
    super.connectedCallback(), await $(this, v, Xe).call(this);
  }
  /**
   * Resets the component's state.
   * @param {boolean} [fullReset=false] If true, performs a full reset, clearing the selected theme and form state.
   */
  resetState(t = !1) {
    t && (this._formState = void 0, this._formError = null, this._selectedTheme = void 0, this._newThemeName = void 0);
  }
  get _submitButtonColor() {
    return this._selectedTheme && this._newThemeName ? "positive" : "primary";
  }
  render() {
    return p`
      <uui-box headline="Theme Duplication">
        ${_e(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customize them yourself. The duplicated theme will
            be copied to the ~/Views/Articulate folder where you can edit it. Then you can select this theme from the
            themes drop down on your Articulate root node to use it.
          </p>
        </div>
        <div class="container">${$(this, v, Je).call(this)} ${$(this, v, Qe).call(this)}</div>
        ${this._formError ? ge(this._formError) : ""}
      </uui-box>
    `;
  }
};
v = /* @__PURE__ */ new WeakSet();
Xe = async function() {
  var t;
  try {
    const e = await Be.getArticulateThemesDefault();
    if (!e.response.ok || !e.data)
      throw e.error || new Error("The list of themes could not be retrieved from the server.");
    this._themes = ((t = e.data) == null ? void 0 : t.map((i) => i)) ?? [];
  } catch (e) {
    f(this, e, "Could not load themes");
  }
};
$e = function(t) {
  this.resetState(!0), this._selectedTheme = t, this._newThemeName = `${t} - Copy`;
};
Ye = function(t, e) {
  t.stopPropagation(), $(this, v, $e).call(this, e);
};
Ke = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && $(this, v, $e).call(this, i);
};
Ge = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && i === this._selectedTheme && this.resetState(!0);
};
we = /* @__PURE__ */ new WeakMap();
Ze = async function(t) {
  if (t.preventDefault(), !!this._form) {
    if (!this._form.reportValidity()) {
      const e = new Error("Please enter a new name for the theme.");
      e.name = "Validation Error", f(this, e, e.name);
      return;
    }
    if (this._formState !== "waiting") {
      this._formState = "waiting", this._formError = null;
      try {
        const e = await Be.postArticulateThemesCopy({
          body: {
            themeName: this._selectedTheme,
            newThemeName: this._newThemeName
          }
        });
        if (!e.response.ok)
          throw e.error || new Error("Failed to duplicate theme.");
        this._formState = "success", await fe(this, "Theme duplicated successfully!", "positive"), this.resetState(!0);
      } catch (e) {
        f(this, e, "Duplication Failed");
      }
    }
  }
};
xe = /* @__PURE__ */ new WeakMap();
Je = function() {
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
              @selected=${$(this, v, Ke)}
              @deselected=${$(this, v, Ge)}
              data-theme=${t}
              role="radio"
              aria-checked=${this._selectedTheme === t}
              aria-label=${`Select theme ${t}`}
              tabindex="0"
            >
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
    }}
              />
              <div slot="actions">
                <uui-button
                  look="primary"
                  label="Select Theme ${t}"
                  @click=${(e) => $(this, v, Ye).call(this, e, t)}
                >
                  Select
                </uui-button>
              </div>
            </uui-card-media>
          `
  )}
      </div>
    `;
};
Qe = function() {
  return this._selectedTheme ? p`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>
        <uui-form>
          <form
            @submit=${$(this, v, Ze)}
            @input=${() => {
    this._formError = null, this._formState = void 0;
  }}
          >
            <uui-validation-message>
              <uui-form-layout-item>
                <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
                <uui-input
                  id="newThemeName"
                  name="newThemeName"
                  .value=${this._newThemeName ?? ""}
                  @input=${Ie(this, we)}
                  required
                  required-message="You must provide a new name for the theme."
                  label="New theme name"
                ></uui-input>
              </uui-form-layout-item>
            </uui-validation-message>
            <div class="form-actions">
              <uui-button
                id="duplicateButton"
                type="submit"
                look="primary"
                .color=${this._submitButtonColor}
                .state=${this._formState}
              >
                Duplicate
              </uui-button>
              <uui-button id="cancelButton" type="reset" look="secondary" @click=${Ie(this, xe)}>
                Cancel
              </uui-button>
            </div>
          </form>
        </uui-form>
      </div>
    ` : p``;
};
g.styles = [
  N,
  W,
  J,
  be,
  ve,
  C`
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
E([
  Z({ type: String })
], g.prototype, "routerPath", 2);
E([
  h()
], g.prototype, "_formState", 2);
E([
  h()
], g.prototype, "_formError", 2);
E([
  h()
], g.prototype, "_themes", 2);
E([
  h()
], g.prototype, "_selectedTheme", 2);
E([
  h()
], g.prototype, "_newThemeName", 2);
E([
  pe("form")
], g.prototype, "_form", 2);
g = E([
  q("copy-theme")
], g);
var Et = Object.defineProperty, Tt = Object.getOwnPropertyDescriptor, et = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Tt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && Et(e, i, r), r;
};
const St = [
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
let P = class extends L {
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
        <div slot="header-actions">
          <uui-button look="default" compact href="https://github.com/Shazwazza/Articulate/wiki" label="Wiki">
            <uui-icon name="icon-help-alt" label="Wiki"></uui-icon>
          </uui-button>
        </div>
        <div class="tools-grid">
          ${St.map((t) => {
      var o;
      const i = `${(o = this.routerPath) == null ? void 0 : o.replace(/\/$/, "")}/${t.path}`;
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
P.styles = [
  N,
  W,
  J,
  C`
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--uui-size-space-4);
      }

      [slot="header-actions"] {
        display: flex;
        gap: var(--uui-size-space-2);
      }

      [slot="header-actions"] > uui-button {
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
et([
  Z({ type: String })
], P.prototype, "routerPath", 2);
P = et([
  q("dashboard-options")
], P);
var kt = Object.defineProperty, Mt = Object.getOwnPropertyDescriptor, Ae = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Mt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && kt(e, i, r), r;
};
let H = class extends L {
  /**
   * The build date of the package, injected by the build process.
   * @private
   * @type {string}
   */
  constructor() {
    super();
    const t = (e) => (i) => {
      this._routerBasePath && i instanceof e && (i.routerPath = this._routerBasePath);
    };
    this._routes = [
      {
        path: "blogml/import",
        component: _,
        setup: t(_)
      },
      {
        path: "blogml/export",
        component: b,
        setup: t(b)
      },
      {
        path: "theme/copy",
        component: g,
        setup: t(g)
      },
      {
        path: "",
        component: P,
        setup: t(P)
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
            @init=${(t) => {
      this._routerBasePath = t.target.absoluteRouterPath;
    }}
          ></umb-router-slot>
        </div>
        <footer slot="footer">
          <p slot="footer-info" class="articulate-footer-info"></p>
        </footer>
      </umb-body-layout>
    `;
  }
};
H.styles = [
  N,
  W,
  C`
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
Ae([
  h()
], H.prototype, "_routerBasePath", 2);
Ae([
  h()
], H.prototype, "_routes", 2);
H = Ae([
  q("articulate-dashboard")
], H);
export {
  H as default
};
