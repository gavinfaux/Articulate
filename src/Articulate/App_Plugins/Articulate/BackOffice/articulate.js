import { UMB_AUTH_CONTEXT as Oe } from "@umbraco-cms/backoffice/auth";
import { A as g, h as b, c as De } from "./error-utils-BqJ7wuVX.js";
import { html as l, css as w, property as te, state as d, customElement as I, nothing as ie } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as A } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as N } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as _e } from "@umbraco-cms/backoffice/modal";
import { UmbValidationContext as re, umbBindToValidation as oe } from "@umbraco-cms/backoffice/validation";
import { UMB_DOCUMENT_PICKER_MODAL as Be } from "@umbraco-cms/backoffice/document";
import { DocumentService as Ie } from "@umbraco-cms/backoffice/external/backend-api";
import { UMB_NOTIFICATION_CONTEXT as ze } from "@umbraco-cms/backoffice/notification";
async function be() {
  const i = await g.getUmbracoManagementApiV1ArticulateBlogArticulateGuid();
  if (i.response.ok && i.data)
    return i.data;
  if (!i.data)
    return console.error("API returned no data for Articulate Archive UDI"), null;
  try {
    let e = await i.response.json();
    console.error(
      e.title && e.detail ? `${e.title}: ${e.detail}` : e.title
    );
  } catch {
    console.error(`${i.response.status} ${i.response.statusText}`);
  }
  return null;
}
async function ye(i) {
  var e;
  try {
    const t = await Ie.getDocumentById({ id: i });
    return ((e = t == null ? void 0 : t.variants) == null ? void 0 : e[0]) ?? null;
  } catch (t) {
    return console.error(
      `Failed to fetch node: ${t instanceof Error ? t.message : String(t)}`
    ), null;
  }
}
async function ve(i, e, t) {
  try {
    const o = await i.open(
      t,
      Be,
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
    return !o || !o.selection || !o.selection[0] ? null : o.selection[0];
  } catch (r) {
    return console.error(`Node picker failed: ${r instanceof Error ? r.message : String(r)}`), null;
  }
}
async function ae(i, e, t) {
  (await i.getContext(ze)).peek(t, {
    data: { message: e }
  });
}
function se(i) {
  return l`
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
const we = w`
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
var Re = Object.defineProperty, Fe = Object.getOwnPropertyDescriptor, $e = (i) => {
  throw TypeError(i);
}, $ = (i, e, t, r) => {
  for (var o = r > 1 ? void 0 : r ? Fe(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (o = (r ? s(e, t, o) : s(o)) || o);
  return r && o && Re(e, t, o), o;
}, Ee = (i, e, t) => e.has(i) || $e("Cannot " + t), T = (i, e, t) => (Ee(i, e, "read from private field"), t ? t.call(i) : e.get(i)), x = (i, e, t) => e.has(i) ? $e("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(i) : e.set(i, t), qe = (i, e, t) => (Ee(i, e, "access private method"), t), q, L, j, W, V, xe;
let h = class extends A {
  /**
   * Creates an instance of ArticulateBlogMlExporterElement.
   * Sets up the modal manager context.
   */
  constructor() {
    super(), x(this, V), this._formState = void 0, this._formError = "", this._articulateNodeId = null, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = null, x(this, q, new re(this)), x(this, L, (i, e) => {
      const t = window.URL.createObjectURL(i), r = document.createElement("a");
      r.style.display = "none", r.href = t, r.download = e, document.body.appendChild(r), r.click(), window.URL.revokeObjectURL(t), r.remove();
    }), x(this, j, (i) => i instanceof Blob), x(this, W, async (i) => {
      i.preventDefault();
      const e = i.target;
      if (!e) return;
      try {
        await T(this, q).validate();
      } catch {
        this._formError = "Please select a blog node.";
        return;
      }
      const r = new FormData(e).get("embedImages") === "on", o = {
        articulateNodeId: this._articulateNodeId,
        exportImagesAsBase64: r
      };
      this._formState = "waiting", this._formError = "";
      const a = await g.postUmbracoManagementApiV1ArticulateBlogExport({
        body: o
      });
      if (!a.response.ok) {
        this._formError = await b(a.response, "Failed to export blog content."), this._formState = "failed";
        return;
      }
      const s = a.data;
      if (!T(this, j).call(this, s)) {
        this._formState = "failed", this._formError = "Failed to receive a valid file from the server.";
        return;
      }
      const n = a.response.headers.get("content-disposition");
      let u = "blog-export.xml";
      if (n) {
        const m = n.match(/filename=\"?([^\"]+)\"?/);
        m && m.length > 1 && m[1] && (u = m[1]);
      }
      T(this, L).call(this, s, u), this._formState = "success", await ae(this, "BlogML exported successfully!", "positive"), e.reset(), this._articulateNodeId = null, this._selectedBlogNodeName = "";
    }), this.consumeContext(_e, (i) => {
      this._modalManagerContext = i;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await be(), this._archiveDoctypeUdi === null) {
      this._formState = "failed", this._formError = "Failed to retrieve Articulate Archive document type.";
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
    const i = await ve(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (i) {
      const e = await ye(i);
      if (!e) {
        this._formError = "Selected node not found.";
        return;
      }
      this._articulateNodeId = i, this._selectedBlogNodeName = e.name;
    }
  }
  render() {
    return l`
      <uui-box headline="BlogML Exporter">
        ${se(this.routerPath)}
        <uui-form-validation-message>
          <uui-form>
            <form id="blogMlExportForm" @submit=${T(this, W)}>
              <uui-form-layout-item>
                <div class="node-picker-container">
                  <uui-label for="articulateNodeId" slot="label" required
                    >Articulate blog node</uui-label
                  >
                  <uui-input
                    id="articulateNodeId"
                    name="articulateNodeId"
                    placeholder="No node selected"
                    .value=${this._selectedBlogNodeName}
                    ${oe(this, "$.articulateNodeId", this._articulateNodeId || "")}
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
                  Check if you want to embed images as base64 data in the output file. Useful if
                  your site isn't going to be HTTP accessible to the site you will be importing on.
                </div>
              </uui-form-layout-item>
              <uui-form-layout-item>${qe(this, V, xe).call(this)}</uui-form-layout-item>
              <uui-button-group>
                <uui-button
                  type="submit"
                  look="primary"
                  .state=${this._formState}
                  ?disabled=${this._formState === "waiting"}
                  >Submit</uui-button
                >
              </uui-button-group>
            </form>
          </uui-form>
        </uui-form-validation-message>
      </uui-box>
    `;
  }
};
q = /* @__PURE__ */ new WeakMap();
L = /* @__PURE__ */ new WeakMap();
j = /* @__PURE__ */ new WeakMap();
W = /* @__PURE__ */ new WeakMap();
V = /* @__PURE__ */ new WeakSet();
xe = function() {
  return !this._formError || this._formState !== "failed" ? ie : l`<p class="text-danger">${this._formError}</p>`;
};
h.styles = [
  N,
  we,
  w`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
      .text-danger {
        color: var(--uui-color-danger);
      }
    `
];
$([
  te({ type: String })
], h.prototype, "routerPath", 2);
$([
  d()
], h.prototype, "_formState", 2);
$([
  d()
], h.prototype, "_formError", 2);
$([
  d()
], h.prototype, "_articulateNodeId", 2);
$([
  d()
], h.prototype, "_selectedBlogNodeName", 2);
h = $([
  I("articulate-blogml-exporter")
], h);
var Le = Object.defineProperty, je = Object.getOwnPropertyDescriptor, Se = (i) => {
  throw TypeError(i);
}, _ = (i, e, t, r) => {
  for (var o = r > 1 ? void 0 : r ? je(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (o = (r ? s(e, t, o) : s(o)) || o);
  return r && o && Le(e, t, o), o;
}, Ce = (i, e, t) => e.has(i) || Se("Cannot " + t), k = (i, e, t) => (Ce(i, e, "read from private field"), t ? t.call(i) : e.get(i)), S = (i, e, t) => e.has(i) ? Se("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(i) : e.set(i, t), We = (i, e, t) => (Ce(i, e, "access private method"), t), X, G, H, Y, K, Pe;
let c = class extends A {
  /**
   * Creates an instance of ArticulateBlogMlImporterElement.
   * Sets up the modal manager context and file reader event handlers.
   */
  constructor() {
    super(), S(this, K), this._formState = void 0, this._formError = "", this._articulateNodeId = null, this._selectedBlogNodeName = "", this._postCount = null, this._archiveDoctypeUdi = null, S(this, X, new re(this)), S(this, G, (i, e) => {
      const t = window.URL.createObjectURL(i), r = document.createElement("a");
      r.style.display = "none", r.href = t, r.download = e, document.body.appendChild(r), r.click(), window.URL.revokeObjectURL(t), r.remove();
    }), S(this, H, (i) => i instanceof Blob), S(this, Y, async (i) => {
      i.preventDefault();
      const e = i.target;
      if (!e) return;
      try {
        await k(this, X).validate();
      } catch {
        this._formError = "Please select a blog node.";
        return;
      }
      const t = new FormData(e), r = t.get("importFile");
      if (!r) {
        this._formError = "Please select a file to import.";
        return;
      }
      const o = new FormData();
      o.append(r.name, r), this._formState = "waiting", this._formError = "";
      const a = await g.postUmbracoManagementApiV1ArticulateBlogImportBegin({
        body: o
        // hey-api handles FormData directly
      });
      if (!a.response.ok) {
        this._formError = await b(a.response, "Failed to upload blog content."), this._formState = "failed";
        return;
      }
      const s = a.data;
      if (!s || !s.temporaryFileName) {
        this._formState = "failed", this._formError = "Failed to upload blog content.";
        return;
      }
      if (this._postCount === 0) {
        this._formError = "No posts found in the file.", this._formState = "failed";
        return;
      }
      this._postCount = s.postCount;
      const n = {
        articulateNodeId: this._articulateNodeId,
        overwrite: t.get("overwrite") === "on",
        publish: t.get("publish") === "on",
        regexMatch: t.get("regexMatch") || "",
        regexReplace: t.get("regexReplace") || "",
        tempFile: s.temporaryFileName,
        exportDisqusXml: t.get("disqusExport") === "on",
        importFirstImage: t.get("importImage") === "on"
      }, u = await g.postUmbracoManagementApiV1ArticulateBlogImport({
        body: n
      });
      if (!u.response.ok) {
        this._formError = await b(
          u.response,
          "Failed to import blog content."
        ), this._formState = "failed";
        return;
      }
      const m = u.data;
      if (!m) {
        this._formState = "failed", this._formError = "Failed to import blog content.";
        return;
      }
      if (t.get("disqusExport") === "on" && (!m.downloadUrl || m.downloadUrl === "")) {
        this._formState = "failed", this._formError = "Import reported success but no Disqus comments XML file was returned.";
        return;
      }
      if (t.get("disqusExport") === "on" && m.downloadUrl) {
        const U = await g.getUmbracoManagementApiV1ArticulateBlogExportDisqus();
        if (!U.response.ok) {
          this._formError = await b(
            U.response,
            "Failed to export Disqus comments."
          ), this._formState = "failed";
          return;
        }
        const ce = U.data;
        if (!k(this, H).call(this, ce)) {
          this._formState = "failed", this._formError = "Failed to receive a valid file from the server.";
          return;
        }
        const de = U.response.headers.get("content-disposition");
        let he = "disqus-comments.xml";
        if (de) {
          const M = de.match(/filename=\"?([^\"]+)\"?/);
          M && M.length > 1 && M[1] && (he = M[1]);
        }
        k(this, G).call(this, ce, he);
      }
      this._formState = "success", await ae(this, "BlogML imported successfully!", "positive"), e.reset(), this._articulateNodeId = null, this._selectedBlogNodeName = "", this._postCount = null;
    }), this.consumeContext(_e, (i) => {
      this._modalManagerContext = i;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await be(), this._archiveDoctypeUdi === null) {
      this._formState = "failed", this._formError = "Failed to retrieve Articulate Archive document type.";
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
    const i = await ve(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (i) {
      const e = await ye(i);
      if (!e) {
        this._formError = "Selected node not found.";
        return;
      }
      this._articulateNodeId = i, this._selectedBlogNodeName = e.name;
    }
  }
  render() {
    return l`
      <uui-box headline="BlogML Importer">
        ${se(this.routerPath)}
        <uui-form-validation-message>
        <uui-form>
        <form id="blogMlImportForm" @submit=${k(this, Y)}>
        <uui-form-layout-item>
                <div class="node-picker-container">
                  <uui-label for="articulateNodeId" slot="label" required
                    >Articulate blog node</uui-label
                  >
                  <uui-input
                    id="articulateNodeId"
                    name="articulateNodeId"
                    placeholder="No node selected"
                    .value=${this._selectedBlogNodeName}
                    ${oe(this, "$.articulateNodeId", this._articulateNodeId || "")}
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
            <div slot="messages">${this._postCount ? `Found ${this._postCount} posts in the file.` : ""}</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label slot="label" for="overwrite">Overwrite imported posts?</uui-label>
            <uui-toggle id="overwrite" name="overwrite"></uui-toggle>
            <div slot="description">Check if you want to overwrite posts already imported</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label slot="label" for="publishAll">Publish all posts?</uui-label>
            <uui-toggle id="publishAll" name="publishAll"></uui-toggle>
            <div slot="description">Check if you want all imported posts to be published</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="regexMatch" slot="label">Regex match expression</uui-label>
            <uui-input
              id="regexMatch"
              style="--auto-width-text-margin-right: 20px"
              name="regexMatch"  auto-width placeholder="Example to match: (@example\.old)"
            ></uui-input>
            <div slot="description">
              Regex statement used to match content in the blog post to be replaced by the match
              statement
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="regexReplace" slot="label">Regex replacement statement</uui-label>
            <uui-input
              id="regexReplace"
              style="--auto-width-text-margin-right: 20px"
              name="regexReplace"  auto-width placeholder="Example replacement: @example.new"
            ></uui-input>
            <div slot="description">Replacement statement used with the above match statement</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label slot="label" for="disqusExport">Export Disqus Xml</uui-label>
            <uui-toggle id="disqusExport" name="disqusExport"></uui-toggle>
            <div slot="description">
              If you would like Articulate to output an XML file that you can use to import the
              comments found in this file in to Disqus
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label slot="label" for="importImage">Import First Image from Post Attachments</uui-label>
            <uui-toggle id="importImage" name="importImage"></uui-toggle>
            <div slot="description">
              If you would like Articulate to try and import the first image url in the post
              attachments
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>${We(this, K, Pe).call(this)}</uui-form-layout-item>
          <uui-button-group>
          <uui-button type="submit" look="primary" .state=${this._formState} ?disabled=${this._formState === "waiting"}
          >Submit</uui-button>
          </uui-button-group>
          </form>
        </uui-form-validation-message>
        </uui-form>
      </uui-box>
    `;
  }
};
X = /* @__PURE__ */ new WeakMap();
G = /* @__PURE__ */ new WeakMap();
H = /* @__PURE__ */ new WeakMap();
Y = /* @__PURE__ */ new WeakMap();
K = /* @__PURE__ */ new WeakSet();
Pe = function() {
  return !this._formError || this._formState !== "failed" ? ie : l`<p class="text-danger">${this._formError}</p>`;
};
c.styles = [
  N,
  we,
  w`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
      .text-danger {
        color: var(--uui-color-danger);
      }
    `
];
_([
  te({ type: String })
], c.prototype, "routerPath", 2);
_([
  d()
], c.prototype, "_formState", 2);
_([
  d()
], c.prototype, "_formError", 2);
_([
  d()
], c.prototype, "_articulateNodeId", 2);
_([
  d()
], c.prototype, "_selectedBlogNodeName", 2);
_([
  d()
], c.prototype, "_postCount", 2);
c = _([
  I("articulate-blogml-importer")
], c);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ve = (i) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(i, e);
  }) : customElements.define(i, e);
};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const D = globalThis, ne = D.ShadowRoot && (D.ShadyCSS === void 0 || D.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Ae = Symbol(), pe = /* @__PURE__ */ new WeakMap();
let Xe = class {
  constructor(e, t, r) {
    if (this._$cssResult$ = !0, r !== Ae) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (ne && e === void 0) {
      const r = t !== void 0 && t.length === 1;
      r && (e = pe.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), r && pe.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ge = (i) => new Xe(typeof i == "string" ? i : i + "", void 0, Ae), He = (i, e) => {
  if (ne) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const r = document.createElement("style"), o = D.litNonce;
    o !== void 0 && r.setAttribute("nonce", o), r.textContent = t.cssText, i.appendChild(r);
  }
}, me = ne ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const r of e.cssRules) t += r.cssText;
  return Ge(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Ye, defineProperty: Ke, getOwnPropertyDescriptor: Je, getOwnPropertyNames: Qe, getOwnPropertySymbols: Ze, getPrototypeOf: et } = Object, f = globalThis, fe = f.trustedTypes, tt = fe ? fe.emptyScript : "", R = f.reactiveElementPolyfillSupport, P = (i, e) => i, B = { toAttribute(i, e) {
  switch (e) {
    case Boolean:
      i = i ? tt : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, e) {
  let t = i;
  switch (e) {
    case Boolean:
      t = i !== null;
      break;
    case Number:
      t = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(i);
      } catch {
        t = null;
      }
  }
  return t;
} }, le = (i, e) => !Ye(i, e), ge = { attribute: !0, type: String, converter: B, reflect: !1, useDefault: !1, hasChanged: le };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), f.litPropertyMetadata ?? (f.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class C extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = ge) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const r = Symbol(), o = this.getPropertyDescriptor(e, r, t);
      o !== void 0 && Ke(this.prototype, e, o);
    }
  }
  static getPropertyDescriptor(e, t, r) {
    const { get: o, set: a } = Je(this.prototype, e) ?? { get() {
      return this[t];
    }, set(s) {
      this[t] = s;
    } };
    return { get: o, set(s) {
      const n = o == null ? void 0 : o.call(this);
      a == null || a.call(this, s), this.requestUpdate(e, n, r);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ge;
  }
  static _$Ei() {
    if (this.hasOwnProperty(P("elementProperties"))) return;
    const e = et(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(P("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(P("properties"))) {
      const t = this.properties, r = [...Qe(t), ...Ze(t)];
      for (const o of r) this.createProperty(o, t[o]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [r, o] of t) this.elementProperties.set(r, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, r] of this.elementProperties) {
      const o = this._$Eu(t, r);
      o !== void 0 && this._$Eh.set(o, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const r = new Set(e.flat(1 / 0).reverse());
      for (const o of r) t.unshift(me(o));
    } else e !== void 0 && t.push(me(e));
    return t;
  }
  static _$Eu(e, t) {
    const r = t.attribute;
    return r === !1 ? void 0 : typeof r == "string" ? r : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const r of t.keys()) this.hasOwnProperty(r) && (e.set(r, this[r]), delete this[r]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return He(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var r;
      return (r = t.hostConnected) == null ? void 0 : r.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var r;
      return (r = t.hostDisconnected) == null ? void 0 : r.call(t);
    });
  }
  attributeChangedCallback(e, t, r) {
    this._$AK(e, r);
  }
  _$ET(e, t) {
    var a;
    const r = this.constructor.elementProperties.get(e), o = this.constructor._$Eu(e, r);
    if (o !== void 0 && r.reflect === !0) {
      const s = (((a = r.converter) == null ? void 0 : a.toAttribute) !== void 0 ? r.converter : B).toAttribute(t, r.type);
      this._$Em = e, s == null ? this.removeAttribute(o) : this.setAttribute(o, s), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var a, s;
    const r = this.constructor, o = r._$Eh.get(e);
    if (o !== void 0 && this._$Em !== o) {
      const n = r.getPropertyOptions(o), u = typeof n.converter == "function" ? { fromAttribute: n.converter } : ((a = n.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? n.converter : B;
      this._$Em = o, this[o] = u.fromAttribute(t, n.type) ?? ((s = this._$Ej) == null ? void 0 : s.get(o)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(e, t, r) {
    var o;
    if (e !== void 0) {
      const a = this.constructor, s = this[e];
      if (r ?? (r = a.getPropertyOptions(e)), !((r.hasChanged ?? le)(s, t) || r.useDefault && r.reflect && s === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(a._$Eu(e, r)))) return;
      this.C(e, t, r);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: r, reflect: o, wrapped: a }, s) {
    r && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, s ?? t ?? this[e]), a !== !0 || s !== void 0) || (this._$AL.has(e) || (this.hasUpdated || r || (t = void 0), this._$AL.set(e, t)), o === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var r;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [a, s] of this._$Ep) this[a] = s;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [a, s] of o) {
        const { wrapped: n } = s, u = this[a];
        n !== !0 || this._$AL.has(a) || u === void 0 || this.C(a, void 0, s, u);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (r = this._$EO) == null || r.forEach((o) => {
        var a;
        return (a = o.hostUpdate) == null ? void 0 : a.call(o);
      }), this.update(t)) : this._$EM();
    } catch (o) {
      throw e = !1, this._$EM(), o;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((r) => {
      var o;
      return (o = r.hostUpdated) == null ? void 0 : o.call(r);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
}
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[P("elementProperties")] = /* @__PURE__ */ new Map(), C[P("finalized")] = /* @__PURE__ */ new Map(), R == null || R({ ReactiveElement: C }), (f.reactiveElementVersions ?? (f.reactiveElementVersions = [])).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const it = { attribute: !0, type: String, converter: B, reflect: !1, hasChanged: le }, rt = (i = it, e, t) => {
  const { kind: r, metadata: o } = t;
  let a = globalThis.litPropertyMetadata.get(o);
  if (a === void 0 && globalThis.litPropertyMetadata.set(o, a = /* @__PURE__ */ new Map()), r === "setter" && ((i = Object.create(i)).wrapped = !0), a.set(t.name, i), r === "accessor") {
    const { name: s } = t;
    return { set(n) {
      const u = e.get.call(this);
      e.set.call(this, n), this.requestUpdate(s, u, i);
    }, init(n) {
      return n !== void 0 && this.C(s, void 0, i, n), n;
    } };
  }
  if (r === "setter") {
    const { name: s } = t;
    return function(n) {
      const u = this[s];
      e.call(this, n), this.requestUpdate(s, u, i);
    };
  }
  throw Error("Unsupported decorator location: " + r);
};
function Ne(i) {
  return (e, t) => typeof t == "object" ? rt(i, e, t) : ((r, o, a) => {
    const s = o.hasOwnProperty(a);
    return o.constructor.createProperty(a, r), s ? Object.getOwnPropertyDescriptor(o, a) : void 0;
  })(i, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function z(i) {
  return Ne({ ...i, state: !0, attribute: !1 });
}
var ot = Object.defineProperty, at = Object.getOwnPropertyDescriptor, Ue = (i) => {
  throw TypeError(i);
}, E = (i, e, t, r) => {
  for (var o = r > 1 ? void 0 : r ? at(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (o = (r ? s(e, t, o) : s(o)) || o);
  return r && o && ot(e, t, o), o;
}, Me = (i, e, t) => e.has(i) || Ue("Cannot " + t), F = (i, e, t) => (Me(i, e, "read from private field"), t ? t.call(i) : e.get(i)), O = (i, e, t) => e.has(i) ? Ue("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(i) : e.set(i, t), st = (i, e, t) => (Me(i, e, "access private method"), t), J, Q, Z, ee, Te;
let p = class extends A {
  constructor() {
    super(...arguments), O(this, ee), this._formState = void 0, this._formError = "", this._themes = [], this._newThemeName = "", this._selectedTheme = null, O(this, J, new re(this)), O(this, Q, (i) => {
      this._newThemeName = i.target.value;
    }), O(this, Z, () => {
      this._selectedTheme = null;
    });
  }
  /**
   * Fetches the list of available themes.
   * @private
   */
  async connectedCallback() {
    super.connectedCallback(), await this._loadThemes();
  }
  async _loadThemes() {
    const i = await g.getUmbracoManagementApiV1ArticulateThemesDefault();
    if (!i.response.ok) {
      this._formError = await b(i.response, "Failed to load themes."), this._formState = "failed";
      return;
    }
    const e = i.data;
    if (!e) {
      this._formState = "failed", this._formError = "Failed to load themes.";
      return;
    }
    this._themes = (e == null ? void 0 : e.map((t) => t)) ?? [];
  }
  /**
   * Selects a theme to duplicate.
   * @private
   * @param {string} theme - The name of the theme to select.
   */
  _selectTheme(i) {
    this._selectedTheme = i, this._newThemeName = `${i} - Copy`;
  }
  _handleSelectThemeButtonClick(i, e) {
    i.stopPropagation(), this._selectTheme(e);
  }
  _onCardSelected(i) {
    const t = i.target.getAttribute("data-theme");
    t && this._selectTheme(t);
  }
  _onCardDeselected(i) {
    const t = i.target.getAttribute("data-theme");
    t && t === this._selectedTheme && (this._selectedTheme = null);
  }
  /**
   * Handles form submission for duplicating a theme.
   * @private
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  async _duplicateTheme() {
    try {
      await F(this, J).validate();
    } catch {
      this._formError = "Please select a theme and enter a new theme name.";
      return;
    }
    if (!this._selectedTheme || !this._newThemeName) return;
    this._formState = "waiting", this._formError = "";
    const i = await g.postUmbracoManagementApiV1ArticulateThemesCopy({
      body: {
        themeName: this._selectedTheme,
        newThemeName: this._newThemeName
      }
    });
    if (!i.response.ok) {
      this._formError = await b(i.response, "Failed to duplicate theme."), this._formState = "failed";
      return;
    }
    this._formState = "success", await ae(this, "Theme duplicated successfully!", "positive"), this._selectedTheme = null, this._newThemeName = "";
  }
  /**
   * Renders the theme grid.
   * @private
   * @returns {TemplateResult} The theme grid template.
   */
  _renderThemeGrid() {
    var i;
    return (((i = this._themes) == null ? void 0 : i.length) ?? 0) > 0 ? l`
        <div class="theme-grid">
          ${(this._themes ?? []).map(
      (e) => l`
              <uui-card-media
                class="theme-card"
                .name=${e}
                ?selectable=${!0}
                ?selected=${this._selectedTheme === e}
                selectOnly
                @selected=${this._onCardSelected}
                @deselected=${this._onCardDeselected}
                data-theme=${e}
              >
                <img
                  class="theme-preview-img"
                  src="/App_Plugins/Articulate/BackOffice/assets/theme-${e.toLowerCase()}.png"
                  alt="${e} theme preview"
                  loading="lazy"
                  @error=${(t) => {
        const r = t.target;
        r.style.display = "none";
        const o = r.parentElement;
        if (o && !o.querySelector(":scope > .theme-fallback-initial")) {
          const a = document.createElement("span");
          a.className = "theme-fallback-initial", a.textContent = e.charAt(0).toUpperCase(), o.appendChild(a);
        }
      }}
                />
                <div slot="actions">
                  <uui-button
                    look="primary"
                    label="Select Theme ${e}"
                    @click=${(t) => this._handleSelectThemeButtonClick(t, e)}
                  >
                    Select
                  </uui-button>
                </div>
              </uui-card-media>
            `
    )}
        </div>
      ` : l`
      <p
        class="no-themes-message"
        style="text-align: center; margin-block: var(--uui-size-space-5);"
      >
        No themes available.
      </p>
    `;
  }
  /**
   * Renders the duplicate form.
   * @private
   * @returns {TemplateResult} The duplicate form template.
   */
  _renderDuplicateForm() {
    if (!this._selectedTheme)
      return l``;
    const i = this._formState === "waiting" ? "Duplicating..." : "Duplicate";
    return l`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>

        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            id="newThemeName"
            .value=${this._newThemeName}
            @input=${F(this, Q)}
            required
            ?disabled=${this._formState === "waiting"}
            ${oe(this, "$.themeName", this._newThemeName || "")}
          ></uui-input>
        </uui-form-layout-item>
        <uui-form-layout-item>${st(this, ee, Te).call(this)}</uui-form-layout-item>

        <div class="form-actions">
          <uui-button
            look="primary"
            label=${i}
            type="button"
            @click=${() => this._duplicateTheme()}
            ?disabled=${!this._newThemeName || this._formState === "waiting"}
            .state=${this._formState}
          >
            ${i}
          </uui-button>

          <uui-button
            look="secondary"
            label="Cancel"
            @click=${F(this, Z)}
            ?disabled=${this._formState === "waiting"}
          >
            Cancel
          </uui-button>
        </div>
      </div>
    `;
  }
  render() {
    return l`
      <uui-box headline="Theme Duplication">
        ${se(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customize them yourself. The
            duplicated theme will be copied to the ~/Views/Articulate folder where you can edit it.
            Then you can select this theme from the themes drop down on your Articulate root node to
            use it.
          </p>
        </div>
        <div class="container">${this._renderThemeGrid()} ${this._renderDuplicateForm()}</div>
      </uui-box>
    `;
  }
};
J = /* @__PURE__ */ new WeakMap();
Q = /* @__PURE__ */ new WeakMap();
Z = /* @__PURE__ */ new WeakMap();
ee = /* @__PURE__ */ new WeakSet();
Te = function() {
  return !this._formError || this._formState !== "failed" ? ie : l`<p class="text-danger">${this._formError}</p>`;
};
p.styles = [
  N,
  w`
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
        color: var(--uui-color-text-alt);
        text-align: center;
        margin-block: var(--uui-size-layout-1);
      }
      .text-danger {
        color: var(--uui-color-danger);
      }
    `
];
E([
  Ne({ type: String })
], p.prototype, "routerPath", 2);
E([
  z()
], p.prototype, "_formState", 2);
E([
  z()
], p.prototype, "_formError", 2);
E([
  z()
], p.prototype, "_themes", 2);
E([
  z()
], p.prototype, "_selectedTheme", 2);
p = E([
  Ve("articulate-copy-theme")
], p);
var nt = Object.defineProperty, lt = Object.getOwnPropertyDescriptor, ke = (i, e, t, r) => {
  for (var o = r > 1 ? void 0 : r ? lt(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (o = (r ? s(e, t, o) : s(o)) || o);
  return r && o && nt(e, t, o), o;
};
const ut = [
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
    icon: "icon-palette",
    description: "Copy Articulate themes for customization"
  }
];
let y = class extends A {
  constructor() {
    super(...arguments), this.routerPath = "";
  }
  /**
   * Renders a navigation card with the specified details.
   * @private
   * @param {string} name - The name of the card.
   * @param {string} description - The description text for the card.
   * @param {string} icon - The icon to display on the card.
   * @param {string} fullHref - The path to navigate to when the card is clicked.
   * @returns {TemplateResult} The rendered card template.
   */
  _renderCards() {
    return l`
      ${ut.map((i) => {
      var r;
      const t = `${(r = this.routerPath) == null ? void 0 : r.replace(/\/$/, "")}/${i.path}`;
      return l`
          <uui-card-block-type
            class="tool-card"
            name="${i.name}"
            description="${i.description}"
            href=${t}
          >
            <uui-icon name="${i.icon}"></uui-icon>
          </uui-card-block-type>
        `;
    })}
    `;
  }
  /**
   * Renders the dashboard options grid with navigation cards.
   * @override
   * @returns {TemplateResult} The rendered dashboard options template.
   */
  render() {
    return l`
      <uui-box headline="Options">
        <div class="tools-grid">${this._renderCards()}</div>
      </uui-box>
    `;
  }
};
y.styles = [
  N,
  w`
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
ke([
  te({ type: String })
], y.prototype, "routerPath", 2);
y = ke([
  I("articulate-dashboard-options")
], y);
var ct = Object.defineProperty, dt = Object.getOwnPropertyDescriptor, ue = (i, e, t, r) => {
  for (var o = r > 1 ? void 0 : r ? dt(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (o = (r ? s(e, t, o) : s(o)) || o);
  return r && o && ct(e, t, o), o;
};
let v = class extends A {
  constructor() {
    super(), this._routes = [
      {
        path: "blogml/import",
        component: c,
        setup: (i) => {
          this._routerBasePath && i instanceof c && (i.routerPath = this._routerBasePath);
        }
      },
      {
        path: "blogml/export",
        component: h,
        setup: (i) => {
          this._routerBasePath && i instanceof h && (i.routerPath = this._routerBasePath);
        }
      },
      {
        path: "theme/copy",
        component: p,
        setup: (i) => {
          this._routerBasePath && i instanceof p && (i.routerPath = this._routerBasePath);
        }
      },
      {
        path: "",
        component: y,
        setup: (i) => {
          this._routerBasePath && i instanceof y && (i.routerPath = this._routerBasePath);
        }
      },
      {
        path: "**",
        component: async () => (await import("@umbraco-cms/backoffice/router")).UmbRouteNotFoundElement
      }
    ];
  }
  render() {
    return l`
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
v.styles = [
  N,
  w`
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
ue([
  d()
], v.prototype, "_routerBasePath", 2);
ue([
  d()
], v.prototype, "_routes", 2);
v = ue([
  I("articulate-dashboard-root")
], v);
const ht = {
  type: "dashboard",
  alias: "Articulate.BackOffice.Dashboard",
  name: "Articulate Dashboard",
  element: v,
  weight: 100,
  meta: {
    label: "Articulate",
    pathname: "articulate"
  },
  conditions: [
    {
      alias: "Umb.Condition.SectionAlias",
      match: "Umb.Section.Settings"
    }
  ]
}, pt = ht, mt = [
  {
    type: "propertyEditorUi",
    alias: "Articulate.MarkdownEditor",
    name: "Articulate Markdown Editor",
    element: () => import("./property-editor-ui-markdown-editor.element-ByRKICRp.js"),
    meta: {
      label: "Articulate Markdown Editor",
      propertyEditorSchemaAlias: "Umbraco.MarkdownEditor",
      icon: "icon-code",
      group: "richContent",
      supportsReadOnly: !0,
      settings: {
        properties: [
          {
            alias: "preview",
            label: "Preview",
            description: "Display a live preview",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.Toggle"
          },
          {
            alias: "overlaySize",
            label: "Overlay Size",
            description: "Select the width of the overlay.",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.OverlaySize"
          }
        ]
      }
    }
  }
], ft = [...mt], gt = [...ft], At = (i, e) => {
  e.register(pt), e.registerMany(gt), i.consumeContext(Oe, (t) => {
    const r = t == null ? void 0 : t.getOpenApiConfiguration();
    De.setConfig({
      auth: (r == null ? void 0 : r.token) ?? void 0,
      baseUrl: (r == null ? void 0 : r.base) ?? "",
      credentials: (r == null ? void 0 : r.credentials) ?? "same-origin"
    });
  });
};
export {
  At as onInit
};
//# sourceMappingURL=articulate.js.map
