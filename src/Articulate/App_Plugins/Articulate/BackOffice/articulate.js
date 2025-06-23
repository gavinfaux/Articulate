import { UMB_AUTH_CONTEXT as ve } from "@umbraco-cms/backoffice/auth";
import { A as b, i as we, e as B, s as N, c as $e } from "./notification-utils-DvHwRL3K.js";
import { html as l, css as w, property as Y, state as h, customElement as I, nothing as Ee } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as T } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as D } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as se } from "@umbraco-cms/backoffice/modal";
import { UmbValidationContext as ne, umbBindToValidation as xe } from "@umbraco-cms/backoffice/validation";
import { UMB_DOCUMENT_PICKER_MODAL as Se } from "@umbraco-cms/backoffice/document";
import { DocumentService as Ue } from "@umbraco-cms/backoffice/external/backend-api";
async function le() {
  const t = await b.getUmbracoManagementApiV1ArticulateBlogArticulateGuid();
  if (t.response.ok && t.data)
    return t.data;
  if (!t.data)
    return console.error("API returned no data for Articulate Archive UDI"), null;
  try {
    let e = await t.response.json();
    console.error(
      e.title && e.detail ? `${e.title}: ${e.detail}` : e.title
    );
  } catch {
    console.error(`${t.response.status} ${t.response.statusText}`);
  }
  return null;
}
async function ue(t) {
  var e;
  try {
    const i = await Ue.getDocumentById({ id: t });
    return ((e = i == null ? void 0 : i.variants) == null ? void 0 : e[0]) ?? null;
  } catch (i) {
    return console.error(
      `Failed to fetch node: ${i instanceof Error ? i.message : String(i)}`
    ), null;
  }
}
async function de(t, e, i) {
  try {
    const r = await t.open(
      i,
      Se,
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
    return console.error(`Node picker failed: ${o instanceof Error ? o.message : String(o)}`), null;
  }
}
function O(t) {
  return l`
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
var Pe = Object.defineProperty, Ae = Object.getOwnPropertyDescriptor, he = (t) => {
  throw TypeError(t);
}, $ = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Ae(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Pe(e, i, r), r;
}, pe = (t, e, i) => e.has(t) || he("Cannot " + i), M = (t, e, i) => (pe(t, e, "read from private field"), i ? i.call(t) : e.get(t)), U = (t, e, i) => e.has(t) ? he("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), Ne = (t, e, i) => (pe(t, e, "access private method"), i), j, W, V, G, X, me;
let p = class extends T {
  /**
   * Creates an instance of ArticulateBlogMlExporterElement.
   * Sets up the modal manager context.
   */
  constructor() {
    super(), U(this, X), this._formState = void 0, this._formError = "", this._articulateNodeId = null, this._selectedBlogNodeName = "", this._archiveDoctypeUdi = null, U(this, j, new ne(this)), U(this, W, (t, e) => {
      const i = window.URL.createObjectURL(t), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = e, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), U(this, V, (t) => t instanceof Blob), U(this, G, async (t) => {
      t.preventDefault();
      const e = t.target;
      if (!e) return;
      try {
        await M(this, j).validate();
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
            u = await a.response.json(), console.error(
              u.title && u.detail ? `${u.title}: ${u.detail}` : u.title
            );
          } catch {
            u = { title: `${a.response.status} ${a.response.statusText}` };
          }
          this._formError = (u.title && u.detail ? `${u.title}: ${u.detail}` : u.title) ?? "Failed to export blog content.", this._formState = "failed";
          return;
        }
        const s = a.data;
        if (!M(this, V).call(this, s)) {
          this._formState = "failed", this._formError = "Failed to receive a valid file from the server.", console.error("API response was not a valid file blob.");
          return;
        }
        const n = a.response.headers.get("content-disposition");
        let d = "export.xml";
        if (n) {
          const u = n.match(/filename=\"?([^\"]+)\"?/);
          u && u.length > 1 && u[1] && (d = u[1]);
        }
        this._formState = "success", M(this, W).call(this, s, d), e.reset(), this._articulateNodeId = null, this._selectedBlogNodeName = "";
      } catch (a) {
        this._formState = "failed", this._formError = `An unexpected error occurred: ${a instanceof Error ? a.message : String(a)}`, console.error(a);
      }
    }), this.consumeContext(se, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await le(), this._archiveDoctypeUdi === null) {
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
    const t = await de(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (t) {
      const e = await ue(t);
      if (!e) {
        this._formError = "Selected node not found.";
        return;
      }
      this._articulateNodeId = t, this._selectedBlogNodeName = e.name;
    }
  }
  render() {
    return l`
      <uui-box headline="BlogML Exporter">
        ${O(this.routerPath)}
        <uui-form-validation-message>
          <uui-form>
            <form id="blogMlExportForm" @submit=${M(this, G)}>
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
                    ${xe(this, "$.articulateNodeId", this._articulateNodeId || "")}
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
              <uui-form-layout-item>${Ne(this, X, me).call(this)}</uui-form-layout-item>
              <uui-button-group>
                <uui-button type="submit" look="primary" .state=${this._formState}
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
j = /* @__PURE__ */ new WeakMap();
W = /* @__PURE__ */ new WeakMap();
V = /* @__PURE__ */ new WeakMap();
G = /* @__PURE__ */ new WeakMap();
X = /* @__PURE__ */ new WeakSet();
me = function() {
  return !this._formError || this._formState !== "failed" ? Ee : l`<p class="text-danger">${this._formError}</p>`;
};
p.styles = [
  D,
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
  Y({ type: String })
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
  I("articulate-blogml-exporter")
], p);
var Ce = Object.defineProperty, Te = Object.getOwnPropertyDescriptor, fe = (t) => {
  throw TypeError(t);
}, _ = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Te(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Ce(e, i, r), r;
}, De = (t, e, i) => e.has(t) || fe("Cannot " + i), R = (t, e, i) => (De(t, e, "read from private field"), i ? i.call(t) : e.get(t)), Me = (t, e, i) => e.has(t) ? fe("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), A;
let c = class extends T {
  /**
   * Creates an instance of ArticulateBlogMlImporterElement.
   * Sets up the modal manager context and file reader event handlers.
   */
  constructor() {
    super(), this._isDisabled = !1, this._isLoading = !0, this._isSubmitting = !1, this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = "No node selected", this._downloadUrl = void 0, this._archiveDoctypeUdi = null, Me(this, A, new ne(this)), this.consumeContext(se, (t) => {
      this._modalManagerContext = t;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    super.connectedCallback(), this._archiveDoctypeUdi = await le(), this._archiveDoctypeUdi === null && (this._isDisabled = !0, this._isLoading = !1, this.requestUpdate("_isLoading", "_isDisabled")), this._isLoading = !1, this.requestUpdate("_isLoading");
  }
  /**
   * Opens the Umbraco document picker to select a blog node.
   * Updates the selected node UDI and fetches its name.
   * @private
   * @returns {Promise<void>}
   */
  async _openNodePicker() {
    try {
      const t = await de(this._modalManagerContext, this._archiveDoctypeUdi, this);
      if (t) {
        this._selectedBlogNodeName = "Loading...", this.requestUpdate("_selectedBlogNodeName");
        const e = await ue(t);
        if (!e)
          throw new Error(`Selected node ${t} not found`);
        this._selectedBlogNodeUdi = t, this._selectedBlogNodeName = e.name, this.requestUpdate("_selectedBlogNodeName", "_selectedBlogNodeUdi");
      }
    } catch (t) {
      if (we(t) && t.message.includes("No node selected"))
        return;
      const e = B(
        t,
        "An error occurred while using the node picker."
      );
      this._selectedBlogNodeName = "Error loading node", this.requestUpdate("_selectedBlogNodeName"), await N(this, e, "danger");
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
    if (!e) return;
    if (await R(this, A).validate(), !R(this, A).isValid) {
      R(this, A).focusFirstInvalidElement();
      return;
    }
    const i = new FormData(e), o = e.querySelector('uui-button[look="primary"]'), r = e.elements.namedItem("importFile"), a = r && r.files ? r.files[0] : null;
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
      const d = n.data;
      if (!d || !d.temporaryFileName)
        throw new Error("Upload completed but no response data was returned.");
      const u = {
        articulateNodeId: this._selectedBlogNodeUdi,
        overwrite: i.get("overwrite") === "on",
        publish: i.get("publish") === "on",
        regexMatch: i.get("regexMatch") || "",
        regexReplace: i.get("regexReplace") || "",
        tempFile: d.temporaryFileName,
        exportDisqusXml: i.get("disqusExport") === "on",
        importFirstImage: i.get("importImage") === "on"
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
      const n = B(s, "Import failed.");
      await N(this, n, "danger");
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
A = /* @__PURE__ */ new WeakMap();
c.styles = [
  D,
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
  Y({ type: String })
], c.prototype, "routerPath", 2);
_([
  h()
], c.prototype, "_isDisabled", 2);
_([
  h()
], c.prototype, "_isLoading", 2);
_([
  h()
], c.prototype, "_isSubmitting", 2);
_([
  h()
], c.prototype, "_selectedBlogNodeUdi", 2);
_([
  h()
], c.prototype, "_selectedBlogNodeName", 2);
_([
  h()
], c.prototype, "_downloadUrl", 2);
c = _([
  I("articulate-blogml-importer")
], c);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ke = (t) => (e, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const k = globalThis, J = k.ShadowRoot && (k.ShadyCSS === void 0 || k.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ge = Symbol(), ee = /* @__PURE__ */ new WeakMap();
let Be = class {
  constructor(e, i, o) {
    if (this._$cssResult$ = !0, o !== ge) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (J && e === void 0) {
      const o = i !== void 0 && i.length === 1;
      o && (e = ee.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), o && ee.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Oe = (t) => new Be(typeof t == "string" ? t : t + "", void 0, ge), ze = (t, e) => {
  if (J) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const o = document.createElement("style"), r = k.litNonce;
    r !== void 0 && o.setAttribute("nonce", r), o.textContent = i.cssText, t.appendChild(o);
  }
}, te = J ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const o of e.cssRules) i += o.cssText;
  return Oe(i);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Ie, defineProperty: Le, getOwnPropertyDescriptor: qe, getOwnPropertyNames: Re, getOwnPropertySymbols: Fe, getPrototypeOf: je } = Object, g = globalThis, ie = g.trustedTypes, We = ie ? ie.emptyScript : "", F = g.reactiveElementPolyfillSupport, C = (t, e) => t, z = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? We : null;
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
} }, Q = (t, e) => !Ie(t, e), oe = { attribute: !0, type: String, converter: z, reflect: !1, useDefault: !1, hasChanged: Q };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), g.litPropertyMetadata ?? (g.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class P extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = oe) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const o = Symbol(), r = this.getPropertyDescriptor(e, o, i);
      r !== void 0 && Le(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, i, o) {
    const { get: r, set: a } = qe(this.prototype, e) ?? { get() {
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
    return this.elementProperties.get(e) ?? oe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const e = je(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const i = this.properties, o = [...Re(i), ...Fe(i)];
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
      for (const r of o) i.unshift(te(r));
    } else e !== void 0 && i.push(te(e));
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
    return ze(e, this.constructor.elementStyles), e;
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
      const s = (((a = o.converter) == null ? void 0 : a.toAttribute) !== void 0 ? o.converter : z).toAttribute(i, o.type);
      this._$Em = e, s == null ? this.removeAttribute(r) : this.setAttribute(r, s), this._$Em = null;
    }
  }
  _$AK(e, i) {
    var a, s;
    const o = this.constructor, r = o._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const n = o.getPropertyOptions(r), d = typeof n.converter == "function" ? { fromAttribute: n.converter } : ((a = n.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? n.converter : z;
      this._$Em = r, this[r] = d.fromAttribute(i, n.type) ?? ((s = this._$Ej) == null ? void 0 : s.get(r)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(e, i, o) {
    var r;
    if (e !== void 0) {
      const a = this.constructor, s = this[e];
      if (o ?? (o = a.getPropertyOptions(e)), !((o.hasChanged ?? Q)(s, i) || o.useDefault && o.reflect && s === ((r = this._$Ej) == null ? void 0 : r.get(e)) && !this.hasAttribute(a._$Eu(e, o)))) return;
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
        const { wrapped: n } = s, d = this[a];
        n !== !0 || this._$AL.has(a) || d === void 0 || this.C(a, void 0, s, d);
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
P.elementStyles = [], P.shadowRootOptions = { mode: "open" }, P[C("elementProperties")] = /* @__PURE__ */ new Map(), P[C("finalized")] = /* @__PURE__ */ new Map(), F == null || F({ ReactiveElement: P }), (g.reactiveElementVersions ?? (g.reactiveElementVersions = [])).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ve = { attribute: !0, type: String, converter: z, reflect: !1, hasChanged: Q }, Ge = (t = Ve, e, i) => {
  const { kind: o, metadata: r } = i;
  let a = globalThis.litPropertyMetadata.get(r);
  if (a === void 0 && globalThis.litPropertyMetadata.set(r, a = /* @__PURE__ */ new Map()), o === "setter" && ((t = Object.create(t)).wrapped = !0), a.set(i.name, t), o === "accessor") {
    const { name: s } = i;
    return { set(n) {
      const d = e.get.call(this);
      e.set.call(this, n), this.requestUpdate(s, d, t);
    }, init(n) {
      return n !== void 0 && this.C(s, void 0, t, n), n;
    } };
  }
  if (o === "setter") {
    const { name: s } = i;
    return function(n) {
      const d = this[s];
      e.call(this, n), this.requestUpdate(s, d, t);
    };
  }
  throw Error("Unsupported decorator location: " + o);
};
function _e(t) {
  return (e, i) => typeof i == "object" ? Ge(t, e, i) : ((o, r, a) => {
    const s = r.hasOwnProperty(a);
    return r.constructor.createProperty(a, o), s ? Object.getOwnPropertyDescriptor(r, a) : void 0;
  })(t, e, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function L(t) {
  return _e({ ...t, state: !0, attribute: !1 });
}
var Xe = Object.defineProperty, He = Object.getOwnPropertyDescriptor, be = (t) => {
  throw TypeError(t);
}, E = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? He(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Xe(e, i, r), r;
}, Ke = (t, e, i) => e.has(t) || be("Cannot " + i), re = (t, e, i) => (Ke(t, e, "read from private field"), i ? i.call(t) : e.get(t)), ae = (t, e, i) => e.has(t) ? be("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), H, K;
let m = class extends T {
  constructor() {
    super(...arguments), this._isLoading = !0, this._isSubmitting = !1, this._themes = [], this._newThemeName = "", this._selectedTheme = null, ae(this, H, (t) => {
      this._newThemeName = t.target.value;
    }), ae(this, K, () => {
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
      const t = await b.getUmbracoManagementApiV1ArticulateThemesList();
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
      const e = B(t, "Could not load themes.");
      await N(this, e, "danger");
    }
  }
  /**
   * Selects a theme to duplicate.
   * @private
   * @param {string} theme - The name of the theme to select.
   */
  _selectTheme(t) {
    this._selectedTheme = t, this._newThemeName = `${t} - Copy`, this.requestUpdate("_selectedTheme", "_newThemeName");
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
        this._isSubmitting = !0, this.requestUpdate("_isSubmitting");
        const t = await b.postUmbracoManagementApiV1ArticulateThemesCopy({
          body: {
            themeName: this._selectedTheme,
            newThemeName: this._newThemeName
          }
        });
        if (!t.response.ok)
          throw new Error(`Failed to duplicate theme: ${t.response.statusText}`);
        await N(this, "Theme duplicated successfully!", "positive"), this._selectedTheme = null, this._newThemeName = "", this.requestUpdate("_selectedTheme", "_newThemeName");
      } catch (t) {
        console.error("Error duplicating theme:", t);
        const e = B(
          t,
          "Failed to duplicate theme. Please try again."
        );
        await N(this, e, "danger");
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
    var t;
    return (((t = this._themes) == null ? void 0 : t.length) ?? 0) > 0 ? l`
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
    const t = this._isSubmitting ? "Duplicating..." : "Duplicate";
    return l`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>

        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            id="newThemeName"
            .value=${this._newThemeName}
            @input=${re(this, H)}
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
            @click=${re(this, K)}
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
H = /* @__PURE__ */ new WeakMap();
K = /* @__PURE__ */ new WeakMap();
m.styles = [
  D,
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
  _e({ type: String })
], m.prototype, "routerPath", 2);
E([
  L()
], m.prototype, "_isLoading", 2);
E([
  L()
], m.prototype, "_isSubmitting", 2);
E([
  L()
], m.prototype, "_themes", 2);
E([
  L()
], m.prototype, "_selectedTheme", 2);
m = E([
  ke("articulate-copy-theme")
], m);
var Ye = Object.defineProperty, Je = Object.getOwnPropertyDescriptor, ye = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Je(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Ye(e, i, r), r;
};
const Qe = [
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
let y = class extends T {
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
      ${Qe.map((t) => {
      var o;
      const i = `${(o = this.routerPath) == null ? void 0 : o.replace(/\/$/, "")}/${t.path}`;
      return l`
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
    return l`
      <uui-box headline="Options">
        <div class="tools-grid">${this._renderCards()}</div>
      </uui-box>
    `;
  }
};
y.styles = [
  D,
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
ye([
  Y({ type: String })
], y.prototype, "routerPath", 2);
y = ye([
  I("articulate-dashboard-options")
], y);
var Ze = Object.defineProperty, et = Object.getOwnPropertyDescriptor, Z = (t, e, i, o) => {
  for (var r = o > 1 ? void 0 : o ? et(e, i) : e, a = t.length - 1, s; a >= 0; a--)
    (s = t[a]) && (r = (o ? s(e, i, r) : s(r)) || r);
  return o && r && Ze(e, i, r), r;
};
let v = class extends T {
  constructor() {
    super(), this._routes = [
      {
        path: "blogml/import",
        component: c,
        setup: (t) => {
          this._routerBasePath && t instanceof c && (t.routerPath = this._routerBasePath);
        }
      },
      {
        path: "blogml/export",
        component: p,
        setup: (t) => {
          this._routerBasePath && t instanceof p && (t.routerPath = this._routerBasePath);
        }
      },
      {
        path: "theme/copy",
        component: m,
        setup: (t) => {
          this._routerBasePath && t instanceof m && (t.routerPath = this._routerBasePath);
        }
      },
      {
        path: "",
        component: y,
        setup: (t) => {
          this._routerBasePath && t instanceof y && (t.routerPath = this._routerBasePath);
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
            @init=${(t) => {
      this._routerBasePath = t.target.absoluteRouterPath;
    }}
          ></umb-router-slot>
        </div>
      </umb-body-layout>
    `;
  }
};
v.styles = [
  D,
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
Z([
  h()
], v.prototype, "_routerBasePath", 2);
Z([
  h()
], v.prototype, "_routes", 2);
v = Z([
  I("articulate-dashboard-root")
], v);
const tt = {
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
}, it = tt, ot = [
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
], rt = [...ot], at = [...rt], gt = (t, e) => {
  e.register(it), e.registerMany(at), t.consumeContext(ve, (i) => {
    const o = i == null ? void 0 : i.getOpenApiConfiguration();
    $e.setConfig({
      auth: (o == null ? void 0 : o.token) ?? void 0,
      baseUrl: (o == null ? void 0 : o.base) ?? "",
      credentials: (o == null ? void 0 : o.credentials) ?? "same-origin"
    });
  });
};
export {
  gt as onInit
};
//# sourceMappingURL=articulate.js.map
