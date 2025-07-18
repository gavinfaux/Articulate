import { html as p, nothing as Be, css as C, property as J, state as h, query as _e, customElement as W } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as V } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as N } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as Oe } from "@umbraco-cms/backoffice/modal";
import { f as at, B as K, T as Fe } from "./error-utils-CUHXtQBu.js";
import { UMB_DOCUMENT_PICKER_MODAL as st } from "@umbraco-cms/backoffice/document";
import { DocumentTypeService as nt, DocumentService as lt } from "@umbraco-cms/backoffice/external/backend-api";
import { UMB_NOTIFICATION_CONTEXT as ut } from "@umbraco-cms/backoffice/notification";
import { UmbValidationContext as ve } from "@umbraco-cms/backoffice/validation";
async function Ue(t) {
  var e;
  try {
    const i = await lt.getDocumentById({ id: t });
    return ((e = i == null ? void 0 : i.variants) == null ? void 0 : e[0]) ?? null;
  } catch (i) {
    return console.error(i, "Failed to fetch node"), null;
  }
}
async function Re() {
  var t, e;
  try {
    const i = await nt.getItemDocumentTypeSearch({
      query: "Articulate",
      skip: 0,
      take: 1,
      isElement: !1
    });
    return ((e = (t = i == null ? void 0 : i.items) == null ? void 0 : t[0]) == null ? void 0 : e.id) ?? void 0;
  } catch (i) {
    console.error(i, "Failed to fetch Articulate document type");
    return;
  }
}
async function He(t, e, i) {
  try {
    const r = await t.open(
      i,
      st,
      {
        data: {
          multiple: !1,
          pickableFilter: (a) => {
            var s;
            return ((s = a.documentType) == null ? void 0 : s.unique) === e;
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
  t._formState = "failed", t._formError = at(e, i), t.resetState();
}
async function be(t, e, i, o = !1) {
  const r = await t.getContext(ut);
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
        href=${t || "/umbraco/section/settings/dashboard/articulate"}
      >
        ← Back
      </uui-button>
    </div>
  `;
}
function $e(t) {
  if (!t)
    return console.info("At validation event: renderErrorMessage returning nothing as errors object is null"), Be;
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
          ` : Be}
    </div>
  `;
}
const Q = C`
  uui-box {
    margin-top: var(--uui-size-space-6);
    max-width: var(--uui-size-content);
    margin-inline: auto;
  }
`, we = C`
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
`, qe = C`
  .node-picker-container {
    display: flex;
    align-items: center;
    gap: var(--uui-size-space-3);
  }
`, xe = C`
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
`, j = C`
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
var ct = Object.defineProperty, dt = Object.getOwnPropertyDescriptor, Le = (t) => {
  throw TypeError(t);
}, D = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? dt(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && ct(e, i, r), r;
}, ht = (t, e, i) => e.has(t) || Le("Cannot " + i), z = (t, e, i) => (ht(t, e, "read from private field"), i ? i.call(t) : e.get(t)), O = (t, e, i) => e.has(t) ? Le("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), re, ae, se, ne, le;
let b = class extends V {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateBlogNode = void 0, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = void 0, O(this, re, new ve(this)), O(this, ae, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), O(this, se, (t) => t instanceof Blob), O(this, ne, async (t) => {
      if (t.preventDefault(), !!this._form) {
        try {
          await z(this, re).validate();
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
            await z(this, le).call(this), this._formState = "success", await be(this, "BlogML exported successfully!", "positive"), this.resetState(!0);
          } catch (e) {
            f(this, e, "Export Failed");
          }
        }
      }
    }), O(this, le, async () => {
      const e = new FormData(this._form).get("embedImages") === "on", i = {
        articulateBlogNode: this._articulateBlogNode,
        exportImagesAsBase64: e
      }, o = await K.postArticulateBlogmlExport({ body: i });
      if (!o.response.ok || !o.data)
        throw o.error || new Error("The server returned an invalid response during export.");
      const r = o.data;
      if (!z(this, se).call(this, r))
        throw new Error("The server did not return a file. Please check the server logs.");
      const a = o.response.headers.get("content-disposition");
      let s = "blog-export.xml";
      if (a) {
        const u = a.match(/filename\*="UTF-8''([^"]+)"/);
        if (u && u.length > 1 && u[1])
          s = u[1];
        else {
          const n = a.match(/filename="?([^"]+)"?/);
          n && n.length > 1 && n[1] && (s = n[1]);
        }
      }
      z(this, ae).call(this, r, s);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(Oe, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Fetches the Articulate Archive doctype UDI when the component connects.
   * @async
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await Re(), this._archiveDoctypeUdi === null) {
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
    t && ((e = this._form) == null || e.reset(), this._formState = void 0, this._formError = null, this._articulateBlogNode = void 0, this._selectedBlogNodeName = "");
  }
  /**
   * Opens the Umbraco node picker to select an Articulate blog node.
   * @private
   * @async
   */
  async _openNodePicker() {
    if (!this._archiveDoctypeUdi) return;
    this._formError = null;
    const t = await He(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await Ue(t);
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
      <uui-box headline="BlogML Exporter">
        ${ye(this.routerPath)}
        <uui-form>
          <form
            id="blogMlExportForm"
            @submit=${z(this, ne)}
            @input=${() => {
      this._formError = null, this._formState = void 0;
    }}
          >
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
                    style="flex-grow: 1;"
                  ></uui-input>
                  <uui-button
                    look="outline"
                    label=${this._articulateBlogNode ? "Change" : "Choose"}
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
            </uui-form-validation-message>

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
        ${this._formError ? $e(this._formError) : ""}
      </uui-box>
    `;
  }
};
re = /* @__PURE__ */ new WeakMap();
ae = /* @__PURE__ */ new WeakMap();
se = /* @__PURE__ */ new WeakMap();
ne = /* @__PURE__ */ new WeakMap();
le = /* @__PURE__ */ new WeakMap();
b.styles = [
  N,
  N,
  N,
  j,
  Q,
  xe,
  we,
  qe
];
D([
  J({ type: String })
], b.prototype, "routerPath", 2);
D([
  h()
], b.prototype, "_formState", 2);
D([
  h()
], b.prototype, "_formError", 2);
D([
  h()
], b.prototype, "_articulateBlogNode", 2);
D([
  h()
], b.prototype, "_selectedBlogNodeName", 2);
D([
  _e("#blogMlExportForm")
], b.prototype, "_form", 2);
b = D([
  W("blogml-exporter")
], b);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const U = globalThis, G = U.trustedTypes, ke = G ? G.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, We = "$lit$", A = `lit$${Math.random().toFixed(9).slice(2)}$`, Ve = "?" + A, mt = `<${Ve}>`, M = document, Z = () => M.createComment(""), R = (t) => t === null || typeof t != "object" && typeof t != "function", Ae = Array.isArray, pt = (t) => Ae(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", ie = `[ 	
\f\r]`, F = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Me = /-->/g, De = />/g, T = RegExp(`>|${ie}(?:([^\\s"'>=/]+)(${ie}*=${ie}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Pe = /'/g, Ie = /"/g, je = /^(?:script|style|textarea|title)$/i, H = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), ze = /* @__PURE__ */ new WeakMap(), k = M.createTreeWalker(M, 129);
function Xe(t, e) {
  if (!Ae(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ke !== void 0 ? ke.createHTML(e) : e;
}
const ft = (t, e) => {
  const i = t.length - 1, o = [];
  let r, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", s = F;
  for (let u = 0; u < i; u++) {
    const n = t[u];
    let d, m, l = -1, y = 0;
    for (; y < n.length && (s.lastIndex = y, m = s.exec(n), m !== null); ) y = s.lastIndex, s === F ? m[1] === "!--" ? s = Me : m[1] !== void 0 ? s = De : m[2] !== void 0 ? (je.test(m[2]) && (r = RegExp("</" + m[2], "g")), s = T) : m[3] !== void 0 && (s = T) : s === T ? m[0] === ">" ? (s = r ?? F, l = -1) : m[1] === void 0 ? l = -2 : (l = s.lastIndex - m[2].length, d = m[1], s = m[3] === void 0 ? T : m[3] === '"' ? Ie : Pe) : s === Ie || s === Pe ? s = T : s === Me || s === De ? s = F : (s = T, r = void 0);
    const x = s === T && t[u + 1].startsWith("/>") ? " " : "";
    a += s === F ? n + mt : l >= 0 ? (o.push(d), n.slice(0, l) + We + n.slice(l) + A + x) : n + A + (l === -2 ? u : x);
  }
  return [Xe(t, a + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), o];
};
class q {
  constructor({ strings: e, _$litType$: i }, o) {
    let r;
    this.parts = [];
    let a = 0, s = 0;
    const u = e.length - 1, n = this.parts, [d, m] = ft(e, i);
    if (this.el = q.createElement(d, o), k.currentNode = this.el.content, i === 2 || i === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (r = k.nextNode()) !== null && n.length < u; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const l of r.getAttributeNames()) if (l.endsWith(We)) {
          const y = m[s++], x = r.getAttribute(l).split(A), X = /([.?@])?(.*)/.exec(y);
          n.push({ type: 1, index: a, name: X[2], strings: x, ctor: X[1] === "." ? _t : X[1] === "?" ? vt : X[1] === "@" ? bt : te }), r.removeAttribute(l);
        } else l.startsWith(A) && (n.push({ type: 6, index: a }), r.removeAttribute(l));
        if (je.test(r.tagName)) {
          const l = r.textContent.split(A), y = l.length - 1;
          if (y > 0) {
            r.textContent = G ? G.emptyScript : "";
            for (let x = 0; x < y; x++) r.append(l[x], Z()), k.nextNode(), n.push({ type: 2, index: ++a });
            r.append(l[y], Z());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Ve) n.push({ type: 2, index: a });
      else {
        let l = -1;
        for (; (l = r.data.indexOf(A, l + 1)) !== -1; ) n.push({ type: 7, index: a }), l += A.length - 1;
      }
      a++;
    }
  }
  static createElement(e, i) {
    const o = M.createElement("template");
    return o.innerHTML = e, o;
  }
}
function P(t, e, i = t, o) {
  var s, u;
  if (e === H) return e;
  let r = o !== void 0 ? (s = i._$Co) == null ? void 0 : s[o] : i._$Cl;
  const a = R(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== a && ((u = r == null ? void 0 : r._$AO) == null || u.call(r, !1), a === void 0 ? r = void 0 : (r = new a(t), r._$AT(t, i, o)), o !== void 0 ? (i._$Co ?? (i._$Co = []))[o] = r : i._$Cl = r), r !== void 0 && (e = P(t, r._$AS(t, e.values), r, o)), e;
}
class gt {
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
    const { el: { content: i }, parts: o } = this._$AD, r = ((e == null ? void 0 : e.creationScope) ?? M).importNode(i, !0);
    k.currentNode = r;
    let a = k.nextNode(), s = 0, u = 0, n = o[0];
    for (; n !== void 0; ) {
      if (s === n.index) {
        let d;
        n.type === 2 ? d = new ee(a, a.nextSibling, this, e) : n.type === 1 ? d = new n.ctor(a, n.name, n.strings, this, e) : n.type === 6 && (d = new yt(a, this, e)), this._$AV.push(d), n = o[++u];
      }
      s !== (n == null ? void 0 : n.index) && (a = k.nextNode(), s++);
    }
    return k.currentNode = M, r;
  }
  p(e) {
    let i = 0;
    for (const o of this._$AV) o !== void 0 && (o.strings !== void 0 ? (o._$AI(e, o, i), i += o.strings.length - 2) : o._$AI(e[i])), i++;
  }
}
class ee {
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
    e = P(this, e, i), R(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== H && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : pt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && R(this._$AH) ? this._$AA.nextSibling.data = e : this.T(M.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var a;
    const { values: i, _$litType$: o } = e, r = typeof o == "number" ? this._$AC(e) : (o.el === void 0 && (o.el = q.createElement(Xe(o.h, o.h[0]), this.options)), o);
    if (((a = this._$AH) == null ? void 0 : a._$AD) === r) this._$AH.p(i);
    else {
      const s = new gt(r, this), u = s.u(this.options);
      s.p(i), this.T(u), this._$AH = s;
    }
  }
  _$AC(e) {
    let i = ze.get(e.strings);
    return i === void 0 && ze.set(e.strings, i = new q(e)), i;
  }
  k(e) {
    Ae(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let o, r = 0;
    for (const a of e) r === i.length ? i.push(o = new ee(this.O(Z()), this.O(Z()), this, this.options)) : o = i[r], o._$AI(a), r++;
    r < i.length && (this._$AR(o && o._$AB.nextSibling, r), i.length = r);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    var o;
    for ((o = this._$AP) == null ? void 0 : o.call(this, !1, !0, i); e !== this._$AB; ) {
      const r = e.nextSibling;
      e.remove(), e = r;
    }
  }
  setConnected(e) {
    var i;
    this._$AM === void 0 && (this._$Cv = e, (i = this._$AP) == null || i.call(this, e));
  }
}
class te {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, i, o, r, a) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = i, this._$AM = r, this.options = a, o.length > 2 || o[0] !== "" || o[1] !== "" ? (this._$AH = Array(o.length - 1).fill(new String()), this.strings = o) : this._$AH = c;
  }
  _$AI(e, i = this, o, r) {
    const a = this.strings;
    let s = !1;
    if (a === void 0) e = P(this, e, i, 0), s = !R(e) || e !== this._$AH && e !== H, s && (this._$AH = e);
    else {
      const u = e;
      let n, d;
      for (e = a[0], n = 0; n < a.length - 1; n++) d = P(this, u[o + n], i, n), d === H && (d = this._$AH[n]), s || (s = !R(d) || d !== this._$AH[n]), d === c ? e = c : e !== c && (e += (d ?? "") + a[n + 1]), this._$AH[n] = d;
    }
    s && !r && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class _t extends te {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class vt extends te {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class bt extends te {
  constructor(e, i, o, r, a) {
    super(e, i, o, r, a), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = P(this, e, i, 0) ?? c) === H) return;
    const o = this._$AH, r = e === c && o !== c || e.capture !== o.capture || e.once !== o.once || e.passive !== o.passive, a = e !== c && (o === c || r);
    r && this.element.removeEventListener(this.name, this, o), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var i;
    typeof this._$AH == "function" ? this._$AH.call(((i = this.options) == null ? void 0 : i.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class yt {
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
const oe = U.litHtmlPolyfillSupport;
oe == null || oe(q, ee), (U.litHtmlVersions ?? (U.litHtmlVersions = [])).push("3.3.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $t = (t) => (...e) => ({ _$litDirective$: t, values: e });
let wt = class {
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
const xt = {}, At = (t, e = xt) => t._$AH = e;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Nt = $t(class extends wt {
  constructor() {
    super(...arguments), this.key = c;
  }
  render(t, e) {
    return this.key = t, e;
  }
  update(t, [e, i]) {
    return e !== this.key && (At(t), this.key = e), i;
  }
});
var Ct = Object.defineProperty, Et = Object.getOwnPropertyDescriptor, Ye = (t) => {
  throw TypeError(t);
}, w = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Et(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Ct(e, i, r), r;
}, Tt = (t, e, i) => e.has(t) || Ye("Cannot " + i), S = (t, e, i) => (Tt(t, e, "read from private field"), i ? i.call(t) : e.get(t)), B = (t, e, i) => e.has(t) ? Ye("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), ue, ce, de, he, me, pe, fe;
let g = class extends V {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateBlogNode = void 0, this._selectedBlogNodeName = "", this._postCount = void 0, this._formRenderKey = 0, this._archiveDoctypeUdi = void 0, B(this, ue, new ve(this)), B(this, ce, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), B(this, de, (t) => t instanceof Blob), B(this, he, async (t) => {
      if (t.preventDefault(), !this._form) return;
      try {
        await S(this, ue).validate();
      } catch (a) {
        f(this, a, "Validation Failed");
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
      ].find((a) => !a.isValid);
      if (r) {
        const a = new Error(r.message);
        a.name = "Validation Error", f(this, a, a.name);
        return;
      }
      if (this._formState !== "waiting") {
        this._formState = "waiting", this._formError = null, this._postCount = void 0;
        try {
          const a = await S(this, me).call(this, i);
          this._postCount = a.postCount, this.requestUpdate("_postCount");
          const s = await S(this, pe).call(this, e, a.temporaryFileName);
          e.get("exportDisqusXml") === "on" && s.commentCount > 0 && await S(this, fe).call(this), this._formState = "success";
          const u = e.get("exportDisqusXml") === "on" && s.commentCount > 0 ? `${s.commentCount} comments exported.` : e.get("exportDisqusXml") === "on" ? "No comments found to export." : "";
          await be(
            this,
            `BlogML imported successfully! ${s.authorCount} authors, ${this._postCount} posts imported. ${u}`,
            "positive",
            !0
          ), this.resetState(!0);
        } catch (a) {
          f(this, a, "Import Failed");
        }
      }
    }), B(this, me, async (t) => {
      var i, o;
      const e = await K.postArticulateBlogmlImportFile({ body: { importFile: t } });
      if (!e.response.ok || !((i = e.data) != null && i.temporaryFileName) || !((o = e.data) != null && o.postCount))
        throw e.error || new Error("Failed to upload blog content.");
      return e.data;
    }), B(this, pe, async (t, e) => {
      var r;
      const i = {
        articulateBlogNode: this._articulateBlogNode,
        overwrite: t.get("overwrite") === "on",
        publish: t.get("publish") === "on",
        regexMatch: t.get("regexMatch") || "",
        regexReplace: t.get("regexReplace") || "",
        tempFile: e,
        exportDisqusXml: t.get("exportDisqusXml") === "on",
        importFirstImage: t.get("importFirstImage") === "on"
      }, o = await K.postArticulateBlogmlImport({ body: i });
      if (!o.response.ok || !((r = o.data) != null && r.completed))
        throw o.error || new Error("Failed to import blog content.");
      return o.data;
    }), B(this, fe, async () => {
      const t = await K.getArticulateBlogmlExportDisqus();
      if (!t.response.ok || !t.data)
        throw t.error || new Error("Failed to export Disqus comments.");
      const e = t.data;
      if (!S(this, de).call(this, e))
        throw new Error("Invalid file received for Disqus export.");
      const i = t.response.headers.get("content-disposition");
      let o = "disqus-comments.xml";
      if (i) {
        const r = i.match(/filename\*="UTF-8''([^"]+)"/);
        if (r && r.length > 1 && r[1])
          o = r[1];
        else {
          const a = i.match(/filename="?([^"]+)"?/);
          a && a.length > 1 && a[1] && (o = a[1]);
        }
      }
      S(this, ce).call(this, e, o);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(Oe, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Fetches the Articulate Archive doctype UDI when the component connects.
   * @async
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await Re(), this._archiveDoctypeUdi === null) {
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
    const t = await He(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await Ue(t);
      if (!e) {
        f(this, new Error(`Could not find a node with UDI: ${t}`), "Node Not Found");
        return;
      }
      this._articulateBlogNode = t, this._selectedBlogNodeName = e.name;
    }
  }
  render() {
    return p`
      <uui-box headline="BlogML Importer">
        ${ye(this.routerPath)}
        <uui-form>
          ${Nt(
      this._formRenderKey,
      p`
              <form
                id="blogMlImportForm"
                @submit=${S(this, he)}
                @input=${() => {
        this._formError = null, this._formState = void 0;
      }}
              >
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
                        style="flex-grow: 1;"
                      ></uui-input>
                      <uui-button
                        look="outline"
                        label=${this._articulateBlogNode ? "Change" : "Choose"}
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
ue = /* @__PURE__ */ new WeakMap();
ce = /* @__PURE__ */ new WeakMap();
de = /* @__PURE__ */ new WeakMap();
he = /* @__PURE__ */ new WeakMap();
me = /* @__PURE__ */ new WeakMap();
pe = /* @__PURE__ */ new WeakMap();
fe = /* @__PURE__ */ new WeakMap();
g.styles = [
  N,
  N,
  j,
  Q,
  xe,
  we,
  qe
];
w([
  J({ type: String })
], g.prototype, "routerPath", 2);
w([
  h()
], g.prototype, "_formState", 2);
w([
  h()
], g.prototype, "_formError", 2);
w([
  h()
], g.prototype, "_articulateBlogNode", 2);
w([
  h()
], g.prototype, "_selectedBlogNodeName", 2);
w([
  h()
], g.prototype, "_postCount", 2);
w([
  h()
], g.prototype, "_formRenderKey", 2);
w([
  _e("#blogMlImportForm")
], g.prototype, "_form", 2);
g = w([
  W("blogml-importer")
], g);
var St = Object.defineProperty, Bt = Object.getOwnPropertyDescriptor, Ke = (t) => {
  throw TypeError(t);
}, E = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Bt(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && St(e, i, r), r;
}, Ge = (t, e, i) => e.has(t) || Ke("Cannot " + i), ge = (t, e, i) => (Ge(t, e, "read from private field"), i ? i.call(t) : e.get(t)), Y = (t, e, i) => e.has(t) ? Ke("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), $ = (t, e, i) => (Ge(t, e, "access private method"), i), Ne, v, Ze, Ce, Je, Qe, et, Ee, tt, Te, it, ot;
let _ = class extends V {
  constructor() {
    super(...arguments), Y(this, v), this._formState = void 0, this._formError = null, this._themes = [], this._selectedTheme = void 0, this._newThemeName = void 0, Y(this, Ne, new ve(this)), Y(this, Ee, (t) => {
      this._formError = null, this._formState = void 0, this._newThemeName = t.target.value;
    }), Y(this, Te, (t) => {
      t.preventDefault(), this.resetState(!0);
    });
  }
  /**
   * Loads the list of themes when the component is connected to the DOM.
   * @async
   */
  async connectedCallback() {
    super.connectedCallback(), await $(this, v, Ze).call(this);
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
        ${ye(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customize them yourself. The duplicated theme will
            be copied to the ~/Views/Articulate folder where you can edit it. Then you can select this theme from the
            themes drop down on your Articulate root node to use it.
          </p>
        </div>
        <div class="container">${$(this, v, it).call(this)} ${$(this, v, ot).call(this)}</div>
        ${this._formError ? $e(this._formError) : ""}
      </uui-box>
    `;
  }
};
Ne = /* @__PURE__ */ new WeakMap();
v = /* @__PURE__ */ new WeakSet();
Ze = async function() {
  var t;
  try {
    const e = await Fe.getArticulateThemeDefault();
    if (!e.response.ok || !e.data)
      throw e.error || new Error("The list of themes could not be retrieved from the server.");
    this._themes = ((t = e.data) == null ? void 0 : t.map((i) => i)) ?? [];
  } catch (e) {
    f(this, e, "Could not load themes");
  }
};
Ce = function(t) {
  this.resetState(!0), this._selectedTheme = t, this._newThemeName = `${t} - Copy`;
};
Je = function(t, e) {
  t.stopPropagation(), $(this, v, Ce).call(this, e);
};
Qe = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && $(this, v, Ce).call(this, i);
};
et = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && i === this._selectedTheme && this.resetState(!0);
};
Ee = /* @__PURE__ */ new WeakMap();
tt = async function(t) {
  if (t.preventDefault(), !!this._form) {
    try {
      await ge(this, Ne).validate();
    } catch (e) {
      f(this, e, "Validation Failed");
      return;
    }
    if (!this._selectedTheme || !this._newThemeName) {
      const e = new Error("Please select a theme to duplicate and provide a new theme name.");
      e.name = "Validation Error", f(this, e, e.name);
      return;
    }
    if (this._formState !== "waiting") {
      this._formState = "waiting", this._formError = null;
      try {
        const e = await Fe.postArticulateThemeCopy({
          body: {
            themeName: this._selectedTheme,
            newThemeName: this._newThemeName
          }
        });
        if (!e.response.ok)
          throw e.error || new Error("Failed to duplicate theme.");
        this._formState = "success", await be(this, "Theme duplicated successfully!", "positive"), this.resetState(!0);
      } catch (e) {
        f(this, e, "Duplication Failed");
      }
    }
  }
};
Te = /* @__PURE__ */ new WeakMap();
it = function() {
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
              @selected=${$(this, v, Qe)}
              @deselected=${$(this, v, et)}
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
                  @click=${(e) => $(this, v, Je).call(this, e, t)}
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
ot = function() {
  return this._selectedTheme ? p`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>
        <uui-form>
          <form
            @submit=${$(this, v, tt)}
            @input=${() => {
    this._formError = null, this._formState = void 0;
  }}
          >
            <uui-form-validation-message>
              <uui-form-layout-item>
                <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
                <uui-input
                  id="newThemeName"
                  name="newThemeName"
                  .value=${this._newThemeName ?? ""}
                  @input=${ge(this, Ee)}
                  required
                  required-message="You must provide a new name for the theme."
                  label="New theme name"
                ></uui-input>
              </uui-form-layout-item>
            </uui-form-validation-message>
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
              <uui-button id="cancelButton" type="reset" look="secondary" @click=${ge(this, Te)}>
                Cancel
              </uui-button>
            </div>
          </form>
        </uui-form>
      </div>
    ` : p``;
};
_.styles = [
  N,
  j,
  Q,
  xe,
  we,
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
  J({ type: String })
], _.prototype, "routerPath", 2);
E([
  h()
], _.prototype, "_formState", 2);
E([
  h()
], _.prototype, "_formError", 2);
E([
  h()
], _.prototype, "_themes", 2);
E([
  h()
], _.prototype, "_selectedTheme", 2);
E([
  h()
], _.prototype, "_newThemeName", 2);
E([
  _e("form")
], _.prototype, "_form", 2);
_ = E([
  W("theme-options")
], _);
var kt = Object.defineProperty, Mt = Object.getOwnPropertyDescriptor, rt = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Mt(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && kt(e, i, r), r;
};
const Dt = [
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
    description: "Duplicate an Articulate default theme for customization"
  }
];
let I = class extends V {
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
          ${Dt.map((t) => {
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
I.styles = [
  N,
  j,
  Q,
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
rt([
  J({ type: String })
], I.prototype, "routerPath", 2);
I = rt([
  W("dashboard-options")
], I);
var Pt = Object.defineProperty, It = Object.getOwnPropertyDescriptor, Se = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? It(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Pt(e, i, r), r;
};
let L = class extends V {
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
L.styles = [
  N,
  j,
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
Se([
  h()
], L.prototype, "_routerBasePath", 2);
Se([
  h()
], L.prototype, "_routes", 2);
L = Se([
  W("articulate-dashboard")
], L);
export {
  L as default
};
