import { DocumentService as Je, RuntimeModeModel as Qe } from "@umbraco-cms/backoffice/external/backend-api";
import { html as p, nothing as xe, css as L, property as J, state as c, query as fe, customElement as V } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as W } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as j } from "@umbraco-cms/backoffice/style";
import { c as O } from "./client.gen--au1sZxC.js";
import { UMB_MODAL_MANAGER_CONTEXT as Te } from "@umbraco-cms/backoffice/modal";
import { B as U, f as Q, T as Me } from "./error-utils-D-7IZ3ij.js";
import { UMB_DOCUMENT_PICKER_MODAL as et } from "@umbraco-cms/backoffice/document";
import { UMB_NOTIFICATION_CONTEXT as tt } from "@umbraco-cms/backoffice/notification";
class it {
  static getServerConfiguration(e) {
    return ((e == null ? void 0 : e.client) ?? O).get({
      url: "/umbraco/management/api/v1/server/configuration",
      ...e
    });
  }
  static getServerInformation(e) {
    return ((e == null ? void 0 : e.client) ?? O).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/server/information",
      ...e
    });
  }
  static getServerStatus(e) {
    return ((e == null ? void 0 : e.client) ?? O).get({
      url: "/umbraco/management/api/v1/server/status",
      ...e
    });
  }
  static getServerTroubleshooting(e) {
    return ((e == null ? void 0 : e.client) ?? O).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/server/troubleshooting",
      ...e
    });
  }
  static getServerUpgradeCheck(e) {
    return ((e == null ? void 0 : e.client) ?? O).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/server/upgrade-check",
      ...e
    });
  }
}
async function De() {
  const t = await U.getArticulateBlogArticulateGuidV1();
  if (t.response.ok && t.data)
    return t.data;
  console.error(Q(t.error, "API request failed for Articulate Archive UDI"));
}
async function Pe(t) {
  var e;
  try {
    const i = await Je.getDocumentById({ id: t });
    return ((e = i == null ? void 0 : i.variants) == null ? void 0 : e[0]) ?? null;
  } catch (i) {
    return console.error(Q(i, "Failed to fetch node")), null;
  }
}
async function Be(t, e, i) {
  try {
    const o = await t.open(
      i,
      et,
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
    return !o || !o.selection || !o.selection[0] ? null : o.selection[0];
  } catch (r) {
    return console.error(Q(r, "Node picker failed")), null;
  }
}
function f(t, e, i) {
  t._formState = "failed", t._formError = Q(e, i), t.resetState();
}
async function _e(t, e, i, r = !1) {
  const o = await t.getContext(tt);
  if (!o) {
    console.error("UMB_NOTIFICATION_CONTEXT not found. Could not display notification.", {
      contextHost: t,
      message: e
    });
    return;
  }
  r ? o.stay(i, {
    data: { message: e }
  }) : o.peek(i, {
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
    return console.info("At validation event: renderErrorMessage returning nothing as errors object is null"), xe;
  const { title: e, details: i } = t;
  return console.info(
    `At validation event: renderErrorMessage rendering with title: '${e}' and ${i.length} details`
  ), p`
    <div class="articulate-error-box">
      <strong>${e}</strong>
      ${i.length > 0 ? p`
            <ul class="articulate-error-list">
              ${i.map(
    (r) => p`
                  <li>${r}</li>
                `
  )}
            </ul>
          ` : xe}
    </div>
  `;
}
var rt = Object.defineProperty, ot = Object.getOwnPropertyDescriptor, Oe = (t) => {
  throw TypeError(t);
}, I = (t, e, i, r) => {
  for (var o = r > 1 ? void 0 : r ? ot(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (o = (r ? a(e, i, o) : a(o)) || o);
  return r && o && rt(e, i, o), o;
}, at = (t, e, i) => e.has(t) || Oe("Cannot " + i), Y = (t, e, i) => (at(t, e, "read from private field"), i ? i.call(t) : e.get(t)), G = (t, e, i) => e.has(t) ? Oe("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), ae, se, ne, le;
let y = class extends W {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = void 0, G(this, ae, (t, e) => {
      const i = window.URL.createObjectURL(t), r = document.createElement("a");
      r.style.display = "none", r.href = i, r.download = e, document.body.appendChild(r), r.click(), window.URL.revokeObjectURL(i), r.remove();
    }), G(this, se, (t) => t instanceof Blob), G(this, ne, async (t) => {
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
            await Y(this, le).call(this), this._formState = "success", await _e(this, "BlogML exported successfully!", "positive"), this.resetState(!0);
          } catch (e) {
            f(this, e, "Export Failed");
          }
        }
      }
    }), G(this, le, async () => {
      const e = new FormData(this._form).get("embedImages") === "on", i = {
        articulateNodeId: this._articulateNodeId,
        exportImagesAsBase64: e
      }, r = await U.postArticulateBlogExportV1({ body: i });
      if (!r.response.ok || !r.data)
        throw r.error || new Error("The server returned an invalid response during export.");
      const o = r.data;
      if (!Y(this, se).call(this, o))
        throw new Error("The server did not return a file. Please check the server logs.");
      const s = r.response.headers.get("content-disposition");
      let a = "blog-export.xml";
      if (s) {
        const u = s.match(/filename="?([^"]+)"?/);
        u && u.length > 1 && u[1] && (a = u[1]);
      }
      Y(this, ae).call(this, o, a);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(Te, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Fetches the Articulate Archive doctype UDI when the component connects.
   * @async
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await De(), this._archiveDoctypeUdi === null) {
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
    const t = await Be(this._modalManagerContext, this._archiveDoctypeUdi, this);
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
      <uui-box headline="BlogML Exporter">
        ${ge(this.routerPath)}
        <uui-form>
          <form
            id="blogMlExportForm"
            @submit=${Y(this, ne)}
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

            <uui-button type="submit" look="primary" .state=${this._formState}>Submit</uui-button>
            <uui-button type="button" look="secondary" @click=${this._handleReset}>Reset</uui-button>
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
y.styles = [
  j,
  L`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }
    `
];
I([
  J({ type: String })
], y.prototype, "routerPath", 2);
I([
  c()
], y.prototype, "_formState", 2);
I([
  c()
], y.prototype, "_formError", 2);
I([
  c()
], y.prototype, "_articulateNodeId", 2);
I([
  c()
], y.prototype, "_selectedBlogNodeName", 2);
I([
  fe("#blogMlExportForm")
], y.prototype, "_form", 2);
y = I([
  V("blogml-exporter")
], y);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const R = globalThis, K = R.trustedTypes, Ae = K ? K.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, ze = "$lit$", A = `lit$${Math.random().toFixed(9).slice(2)}$`, Ue = "?" + A, st = `<${Ue}>`, k = document, Z = () => k.createComment(""), F = (t) => t === null || typeof t != "object" && typeof t != "function", ye = Array.isArray, nt = (t) => ye(t) || typeof (t == null ? void 0 : t[Symbol.iterator]) == "function", ie = `[ 	
\f\r]`, z = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ne = /-->/g, Ee = />/g, C = RegExp(`>|${ie}(?:([^\\s"'>=/]+)(${ie}*=${ie}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ce = /'/g, Se = /"/g, Re = /^(?:script|style|textarea|title)$/i, H = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), ke = /* @__PURE__ */ new WeakMap(), S = k.createTreeWalker(k, 129);
function Fe(t, e) {
  if (!ye(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ae !== void 0 ? Ae.createHTML(e) : e;
}
const lt = (t, e) => {
  const i = t.length - 1, r = [];
  let o, s = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = z;
  for (let u = 0; u < i; u++) {
    const n = t[u];
    let h, m, l = -1, b = 0;
    for (; b < n.length && (a.lastIndex = b, m = a.exec(n), m !== null); ) b = a.lastIndex, a === z ? m[1] === "!--" ? a = Ne : m[1] !== void 0 ? a = Ee : m[2] !== void 0 ? (Re.test(m[2]) && (o = RegExp("</" + m[2], "g")), a = C) : m[3] !== void 0 && (a = C) : a === C ? m[0] === ">" ? (a = o ?? z, l = -1) : m[1] === void 0 ? l = -2 : (l = a.lastIndex - m[2].length, h = m[1], a = m[3] === void 0 ? C : m[3] === '"' ? Se : Ce) : a === Se || a === Ce ? a = C : a === Ne || a === Ee ? a = z : (a = C, o = void 0);
    const x = a === C && t[u + 1].startsWith("/>") ? " " : "";
    s += a === z ? n + st : l >= 0 ? (r.push(h), n.slice(0, l) + ze + n.slice(l) + A + x) : n + A + (l === -2 ? u : x);
  }
  return [Fe(t, s + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), r];
};
class q {
  constructor({ strings: e, _$litType$: i }, r) {
    let o;
    this.parts = [];
    let s = 0, a = 0;
    const u = e.length - 1, n = this.parts, [h, m] = lt(e, i);
    if (this.el = q.createElement(h, r), S.currentNode = this.el.content, i === 2 || i === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (o = S.nextNode()) !== null && n.length < u; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const l of o.getAttributeNames()) if (l.endsWith(ze)) {
          const b = m[a++], x = o.getAttribute(l).split(A), X = /([.?@])?(.*)/.exec(b);
          n.push({ type: 1, index: s, name: X[2], strings: x, ctor: X[1] === "." ? ct : X[1] === "?" ? dt : X[1] === "@" ? ht : te }), o.removeAttribute(l);
        } else l.startsWith(A) && (n.push({ type: 6, index: s }), o.removeAttribute(l));
        if (Re.test(o.tagName)) {
          const l = o.textContent.split(A), b = l.length - 1;
          if (b > 0) {
            o.textContent = K ? K.emptyScript : "";
            for (let x = 0; x < b; x++) o.append(l[x], Z()), S.nextNode(), n.push({ type: 2, index: ++s });
            o.append(l[b], Z());
          }
        }
      } else if (o.nodeType === 8) if (o.data === Ue) n.push({ type: 2, index: s });
      else {
        let l = -1;
        for (; (l = o.data.indexOf(A, l + 1)) !== -1; ) n.push({ type: 7, index: s }), l += A.length - 1;
      }
      s++;
    }
  }
  static createElement(e, i) {
    const r = k.createElement("template");
    return r.innerHTML = e, r;
  }
}
function D(t, e, i = t, r) {
  var a, u;
  if (e === H) return e;
  let o = r !== void 0 ? (a = i._$Co) == null ? void 0 : a[r] : i._$Cl;
  const s = F(e) ? void 0 : e._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== s && ((u = o == null ? void 0 : o._$AO) == null || u.call(o, !1), s === void 0 ? o = void 0 : (o = new s(t), o._$AT(t, i, r)), r !== void 0 ? (i._$Co ?? (i._$Co = []))[r] = o : i._$Cl = o), o !== void 0 && (e = D(t, o._$AS(t, e.values), o, r)), e;
}
class ut {
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
    const { el: { content: i }, parts: r } = this._$AD, o = ((e == null ? void 0 : e.creationScope) ?? k).importNode(i, !0);
    S.currentNode = o;
    let s = S.nextNode(), a = 0, u = 0, n = r[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let h;
        n.type === 2 ? h = new ee(s, s.nextSibling, this, e) : n.type === 1 ? h = new n.ctor(s, n.name, n.strings, this, e) : n.type === 6 && (h = new mt(s, this, e)), this._$AV.push(h), n = r[++u];
      }
      a !== (n == null ? void 0 : n.index) && (s = S.nextNode(), a++);
    }
    return S.currentNode = k, o;
  }
  p(e) {
    let i = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(e, r, i), i += r.strings.length - 2) : r._$AI(e[i])), i++;
  }
}
class ee {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, i, r, o) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = r, this.options = o, this._$Cv = (o == null ? void 0 : o.isConnected) ?? !0;
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
    e = D(this, e, i), F(e) ? e === d || e == null || e === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : e !== this._$AH && e !== H && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : nt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== d && F(this._$AH) ? this._$AA.nextSibling.data = e : this.T(k.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var s;
    const { values: i, _$litType$: r } = e, o = typeof r == "number" ? this._$AC(e) : (r.el === void 0 && (r.el = q.createElement(Fe(r.h, r.h[0]), this.options)), r);
    if (((s = this._$AH) == null ? void 0 : s._$AD) === o) this._$AH.p(i);
    else {
      const a = new ut(o, this), u = a.u(this.options);
      a.p(i), this.T(u), this._$AH = a;
    }
  }
  _$AC(e) {
    let i = ke.get(e.strings);
    return i === void 0 && ke.set(e.strings, i = new q(e)), i;
  }
  k(e) {
    ye(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let r, o = 0;
    for (const s of e) o === i.length ? i.push(r = new ee(this.O(Z()), this.O(Z()), this, this.options)) : r = i[o], r._$AI(s), o++;
    o < i.length && (this._$AR(r && r._$AB.nextSibling, o), i.length = o);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    var r;
    for ((r = this._$AP) == null ? void 0 : r.call(this, !1, !0, i); e && e !== this._$AB; ) {
      const o = e.nextSibling;
      e.remove(), e = o;
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
  constructor(e, i, r, o, s) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = i, this._$AM = o, this.options = s, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(new String()), this.strings = r) : this._$AH = d;
  }
  _$AI(e, i = this, r, o) {
    const s = this.strings;
    let a = !1;
    if (s === void 0) e = D(this, e, i, 0), a = !F(e) || e !== this._$AH && e !== H, a && (this._$AH = e);
    else {
      const u = e;
      let n, h;
      for (e = s[0], n = 0; n < s.length - 1; n++) h = D(this, u[r + n], i, n), h === H && (h = this._$AH[n]), a || (a = !F(h) || h !== this._$AH[n]), h === d ? e = d : e !== d && (e += (h ?? "") + s[n + 1]), this._$AH[n] = h;
    }
    a && !o && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ct extends te {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}
class dt extends te {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}
class ht extends te {
  constructor(e, i, r, o, s) {
    super(e, i, r, o, s), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = D(this, e, i, 0) ?? d) === H) return;
    const r = this._$AH, o = e === d && r !== d || e.capture !== r.capture || e.once !== r.once || e.passive !== r.passive, s = e !== d && (r === d || o);
    o && this.element.removeEventListener(this.name, this, r), s && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var i;
    typeof this._$AH == "function" ? this._$AH.call(((i = this.options) == null ? void 0 : i.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class mt {
  constructor(e, i, r) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    D(this, e);
  }
}
const re = R.litHtmlPolyfillSupport;
re == null || re(q, ee), (R.litHtmlVersions ?? (R.litHtmlVersions = [])).push("3.3.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const pt = (t) => (...e) => ({ _$litDirective$: t, values: e });
let ft = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, i, r) {
    this._$Ct = e, this._$AM = i, this._$Ci = r;
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
const _t = {}, gt = (t, e = _t) => t._$AH = e;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const vt = pt(class extends ft {
  constructor() {
    super(...arguments), this.key = d;
  }
  render(t, e) {
    return this.key = t, e;
  }
  update(t, [e, i]) {
    return e !== this.key && (gt(t), this.key = e), i;
  }
});
var yt = Object.defineProperty, bt = Object.getOwnPropertyDescriptor, He = (t) => {
  throw TypeError(t);
}, w = (t, e, i, r) => {
  for (var o = r > 1 ? void 0 : r ? bt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (o = (r ? a(e, i, o) : a(o)) || o);
  return r && o && yt(e, i, o), o;
}, $t = (t, e, i) => e.has(t) || He("Cannot " + i), T = (t, e, i) => ($t(t, e, "read from private field"), i ? i.call(t) : e.get(t)), M = (t, e, i) => e.has(t) ? He("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), ue, ce, de, he, me, pe;
let _ = class extends W {
  constructor() {
    super(), this._formState = void 0, this._formError = null, this._articulateNodeId = void 0, this._selectedBlogNodeName = "", this._postCount = void 0, this._formRenderKey = 0, this._archiveDoctypeUdi = void 0, M(this, ue, (t, e) => {
      const i = window.URL.createObjectURL(t), r = document.createElement("a");
      r.style.display = "none", r.href = i, r.download = e, document.body.appendChild(r), r.click(), window.URL.revokeObjectURL(i), r.remove();
    }), M(this, ce, (t) => t instanceof Blob), M(this, de, async (t) => {
      if (t.preventDefault(), !this._form) return;
      const e = new FormData(this._form), i = e.get("importFile");
      if (console.info("Form submission validity check:", this._form.reportValidity()), console.info("Current _articulateNodeId:", this._articulateNodeId), console.info("Selected import file:", i == null ? void 0 : i.name, "Size:", i == null ? void 0 : i.size), !this._articulateNodeId) {
        const r = new Error("A blog node must be selected before importing.");
        r.name = "Validation Error", f(this, r, r.name), this._form.reportValidity();
        return;
      }
      if (!i || i.size === 0) {
        const r = new Error("A BlogML file must be selected for import.");
        r.name = "Validation Error", f(this, r, r.name), this._form.reportValidity();
        return;
      }
      if (!this._form.reportValidity()) {
        const r = new Error("The form is not valid. Please check the fields marked with an error.");
        r.name = "Validation Error", f(this, r, r.name);
        return;
      }
      if (this._formState !== "waiting") {
        this._formState = "waiting", this._formError = null, this._postCount = void 0;
        try {
          const r = await T(this, he).call(this, i);
          this._postCount = r.postCount;
          const o = await T(this, me).call(this, e, r.temporaryFileName);
          e.get("exportDisqusXml") === "on" && o.commentCount > 0 && await T(this, pe).call(this), this._formState = "success";
          const s = e.get("exportDisqusXml") === "on" && o.commentCount > 0 ? `${o.commentCount} comments exported.` : e.get("exportDisqusXml") === "on" ? "No comments found to export." : "";
          await _e(
            this,
            `BlogML imported successfully! ${o.authorCount} authors, ${this._postCount} posts imported. ${s}`,
            "positive",
            !0
          ), this.resetState(!0);
        } catch (r) {
          f(this, r, "Import Failed");
        }
      }
    }), M(this, he, async (t) => {
      var i, r;
      const e = await U.postArticulateBlogImportBeginV1({ body: { importFile: t } });
      if (!e.response.ok || !((i = e.data) != null && i.temporaryFileName) || !((r = e.data) != null && r.postCount))
        throw e.error || new Error("Failed to upload blog content.");
      return e.data;
    }), M(this, me, async (t, e) => {
      var o;
      const i = {
        articulateNodeId: this._articulateNodeId,
        overwrite: t.get("overwrite") === "on",
        publish: t.get("publish") === "on",
        regexMatch: t.get("regexMatch") || "",
        regexReplace: t.get("regexReplace") || "",
        tempFile: e,
        exportDisqusXml: t.get("exportDisqusXml") === "on",
        importFirstImage: t.get("importFirstImage") === "on"
      }, r = await U.postArticulateBlogImportV1({ body: i });
      if (!r.response.ok || !((o = r.data) != null && o.completed))
        throw r.error || new Error("Failed to import blog content.");
      return r.data;
    }), M(this, pe, async () => {
      const t = await U.getArticulateBlogExportDisqusV1();
      if (!t.response.ok || !t.data)
        throw t.error || new Error("Failed to export Disqus comments.");
      const e = t.data;
      if (!T(this, ce).call(this, e))
        throw new Error("Invalid file received for Disqus export.");
      const i = t.response.headers.get("content-disposition");
      let r = "disqus-comments.xml";
      if (i) {
        const o = i.match(/filename="?([^"]+)"?/);
        o && o.length > 1 && o[1] && (r = o[1]);
      }
      T(this, ue).call(this, e, r);
    }), this._handleReset = (t) => {
      t.preventDefault(), this.resetState(!0);
    }, this.consumeContext(Te, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Fetches the Articulate Archive doctype UDI when the component connects.
   * @async
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await De(), this._archiveDoctypeUdi === null) {
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
    const t = await Be(this._modalManagerContext, this._archiveDoctypeUdi, this);
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
        ${ge(this.routerPath)}
        <uui-form>
          ${vt(
      this._formRenderKey,
      p`
              <form
                id="blogMlImportForm"
                @submit=${T(this, de)}
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
  j,
  L`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }

      .node-picker-container {
        display: flex;
        gap: var(--uui-size-space-4);
        align-items: flex-end;
      }
    `
];
w([
  J({ type: String })
], _.prototype, "routerPath", 2);
w([
  c()
], _.prototype, "_formState", 2);
w([
  c()
], _.prototype, "_formError", 2);
w([
  c()
], _.prototype, "_articulateNodeId", 2);
w([
  c()
], _.prototype, "_selectedBlogNodeName", 2);
w([
  c()
], _.prototype, "_postCount", 2);
w([
  c()
], _.prototype, "_formRenderKey", 2);
w([
  fe("#blogMlImportForm")
], _.prototype, "_form", 2);
_ = w([
  V("blogml-importer")
], _);
var wt = Object.defineProperty, xt = Object.getOwnPropertyDescriptor, qe = (t) => {
  throw TypeError(t);
}, E = (t, e, i, r) => {
  for (var o = r > 1 ? void 0 : r ? xt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (o = (r ? a(e, i, o) : a(o)) || o);
  return r && o && wt(e, i, o), o;
}, Le = (t, e, i) => e.has(t) || qe("Cannot " + i), Ie = (t, e, i) => (Le(t, e, "read from private field"), i ? i.call(t) : e.get(t)), oe = (t, e, i) => e.has(t) ? qe("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), $ = (t, e, i) => (Le(t, e, "access private method"), i), v, Ve, be, We, je, Xe, $e, Ye, we, Ge, Ke;
let g = class extends W {
  constructor() {
    super(...arguments), oe(this, v), this._formState = void 0, this._formError = null, this._themes = [], this._selectedTheme = void 0, this._newThemeName = void 0, oe(this, $e, (t) => {
      this._formError = null, this._formState = void 0, this._newThemeName = t.target.value;
    }), oe(this, we, (t) => {
      t.preventDefault(), this.resetState(!0);
    });
  }
  /**
   * Loads the list of themes when the component is connected to the DOM.
   * @async
   */
  async connectedCallback() {
    super.connectedCallback(), await $(this, v, Ve).call(this);
  }
  /**
   * Resets the component's state.
   * @param {boolean} [fullReset=false] If true, performs a full reset, clearing the selected theme and form state.
   */
  resetState(t = !1) {
    t && (this._formState = void 0, this._formError = null, this._selectedTheme = void 0, this._newThemeName = void 0);
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
        <div class="container">${$(this, v, Ge).call(this)} ${$(this, v, Ke).call(this)}</div>
        ${this._formError ? ve(this._formError) : ""}
      </uui-box>
    `;
  }
};
v = /* @__PURE__ */ new WeakSet();
Ve = async function() {
  var t;
  try {
    const e = await Me.getArticulateThemesDefaultV1();
    if (!e.response.ok || !e.data)
      throw e.error || new Error("The list of themes could not be retrieved from the server.");
    this._themes = ((t = e.data) == null ? void 0 : t.map((i) => i)) ?? [];
  } catch (e) {
    f(this, e, "Could not load themes");
  }
};
be = function(t) {
  this.resetState(!0), this._selectedTheme = t, this._newThemeName = `${t} - Copy`;
};
We = function(t, e) {
  t.stopPropagation(), $(this, v, be).call(this, e);
};
je = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && $(this, v, be).call(this, i);
};
Xe = function(t) {
  const i = t.target.getAttribute("data-theme");
  i && i === this._selectedTheme && this.resetState(!0);
};
$e = /* @__PURE__ */ new WeakMap();
Ye = async function(t) {
  if (t.preventDefault(), !!this._form) {
    if (!this._form.reportValidity()) {
      const e = new Error("Please enter a new name for the theme.");
      e.name = "Validation Error", f(this, e, e.name);
      return;
    }
    if (this._formState !== "waiting") {
      this._formState = "waiting", this._formError = null;
      try {
        const e = await Me.postArticulateThemesCopyV1({
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
we = /* @__PURE__ */ new WeakMap();
Ge = function() {
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
              @selected=${$(this, v, je)}
              @deselected=${$(this, v, Xe)}
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
      const r = i.parentElement;
      if (r && !r.querySelector(":scope > .theme-fallback-initial")) {
        const o = document.createElement("span");
        o.className = "theme-fallback-initial", o.textContent = t.charAt(0).toUpperCase(), r.appendChild(o);
      }
    }}
              />
              <div slot="actions">
                <uui-button
                  look="primary"
                  label="Select Theme ${t}"
                  @click=${(e) => $(this, v, We).call(this, e, t)}
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
Ke = function() {
  return this._selectedTheme ? p`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>
        <uui-form>
          <form
            @submit=${$(this, v, Ye)}
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
                  @input=${Ie(this, $e)}
                  required
                  required-message="You must provide a new name for the theme."
                  label="New theme name"
                ></uui-input>
              </uui-form-layout-item>
            </uui-validation-message>
            <div class="form-actions">
              <uui-button id="duplicateButton" type="submit" look="primary" .state=${this._formState}>
                Duplicate
              </uui-button>
              <uui-button id="cancelButton" type="button" look="secondary" @click=${Ie(this, we)}>
                Cancel
              </uui-button>
            </div>
          </form>
        </uui-form>
      </div>
    ` : p``;
};
g.styles = [
  j,
  L`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }
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

      .form-actions {
        display: flex;
        gap: var(--uui-size-space-4);
        margin-top: var(--uui-size-space-6);
      }
    `
];
E([
  J({ type: String })
], g.prototype, "routerPath", 2);
E([
  c()
], g.prototype, "_formState", 2);
E([
  c()
], g.prototype, "_formError", 2);
E([
  c()
], g.prototype, "_themes", 2);
E([
  c()
], g.prototype, "_selectedTheme", 2);
E([
  c()
], g.prototype, "_newThemeName", 2);
E([
  fe("form")
], g.prototype, "_form", 2);
g = E([
  V("copy-theme")
], g);
var At = Object.defineProperty, Nt = Object.getOwnPropertyDescriptor, Ze = (t, e, i, r) => {
  for (var o = r > 1 ? void 0 : r ? Nt(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (o = (r ? a(e, i, o) : a(o)) || o);
  return r && o && At(e, i, o), o;
};
const Et = [
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
let P = class extends W {
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
          ${Et.map((t) => {
      var r;
      const i = `${(r = this.routerPath) == null ? void 0 : r.replace(/\/$/, "")}/${t.path}`;
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
  j,
  L`
      :host {
        display: block;
      }
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--uui-size-space-6);
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
Ze([
  J({ type: String })
], P.prototype, "routerPath", 2);
P = Ze([
  V("dashboard-options")
], P);
var Ct = Object.defineProperty, St = Object.getOwnPropertyDescriptor, B = (t, e, i, r) => {
  for (var o = r > 1 ? void 0 : r ? St(e, i) : e, s = t.length - 1, a; s >= 0; s--)
    (a = t[s]) && (o = (r ? a(e, i, o) : a(o)) || o);
  return r && o && Ct(e, i, o), o;
};
let N = class extends W {
  /**
   * Initializes the component, fetches server information, and sets up routes.
   */
  constructor() {
    super(), this._buildDate = "2025-07-03T01:37:15.553Z", this._packageVersion = "6.0.0-g974c722e5a", this._getServerInformation();
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
        component: y,
        setup: t(y)
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
  /**
   * Fetches server information from the backend.
   * @private
   * @async
   * @returns {Promise<ServerInformationResponseModel | null>} The server information or null if it fails.
   */
  async _getServerInformation() {
    const t = await it.getServerInformation();
    return t.response.ok && t.data ? (this._serverInformation = t.data, console.info("Server Information:", t.data), t.data) : (console.warn("Failed to get server information."), null);
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
          <p slot="footer-info" class="articulate-footer-info">
            Articulate | Version:
            ${this._packageVersion}${this._serverInformation && this._serverInformation.runtimeMode === Qe.BACKOFFICE_DEVELOPMENT ? ` | Build Date: ${this._buildDate}` : ""}
          </p>
        </footer>
      </umb-body-layout>
    `;
  }
};
N.styles = [
  j,
  L`
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
B([
  c()
], N.prototype, "_routerBasePath", 2);
B([
  c()
], N.prototype, "_routes", 2);
B([
  c()
], N.prototype, "_buildDate", 2);
B([
  c()
], N.prototype, "_packageVersion", 2);
B([
  c()
], N.prototype, "_serverInformation", 2);
N = B([
  V("articulate-dashboard")
], N);
export {
  N as default
};
