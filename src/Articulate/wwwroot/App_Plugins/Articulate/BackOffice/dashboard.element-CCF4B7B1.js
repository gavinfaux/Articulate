import { html as m, nothing as Se, css as N, property as Z, state as d, query as ge, customElement as L } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as W } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as C } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as Oe } from "@umbraco-cms/backoffice/modal";
import { UmbValidationContext as _e } from "@umbraco-cms/backoffice/validation";
import { f as rt, B as Y, T as Fe } from "./error-utils-ulwSul7B.js";
import { UMB_DOCUMENT_PICKER_MODAL as at } from "@umbraco-cms/backoffice/document";
import { DocumentTypeService as st, DocumentService as nt } from "@umbraco-cms/backoffice/external/backend-api";
import { UMB_NOTIFICATION_CONTEXT as lt } from "@umbraco-cms/backoffice/notification";
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function ut(t, e, i) {
  return t ? e(t) : i?.(t);
}
async function Re(t) {
  try {
    return (await nt.getDocumentById({ id: t }))?.variants?.[0] ?? null;
  } catch (e) {
    return console.error(e, "Failed to fetch node"), null;
  }
}
async function Ue() {
  try {
    return (await st.getItemDocumentTypeSearch({
      query: "Articulate",
      skip: 0,
      take: 1,
      isElement: !1
    }))?.items?.[0]?.id ?? void 0;
  } catch (t) {
    console.error(t, "Failed to fetch Articulate document type");
    return;
  }
}
async function ze(t, e, i) {
  try {
    const r = await t.open(
      i,
      at,
      {
        data: {
          multiple: !1,
          pickableFilter: (a) => a.documentType?.unique === e
        }
      }
    ).onSubmit();
    return !r || !r.selection || !r.selection[0] ? null : r.selection[0];
  } catch (o) {
    return console.error(o, "Node picker failed"), null;
  }
}
function f(t, e, i) {
  t._formState = "failed", t._formError = rt(e, i), t.resetState();
}
async function ve(t, e, i, o = !1) {
  const r = await t.getContext(lt);
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
  return m`
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
function be(t) {
  if (!t)
    return console.info("At validation event: renderErrorMessage returning nothing as errors object is null"), Se;
  const { title: e, details: i } = t;
  return m`
    <div class="articulate-error-box">
      <strong>${e}</strong>
      ${i.length > 0 ? m`
            <ul class="articulate-error-list">
              ${i.map(
    (o) => m`
                  <li>${o}</li>
                `
  )}
            </ul>
          ` : Se}
    </div>
  `;
}
const J = N`
  uui-box {
    margin-top: var(--uui-size-space-6);
    max-width: var(--uui-size-content);
    margin-inline: auto;
  }
`, $e = N`
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
`, He = N`
  .node-picker-container {
    display: flex;
    align-items: center;
    gap: var(--uui-size-space-3);
  }
`, we = N`
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
`, V = N`
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
var ct = Object.defineProperty, ht = Object.getOwnPropertyDescriptor, qe = (t) => {
  throw TypeError(t);
}, P = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? ht(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && ct(e, i, r), r;
}, dt = (t, e, i) => e.has(t) || qe("Cannot " + i), F = (t, e, i) => (dt(t, e, "read from private field"), i ? i.call(t) : e.get(t)), R = (t, e, i) => e.has(t) ? qe("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), oe, re, ae, se, ne;
let y = class extends W {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateBlogNode = void 0, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = void 0, R(this, oe, new _e(this)), R(this, re, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), R(this, ae, (t) => t instanceof Blob), R(this, se, async (t) => {
      if (t.preventDefault(), !!this._form) {
        try {
          await F(this, oe).validate();
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
            await F(this, ne).call(this), this._formState = "success", await ve(this, "BlogML exported successfully!", "positive"), this.resetState(!0);
          } catch (e) {
            f(this, e, "Export Failed");
          }
        }
      }
    }), R(this, ne, async () => {
      const e = new FormData(this._form).get("embedImages") === "on", i = {
        articulateBlogNode: this._articulateBlogNode,
        exportImagesAsBase64: e
      }, o = await Y.postArticulateBlogmlExport({ body: i });
      if (!o.response.ok || !o.data)
        throw o.error || new Error("The server returned an invalid response during export.");
      const r = o.data;
      if (!F(this, ae).call(this, r))
        throw new Error("The server did not return a file. Please check the server logs.");
      const a = o.response.headers.get("content-disposition");
      let s = "blog-export.xml";
      if (a) {
        const c = a.match(/filename\*="UTF-8''([^"]+)"/);
        if (c && c.length > 1 && c[1])
          s = c[1];
        else {
          const n = a.match(/filename="?([^"]+)"?/);
          n && n.length > 1 && n[1] && (s = n[1]);
        }
      }
      F(this, re).call(this, r, s);
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
    if (super.connectedCallback(), this._archiveDoctypeUdi = await Ue(), this._archiveDoctypeUdi === null) {
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
    const t = await ze(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await Re(t);
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
    return m`
      <uui-box headline="BlogML Exporter" headlinevariant="h2">
        ${ye(this.routerPath)}
        <uui-form>
          <form
            id="blogMlExportForm"
            @submit=${F(this, se)}
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
        ${this._formError ? be(this._formError) : ""}
      </uui-box>
    `;
  }
};
oe = /* @__PURE__ */ new WeakMap();
re = /* @__PURE__ */ new WeakMap();
ae = /* @__PURE__ */ new WeakMap();
se = /* @__PURE__ */ new WeakMap();
ne = /* @__PURE__ */ new WeakMap();
y.styles = [
  C,
  C,
  C,
  V,
  J,
  we,
  $e,
  He
];
P([
  Z({ type: String })
], y.prototype, "routerPath", 2);
P([
  d()
], y.prototype, "_formState", 2);
P([
  d()
], y.prototype, "_formError", 2);
P([
  d()
], y.prototype, "_articulateBlogNode", 2);
P([
  d()
], y.prototype, "_selectedBlogNodeName", 2);
P([
  ge("#blogMlExportForm")
], y.prototype, "_form", 2);
y = P([
  L("blogml-exporter")
], y);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xe = globalThis, K = xe.trustedTypes, ke = K ? K.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Le = "$lit$", A = `lit$${Math.random().toFixed(9).slice(2)}$`, We = "?" + A, mt = `<${We}>`, M = document, G = () => M.createComment(""), z = (t) => t === null || typeof t != "object" && typeof t != "function", Ae = Array.isArray, pt = (t) => Ae(t) || typeof t?.[Symbol.iterator] == "function", ie = `[ 	
\f\r]`, U = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Be = /-->/g, Me = />/g, T = RegExp(`>|${ie}(?:([^\\s"'>=/]+)(${ie}*=${ie}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Pe = /'/g, De = /"/g, Ve = /^(?:script|style|textarea|title)$/i, H = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), Ie = /* @__PURE__ */ new WeakMap(), B = M.createTreeWalker(M, 129);
function je(t, e) {
  if (!Ae(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ke !== void 0 ? ke.createHTML(e) : e;
}
const ft = (t, e) => {
  const i = t.length - 1, o = [];
  let r, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", s = U;
  for (let c = 0; c < i; c++) {
    const n = t[c];
    let h, p, l = -1, b = 0;
    for (; b < n.length && (s.lastIndex = b, p = s.exec(n), p !== null); ) b = s.lastIndex, s === U ? p[1] === "!--" ? s = Be : p[1] !== void 0 ? s = Me : p[2] !== void 0 ? (Ve.test(p[2]) && (r = RegExp("</" + p[2], "g")), s = T) : p[3] !== void 0 && (s = T) : s === T ? p[0] === ">" ? (s = r ?? U, l = -1) : p[1] === void 0 ? l = -2 : (l = s.lastIndex - p[2].length, h = p[1], s = p[3] === void 0 ? T : p[3] === '"' ? De : Pe) : s === De || s === Pe ? s = T : s === Be || s === Me ? s = U : (s = T, r = void 0);
    const x = s === T && t[c + 1].startsWith("/>") ? " " : "";
    a += s === U ? n + mt : l >= 0 ? (o.push(h), n.slice(0, l) + Le + n.slice(l) + A + x) : n + A + (l === -2 ? c : x);
  }
  return [je(t, a + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), o];
};
class q {
  constructor({ strings: e, _$litType$: i }, o) {
    let r;
    this.parts = [];
    let a = 0, s = 0;
    const c = e.length - 1, n = this.parts, [h, p] = ft(e, i);
    if (this.el = q.createElement(h, o), B.currentNode = this.el.content, i === 2 || i === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (r = B.nextNode()) !== null && n.length < c; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const l of r.getAttributeNames()) if (l.endsWith(Le)) {
          const b = p[s++], x = r.getAttribute(l).split(A), j = /([.?@])?(.*)/.exec(b);
          n.push({ type: 1, index: a, name: j[2], strings: x, ctor: j[1] === "." ? _t : j[1] === "?" ? vt : j[1] === "@" ? yt : ee }), r.removeAttribute(l);
        } else l.startsWith(A) && (n.push({ type: 6, index: a }), r.removeAttribute(l));
        if (Ve.test(r.tagName)) {
          const l = r.textContent.split(A), b = l.length - 1;
          if (b > 0) {
            r.textContent = K ? K.emptyScript : "";
            for (let x = 0; x < b; x++) r.append(l[x], G()), B.nextNode(), n.push({ type: 2, index: ++a });
            r.append(l[b], G());
          }
        }
      } else if (r.nodeType === 8) if (r.data === We) n.push({ type: 2, index: a });
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
function D(t, e, i = t, o) {
  if (e === H) return e;
  let r = o !== void 0 ? i._$Co?.[o] : i._$Cl;
  const a = z(e) ? void 0 : e._$litDirective$;
  return r?.constructor !== a && (r?._$AO?.(!1), a === void 0 ? r = void 0 : (r = new a(t), r._$AT(t, i, o)), o !== void 0 ? (i._$Co ??= [])[o] = r : i._$Cl = r), r !== void 0 && (e = D(t, r._$AS(t, e.values), r, o)), e;
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
    const { el: { content: i }, parts: o } = this._$AD, r = (e?.creationScope ?? M).importNode(i, !0);
    B.currentNode = r;
    let a = B.nextNode(), s = 0, c = 0, n = o[0];
    for (; n !== void 0; ) {
      if (s === n.index) {
        let h;
        n.type === 2 ? h = new Q(a, a.nextSibling, this, e) : n.type === 1 ? h = new n.ctor(a, n.name, n.strings, this, e) : n.type === 6 && (h = new bt(a, this, e)), this._$AV.push(h), n = o[++c];
      }
      s !== n?.index && (a = B.nextNode(), s++);
    }
    return B.currentNode = M, r;
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
    this.type = 2, this._$AH = u, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = o, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
    e = D(this, e, i), z(e) ? e === u || e == null || e === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : e !== this._$AH && e !== H && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : pt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== u && z(this._$AH) ? this._$AA.nextSibling.data = e : this.T(M.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: o } = e, r = typeof o == "number" ? this._$AC(e) : (o.el === void 0 && (o.el = q.createElement(je(o.h, o.h[0]), this.options)), o);
    if (this._$AH?._$AD === r) this._$AH.p(i);
    else {
      const a = new gt(r, this), s = a.u(this.options);
      a.p(i), this.T(s), this._$AH = a;
    }
  }
  _$AC(e) {
    let i = Ie.get(e.strings);
    return i === void 0 && Ie.set(e.strings, i = new q(e)), i;
  }
  k(e) {
    Ae(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let o, r = 0;
    for (const a of e) r === i.length ? i.push(o = new Q(this.O(G()), this.O(G()), this, this.options)) : o = i[r], o._$AI(a), r++;
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
  constructor(e, i, o, r, a) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = e, this.name = i, this._$AM = r, this.options = a, o.length > 2 || o[0] !== "" || o[1] !== "" ? (this._$AH = Array(o.length - 1).fill(new String()), this.strings = o) : this._$AH = u;
  }
  _$AI(e, i = this, o, r) {
    const a = this.strings;
    let s = !1;
    if (a === void 0) e = D(this, e, i, 0), s = !z(e) || e !== this._$AH && e !== H, s && (this._$AH = e);
    else {
      const c = e;
      let n, h;
      for (e = a[0], n = 0; n < a.length - 1; n++) h = D(this, c[o + n], i, n), h === H && (h = this._$AH[n]), s ||= !z(h) || h !== this._$AH[n], h === u ? e = u : e !== u && (e += (h ?? "") + a[n + 1]), this._$AH[n] = h;
    }
    s && !r && this.j(e);
  }
  j(e) {
    e === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class _t extends ee {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === u ? void 0 : e;
  }
}
class vt extends ee {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== u);
  }
}
class yt extends ee {
  constructor(e, i, o, r, a) {
    super(e, i, o, r, a), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = D(this, e, i, 0) ?? u) === H) return;
    const o = this._$AH, r = e === u && o !== u || e.capture !== o.capture || e.once !== o.once || e.passive !== o.passive, a = e !== u && (o === u || r);
    r && this.element.removeEventListener(this.name, this, o), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class bt {
  constructor(e, i, o) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = o;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    D(this, e);
  }
}
const $t = xe.litHtmlPolyfillSupport;
$t?.(q, Q), (xe.litHtmlVersions ??= []).push("3.3.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const wt = (t) => (...e) => ({ _$litDirective$: t, values: e });
let xt = class {
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
const At = {}, Ct = (t, e = At) => t._$AH = e;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Nt = wt(class extends xt {
  constructor() {
    super(...arguments), this.key = u;
  }
  render(t, e) {
    return this.key = t, e;
  }
  update(t, [e, i]) {
    return e !== this.key && (Ct(t), this.key = e), i;
  }
});
var Et = Object.defineProperty, Tt = Object.getOwnPropertyDescriptor, Xe = (t) => {
  throw TypeError(t);
}, w = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Tt(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Et(e, i, r), r;
}, St = (t, e, i) => e.has(t) || Xe("Cannot " + i), S = (t, e, i) => (St(t, e, "read from private field"), i ? i.call(t) : e.get(t)), k = (t, e, i) => e.has(t) ? Xe("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), le, ue, ce, he, de, me, pe;
let g = class extends W {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateBlogNode = void 0, this._selectedBlogNodeName = "", this._postCount = void 0, this._formRenderKey = 0, this._archiveDoctypeUdi = void 0, k(this, le, new _e(this)), k(this, ue, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), k(this, ce, (t) => t instanceof Blob), k(this, he, async (t) => {
      if (t.preventDefault(), !this._form) return;
      try {
        await S(this, le).validate();
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
          const a = await S(this, de).call(this, i);
          this._postCount = a.postCount, this.requestUpdate("_postCount");
          const s = await S(this, me).call(this, e, a.temporaryFileName);
          e.get("exportDisqusXml") === "on" && s.commentCount > 0 && await S(this, pe).call(this), this._formState = "success";
          const c = e.get("exportDisqusXml") === "on" && s.commentCount > 0 ? `${s.commentCount} comments exported.` : e.get("exportDisqusXml") === "on" ? "No comments found to export." : "";
          await ve(
            this,
            `BlogML imported successfully! ${s.authorCount} authors, ${this._postCount} posts imported. ${c}`,
            "positive",
            !0
          ), this.resetState(!0);
        } catch (a) {
          f(this, a, "Import Failed");
        }
      }
    }), k(this, de, async (t) => {
      const e = await Y.postArticulateBlogmlImportFile({ body: { importFile: t } });
      if (!e.response.ok || !e.data?.temporaryFileName || !e.data?.postCount)
        throw e.error || new Error("Failed to upload blog content.");
      return e.data;
    }), k(this, me, async (t, e) => {
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
      if (!o.response.ok || !o.data?.completed)
        throw o.error || new Error("Failed to import blog content.");
      return o.data;
    }), k(this, pe, async () => {
      const t = await Y.getArticulateBlogmlExportDisqus();
      if (!t.response.ok || !t.data)
        throw t.error || new Error("Failed to export Disqus comments.");
      const e = t.data;
      if (!S(this, ce).call(this, e))
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
      S(this, ue).call(this, e, o);
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
    if (super.connectedCallback(), this._archiveDoctypeUdi = await Ue(), this._archiveDoctypeUdi === null) {
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
    const t = await ze(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await Re(t);
      if (!e) {
        f(this, new Error(`Could not find a node with UDI: ${t}`), "Node Not Found");
        return;
      }
      this._articulateBlogNode = t, this._selectedBlogNodeName = e.name;
    }
  }
  render() {
    return m`
      <uui-box headline="BlogML Importer" headlinevariant="h2">
        ${ye(this.routerPath)}
        <uui-form>
          ${Nt(
      this._formRenderKey,
      m`
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
                  ${this._postCount !== void 0 && this._postCount > 0 ? m`
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

        ${this._formError ? be(this._formError) : ""}
      </uui-box>
    `;
  }
};
le = /* @__PURE__ */ new WeakMap();
ue = /* @__PURE__ */ new WeakMap();
ce = /* @__PURE__ */ new WeakMap();
he = /* @__PURE__ */ new WeakMap();
de = /* @__PURE__ */ new WeakMap();
me = /* @__PURE__ */ new WeakMap();
pe = /* @__PURE__ */ new WeakMap();
g.styles = [
  C,
  C,
  V,
  J,
  we,
  $e,
  He
];
w([
  Z({ type: String })
], g.prototype, "routerPath", 2);
w([
  d()
], g.prototype, "_formState", 2);
w([
  d()
], g.prototype, "_formError", 2);
w([
  d()
], g.prototype, "_articulateBlogNode", 2);
w([
  d()
], g.prototype, "_selectedBlogNodeName", 2);
w([
  d()
], g.prototype, "_postCount", 2);
w([
  d()
], g.prototype, "_formRenderKey", 2);
w([
  ge("#blogMlImportForm")
], g.prototype, "_form", 2);
g = w([
  L("blogml-importer")
], g);
var kt = Object.defineProperty, Bt = Object.getOwnPropertyDescriptor, Ye = (t) => {
  throw TypeError(t);
}, E = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Bt(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && kt(e, i, r), r;
}, Ke = (t, e, i) => e.has(t) || Ye("Cannot " + i), fe = (t, e, i) => (Ke(t, e, "read from private field"), i ? i.call(t) : e.get(t)), X = (t, e, i) => e.has(t) ? Ye("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), $ = (t, e, i) => (Ke(t, e, "access private method"), i), Ce, v, Ge, Ne, Ze, Je, Qe, Ee, et, Te, tt, it;
let _ = class extends W {
  constructor() {
    super(...arguments), X(this, v), this._formState = void 0, this._formError = null, this._themes = [], this._selectedTheme = void 0, this._themeName = void 0, X(this, Ce, new _e(this)), X(this, Ee, (t) => {
      this._formError = null, this._formState = void 0, this._themeName = t.target.value;
    }), X(this, Te, (t) => {
      t.preventDefault(), this.resetState(!0);
    });
  }
  /**
   * Loads the list of themes when the component is connected to the DOM.
   * @async
   */
  async connectedCallback() {
    super.connectedCallback(), await $(this, v, Ge).call(this);
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
    return m`
      <uui-box headline="Theme Options">
        ${ye(this.routerPath)}
        <div class="container">
          <h3>Creating and Customising Themes</h3>
          <p>
            Articulate's theming engine allows you to either create a brand new theme or make small, safe customisations
            to a built-in one.
          </p>
          <hr />

          <h4>Option 1: Creating a Brand New Theme</h4>
          <p>
            Use this option if you want a complete copy of a theme to use as a starting point for heavy customisation.
          </p>
          <ol>
            <li>
              Select a built-in theme from the
              <strong>Template</strong>
              options (e.g., "VAPOR").
            </li>
            <li>Enter a <em>new, unique name</em> for your theme (e.g., "CustomVaporTheme").</li>
            <li>
              Click
              <strong>Create Theme</strong>
              .
            </li>
          </ol>
          <p>
            A full copy of the template's files will be created in your
            <code>~/Views/ArticulateThemes/</code>
            folder. You can now edit any file in this new theme. Once you are ready, select it from the "Theme" dropdown
            on your Articulate root node.
          </p>

          <hr />

          <h4>Option 2: Customising a Built-in Theme</h4>
          <p>
            Use this option if you like a built-in theme but just want to change one or two things, like the layout of
            the post page or the site's colours. This method ensures your customisations are safe from package upgrades.
          </p>

          <h5>Step 1: Create the Override Folder</h5>
          <p>First, you need to create a local copy of the theme you wish to customise.</p>
          <ol>
            <li>
              Select the built-in theme you want to change from the
              <strong>Template</strong>
              options (e.g., "VAPOR").
            </li>
            <li>
              In the
              <strong>Theme Name</strong>
              field, enter the
              <strong>exact same name</strong>
              ("VAPOR").
            </li>
            <li>
              Click
              <strong>Create Theme</strong>
              .
            </li>
          </ol>
          <p>
            This will create a full copy of all the original "VAPOR" theme files in
            <code>~/Views/ArticulateThemes/VAPOR/</code>
            . This folder now has the highest priority.
          </p>

          <h5>Step 2: Create the Override Folder</h5>

          <h5>Step 2: Delete Untouched Files to Enable Fallback</h5>
          <p>
            This next step is the most important part. To get the benefits of easy maintenance and automatic updates,
            you should <em>delete any files from your new theme folder that you do not intend to change.</em>
          </p>
          <p>
            This might seem unusual, but it's very powerful. When you delete a file from your folder (for example,
            <code>List.cshtml</code>
            ), you are telling Articulate: "For this file, please use the built-in version from the original theme."
          </p>
          <p>
            <strong>Example: To only change the Post page layout.</strong>
            <br />
            After creating your "VAPOR" override folder in Step 1, go into that folder and <em>delete everything except
            for</em> <code>Post.cshtml</code>. Now you can edit <code>Post.cshtml</code> to make your changes. Your website will use your custom
            post page, but will automatically fall back to the built-in, up-to-date versions for the List page, Pager,
            Tags, and everything else.
          </p>
        </div>
        <div class="container">${$(this, v, tt).call(this)} ${$(this, v, it).call(this)}</div>
        ${this._formError ? be(this._formError) : ""}
      </uui-box>
    `;
  }
};
Ce = /* @__PURE__ */ new WeakMap();
v = /* @__PURE__ */ new WeakSet();
Ge = async function() {
  try {
    const t = await Fe.getArticulateThemeDefault();
    if (!t.response.ok || !t.data)
      throw t.error || new Error("The list of themes could not be retrieved from the server.");
    this._themes = t.data?.map((e) => e) ?? [];
  } catch (t) {
    f(this, t, "Could not load themes");
  }
};
Ne = function(t) {
  this.resetState(!0), this._selectedTheme = t, this._themeName = `Custom${t}Theme`;
};
Ze = function(t, e) {
  t.stopPropagation(), $(this, v, Ne).call(this, e);
};
Je = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && $(this, v, Ne).call(this, i);
};
Qe = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && i === this._selectedTheme && this.resetState(!0);
};
Ee = /* @__PURE__ */ new WeakMap();
et = async function(t) {
  if (t.preventDefault(), !!this._form) {
    try {
      await fe(this, Ce).validate();
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
        const e = await Fe.postArticulateThemeCopy({
          body: {
            themeName: this._selectedTheme,
            newThemeName: this._themeName
          }
        });
        if (!e.response.ok)
          throw e.error || new Error("Failed to copy theme.");
        this._formState = "success", await ve(this, "Theme copied successfully!", "positive"), this.resetState(!0);
      } catch (e) {
        f(this, e, "Copy Failed");
      }
    }
  }
};
Te = /* @__PURE__ */ new WeakMap();
tt = function() {
  return m`
      <div class="theme-grid">
        ${(this._themes ?? []).map(
    (t) => m`
            <uui-card-media
              class="theme-card"
              .name=${t}
              ?selectable=${this._formState !== "waiting"}
              ?selected=${this._selectedTheme === t}
              selectOnly
              @selected=${$(this, v, Je)}
              @deselected=${$(this, v, Qe)}
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
                  @click=${(e) => $(this, v, Ze).call(this, e, t)}
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
it = function() {
  return this._selectedTheme ? m`
      <div class="duplicate-form">
        <h3>Copy '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customise.</p>
        <uui-form>
          <form
            @submit=${$(this, v, et)}
            @input=${() => {
    this._formError = null, this._formState = void 0;
  }}
          >
            <uui-form-validation-message>
              <uui-form-layout-item>
                <uui-label for="themeName" slot="label" required>Theme name</uui-label>
                <uui-input
                  id="themeName"
                  name="themeName"
                  .value=${this._themeName ?? ""}
                  @input=${fe(this, Ee)}
                  required
                  required-message="You must provide a name for the theme."
                  label="Theme name"
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
                Create Theme
              </uui-button>
              <uui-button id="cancelButton" type="reset" look="secondary" @click=${fe(this, Te)}>
                Cancel
              </uui-button>
            </div>
          </form>
        </uui-form>
      </div>
    ` : m``;
};
_.styles = [
  C,
  V,
  J,
  we,
  $e,
  N`
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
], _.prototype, "routerPath", 2);
E([
  d()
], _.prototype, "_formState", 2);
E([
  d()
], _.prototype, "_formError", 2);
E([
  d()
], _.prototype, "_themes", 2);
E([
  d()
], _.prototype, "_selectedTheme", 2);
E([
  d()
], _.prototype, "_themeName", 2);
E([
  ge("form")
], _.prototype, "_form", 2);
_ = E([
  L("theme-options")
], _);
var Mt = Object.defineProperty, Pt = Object.getOwnPropertyDescriptor, ot = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Pt(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Mt(e, i, r), r;
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
    return m`
      <uui-box headline="Articulate Options" headlinevariant="h2">
        <div slot="header-actions">
          <uui-button look="default" compact href="https://github.com/Shazwazza/Articulate/wiki" label="Wiki">
            <uui-icon name="icon-help-alt" label="Wiki"></uui-icon>
          </uui-button>
        </div>
        <div class="tools-grid">
          ${Dt.map((t) => {
      const i = `${this.routerPath?.replace(/\/$/, "")}/${t.path}`;
      return m`
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
  C,
  V,
  J,
  N`
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
ot([
  Z({ type: String })
], I.prototype, "routerPath", 2);
I = ot([
  L("dashboard-options")
], I);
var It = Object.defineProperty, Ot = Object.getOwnPropertyDescriptor, te = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Ot(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && It(e, i, r), r;
};
let O = class extends W {
  constructor() {
    super(), this._getBuildInfo();
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
        component: y,
        setup: t(y)
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
  async _getBuildInfo() {
    try {
      const t = await fetch("/build-info.json");
      if (!t.ok) throw new Error("Failed to fetch build info");
      const e = await t.json();
      this._buildInfo = {
        version: e.version ?? "Development",
        date: e.date ?? "",
        commit: e.commit ?? ""
      }, console.info("Build Info:", this._buildInfo);
    } catch (t) {
      console.warn("Could not load build-info.json", t), this._buildInfo = { version: "Development", date: "", commit: "" };
    }
  }
  render() {
    return m`
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
    }}
          ></umb-router-slot>
        </div>
        <footer slot="footer">
          <p slot="footer-info" class="articulate-footer-info">
            ${ut(
      this._buildInfo?.version,
      () => m`Articulate | Version: ${this._buildInfo.version}`
    )}
          </p>
        </footer>
      </umb-body-layout>
    `;
  }
};
O.styles = [
  C,
  V,
  N`
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
te([
  d()
], O.prototype, "_routerBasePath", 2);
te([
  d()
], O.prototype, "_routes", 2);
te([
  d()
], O.prototype, "_buildInfo", 2);
O = te([
  L("articulate-dashboard")
], O);
export {
  O as default
};
//# sourceMappingURL=dashboard.element-CCF4B7B1.js.map
