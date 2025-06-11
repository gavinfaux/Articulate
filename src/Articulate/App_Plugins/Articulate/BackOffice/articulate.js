import { UMB_AUTH_CONTEXT as le } from "@umbraco-cms/backoffice/auth";
import { A as w, i as Q, e as v, s as _, c as ue } from "./notification-utils-D7uwENxV.js";
import { html as u, css as U, property as j, state as d, customElement as B } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as D } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as T } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as Z } from "@umbraco-cms/backoffice/modal";
import { DocumentService as de } from "@umbraco-cms/backoffice/external/backend-api";
async function ee() {
  try {
    const t = await w.getUmbracoManagementApiV1ArticulateBlogArchiveUdi();
    if (!t.response.ok) {
      let e;
      try {
        e = await t.response.json();
      } catch {
        e = `API Error: ${t.response.status} ${t.response.statusText}`;
      }
      throw typeof e == "string" ? new Error(e) : new Error(e.title || e.detail || "Unknown API error");
    }
    if (!t.data)
      throw new Error("API returned no data for Articulate Archive UDI");
    return t.data;
  } catch (t) {
    throw new Error(
      `Could not retrieve Articulate Archive document type: ${t instanceof Error ? t.message : String(t)}`
    );
  }
}
async function te(t) {
  var e;
  try {
    const i = await de.getDocumentById({ id: t });
    return ((e = i == null ? void 0 : i.variants) == null ? void 0 : e[0]) ?? null;
  } catch (i) {
    throw new Error(
      `Failed to fetch node: ${i instanceof Error ? i.message : String(i)}`
    );
  }
}
async function ie(t, e, i) {
  var o;
  try {
    const a = await t.open(i, "UMB_DOCUMENT_PICKER_MODAL", {
      data: {
        multiple: !1,
        filter: (s) => {
          var n;
          return ((n = s.documentType) == null ? void 0 : n.unique) === e;
        }
      }
    }).onSubmit();
    if (!((o = a == null ? void 0 : a.selection) != null && o[0]))
      throw new Error("No node selected or selection cancelled");
    return a.selection[0];
  } catch (r) {
    throw new Error(
      `Node picker failed: ${r instanceof Error ? r.message : String(r)}`
    );
  }
}
function N(t) {
  return u`
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
const oe = U`
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
var ce = Object.defineProperty, he = Object.getOwnPropertyDescriptor, b = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? he(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && ce(e, i, r), r;
};
let c = class extends D {
  /**
   * Creates an instance of ArticulateBlogMlExporterElement.
   * Sets up the modal manager context.
   */
  constructor() {
    super(), this._isDisabled = !1, this._isLoading = !0, this._isSubmitting = !1, this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = "No node selected", this._downloadUrl = void 0, this._archiveDoctypeUdi = null, this.consumeContext(Z, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    super.connectedCallback(), this._archiveDoctypeUdi = await ee(), this._archiveDoctypeUdi === null && (this._isDisabled = !0, this._isLoading = !1, this.requestUpdate()), this._isLoading = !1, this.requestUpdate();
  }
  /**
   * Opens the Umbraco document picker to select a blog node.
   * Updates the selected node UDI and fetches its name.
   * @private
   * @returns {Promise<void>}
   */
  async _openNodePicker() {
    try {
      const t = await ie(this._modalManagerContext, this._archiveDoctypeUdi, this);
      if (t) {
        this._selectedBlogNodeName = "Loading...", this.requestUpdate();
        const e = await te(t);
        if (!e)
          throw new Error(`Selected node ${t} not found`);
        this._selectedBlogNodeUdi = t, this._selectedBlogNodeName = e.name, this.requestUpdate();
      }
    } catch (t) {
      if (Q(t) && t.message.includes("No node selected"))
        return;
      const e = v(
        t,
        "An error occurred while using the node picker."
      );
      this._selectedBlogNodeName = "Error loading node", this.requestUpdate(), await _(this, e, "danger");
    }
  }
  /**
   * Handles the form submission for exporting blog content.
   * Validates the form and initiates the export process.
   * @private
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  async _handleSubmit(t) {
    if (t.preventDefault(), this._isSubmitting) return;
    const e = t.target;
    if (!e.checkValidity())
      return;
    const o = new FormData(e), r = e.querySelector('uui-button[look="primary"]'), a = o.get("embedImages") === "on", s = {
      articulateNodeId: this._selectedBlogNodeUdi,
      exportImagesAsBase64: a
    };
    try {
      r == null || r.setAttribute("state", "waiting"), this._isSubmitting = !0, this.requestUpdate();
      const n = await w.postUmbracoManagementApiV1ArticulateBlogExport({
        body: s
      });
      if (!n.response.ok) {
        let m;
        try {
          m = await n.response.json();
        } catch {
          m = new Error(
            `API Error: ${n.response.status} ${n.response.statusText}`
          );
        }
        throw m;
      }
      const l = n.data;
      if (!l || !l.downloadUrl)
        throw new Error("Export completed but no response data was returned.");
      if (l.downloadUrl) {
        const m = l.downloadUrl.startsWith("http") ? l.downloadUrl : `${window.location.origin}${l.downloadUrl}`;
        this._downloadUrl = u`<a href="${m}" target="_blank">Download</a>.`;
      }
      e.reset(), this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = "No node selected", this.requestUpdate();
    } catch (n) {
      const l = v(n, "Export failed.");
      await _(this, l, "danger");
    } finally {
      r == null || r.setAttribute("state", ""), this._isSubmitting = !1, this.requestUpdate();
    }
  }
  _closeModal() {
    this._downloadUrl = void 0, this.requestUpdate();
  }
  render() {
    return this._isLoading ? u`<uui-loader-bar></uui-loader-bar>` : this._isDisabled ? u`<uui-box headline="BlogML Exporter">
        ${N(this.routerPath)}
        <span slot="header"><uui-tag look="danger">Disabled</uui-tag></span>
        <p>Could not retrieve Articulate Archive document type.</p>
        <p>Ensure that the Articulate package is installed and configured correctly.</p>
        <p>Check the Articulate documentation for more information.</p>
      </uui-box>` : u`
      <uui-box headline="BlogML Exporter">
        ${N(this.routerPath)}
        <uui-form-validation-message>
          <uui-form @submit=${this._handleSubmit}>
            <uui-form-layout-item>
              <uui-label for="blogNodeDisplay" required>Articulate blog node</uui-label>
              <div class="node-picker-container">
                <uui-input
                  id="blogNodeDisplay"
                  name="blogNodeDisplay"
                  .value=${this._selectedBlogNodeName}
                  readonly
                  style="flex-grow: 1;"
                ></uui-input>
                <uui-button
                  look="outline"
                  label=${this._selectedBlogNodeUdi ? "Change" : "Choose"}
                  @click=${this._openNodePicker}
                ></uui-button>
              </div>
              <input
                type="hidden"
                required
                name="blogNodeId"
                .value=${this._selectedBlogNodeUdi || ""}
              />
              <div slot="description">Choose the Articulate blog node to export from</div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label for="embedImages">Embed images?</uui-label>
              <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
              <div slot="description">
                Check if you want to embed images as base64 data in the output file. Useful if your
                site isn't going to be HTTP accessible to the site you will be importing on.
              </div>
            </uui-form-layout-item>
            <uui-button-group>
              <uui-button type="submit" look="primary">Submit</uui-button>
            </uui-button-group>
          </uui-form>
        </uui-form-validation-message>
      </uui-box>
      ${this._downloadUrl ? u`
            <uui-modal-container>
              <uui-modal-dialog>
                <uui-dialog>
                  <uui-dialog-layout>
                    <span slot="headline">
                      <uui-icon name="info" style="color: green;"></uui-icon> BlogML export
                      completed</span
                    >
                    <p>Your BlogML export is ready to download.</p>
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
          ` : u``}
    `;
  }
};
c.styles = [
  T,
  oe,
  U`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
    `
];
b([
  j({ type: String })
], c.prototype, "routerPath", 2);
b([
  d()
], c.prototype, "_isDisabled", 2);
b([
  d()
], c.prototype, "_isLoading", 2);
b([
  d()
], c.prototype, "_isSubmitting", 2);
b([
  d()
], c.prototype, "_selectedBlogNodeUdi", 2);
b([
  d()
], c.prototype, "_selectedBlogNodeName", 2);
b([
  d()
], c.prototype, "_downloadUrl", 2);
c = b([
  B("articulate-blogml-exporter")
], c);
var pe = Object.defineProperty, me = Object.getOwnPropertyDescriptor, y = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? me(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && pe(e, i, r), r;
};
let h = class extends D {
  /**
   * Creates an instance of ArticulateBlogMlImporterElement.
   * Sets up the modal manager context and file reader event handlers.
   */
  constructor() {
    super(), this._isDisabled = !1, this._isLoading = !0, this._isSubmitting = !1, this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = "No node selected", this._downloadUrl = void 0, this._archiveDoctypeUdi = null, this.consumeContext(Z, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    super.connectedCallback(), this._archiveDoctypeUdi = await ee(), this._archiveDoctypeUdi === null && (this._isDisabled = !0, this._isLoading = !1, this.requestUpdate()), this._isLoading = !1, this.requestUpdate();
  }
  /**
   * Opens the Umbraco document picker to select a blog node.
   * Updates the selected node UDI and fetches its name.
   * @private
   * @returns {Promise<void>}
   */
  async _openNodePicker() {
    try {
      const t = await ie(this._modalManagerContext, this._archiveDoctypeUdi, this);
      if (t) {
        this._selectedBlogNodeName = "Loading...", this.requestUpdate();
        const e = await te(t);
        if (!e)
          throw new Error(`Selected node ${t} not found`);
        this._selectedBlogNodeUdi = t, this._selectedBlogNodeName = e.name, this.requestUpdate();
      }
    } catch (t) {
      if (Q(t) && t.message.includes("No node selected"))
        return;
      const e = v(
        t,
        "An error occurred while using the node picker."
      );
      this._selectedBlogNodeName = "Error loading node", this.requestUpdate(), await _(this, e, "danger");
    }
  }
  /**
   * Handles the form submission for importing blog content.
   * Validates the form and initiates the import process.
   * @private
   * @param {Event} e - The form submission event.
   * @returns {Promise<void>}
   */
  async _handleSubmit(t) {
    if (t.preventDefault(), this._isSubmitting) return;
    const e = t.target;
    if (!e.checkValidity())
      return;
    const o = new FormData(e), r = e.querySelector('uui-button[look="primary"]'), a = e.elements.namedItem("importFile"), s = a && a.files ? a.files[0] : null;
    try {
      r == null || r.setAttribute("state", "waiting"), this._isSubmitting = !0, this.requestUpdate();
      const n = new FormData();
      n.append(s.name, s);
      const l = await w.postUmbracoManagementApiV1ArticulateBlogImportBegin({
        body: n
        // hey-api handles FormData directly
      });
      if (!l.response.ok) {
        let g;
        try {
          g = await l.response.json();
        } catch {
          g = new Error(
            `File Upload API Error: ${l.response.status} ${l.response.statusText}`
          );
        }
        throw g;
      }
      const m = l.data;
      if (!m || !m.temporaryFileName)
        throw new Error("Upload completed but no response data was returned.");
      const z = {
        articulateNodeId: this._selectedBlogNodeUdi,
        overwrite: o.get("overwrite") === "on",
        publish: o.get("publish") === "on",
        regexMatch: o.get("regexMatch") || "",
        regexReplace: o.get("regexReplace") || "",
        tempFile: m.temporaryFileName,
        exportDisqusXml: o.get("disqusExport") === "on",
        importFirstImage: o.get("importImage") === "on"
      }, P = await w.postUmbracoManagementApiV1ArticulateBlogImport({
        body: z
      });
      if (!P.response.ok) {
        let g;
        try {
          g = await P.response.json();
        } catch {
          g = new Error(
            `Import API Error: ${P.response.status} ${P.response.statusText}`
          );
        }
        throw g;
      }
      const S = P.data;
      if (!S)
        throw new Error("Import completed but no response data was returned.");
      if (S.downloadUrl) {
        const g = S.downloadUrl.startsWith("http") ? S.downloadUrl : `${window.location.origin}${S.downloadUrl}`;
        this._downloadUrl = u`<a href="${g}" target="_blank">Download</a>.`;
      }
      e.reset(), this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = "No node selected", this.requestUpdate();
    } catch (n) {
      const l = v(n, "Import failed.");
      await _(this, l, "danger");
    } finally {
      r == null || r.setAttribute("state", ""), this._isSubmitting = !1, this.requestUpdate();
    }
  }
  _closeModal() {
    this._downloadUrl = void 0, this.requestUpdate();
  }
  render() {
    return this._isLoading ? u`<uui-loader-bar></uui-loader-bar>` : this._isDisabled ? u`<uui-box headline="BlogML Importer">
        ${N(this.routerPath)}
        <span slot="header"><uui-tag look="danger">Disabled</uui-tag></span>
        <p>Could not retrieve Articulate Archive document type.</p>
        <p>Ensure that the Articulate package is installed and configured correctly.</p>
        <p>Check the Articulate documentation for more information.</p>
      </uui-box>` : u`
      <uui-box headline="BlogML Importer">
        ${N(this.routerPath)}
        <uui-form-validation-message>
        <uui-form @submit=${this._handleSubmit}>
          <uui-form-layout-item>
            <uui-label for="blogNodeDisplay" required>Articulate blog node</uui-label>
            <div class="node-picker-container">
              <uui-input
                id="blogNodeDisplay"
                .value=${this._selectedBlogNodeName || "No node selected. Click 'Add' to choose."}
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
              required
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
      ${this._downloadUrl ? u`
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
            ` : u``}
    `;
  }
};
h.styles = [
  T,
  oe,
  U`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
    `
];
y([
  j({ type: String })
], h.prototype, "routerPath", 2);
y([
  d()
], h.prototype, "_isDisabled", 2);
y([
  d()
], h.prototype, "_isLoading", 2);
y([
  d()
], h.prototype, "_isSubmitting", 2);
y([
  d()
], h.prototype, "_selectedBlogNodeUdi", 2);
y([
  d()
], h.prototype, "_selectedBlogNodeName", 2);
y([
  d()
], h.prototype, "_downloadUrl", 2);
h = y([
  B("articulate-blogml-importer")
], h);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ge = (t) => (e, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const k = globalThis, F = k.ShadowRoot && (k.ShadyCSS === void 0 || k.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, re = Symbol(), X = /* @__PURE__ */ new WeakMap();
let fe = class {
  constructor(e, i, o) {
    if (this._$cssResult$ = !0, o !== re) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (F && e === void 0) {
      const o = i !== void 0 && i.length === 1;
      o && (e = X.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), o && X.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const be = (t) => new fe(typeof t == "string" ? t : t + "", void 0, re), ye = (t, e) => {
  if (F) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const o = document.createElement("style"), r = k.litNonce;
    r !== void 0 && o.setAttribute("nonce", r), o.textContent = i.cssText, t.appendChild(o);
  }
}, H = F ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const o of e.cssRules) i += o.cssText;
  return be(i);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: _e, defineProperty: we, getOwnPropertyDescriptor: ve, getOwnPropertyNames: $e, getOwnPropertySymbols: Ee, getPrototypeOf: Ue } = Object, f = globalThis, G = f.trustedTypes, xe = G ? G.emptyScript : "", L = f.reactiveElementPolyfillSupport, C = (t, e) => t, M = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? xe : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let i = t;
  switch (e) {
    case Boolean:
      i = t !== null;
      break;
    case Number:
      i = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(t);
      } catch {
        i = null;
      }
  }
  return i;
} }, V = (t, e) => !_e(t, e), K = { attribute: !0, type: String, converter: M, reflect: !1, useDefault: !1, hasChanged: V };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), f.litPropertyMetadata ?? (f.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class A extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = K) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const o = Symbol(), r = this.getPropertyDescriptor(e, o, i);
      r !== void 0 && we(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, i, o) {
    const { get: r, set: a } = ve(this.prototype, e) ?? { get() {
      return this[i];
    }, set(s) {
      this[i] = s;
    } };
    return { get: r, set(s) {
      const n = r == null ? void 0 : r.call(this);
      a == null || a.call(this, s), this.requestUpdate(e, n, o);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? K;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const e = Ue(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const i = this.properties, o = [...$e(i), ...Ee(i)];
      for (const r of o) this.createProperty(r, i[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [o, r] of i) this.elementProperties.set(o, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, o] of this.elementProperties) {
      const r = this._$Eu(i, o);
      r !== void 0 && this._$Eh.set(r, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const o = new Set(e.flat(1 / 0).reverse());
      for (const r of o) i.unshift(H(r));
    } else e !== void 0 && i.push(H(e));
    return i;
  }
  static _$Eu(e, i) {
    const o = i.attribute;
    return o === !1 ? void 0 : typeof o == "string" ? o : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((i) => this.enableUpdating = i), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((i) => i(this));
  }
  addController(e) {
    var i;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((i = e.hostConnected) == null || i.call(e));
  }
  removeController(e) {
    var i;
    (i = this._$EO) == null || i.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const o of i.keys()) this.hasOwnProperty(o) && (e.set(o, this[o]), delete this[o]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ye(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((i) => {
      var o;
      return (o = i.hostConnected) == null ? void 0 : o.call(i);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var o;
      return (o = i.hostDisconnected) == null ? void 0 : o.call(i);
    });
  }
  attributeChangedCallback(e, i, o) {
    this._$AK(e, o);
  }
  _$ET(e, i) {
    var a;
    const o = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, o);
    if (r !== void 0 && o.reflect === !0) {
      const s = (((a = o.converter) == null ? void 0 : a.toAttribute) !== void 0 ? o.converter : M).toAttribute(i, o.type);
      this._$Em = e, s == null ? this.removeAttribute(r) : this.setAttribute(r, s), this._$Em = null;
    }
  }
  _$AK(e, i) {
    var a, s;
    const o = this.constructor, r = o._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const n = o.getPropertyOptions(r), l = typeof n.converter == "function" ? { fromAttribute: n.converter } : ((a = n.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? n.converter : M;
      this._$Em = r, this[r] = l.fromAttribute(i, n.type) ?? ((s = this._$Ej) == null ? void 0 : s.get(r)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(e, i, o) {
    var r;
    if (e !== void 0) {
      const a = this.constructor, s = this[e];
      if (o ?? (o = a.getPropertyOptions(e)), !((o.hasChanged ?? V)(s, i) || o.useDefault && o.reflect && s === ((r = this._$Ej) == null ? void 0 : r.get(e)) && !this.hasAttribute(a._$Eu(e, o)))) return;
      this.C(e, i, o);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: o, reflect: r, wrapped: a }, s) {
    o && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, s ?? i ?? this[e]), a !== !0 || s !== void 0) || (this._$AL.has(e) || (this.hasUpdated || o || (i = void 0), this._$AL.set(e, i)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
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
        const { wrapped: n } = s, l = this[a];
        n !== !0 || this._$AL.has(a) || l === void 0 || this.C(a, void 0, s, l);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), (o = this._$EO) == null || o.forEach((r) => {
        var a;
        return (a = r.hostUpdate) == null ? void 0 : a.call(r);
      }), this.update(i)) : this._$EM();
    } catch (r) {
      throw e = !1, this._$EM(), r;
    }
    e && this._$AE(i);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var i;
    (i = this._$EO) == null || i.forEach((o) => {
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
    this._$Eq && (this._$Eq = this._$Eq.forEach((i) => this._$ET(i, this[i]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
}
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[C("elementProperties")] = /* @__PURE__ */ new Map(), A[C("finalized")] = /* @__PURE__ */ new Map(), L == null || L({ ReactiveElement: A }), (f.reactiveElementVersions ?? (f.reactiveElementVersions = [])).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Pe = { attribute: !0, type: String, converter: M, reflect: !1, hasChanged: V }, Se = (t = Pe, e, i) => {
  const { kind: o, metadata: r } = i;
  let a = globalThis.litPropertyMetadata.get(r);
  if (a === void 0 && globalThis.litPropertyMetadata.set(r, a = /* @__PURE__ */ new Map()), o === "setter" && ((t = Object.create(t)).wrapped = !0), a.set(i.name, t), o === "accessor") {
    const { name: s } = i;
    return { set(n) {
      const l = e.get.call(this);
      e.set.call(this, n), this.requestUpdate(s, l, t);
    }, init(n) {
      return n !== void 0 && this.C(s, void 0, t, n), n;
    } };
  }
  if (o === "setter") {
    const { name: s } = i;
    return function(n) {
      const l = this[s];
      e.call(this, n), this.requestUpdate(s, l, t);
    };
  }
  throw Error("Unsupported decorator location: " + o);
};
function ae(t) {
  return (e, i) => typeof i == "object" ? Se(t, e, i) : ((o, r, a) => {
    const s = r.hasOwnProperty(a);
    return r.constructor.createProperty(a, o), s ? Object.getOwnPropertyDescriptor(r, a) : void 0;
  })(t, e, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function O(t) {
  return ae({ ...t, state: !0, attribute: !1 });
}
var Ae = Object.defineProperty, Ce = Object.getOwnPropertyDescriptor, se = (t) => {
  throw TypeError(t);
}, x = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Ce(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Ae(e, i, r), r;
}, Ne = (t, e, i) => e.has(t) || se("Cannot " + i), Y = (t, e, i) => (Ne(t, e, "read from private field"), i ? i.call(t) : e.get(t)), J = (t, e, i) => e.has(t) ? se("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), I, R;
let p = class extends D {
  constructor() {
    super(...arguments), this._isLoading = !0, this._isSubmitting = !1, this._themes = [], this._newThemeName = "", this._selectedTheme = null, J(this, I, (t) => {
      this._newThemeName = t.target.value;
    }), J(this, R, () => {
      this._selectedTheme = null;
    });
  }
  /**
   * Fetches the list of available themes.
   * @private
   */
  async connectedCallback() {
    super.connectedCallback(), await this._loadThemes(), this._isLoading = !1, this.requestUpdate();
  }
  async _loadThemes() {
    try {
      const t = await w.getUmbracoManagementApiV1ArticulateThemesList();
      if (!t.response.ok) {
        let i;
        try {
          i = await t.response.json();
        } catch {
          i = new Error(
            `API Error: ${t.response.status} ${t.response.statusText}`
          );
        }
        throw i;
      }
      const e = await t.data;
      if (!e)
        throw new Error("Failed to load themes.");
      this._themes = (e == null ? void 0 : e.map((i) => i)) ?? [];
    } catch (t) {
      this._themes = [];
      const e = v(t, "Could not load themes.");
      await _(this, e, "danger");
    }
  }
  /**
   * Selects a theme to duplicate.
   * @private
   * @param {string} theme - The name of the theme to select.
   */
  _selectTheme(t) {
    this._selectedTheme = t, this._newThemeName = `${t} - Copy`, this.requestUpdate();
  }
  _handleSelectThemeButtonClick(t, e) {
    t.stopPropagation(), this._selectTheme(e);
  }
  _onCardSelected(t) {
    const i = t.target.getAttribute("data-theme");
    i && this._selectTheme(i);
  }
  _onCardDeselected(t) {
    const i = t.target.getAttribute("data-theme");
    i && i === this._selectedTheme && (this._selectedTheme = null);
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
        this._isSubmitting = !0, this.requestUpdate();
        const t = await w.postUmbracoManagementApiV1ArticulateThemesCopy({
          body: {
            themeName: this._selectedTheme,
            newThemeName: this._newThemeName
          }
        });
        if (!t.response.ok)
          throw new Error(`Failed to duplicate theme: ${t.response.statusText}`);
        await _(this, "Theme duplicated successfully!", "positive"), this._selectedTheme = null, this._newThemeName = "", this.requestUpdate();
      } catch (t) {
        console.error("Error duplicating theme:", t);
        const e = v(
          t,
          "Failed to duplicate theme. Please try again."
        );
        await _(this, e, "danger");
      } finally {
        this._isSubmitting = !1, this.requestUpdate();
      }
  }
  /**
   * Renders the theme grid.
   * @private
   * @returns {TemplateResult} The theme grid template.
   */
  _renderThemeGrid() {
    var t;
    return (((t = this._themes) == null ? void 0 : t.length) ?? 0) > 0 ? u`
        <div class="theme-grid">
          ${(this._themes ?? []).map(
      (e) => u`
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
                  @error=${(i) => {
        const o = i.target;
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
                    @click=${(i) => this._handleSelectThemeButtonClick(i, e)}
                  >
                    Select
                  </uui-button>
                </div>
              </uui-card-media>
            `
    )}
        </div>
      ` : u`
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
      return u``;
    const t = this._isSubmitting ? "Duplicating..." : "Duplicate";
    return u`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>

        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            id="newThemeName"
            .value=${this._newThemeName}
            @input=${Y(this, I)}
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
            ${t}
          </uui-button>

          <uui-button
            look="secondary"
            label="Cancel"
            @click=${Y(this, R)}
            ?disabled=${this._isSubmitting}
          >
            Cancel
          </uui-button>
        </div>
      </div>
    `;
  }
  render() {
    return this._isLoading ? u`<uui-loader-bar></uui-loader-bar>` : u`
      <uui-box headline="Theme Duplication">
        ${N(this.routerPath)}
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
I = /* @__PURE__ */ new WeakMap();
R = /* @__PURE__ */ new WeakMap();
p.styles = [
  T,
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
        color: var(--uui-color-text-alt);
        text-align: center;
        margin-block: var(--uui-size-layout-1);
      }
    `
];
x([
  ae({ type: String })
], p.prototype, "routerPath", 2);
x([
  O()
], p.prototype, "_isLoading", 2);
x([
  O()
], p.prototype, "_isSubmitting", 2);
x([
  O()
], p.prototype, "_themes", 2);
x([
  O()
], p.prototype, "_selectedTheme", 2);
p = x([
  ge("articulate-copy-theme")
], p);
var De = Object.defineProperty, Te = Object.getOwnPropertyDescriptor, ne = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Te(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && De(e, i, r), r;
};
const ke = [
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
let $ = class extends D {
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
    return u`
      ${ke.map((t) => {
      var o;
      const i = `${(o = this.routerPath) == null ? void 0 : o.replace(/\/$/, "")}/${t.path}`;
      return u`
          <uui-card-block-type
            class="tool-card"
            name="${t.name}"
            description="${t.description}"
            href=${i}
          >
            <uui-icon name="${t.icon}"></uui-icon>
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
    return u`
      <uui-box headline="Options">
        <div class="tools-grid">${this._renderCards()}</div>
      </uui-box>
    `;
  }
};
$.styles = [
  T,
  U`
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
ne([
  j({ type: String })
], $.prototype, "routerPath", 2);
$ = ne([
  B("articulate-dashboard-options")
], $);
var Me = Object.defineProperty, Be = Object.getOwnPropertyDescriptor, W = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Be(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Me(e, i, r), r;
};
let E = class extends D {
  constructor() {
    super(), this._routes = [
      {
        path: "blogml/import",
        component: h,
        setup: (t) => {
          this._routerBasePath && t instanceof h && (t.routerPath = this._routerBasePath);
        }
      },
      {
        path: "blogml/export",
        component: c,
        setup: (t) => {
          this._routerBasePath && t instanceof c && (t.routerPath = this._routerBasePath);
        }
      },
      {
        path: "theme/copy",
        component: p,
        setup: (t) => {
          this._routerBasePath && t instanceof p && (t.routerPath = this._routerBasePath);
        }
      },
      {
        path: "",
        component: $,
        setup: (t) => {
          this._routerBasePath && t instanceof $ && (t.routerPath = this._routerBasePath);
        }
      },
      {
        path: "**",
        component: async () => (await import("@umbraco-cms/backoffice/router")).UmbRouteNotFoundElement
      }
    ];
  }
  render() {
    return u`
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
      </umb-body-layout>
    `;
  }
};
E.styles = [
  T,
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
W([
  d()
], E.prototype, "_routerBasePath", 2);
W([
  d()
], E.prototype, "_routes", 2);
E = W([
  B("articulate-dashboard-root")
], E);
const Oe = {
  type: "dashboard",
  alias: "Articulate.BackOffice.Dashboard",
  name: "Articulate Dashboard",
  element: E,
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
}, ze = Oe, qe = [
  {
    type: "propertyEditorUi",
    alias: "Articulate.PropertyEditorUi.MarkdownEditor",
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
            // Required field
          }
        ]
      }
    }
  }
], Le = [...qe], Ie = [...Le], Ke = (t, e) => {
  e.register(ze), e.registerMany(Ie), t.consumeContext(le, (i) => {
    const o = i == null ? void 0 : i.getOpenApiConfiguration();
    ue.setConfig({
      auth: (o == null ? void 0 : o.token) ?? void 0,
      baseUrl: (o == null ? void 0 : o.base) ?? "",
      credentials: (o == null ? void 0 : o.credentials) ?? "same-origin"
    });
  });
};
export {
  Ke as onInit
};
//# sourceMappingURL=articulate.js.map
