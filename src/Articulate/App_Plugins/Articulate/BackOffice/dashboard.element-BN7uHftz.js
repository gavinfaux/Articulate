import { html as p, nothing as Ce, css as C, property as Z, state as h, query as fe, customElement as L } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as V } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as N } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as Be } from "@umbraco-cms/backoffice/modal";
import { B as O, f as J, T as Pe } from "./error-utils-DDBb-qkN.js";
import { UMB_DOCUMENT_PICKER_MODAL as it } from "@umbraco-cms/backoffice/document";
import { DocumentService as ot } from "@umbraco-cms/backoffice/external/backend-api";
import { UMB_NOTIFICATION_CONTEXT as rt } from "@umbraco-cms/backoffice/notification";
async function ze() {
  const t = await O.getArticulateBlogArticulateGuidV1();
  if (t.response.ok && t.data)
    return t.data;
  console.error(J(t.error, "API request failed for Articulate Archive UDI"));
}
async function Oe(t) {
  var e;
  try {
    const i = await ot.getDocumentById({ id: t });
    return ((e = i == null ? void 0 : i.variants) == null ? void 0 : e[0]) ?? null;
  } catch (i) {
    return console.error(J(i, "Failed to fetch node")), null;
  }
}
async function Ue(t, e, i) {
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
    return console.error(J(o, "Node picker failed")), null;
  }
}
function f(t, e, i) {
  t._formState = "failed", t._formError = J(e, i), t.resetState();
}
async function _e(t, e, i, o = !1) {
  const r = await t.getContext(rt);
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
function ge(t) {
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
function ve(t) {
  if (console.info(`At validation event: renderErrorMessage called with errors: ${JSON.stringify(t)}`), !t)
    return console.info("At validation event: renderErrorMessage returning nothing as errors object is null"), Ce;
  const { title: e, details: i } = t;
  return console.info(
    `At validation event: renderErrorMessage rendering with title: '${e}' and ${i.length} details`
  ), p`
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
          ` : Ce}
    </div>
  `;
}
const Q = C`
  uui-box {
    margin-top: var(--uui-size-space-6);
    max-width: var(--uui-size-content);
    margin-inline: auto;
  }
`, be = C`
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
`, ye = C`
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
var at = Object.defineProperty, st = Object.getOwnPropertyDescriptor, He = (t) => {
  throw TypeError(t);
}, I = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? st(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && at(e, i, r), r;
}, nt = (t, e, i) => e.has(t) || He("Cannot " + i), X = (t, e, i) => (nt(t, e, "read from private field"), i ? i.call(t) : e.get(t)), Y = (t, e, i) => e.has(t) ? He("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), ae, se, ne, le;
let b = class extends V {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = void 0, Y(this, ae, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), Y(this, se, (t) => t instanceof Blob), Y(this, ne, async (t) => {
      if (t.preventDefault(), !!this._form) {
        if (console.info("Form submission validity check:", this._form.reportValidity()), console.info("Current _articulateNodeId:", this._articulateNodeId), !this._articulateNodeId) {
          const e = new Error("A blog node must be selected before exporting.");
          e.name = "Validation Error", f(this, e, e.name), this._form.reportValidity();
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
            await X(this, le).call(this), this._formState = "success", await _e(this, "BlogML exported successfully!", "positive"), this.resetState(!0);
          } catch (e) {
            f(this, e, "Export Failed");
          }
        }
      }
    }), Y(this, le, async () => {
      const e = new FormData(this._form).get("embedImages") === "on", i = {
        articulateNodeId: this._articulateNodeId,
        exportImagesAsBase64: e
      }, o = await O.postArticulateBlogExportV1({ body: i });
      if (!o.response.ok || !o.data)
        throw o.error || new Error("The server returned an invalid response during export.");
      const r = o.data;
      if (!X(this, se).call(this, r))
        throw new Error("The server did not return a file. Please check the server logs.");
      const s = o.response.headers.get("content-disposition");
      let a = "blog-export.xml";
      if (s) {
        const u = s.match(/filename="?([^"]+)"?/);
        u && u.length > 1 && u[1] && (a = u[1]);
      }
      X(this, ae).call(this, r, a);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(Be, (t) => {
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
    const t = await Ue(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await Oe(t);
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
        ${ge(this.routerPath)}
        <uui-form>
          <form
            id="blogMlExportForm"
            @submit=${X(this, ne)}
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
        ${this._formError ? ve(this._formError) : ""}
      </uui-box>
    `;
  }
};
ae = /* @__PURE__ */ new WeakMap();
se = /* @__PURE__ */ new WeakMap();
ne = /* @__PURE__ */ new WeakMap();
le = /* @__PURE__ */ new WeakMap();
b.styles = [
  N,
  N,
  N,
  W,
  Q,
  ye,
  be,
  Re
];
I([
  Z({ type: String })
], b.prototype, "routerPath", 2);
I([
  h()
], b.prototype, "_formState", 2);
I([
  h()
], b.prototype, "_formError", 2);
I([
  h()
], b.prototype, "_articulateNodeId", 2);
I([
  h()
], b.prototype, "_selectedBlogNodeName", 2);
I([
  fe("#blogMlExportForm")
], b.prototype, "_form", 2);
b = I([
  L("blogml-exporter")
], b);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const U = globalThis, G = U.trustedTypes, Ee = G ? G.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Fe = "$lit$", A = `lit$${Math.random().toFixed(9).slice(2)}$`, qe = "?" + A, lt = `<${qe}>`, k = document, K = () => k.createComment(""), R = (t) => t === null || typeof t != "object" && typeof t != "function", $e = Array.isArray, ut = (t) => $e(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", ie = `[ 	
\f\r]`, z = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Se = /-->/g, Te = />/g, S = RegExp(`>|${ie}(?:([^\\s"'>=/]+)(${ie}*=${ie}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ke = /'/g, Ie = /"/g, Le = /^(?:script|style|textarea|title)$/i, H = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), Me = /* @__PURE__ */ new WeakMap(), T = k.createTreeWalker(k, 129);
function Ve(t, e) {
  if (!$e(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ee !== void 0 ? Ee.createHTML(e) : e;
}
const ct = (t, e) => {
  const i = t.length - 1, o = [];
  let r, s = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = z;
  for (let u = 0; u < i; u++) {
    const n = t[u];
    let d, m, l = -1, y = 0;
    for (; y < n.length && (a.lastIndex = y, m = a.exec(n), m !== null); ) y = a.lastIndex, a === z ? m[1] === "!--" ? a = Se : m[1] !== void 0 ? a = Te : m[2] !== void 0 ? (Le.test(m[2]) && (r = RegExp("</" + m[2], "g")), a = S) : m[3] !== void 0 && (a = S) : a === S ? m[0] === ">" ? (a = r ?? z, l = -1) : m[1] === void 0 ? l = -2 : (l = a.lastIndex - m[2].length, d = m[1], a = m[3] === void 0 ? S : m[3] === '"' ? Ie : ke) : a === Ie || a === ke ? a = S : a === Se || a === Te ? a = z : (a = S, r = void 0);
    const x = a === S && t[u + 1].startsWith("/>") ? " " : "";
    s += a === z ? n + lt : l >= 0 ? (o.push(d), n.slice(0, l) + Fe + n.slice(l) + A + x) : n + A + (l === -2 ? u : x);
  }
  return [Ve(t, s + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), o];
};
class F {
  constructor({ strings: e, _$litType$: i }, o) {
    let r;
    this.parts = [];
    let s = 0, a = 0;
    const u = e.length - 1, n = this.parts, [d, m] = ct(e, i);
    if (this.el = F.createElement(d, o), T.currentNode = this.el.content, i === 2 || i === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (r = T.nextNode()) !== null && n.length < u; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const l of r.getAttributeNames()) if (l.endsWith(Fe)) {
          const y = m[a++], x = r.getAttribute(l).split(A), j = /([.?@])?(.*)/.exec(y);
          n.push({ type: 1, index: s, name: j[2], strings: x, ctor: j[1] === "." ? ht : j[1] === "?" ? mt : j[1] === "@" ? pt : te }), r.removeAttribute(l);
        } else l.startsWith(A) && (n.push({ type: 6, index: s }), r.removeAttribute(l));
        if (Le.test(r.tagName)) {
          const l = r.textContent.split(A), y = l.length - 1;
          if (y > 0) {
            r.textContent = G ? G.emptyScript : "";
            for (let x = 0; x < y; x++) r.append(l[x], K()), T.nextNode(), n.push({ type: 2, index: ++s });
            r.append(l[y], K());
          }
        }
      } else if (r.nodeType === 8) if (r.data === qe) n.push({ type: 2, index: s });
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
  if (e === H) return e;
  let r = o !== void 0 ? (a = i._$Co) == null ? void 0 : a[o] : i._$Cl;
  const s = R(e) ? void 0 : e._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== s && ((u = r == null ? void 0 : r._$AO) == null || u.call(r, !1), s === void 0 ? r = void 0 : (r = new s(t), r._$AT(t, i, o)), o !== void 0 ? (i._$Co ?? (i._$Co = []))[o] = r : i._$Cl = r), r !== void 0 && (e = B(t, r._$AS(t, e.values), r, o)), e;
}
class dt {
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
    T.currentNode = r;
    let s = T.nextNode(), a = 0, u = 0, n = o[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let d;
        n.type === 2 ? d = new ee(s, s.nextSibling, this, e) : n.type === 1 ? d = new n.ctor(s, n.name, n.strings, this, e) : n.type === 6 && (d = new ft(s, this, e)), this._$AV.push(d), n = o[++u];
      }
      a !== (n == null ? void 0 : n.index) && (s = T.nextNode(), a++);
    }
    return T.currentNode = k, r;
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
    e = B(this, e, i), R(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== H && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ut(e) ? this.k(e) : this._(e);
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
    const { values: i, _$litType$: o } = e, r = typeof o == "number" ? this._$AC(e) : (o.el === void 0 && (o.el = F.createElement(Ve(o.h, o.h[0]), this.options)), o);
    if (((s = this._$AH) == null ? void 0 : s._$AD) === r) this._$AH.p(i);
    else {
      const a = new dt(r, this), u = a.u(this.options);
      a.p(i), this.T(u), this._$AH = a;
    }
  }
  _$AC(e) {
    let i = Me.get(e.strings);
    return i === void 0 && Me.set(e.strings, i = new F(e)), i;
  }
  k(e) {
    $e(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let o, r = 0;
    for (const s of e) r === i.length ? i.push(o = new ee(this.O(K()), this.O(K()), this, this.options)) : o = i[r], o._$AI(s), r++;
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
class te {
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
    if (s === void 0) e = B(this, e, i, 0), a = !R(e) || e !== this._$AH && e !== H, a && (this._$AH = e);
    else {
      const u = e;
      let n, d;
      for (e = s[0], n = 0; n < s.length - 1; n++) d = B(this, u[o + n], i, n), d === H && (d = this._$AH[n]), a || (a = !R(d) || d !== this._$AH[n]), d === c ? e = c : e !== c && (e += (d ?? "") + s[n + 1]), this._$AH[n] = d;
    }
    a && !r && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ht extends te {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class mt extends te {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class pt extends te {
  constructor(e, i, o, r, s) {
    super(e, i, o, r, s), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = B(this, e, i, 0) ?? c) === H) return;
    const o = this._$AH, r = e === c && o !== c || e.capture !== o.capture || e.once !== o.once || e.passive !== o.passive, s = e !== c && (o === c || r);
    r && this.element.removeEventListener(this.name, this, o), s && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var i;
    typeof this._$AH == "function" ? this._$AH.call(((i = this.options) == null ? void 0 : i.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class ft {
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
const oe = U.litHtmlPolyfillSupport;
oe == null || oe(F, ee), (U.litHtmlVersions ?? (U.litHtmlVersions = [])).push("3.3.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _t = (t) => (...e) => ({ _$litDirective$: t, values: e });
let gt = class {
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
const vt = {}, bt = (t, e = vt) => t._$AH = e;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const yt = _t(class extends gt {
  constructor() {
    super(...arguments), this.key = c;
  }
  render(t, e) {
    return this.key = t, e;
  }
  update(t, [e, i]) {
    return e !== this.key && (bt(t), this.key = e), i;
  }
});
var $t = Object.defineProperty, wt = Object.getOwnPropertyDescriptor, We = (t) => {
  throw TypeError(t);
}, w = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? wt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && $t(e, i, r), r;
}, xt = (t, e, i) => e.has(t) || We("Cannot " + i), M = (t, e, i) => (xt(t, e, "read from private field"), i ? i.call(t) : e.get(t)), D = (t, e, i) => e.has(t) ? We("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), ue, ce, de, he, me, pe;
let _ = class extends V {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._postCount = void 0, this._formRenderKey = 0, this._archiveDoctypeUdi = void 0, D(this, ue, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), D(this, ce, (t) => t instanceof Blob), D(this, de, async (t) => {
      if (t.preventDefault(), !this._form) return;
      const e = new FormData(this._form), i = e.get("importFile");
      if (console.info("Form submission validity check:", this._form.reportValidity()), console.info("Current _articulateNodeId:", this._articulateNodeId), console.info("Selected import file:", i == null ? void 0 : i.name, "Size:", i == null ? void 0 : i.size), !this._articulateNodeId) {
        const o = new Error("A blog node must be selected before importing.");
        o.name = "Validation Error", f(this, o, o.name), this._form.reportValidity();
        return;
      }
      if (!i || i.size === 0) {
        const o = new Error("A BlogML file must be selected for import.");
        o.name = "Validation Error", f(this, o, o.name), this._form.reportValidity();
        return;
      }
      if (!this._form.reportValidity()) {
        const o = new Error("The form is not valid. Please check the fields marked with an error.");
        o.name = "Validation Error", f(this, o, o.name);
        return;
      }
      if (this._formState !== "waiting") {
        this._formState = "waiting", this._formError = null, this._postCount = void 0;
        try {
          const o = await M(this, he).call(this, i);
          this._postCount = o.postCount;
          const r = await M(this, me).call(this, e, o.temporaryFileName);
          e.get("exportDisqusXml") === "on" && r.commentCount > 0 && await M(this, pe).call(this), this._formState = "success";
          const s = e.get("exportDisqusXml") === "on" && r.commentCount > 0 ? `${r.commentCount} comments exported.` : e.get("exportDisqusXml") === "on" ? "No comments found to export." : "";
          await _e(
            this,
            `BlogML imported successfully! ${r.authorCount} authors, ${this._postCount} posts imported. ${s}`,
            "positive",
            !0
          ), this.resetState(!0);
        } catch (o) {
          f(this, o, "Import Failed");
        }
      }
    }), D(this, he, async (t) => {
      var i, o;
      const e = await O.postArticulateBlogImportBeginV1({ body: { importFile: t } });
      if (!e.response.ok || !((i = e.data) != null && i.temporaryFileName) || !((o = e.data) != null && o.postCount))
        throw e.error || new Error("Failed to upload blog content.");
      return e.data;
    }), D(this, me, async (t, e) => {
      var r;
      const i = {
        articulateNodeId: this._articulateNodeId,
        overwrite: t.get("overwrite") === "on",
        publish: t.get("publish") === "on",
        regexMatch: t.get("regexMatch") || "",
        regexReplace: t.get("regexReplace") || "",
        tempFile: e,
        exportDisqusXml: t.get("exportDisqusXml") === "on",
        importFirstImage: t.get("importFirstImage") === "on"
      }, o = await O.postArticulateBlogImportV1({ body: i });
      if (!o.response.ok || !((r = o.data) != null && r.completed))
        throw o.error || new Error("Failed to import blog content.");
      return o.data;
    }), D(this, pe, async () => {
      const t = await O.getArticulateBlogExportDisqusV1();
      if (!t.response.ok || !t.data)
        throw t.error || new Error("Failed to export Disqus comments.");
      const e = t.data;
      if (!M(this, ce).call(this, e))
        throw new Error("Invalid file received for Disqus export.");
      const i = t.response.headers.get("content-disposition");
      let o = "disqus-comments.xml";
      if (i) {
        const r = i.match(/filename="?([^"]+)"?/);
        r && r.length > 1 && r[1] && (o = r[1]);
      }
      M(this, ue).call(this, e, o);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(Be, (t) => {
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
    const t = await Ue(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await Oe(t);
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
        ${ge(this.routerPath)}
        <uui-form>
          ${yt(
      this._formRenderKey,
      p`
              <form
                id="blogMlImportForm"
                @submit=${M(this, de)}
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
        ${this._formError ? ve(this._formError) : ""}
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
_.styles = [
  N,
  N,
  W,
  Q,
  ye,
  be,
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
  fe("#blogMlImportForm")
], _.prototype, "_form", 2);
_ = w([
  L("blogml-importer")
], _);
var At = Object.defineProperty, Nt = Object.getOwnPropertyDescriptor, je = (t) => {
  throw TypeError(t);
}, E = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Nt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && At(e, i, r), r;
}, Xe = (t, e, i) => e.has(t) || je("Cannot " + i), De = (t, e, i) => (Xe(t, e, "read from private field"), i ? i.call(t) : e.get(t)), re = (t, e, i) => e.has(t) ? je("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), $ = (t, e, i) => (Xe(t, e, "access private method"), i), v, Ye, we, Ge, Ke, Ze, xe, Je, Ae, Qe, et;
let g = class extends V {
  constructor() {
    super(...arguments), re(this, v), this._formState = void 0, this._formError = null, this._themes = [], this._selectedTheme = void 0, this._newThemeName = void 0, re(this, xe, (t) => {
      this._formError = null, this._formState = void 0, this._newThemeName = t.target.value;
    }), re(this, Ae, (t) => {
      t.preventDefault(), this.resetState(!0);
    });
  }
  /**
   * Loads the list of themes when the component is connected to the DOM.
   * @async
   */
  async connectedCallback() {
    super.connectedCallback(), await $(this, v, Ye).call(this);
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
        ${ge(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customize them yourself. The duplicated theme will
            be copied to the ~/Views/Articulate folder where you can edit it. Then you can select this theme from the
            themes drop down on your Articulate root node to use it.
          </p>
        </div>
        <div class="container">${$(this, v, Qe).call(this)} ${$(this, v, et).call(this)}</div>
        ${this._formError ? ve(this._formError) : ""}
      </uui-box>
    `;
  }
};
v = /* @__PURE__ */ new WeakSet();
Ye = async function() {
  var t;
  try {
    const e = await Pe.getArticulateThemesDefaultV1();
    if (!e.response.ok || !e.data)
      throw e.error || new Error("The list of themes could not be retrieved from the server.");
    this._themes = ((t = e.data) == null ? void 0 : t.map((i) => i)) ?? [];
  } catch (e) {
    f(this, e, "Could not load themes");
  }
};
we = function(t) {
  this.resetState(!0), this._selectedTheme = t, this._newThemeName = `${t} - Copy`;
};
Ge = function(t, e) {
  t.stopPropagation(), $(this, v, we).call(this, e);
};
Ke = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && $(this, v, we).call(this, i);
};
Ze = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && i === this._selectedTheme && this.resetState(!0);
};
xe = /* @__PURE__ */ new WeakMap();
Je = async function(t) {
  if (t.preventDefault(), !!this._form) {
    if (!this._form.reportValidity()) {
      const e = new Error("Please enter a new name for the theme.");
      e.name = "Validation Error", f(this, e, e.name);
      return;
    }
    if (this._formState !== "waiting") {
      this._formState = "waiting", this._formError = null;
      try {
        const e = await Pe.postArticulateThemesCopyV1({
          body: {
            themeName: this._selectedTheme,
            newThemeName: this._newThemeName
          }
        });
        if (!e.response.ok)
          throw e.error || new Error("Failed to duplicate theme.");
        this._formState = "success", await _e(this, "Theme duplicated successfully!", "positive"), this.resetState(!0);
      } catch (e) {
        f(this, e, "Duplication Failed");
      }
    }
  }
};
Ae = /* @__PURE__ */ new WeakMap();
Qe = function() {
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
              @deselected=${$(this, v, Ze)}
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
                  @click=${(e) => $(this, v, Ge).call(this, e, t)}
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
et = function() {
  return this._selectedTheme ? p`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>
        <uui-form>
          <form
            @submit=${$(this, v, Je)}
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
                  @input=${De(this, xe)}
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
              <uui-button id="cancelButton" type="reset" look="secondary" @click=${De(this, Ae)}>
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
  Q,
  ye,
  be,
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
  fe("form")
], g.prototype, "_form", 2);
g = E([
  L("copy-theme")
], g);
var Ct = Object.defineProperty, Et = Object.getOwnPropertyDescriptor, tt = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Et(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && Ct(e, i, r), r;
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
let P = class extends V {
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
tt([
  Z({ type: String })
], P.prototype, "routerPath", 2);
P = tt([
  L("dashboard-options")
], P);
var Tt = Object.defineProperty, kt = Object.getOwnPropertyDescriptor, Ne = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? kt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (r = (o ? a(e, i, r) : a(r)) || r);
  return o && r && Tt(e, i, r), r;
};
let q = class extends V {
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
q.styles = [
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
Ne([
  h()
], q.prototype, "_routerBasePath", 2);
Ne([
  h()
], q.prototype, "_routes", 2);
q = Ne([
  L("articulate-dashboard")
], q);
export {
  q as default
};
