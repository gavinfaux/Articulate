import { UMB_AUTH_CONTEXT as ye } from "@umbraco-cms/backoffice/auth";
import { A as b, i as ve, e as k, s as A, c as we } from "./notification-utils-DvHwRL3K.js";
import { html as l, css as w, property as K, state as h, customElement as z, nothing as $e } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as C } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as T } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as ae } from "@umbraco-cms/backoffice/modal";
import { UmbValidationContext as se, umbBindToValidation as Ee } from "@umbraco-cms/backoffice/validation";
import { UMB_DOCUMENT_PICKER_MODAL as xe } from "@umbraco-cms/backoffice/document";
import { DocumentService as Se } from "@umbraco-cms/backoffice/external/backend-api";
async function ne() {
  const i = await b.getUmbracoManagementApiV1ArticulateBlogArticulateGuid();
  if (i.response.ok && i.data)
    return i.data;
  if (!i.data)
    return console.error("API returned no data for Articulate Archive UDI"), null;
  try {
    let e = await i.response.json();
    console.error(e.title && e.detail ? `${e.title}: ${e.detail}` : e.title);
  } catch {
    console.error(`${i.response.status} ${i.response.statusText}`);
  }
  return null;
}
async function le(i) {
  var e;
  try {
    const t = await Se.getDocumentById({ id: i });
    return ((e = t == null ? void 0 : t.variants) == null ? void 0 : e[0]) ?? null;
  } catch (t) {
    return console.error(
      `Failed to fetch node: ${t instanceof Error ? t.message : String(t)}`
    ), null;
  }
}
async function ue(i, e, t) {
  try {
    const r = await i.open(t, xe, {
      data: {
        multiple: !1,
        pickableFilter: (a) => {
          var s;
          return ((s = a.documentType) == null ? void 0 : s.unique) === e;
        }
      }
    }).onSubmit();
    return !r || !r.selection || !r.selection[0] ? null : r.selection[0];
  } catch (o) {
    return console.error(
      `Node picker failed: ${o instanceof Error ? o.message : String(o)}`
    ), null;
  }
}
function O(i) {
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
const ce = w`
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
var Ue = Object.defineProperty, Pe = Object.getOwnPropertyDescriptor, de = (i) => {
  throw TypeError(i);
}, $ = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? Pe(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (r = (o ? s(e, t, r) : s(r)) || r);
  return o && r && Ue(e, t, r), r;
}, he = (i, e, t) => e.has(i) || de("Cannot " + t), q = (i, e, t) => (he(i, e, "read from private field"), t ? t.call(i) : e.get(i)), D = (i, e, t) => e.has(i) ? de("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(i) : e.set(i, t), Ae = (i, e, t) => (he(i, e, "access private method"), t), j, W, V, G, pe;
let p = class extends C {
  /**
   * Creates an instance of ArticulateBlogMlExporterElement.
   * Sets up the modal manager context.
   */
  constructor() {
    super(), D(this, G), this._formState = void 0, this._formError = "", this._articulateNodeId = null, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = null, D(this, j, new se(this)), D(this, W, (i, e) => {
      const t = window.URL.createObjectURL(i), o = document.createElement("a");
      o.style.display = "none", o.href = t, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(t), o.remove();
    }), D(this, V, async (i) => {
      i.preventDefault();
      const e = i.target;
      if (!e) return;
      try {
        await q(this, j).validate();
      } catch (a) {
        console.error("Validation error:", a), this._formError = "Please select a blog node.";
        return;
      }
      const o = new FormData(e).get("embedImages") === "on", r = {
        articulateNodeId: this._articulateNodeId,
        exportImagesAsBase64: o
      };
      this._formState = "waiting", this._formError = "";
      try {
        const a = await b.postUmbracoManagementApiV1ArticulateBlogExport({
          body: r
        });
        if (!a.response.ok) {
          let u;
          try {
            u = await a.response.json(), console.error(u.title && u.detail ? `${u.title}: ${u.detail}` : u.title);
          } catch {
            u = { title: `${a.response.status} ${a.response.statusText}` };
          }
          this._formError = (u.title && u.detail ? `${u.title}: ${u.detail}` : u.title) ?? "Failed to export blog content.", this._formState = "failed";
          return;
        }
        const s = await a.response.blob(), n = a.response.headers.get("content-disposition");
        let c = "export.xml";
        if (n) {
          const u = n.match(/filename=\"?([^\"]+)\"?/);
          u && u.length > 1 && u[1] && (c = u[1]);
        }
        q(this, W).call(this, s, c), e.reset(), this._articulateNodeId = null, this._selectedBlogNodeName = "", this._formState = "success";
      } catch (a) {
        this._formState = "failed", this._formError = `An unexpected error occurred: ${a instanceof Error ? a.message : String(a)}`, console.error(a);
      }
    }), this.consumeContext(ae, (i) => {
      this._modalManagerContext = i;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await ne(), this._archiveDoctypeUdi === null) {
      this._formError = "Failed to retrieve Articulate Archive document type.";
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
    const i = await ue(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (i) {
      const e = await le(i);
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
        ${O(this.routerPath)}
        <uui-form-validation-message>
          <uui-form>
            <form id="blogMlExportForm" @submit=${q(this, V)}>
              <uui-form-layout-item>
                <div class="node-picker-container">
                  <uui-label for="articulateNodeId" slot="label" required>Articulate blog node</uui-label>
                  <uui-input
                    id="articulateNodeId"
                    name="articulateNodeId"
                    placeholder="No node selected"
                    .value=${this._selectedBlogNodeName}
                    ${Ee(this, "$.articulateNodeId", this._articulateNodeId || "")}
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
                  Check if you want to embed images as base64 data in the output file. Useful if your
                  site isn't going to be HTTP accessible to the site you will be importing on.
                </div>
              </uui-form-layout-item>
              <uui-form-layout-item>${Ae(this, G, pe).call(this)}</uui-form-layout-item>
              <uui-button-group>
                <uui-button type="submit" look="primary" .state=${this._formState}>Submit</uui-button>
              </uui-button-group>
            </form>
          </uui-form>
        </uui-form-validation-message>
      </uui-box>
    `;
  }
};
j = /* @__PURE__ */ new WeakMap();
W = /* @__PURE__ */ new WeakMap();
V = /* @__PURE__ */ new WeakMap();
G = /* @__PURE__ */ new WeakSet();
pe = function() {
  return !this._formError || this._formState !== "failed" ? $e : l`<p class="text-danger">${this._formError}</p>`;
};
p.styles = [
  T,
  ce,
  w`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
    `
];
$([
  K({ type: String })
], p.prototype, "routerPath", 2);
$([
  h()
], p.prototype, "_formState", 2);
$([
  h()
], p.prototype, "_formError", 2);
$([
  h()
], p.prototype, "_articulateNodeId", 2);
$([
  h()
], p.prototype, "_selectedBlogNodeName", 2);
p = $([
  z("articulate-blogml-exporter")
], p);
var Ne = Object.defineProperty, Ce = Object.getOwnPropertyDescriptor, me = (i) => {
  throw TypeError(i);
}, _ = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? Ce(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (r = (o ? s(e, t, r) : s(r)) || r);
  return o && r && Ne(e, t, r), r;
}, Te = (i, e, t) => e.has(i) || me("Cannot " + t), R = (i, e, t) => (Te(i, e, "read from private field"), t ? t.call(i) : e.get(i)), De = (i, e, t) => e.has(i) ? me("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(i) : e.set(i, t), P;
let d = class extends C {
  /**
   * Creates an instance of ArticulateBlogMlImporterElement.
   * Sets up the modal manager context and file reader event handlers.
   */
  constructor() {
    super(), this._isDisabled = !1, this._isLoading = !0, this._isSubmitting = !1, this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = "No node selected", this._downloadUrl = void 0, this._archiveDoctypeUdi = null, De(this, P, new se(this)), this.consumeContext(ae, (i) => {
      this._modalManagerContext = i;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    super.connectedCallback(), this._archiveDoctypeUdi = await ne(), this._archiveDoctypeUdi === null && (this._isDisabled = !0, this._isLoading = !1, this.requestUpdate("_isLoading", "_isDisabled")), this._isLoading = !1, this.requestUpdate("_isLoading");
  }
  /**
   * Opens the Umbraco document picker to select a blog node.
   * Updates the selected node UDI and fetches its name.
   * @private
   * @returns {Promise<void>}
   */
  async _openNodePicker() {
    try {
      const i = await ue(this._modalManagerContext, this._archiveDoctypeUdi, this);
      if (i) {
        this._selectedBlogNodeName = "Loading...", this.requestUpdate("_selectedBlogNodeName");
        const e = await le(i);
        if (!e)
          throw new Error(`Selected node ${i} not found`);
        this._selectedBlogNodeUdi = i, this._selectedBlogNodeName = e.name, this.requestUpdate("_selectedBlogNodeName", "_selectedBlogNodeUdi");
      }
    } catch (i) {
      if (ve(i) && i.message.includes("No node selected"))
        return;
      const e = k(
        i,
        "An error occurred while using the node picker."
      );
      this._selectedBlogNodeName = "Error loading node", this.requestUpdate("_selectedBlogNodeName"), await A(this, e, "danger");
    }
  }
  /**
   * Handles the form submission for importing blog content.
   * Validates the form and initiates the import process.
   * @private
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  async _handleSubmit(i) {
    if (i.preventDefault(), this._isSubmitting) return;
    const e = i.target;
    if (!e) return;
    if (await R(this, P).validate(), !R(this, P).isValid) {
      R(this, P).focusFirstInvalidElement();
      return;
    }
    const t = new FormData(e), o = e.querySelector('uui-button[look="primary"]'), r = e.elements.namedItem("importFile"), a = r && r.files ? r.files[0] : null;
    try {
      o == null || o.setAttribute("state", "waiting"), this._isSubmitting = !0, this.requestUpdate("_isSubmitting");
      const s = new FormData();
      s.append(a.name, a);
      const n = await b.postUmbracoManagementApiV1ArticulateBlogImportBegin({
        body: s
        // hey-api handles FormData directly
      });
      if (!n.response.ok) {
        let f;
        try {
          f = await n.response.json();
        } catch {
          f = new Error(
            `File Upload API Error: ${n.response.status} ${n.response.statusText}`
          );
        }
        throw f;
      }
      const c = n.data;
      if (!c || !c.temporaryFileName)
        throw new Error("Upload completed but no response data was returned.");
      const u = {
        articulateNodeId: this._selectedBlogNodeUdi,
        overwrite: t.get("overwrite") === "on",
        publish: t.get("publish") === "on",
        regexMatch: t.get("regexMatch") || "",
        regexReplace: t.get("regexReplace") || "",
        tempFile: c.temporaryFileName,
        exportDisqusXml: t.get("disqusExport") === "on",
        importFirstImage: t.get("importImage") === "on"
      }, x = await b.postUmbracoManagementApiV1ArticulateBlogImport({
        body: u
      });
      if (!x.response.ok) {
        let f;
        try {
          f = await x.response.json();
        } catch {
          f = new Error(
            `Import API Error: ${x.response.status} ${x.response.statusText}`
          );
        }
        throw f;
      }
      const S = x.data;
      if (!S)
        throw new Error("Import completed but no response data was returned.");
      if (S.downloadUrl) {
        const f = S.downloadUrl.startsWith("http") ? S.downloadUrl : `${window.location.origin}${S.downloadUrl}`;
        this._downloadUrl = l`<a href="${f}" target="_blank">Download</a>.`;
      }
      e.reset(), this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = "No node selected", this.requestUpdate("_selectedBlogNodeUdi", "_selectedBlogNodeName");
    } catch (s) {
      const n = k(s, "Import failed.");
      await A(this, n, "danger");
    } finally {
      o == null || o.setAttribute("state", ""), this._isSubmitting = !1, this.requestUpdate("_isSubmitting");
    }
  }
  _closeModal() {
    this._downloadUrl = void 0, this.requestUpdate("_downloadUrl");
  }
  render() {
    return this._isLoading ? l`<uui-loader-bar></uui-loader-bar>` : this._isDisabled ? l`<uui-box headline="BlogML Importer">
        ${O(this.routerPath)}
        <span slot="header"><uui-tag look="danger">Disabled</uui-tag></span>
        <p>Could not retrieve Articulate Archive document type.</p>
        <p>Ensure that the Articulate package is installed and configured correctly.</p>
        <p>Check the Articulate documentation for more information.</p>
      </uui-box>` : l`
      <uui-box headline="BlogML Importer">
        ${O(this.routerPath)}
        <uui-form-validation-message>
        <uui-form @submit=${this._handleSubmit}>
          <uui-form-layout-item>
            <uui-label for="blogNodeDisplay" required>Articulate blog node</uui-label>
            <div class="node-picker-container">
              <uui-input
                id="blogNodeDisplay"
                .value=${this._selectedBlogNodeName || "No node selected. Click 'Add' to choose."}
                required
                readonly
                style="flex-grow: 1;"
              ></uui-input>
              <uui-button
                look="outline"
                .label=${this._selectedBlogNodeUdi ? "Change" : "Add"}
                @click=${this._openNodePicker}
                style="margin-left: var(--uui-size-space-3);"
              ></uui-button>
            </div>
            <input
              type="hidden"
              name="blogNodeValue"
              .value=${this._selectedBlogNodeUdi || ""}
            />
            <div slot="description">Choose the Articulate blog node to import to</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="importFile" required>BlogML import file</uui-label>
            <uui-input-file
              id="importFile"
              accept="text/xml"
              required
              name="importFile"
            ></uui-input-file>
            <div slot="description">The XML file to upload for import</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="overwrite">Overwrite imported posts?</uui-label>
            <uui-toggle id="overwrite" name="overwrite"></uui-toggle>
            <div slot="description">Check if you want to overwrite posts already imported</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="publishAll">Publish all posts?</uui-label>
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
            <uui-label for="disqusExport">Export Disqus Xml</uui-label>
            <uui-toggle id="disqusExport" name="disqusExport"></uui-toggle>
            <div slot="description">
              If you would like Articulate to output an XML file that you can use to import the
              comments found in this file in to Disqus
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="importImage">Import First Image from Post Attachments</uui-label>
            <uui-toggle id="importImage" name="importImage"></uui-toggle>
            <div slot="description">
              If you would like Articulate to try and import the first image url in the post
              attachments
            </div>
          </uui-form-layout-item>
          <uui-button-group>
            <uui-button type="submit" look="primary">Submit</uui-button>
          </uui-button-group>
          </uui-form-validation-message>
        </uui-form>
      </uui-box>
      ${this._downloadUrl ? l`
              <uui-modal-container>
                <uui-modal-dialog>
                  <uui-dialog>
                    <uui-dialog-layout>
                      <span slot="headline">
                        <uui-icon name="info" style="color: green;"></uui-icon> BlogML import
                        completed</span
                      >
                      <p>Your Disqus XML import is ready to download.</p>
                      <uui-button slot="actions" look="secondary" @click=${this._closeModal}
                        >Cancel</uui-button
                      >
                      <uui-button
                        slot="actions"
                        look="primary"
                        label="Download"
                        href=${this._downloadUrl}
                        target="_blank"
                        ><uui-icon name="download"></uui-icon> Download</uui-button
                      >
                    </uui-dialog-layout>
                  </uui-dialog>
                </uui-modal-dialog>
              </uui-modal-container>
            ` : l``}
    `;
  }
};
P = /* @__PURE__ */ new WeakMap();
d.styles = [
  T,
  ce,
  w`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
    `
];
_([
  K({ type: String })
], d.prototype, "routerPath", 2);
_([
  h()
], d.prototype, "_isDisabled", 2);
_([
  h()
], d.prototype, "_isLoading", 2);
_([
  h()
], d.prototype, "_isSubmitting", 2);
_([
  h()
], d.prototype, "_selectedBlogNodeUdi", 2);
_([
  h()
], d.prototype, "_selectedBlogNodeName", 2);
_([
  h()
], d.prototype, "_downloadUrl", 2);
d = _([
  z("articulate-blogml-importer")
], d);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Me = (i) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(i, e);
  }) : customElements.define(i, e);
};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis, Y = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, fe = Symbol(), Z = /* @__PURE__ */ new WeakMap();
let ke = class {
  constructor(e, t, o) {
    if (this._$cssResult$ = !0, o !== fe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Y && e === void 0) {
      const o = t !== void 0 && t.length === 1;
      o && (e = Z.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), o && Z.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Oe = (i) => new ke(typeof i == "string" ? i : i + "", void 0, fe), Be = (i, e) => {
  if (Y) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const o = document.createElement("style"), r = M.litNonce;
    r !== void 0 && o.setAttribute("nonce", r), o.textContent = t.cssText, i.appendChild(o);
  }
}, ee = Y ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const o of e.cssRules) t += o.cssText;
  return Oe(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ze, defineProperty: Ie, getOwnPropertyDescriptor: Le, getOwnPropertyNames: qe, getOwnPropertySymbols: Re, getPrototypeOf: Fe } = Object, g = globalThis, te = g.trustedTypes, je = te ? te.emptyScript : "", F = g.reactiveElementPolyfillSupport, N = (i, e) => i, B = { toAttribute(i, e) {
  switch (e) {
    case Boolean:
      i = i ? je : null;
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
} }, J = (i, e) => !ze(i, e), ie = { attribute: !0, type: String, converter: B, reflect: !1, useDefault: !1, hasChanged: J };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), g.litPropertyMetadata ?? (g.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class U extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = ie) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const o = Symbol(), r = this.getPropertyDescriptor(e, o, t);
      r !== void 0 && Ie(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, o) {
    const { get: r, set: a } = Le(this.prototype, e) ?? { get() {
      return this[t];
    }, set(s) {
      this[t] = s;
    } };
    return { get: r, set(s) {
      const n = r == null ? void 0 : r.call(this);
      a == null || a.call(this, s), this.requestUpdate(e, n, o);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ie;
  }
  static _$Ei() {
    if (this.hasOwnProperty(N("elementProperties"))) return;
    const e = Fe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(N("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(N("properties"))) {
      const t = this.properties, o = [...qe(t), ...Re(t)];
      for (const r of o) this.createProperty(r, t[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [o, r] of t) this.elementProperties.set(o, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, o] of this.elementProperties) {
      const r = this._$Eu(t, o);
      r !== void 0 && this._$Eh.set(r, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const o = new Set(e.flat(1 / 0).reverse());
      for (const r of o) t.unshift(ee(r));
    } else e !== void 0 && t.push(ee(e));
    return t;
  }
  static _$Eu(e, t) {
    const o = t.attribute;
    return o === !1 ? void 0 : typeof o == "string" ? o : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const o of t.keys()) this.hasOwnProperty(o) && (e.set(o, this[o]), delete this[o]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Be(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var o;
      return (o = t.hostConnected) == null ? void 0 : o.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var o;
      return (o = t.hostDisconnected) == null ? void 0 : o.call(t);
    });
  }
  attributeChangedCallback(e, t, o) {
    this._$AK(e, o);
  }
  _$ET(e, t) {
    var a;
    const o = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, o);
    if (r !== void 0 && o.reflect === !0) {
      const s = (((a = o.converter) == null ? void 0 : a.toAttribute) !== void 0 ? o.converter : B).toAttribute(t, o.type);
      this._$Em = e, s == null ? this.removeAttribute(r) : this.setAttribute(r, s), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var a, s;
    const o = this.constructor, r = o._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const n = o.getPropertyOptions(r), c = typeof n.converter == "function" ? { fromAttribute: n.converter } : ((a = n.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? n.converter : B;
      this._$Em = r, this[r] = c.fromAttribute(t, n.type) ?? ((s = this._$Ej) == null ? void 0 : s.get(r)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(e, t, o) {
    var r;
    if (e !== void 0) {
      const a = this.constructor, s = this[e];
      if (o ?? (o = a.getPropertyOptions(e)), !((o.hasChanged ?? J)(s, t) || o.useDefault && o.reflect && s === ((r = this._$Ej) == null ? void 0 : r.get(e)) && !this.hasAttribute(a._$Eu(e, o)))) return;
      this.C(e, t, o);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: o, reflect: r, wrapped: a }, s) {
    o && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, s ?? t ?? this[e]), a !== !0 || s !== void 0) || (this._$AL.has(e) || (this.hasUpdated || o || (t = void 0), this._$AL.set(e, t)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
    var o;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [a, s] of this._$Ep) this[a] = s;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [a, s] of r) {
        const { wrapped: n } = s, c = this[a];
        n !== !0 || this._$AL.has(a) || c === void 0 || this.C(a, void 0, s, c);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (o = this._$EO) == null || o.forEach((r) => {
        var a;
        return (a = r.hostUpdate) == null ? void 0 : a.call(r);
      }), this.update(t)) : this._$EM();
    } catch (r) {
      throw e = !1, this._$EM(), r;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((o) => {
      var r;
      return (r = o.hostUpdated) == null ? void 0 : r.call(o);
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
U.elementStyles = [], U.shadowRootOptions = { mode: "open" }, U[N("elementProperties")] = /* @__PURE__ */ new Map(), U[N("finalized")] = /* @__PURE__ */ new Map(), F == null || F({ ReactiveElement: U }), (g.reactiveElementVersions ?? (g.reactiveElementVersions = [])).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const We = { attribute: !0, type: String, converter: B, reflect: !1, hasChanged: J }, Ve = (i = We, e, t) => {
  const { kind: o, metadata: r } = t;
  let a = globalThis.litPropertyMetadata.get(r);
  if (a === void 0 && globalThis.litPropertyMetadata.set(r, a = /* @__PURE__ */ new Map()), o === "setter" && ((i = Object.create(i)).wrapped = !0), a.set(t.name, i), o === "accessor") {
    const { name: s } = t;
    return { set(n) {
      const c = e.get.call(this);
      e.set.call(this, n), this.requestUpdate(s, c, i);
    }, init(n) {
      return n !== void 0 && this.C(s, void 0, i, n), n;
    } };
  }
  if (o === "setter") {
    const { name: s } = t;
    return function(n) {
      const c = this[s];
      e.call(this, n), this.requestUpdate(s, c, i);
    };
  }
  throw Error("Unsupported decorator location: " + o);
};
function ge(i) {
  return (e, t) => typeof t == "object" ? Ve(i, e, t) : ((o, r, a) => {
    const s = r.hasOwnProperty(a);
    return r.constructor.createProperty(a, o), s ? Object.getOwnPropertyDescriptor(r, a) : void 0;
  })(i, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function I(i) {
  return ge({ ...i, state: !0, attribute: !1 });
}
var Ge = Object.defineProperty, Xe = Object.getOwnPropertyDescriptor, _e = (i) => {
  throw TypeError(i);
}, E = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? Xe(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (r = (o ? s(e, t, r) : s(r)) || r);
  return o && r && Ge(e, t, r), r;
}, He = (i, e, t) => e.has(i) || _e("Cannot " + t), oe = (i, e, t) => (He(i, e, "read from private field"), t ? t.call(i) : e.get(i)), re = (i, e, t) => e.has(i) ? _e("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(i) : e.set(i, t), X, H;
let m = class extends C {
  constructor() {
    super(...arguments), this._isLoading = !0, this._isSubmitting = !1, this._themes = [], this._newThemeName = "", this._selectedTheme = null, re(this, X, (i) => {
      this._newThemeName = i.target.value;
    }), re(this, H, () => {
      this._selectedTheme = null;
    });
  }
  /**
   * Fetches the list of available themes.
   * @private
   */
  async connectedCallback() {
    super.connectedCallback(), await this._loadThemes(), this._isLoading = !1, this.requestUpdate("_isLoading");
  }
  async _loadThemes() {
    try {
      const i = await b.getUmbracoManagementApiV1ArticulateThemesList();
      if (!i.response.ok) {
        let t;
        try {
          t = await i.response.json();
        } catch {
          t = new Error(
            `API Error: ${i.response.status} ${i.response.statusText}`
          );
        }
        throw t;
      }
      const e = await i.data;
      if (!e)
        throw new Error("Failed to load themes.");
      this._themes = (e == null ? void 0 : e.map((t) => t)) ?? [];
    } catch (i) {
      this._themes = [];
      const e = k(i, "Could not load themes.");
      await A(this, e, "danger");
    }
  }
  /**
   * Selects a theme to duplicate.
   * @private
   * @param {string} theme - The name of the theme to select.
   */
  _selectTheme(i) {
    this._selectedTheme = i, this._newThemeName = `${i} - Copy`, this.requestUpdate("_selectedTheme", "_newThemeName");
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
    if (!(this._isSubmitting || !this._selectedTheme || !this._newThemeName))
      try {
        this._isSubmitting = !0, this.requestUpdate("_isSubmitting");
        const i = await b.postUmbracoManagementApiV1ArticulateThemesCopy({
          body: {
            themeName: this._selectedTheme,
            newThemeName: this._newThemeName
          }
        });
        if (!i.response.ok)
          throw new Error(`Failed to duplicate theme: ${i.response.statusText}`);
        await A(this, "Theme duplicated successfully!", "positive"), this._selectedTheme = null, this._newThemeName = "", this.requestUpdate("_selectedTheme", "_newThemeName");
      } catch (i) {
        console.error("Error duplicating theme:", i);
        const e = k(
          i,
          "Failed to duplicate theme. Please try again."
        );
        await A(this, e, "danger");
      } finally {
        this._isSubmitting = !1, this.requestUpdate("_isSubmitting");
      }
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
        const o = t.target;
        o.style.display = "none";
        const r = o.parentElement;
        if (r && !r.querySelector(":scope > .theme-fallback-initial")) {
          const a = document.createElement("span");
          a.className = "theme-fallback-initial", a.textContent = e.charAt(0).toUpperCase(), r.appendChild(a);
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
    const i = this._isSubmitting ? "Duplicating..." : "Duplicate";
    return l`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>

        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            id="newThemeName"
            .value=${this._newThemeName}
            @input=${oe(this, X)}
            required
            ?disabled=${this._isSubmitting}
          ></uui-input>
        </uui-form-layout-item>

        <div class="form-actions">
          <uui-button
            look="primary"
            color="positive"
            label="Duplicate"
            type="button"
            @click=${() => this._duplicateTheme()}
            ?disabled=${!this._newThemeName || this._isSubmitting}
            .state=${this._isSubmitting ? "waiting" : ""}
          >
            ${i}
          </uui-button>

          <uui-button
            look="secondary"
            label="Cancel"
            @click=${oe(this, H)}
            ?disabled=${this._isSubmitting}
          >
            Cancel
          </uui-button>
        </div>
      </div>
    `;
  }
  render() {
    return this._isLoading ? l`<uui-loader-bar></uui-loader-bar>` : l`
      <uui-box headline="Theme Duplication">
        ${O(this.routerPath)}
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
X = /* @__PURE__ */ new WeakMap();
H = /* @__PURE__ */ new WeakMap();
m.styles = [
  T,
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
    `
];
E([
  ge({ type: String })
], m.prototype, "routerPath", 2);
E([
  I()
], m.prototype, "_isLoading", 2);
E([
  I()
], m.prototype, "_isSubmitting", 2);
E([
  I()
], m.prototype, "_themes", 2);
E([
  I()
], m.prototype, "_selectedTheme", 2);
m = E([
  Me("articulate-copy-theme")
], m);
var Ke = Object.defineProperty, Ye = Object.getOwnPropertyDescriptor, be = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? Ye(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (r = (o ? s(e, t, r) : s(r)) || r);
  return o && r && Ke(e, t, r), r;
};
const Je = [
  {
    path: "blogml/import",
    name: "BlogML Import",
    icon: "add",
    description: "Import content from any BlogML compatible platform"
  },
  {
    path: "blogml/export",
    name: "BlogML Export",
    icon: "download",
    description: "Export content to any BlogML compatible platform"
  },
  {
    path: "theme/copy",
    name: "Copy Theme",
    icon: "copy",
    description: "Copy Articulate themes for customization"
  }
];
let y = class extends C {
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
      ${Je.map((i) => {
      var o;
      const t = `${(o = this.routerPath) == null ? void 0 : o.replace(/\/$/, "")}/${i.path}`;
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
  T,
  w`
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
        gap: var(--uui-size-space-5);
      }

      .tool-card {
        min-width: 0;
        height: 128px;
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
be([
  K({ type: String })
], y.prototype, "routerPath", 2);
y = be([
  z("articulate-dashboard-options")
], y);
var Qe = Object.defineProperty, Ze = Object.getOwnPropertyDescriptor, Q = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? Ze(e, t) : e, a = i.length - 1, s; a >= 0; a--)
    (s = i[a]) && (r = (o ? s(e, t, r) : s(r)) || r);
  return o && r && Qe(e, t, r), r;
};
let v = class extends C {
  constructor() {
    super(), this._routes = [
      {
        path: "blogml/import",
        component: d,
        setup: (i) => {
          this._routerBasePath && i instanceof d && (i.routerPath = this._routerBasePath);
        }
      },
      {
        path: "blogml/export",
        component: p,
        setup: (i) => {
          this._routerBasePath && i instanceof p && (i.routerPath = this._routerBasePath);
        }
      },
      {
        path: "theme/copy",
        component: m,
        setup: (i) => {
          this._routerBasePath && i instanceof m && (i.routerPath = this._routerBasePath);
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
  T,
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
Q([
  h()
], v.prototype, "_routerBasePath", 2);
Q([
  h()
], v.prototype, "_routes", 2);
v = Q([
  z("articulate-dashboard-root")
], v);
const et = {
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
}, tt = et, it = [
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
], ot = [...it], rt = [...ot], ft = (i, e) => {
  e.register(tt), e.registerMany(rt), i.consumeContext(ye, (t) => {
    const o = t == null ? void 0 : t.getOpenApiConfiguration();
    we.setConfig({
      auth: (o == null ? void 0 : o.token) ?? void 0,
      baseUrl: (o == null ? void 0 : o.base) ?? "",
      credentials: (o == null ? void 0 : o.credentials) ?? "same-origin"
    });
  });
};
export {
  ft as onInit
};
//# sourceMappingURL=articulate.js.map
