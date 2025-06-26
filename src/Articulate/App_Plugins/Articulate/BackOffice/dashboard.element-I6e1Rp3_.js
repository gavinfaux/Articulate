import { css as v, html as u, nothing as at, property as Y, state as d, customElement as U } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as N } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as A } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as ct } from "@umbraco-cms/backoffice/modal";
import { A as g, f as b } from "./error-utils-CM2ch-oG.js";
import { UMB_DOCUMENT_PICKER_MODAL as St } from "@umbraco-cms/backoffice/document";
import { DocumentService as Ct } from "@umbraco-cms/backoffice/external/backend-api";
import { UMB_NOTIFICATION_CONTEXT as Pt } from "@umbraco-cms/backoffice/notification";
async function dt() {
  const e = await g.getArticulateBlogArticulateGuidV1();
  if (e.response.ok && e.data)
    return e.data;
  if (!e.data)
    return console.error("API returned no data for Articulate Archive UDI"), null;
  try {
    let t = await e.response.json();
    console.error(
      t.title && t.detail ? `${t.title}: ${t.detail}` : t.title
    );
  } catch {
    console.error(`${e.response.status} ${e.response.statusText}`);
  }
  return null;
}
async function ht(e) {
  var t;
  try {
    const i = await Ct.getDocumentById({ id: e });
    return ((t = i == null ? void 0 : i.variants) == null ? void 0 : t[0]) ?? null;
  } catch (i) {
    return console.error(
      `Failed to fetch node: ${i instanceof Error ? i.message : String(i)}`
    ), null;
  }
}
async function pt(e, t, i) {
  try {
    const r = await e.open(
      i,
      St,
      {
        data: {
          multiple: !1,
          pickableFilter: (a) => {
            var s;
            return ((s = a.documentType) == null ? void 0 : s.unique) === t;
          }
        }
      }
    ).onSubmit();
    return !r || !r.selection || !r.selection[0] ? null : r.selection[0];
  } catch (o) {
    return console.error(`Node picker failed: ${o instanceof Error ? o.message : String(o)}`), null;
  }
}
const mt = v`
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
async function S(e, t, i, o = !1) {
  const r = await e.getContext(Pt);
  o ? r.stay(i, {
    data: { message: t }
  }) : r.peek(i, {
    data: { message: t }
  });
}
function K(e) {
  return u`
    <div slot="header-actions">
      <uui-button
        label="Back to Articulate dashboard options"
        look="outline"
        compact
        href=${e || "/umbraco/section/settings/dashboard/articulate"}
      >
        ← Back
      </uui-button>
    </div>
  `;
}
function J(e) {
  if (!e || e.length === 0)
    return at;
  const [t, ...i] = e;
  return u`
    <div
      style="padding: var(--uui-size-space-4); margin-block: 1rem; border: 1px solid var(--uui-color-danger-standalone); color: var(--uui-color-danger); border-radius: var(--uui-border-radius);"
    >
      <strong>${t}</strong>
      ${i.length > 0 ? u`
            <ul style="margin: 0; padding-left: 20px; list-style-position: inside;">
              ${i.map((o) => u`<li>${o}</li>`)}
            </ul>
          ` : at}
    </div>
  `;
}
var Nt = Object.defineProperty, At = Object.getOwnPropertyDescriptor, ft = (e) => {
  throw TypeError(e);
}, w = (e, t, i, o) => {
  for (var r = o > 1 ? void 0 : o ? At(t, i) : t, a = e.length - 1, s; a >= 0; a--)
    (s = e[a]) && (r = (o ? s(t, i, r) : s(r)) || r);
  return o && r && Nt(t, i, r), r;
}, gt = (e, t, i) => t.has(e) || ft("Cannot " + i), I = (e, t, i) => (gt(e, t, "read from private field"), i ? i.call(e) : t.get(e)), k = (e, t, i) => t.has(e) ? ft("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), Tt = (e, t, i) => (gt(e, t, "access private method"), i), q, L, F, _t, j;
let h = class extends N {
  /**
   * Creates an instance of ArticulateBlogMlExporterElement.
   * Sets up the modal manager context.
   */
  constructor() {
    super(), k(this, F), this._formState = void 0, this._formError = [], this._articulateNodeId = "", this._selectedBlogNodeName = "", this._archiveDoctypeUdi = null, k(this, q, (e, t) => {
      const i = window.URL.createObjectURL(e), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = t, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), k(this, L, (e) => e instanceof Blob), k(this, j, async (e) => {
      if (e.preventDefault(), this._formState = "waiting", this._formError = [], !this._articulateNodeId) {
        this._formError = ["Please select a blog node before exporting."], this._formState = "failed";
        return;
      }
      const t = e.target;
      if (!t) return;
      const o = new FormData(t).get("embedImages") === "on", r = {
        articulateNodeId: this._articulateNodeId,
        exportImagesAsBase64: o
      }, a = await g.postArticulateBlogExportV1({
        body: r
      });
      if (!a.response.ok || !a.data) {
        this._formError = b(a.error, "Failed to export blog content."), this._formState = "failed";
        return;
      }
      const s = a.data;
      if (!I(this, L).call(this, s)) {
        this._formState = "failed", this._formError = ["Failed to receive a valid file from the server."];
        return;
      }
      const n = a.response.headers.get("content-disposition");
      let l = "blog-export.xml";
      if (n) {
        const f = n.match(/filename=\"?([^\"]+)\"?/);
        f && f.length > 1 && f[1] && (l = f[1]);
      }
      I(this, q).call(this, s, l), this._formState = "success", await S(this, "BlogML exported successfully!", "positive", !0), t.reset(), this._articulateNodeId = "", this._selectedBlogNodeName = "";
    }), this.consumeContext(ct, (e) => {
      this._modalManagerContext = e;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await dt(), this._archiveDoctypeUdi === null) {
      this._formState = "failed", this._formError = ["Failed to retrieve Articulate Archive document type."];
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
    this._formError = [];
    const e = await pt(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (e) {
      const t = await ht(e);
      if (!t) {
        this._formError = ["Selected node not found."];
        return;
      }
      this._articulateNodeId = e, this._selectedBlogNodeName = t.name;
    }
  }
  render() {
    return u`
      <uui-box headline="BlogML Exporter">
        ${K(this.routerPath)}
        <uui-form>
          <form id="blogMlExportForm" @submit=${I(this, j)} @input=${Tt(this, F, _t)}>
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
                  readonly
                  required
                  required-message="You must select a blog node"
                  style="flex-grow: 1;"
                ></uui-input>
                <uui-button
                  look="outline"
                  label=${this._articulateNodeId !== "" ? "Change" : "Choose"}
                  @click=${this._openNodePicker}
                  ?disabled=${this._formState === "waiting"}
                ></uui-button>
              </div>
              <div slot="description">Choose the Articulate blog node to export from</div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="embedImages">Embed images?</uui-label>
              <uui-toggle
                id="embedImages"
                name="embedImages"
                ?disabled=${this._formState === "waiting"}
              ></uui-toggle>
              <div slot="description">
                Check if you want to embed images as base64 data in the output file. Useful if your
                site isn't going to be HTTP accessible to the site you will be importing on.
              </div>
            </uui-form-layout-item>
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
        ${J(this._formError)}
      </uui-box>
    `;
  }
};
q = /* @__PURE__ */ new WeakMap();
L = /* @__PURE__ */ new WeakMap();
F = /* @__PURE__ */ new WeakSet();
_t = function() {
  this._formError = [];
};
j = /* @__PURE__ */ new WeakMap();
h.styles = [
  A,
  mt,
  v`
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
    `
];
w([
  Y({ type: String })
], h.prototype, "routerPath", 2);
w([
  d()
], h.prototype, "_formState", 2);
w([
  d()
], h.prototype, "_formError", 2);
w([
  d()
], h.prototype, "_articulateNodeId", 2);
w([
  d()
], h.prototype, "_selectedBlogNodeName", 2);
h = w([
  U("blogml-exporter")
], h);
var kt = Object.defineProperty, Mt = Object.getOwnPropertyDescriptor, bt = (e) => {
  throw TypeError(e);
}, _ = (e, t, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Mt(t, i) : t, a = e.length - 1, s; a >= 0; a--)
    (s = e[a]) && (r = (o ? s(t, i, r) : s(r)) || r);
  return o && r && kt(t, i, r), r;
}, yt = (e, t, i) => t.has(e) || bt("Cannot " + i), z = (e, t, i) => (yt(e, t, "read from private field"), i ? i.call(e) : t.get(e)), M = (e, t, i) => t.has(e) ? bt("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), Dt = (e, t, i) => (yt(e, t, "access private method"), i), W, V, G, vt, X;
let c = class extends N {
  /**
   * Creates an instance of ArticulateBlogMlImporterElement.
   * Sets up the modal manager context and file reader event handlers.
   */
  constructor() {
    super(), M(this, G), this._formState = void 0, this._formError = [], this._articulateNodeId = null, this._selectedBlogNodeName = "", this._postCount = null, this._archiveDoctypeUdi = null, M(this, W, (e, t) => {
      const i = window.URL.createObjectURL(e), o = document.createElement("a");
      o.style.display = "none", o.href = i, o.download = t, document.body.appendChild(o), o.click(), window.URL.revokeObjectURL(i), o.remove();
    }), M(this, V, (e) => e instanceof Blob), M(this, X, async (e) => {
      var f, et;
      if (e.preventDefault(), this._formState = "waiting", this._formError = [], this._postCount = null, !this._articulateNodeId) {
        this._formError = ["Please select a blog node before importing."], this._formState = "failed";
        return;
      }
      const t = e.target;
      if (!t) return;
      const i = new FormData(t), o = i.get("importFile");
      if (!o) {
        this._formError = ["Please select a file to import."];
        return;
      }
      const r = await g.postArticulateBlogImportBeginV1({
        body: {
          importFile: o
        }
      });
      if (!r.response.ok || !((f = r.data) != null && f.temporaryFileName) || !((et = r.data) != null && et.postCount)) {
        this._formError = b(r.error, "Failed to upload blog content."), this._formState = "failed";
        return;
      }
      const a = r.data;
      this._postCount = a.postCount;
      const s = {
        articulateNodeId: this._articulateNodeId,
        overwrite: i.get("overwrite") === "on",
        publish: i.get("publish") === "on",
        regexMatch: i.get("regexMatch") || "",
        regexReplace: i.get("regexReplace") || "",
        tempFile: a.temporaryFileName,
        exportDisqusXml: i.get("disqusExport") === "on",
        importFirstImage: i.get("importImage") === "on"
      }, n = await g.postArticulateBlogImportV1({
        body: s
      });
      if (!n.response.ok || !n.data || !n.data.completed) {
        this._formError = b(n.error, "Failed to import blog content."), this._formState = "failed", this._postCount = null;
        return;
      }
      const l = n.data;
      if (i.get("disqusExport") === "on" && l.commentCount > 0) {
        const E = await g.getArticulateBlogExportDisqusV1();
        if (!E.response.ok || !E.data) {
          this._formError = b(
            E.error,
            "Import reported success but failed to export Disqus comments."
          ), await S(
            this,
            `BlogML imported successfully. ${l.authorCount} authors, ${this._postCount} posts imported. Failed to export ${l.commentCount} comments.`,
            "warning",
            !0
          ), this._formState = "failed", this._postCount = null;
          return;
        }
        const it = E.data;
        if (!z(this, V).call(this, it)) {
          this._formState = "failed", this._postCount = null, this._formError = [
            "Import reported success but failed to receive a valid file Disqus file from the server."
          ], await S(
            this,
            `BlogML imported successfully. ${l.authorCount} authors, ${this._postCount} posts imported. Failed to export ${l.commentCount} comments.`,
            "warning",
            !0
          );
          return;
        }
        const ot = E.response.headers.get("content-disposition");
        let rt = "disqus-comments.xml";
        if (ot) {
          const T = ot.match(/filename=\"?([^\"]+)\"?/);
          T && T.length > 1 && T[1] && (rt = T[1]);
        }
        z(this, W).call(this, it, rt);
      }
      this._formState = "success", await S(
        this,
        `BlogML imported successfully! ${l.authorCount} authors, ${this._postCount} posts imported. ${i.get("disqusExport") === "on" && l.commentCount > 0 ? ` ${l.commentCount} comments exported.` : i.get("disqusExport") === "on" && l.commentCount === 0 ? "No comments found to export." : ""}`,
        "positive",
        !0
      ), t.reset(), this._articulateNodeId = null, this._selectedBlogNodeName = "", this._postCount = null;
    }), this.consumeContext(ct, (e) => {
      this._modalManagerContext = e;
    });
  }
  /**
   * Lifecycle method called when the element is added to the DOM.
   * Fetches the Articulate Archive document type UDI.
   */
  async connectedCallback() {
    if (super.connectedCallback(), this._archiveDoctypeUdi = await dt(), this._archiveDoctypeUdi === null) {
      this._formState = "failed", this._formError = ["Failed to retrieve Articulate Archive document type."];
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
    this._formError = [];
    const e = await pt(this._modalManagerContext, this._archiveDoctypeUdi, this);
    if (e) {
      const t = await ht(e);
      if (!t) {
        this._formError = ["Selected node not found."];
        return;
      }
      this._articulateNodeId = e, this._selectedBlogNodeName = t.name;
    }
  }
  render() {
    return u`
      <uui-box headline="BlogML Importer">
        ${K(this.routerPath)}
        <uui-form>
          <form
            enctype="multipart/form-data"
            id="blogMlImportForm"
            @submit=${z(this, X)}
            @input=${Dt(this, G, vt)}
          >
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
                  readonly
                  required
                  required-message="You must select a blog node"
                  style="flex-grow: 1;"
                ></uui-input>
                <uui-button
                  look="outline"
                  label=${this._articulateNodeId ? "Change" : "Choose"}
                  @click=${this._openNodePicker}
                  ?disabled=${this._formState === "waiting"}
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
                ?disabled=${this._formState === "waiting"}
              >
              </uui-input-file>
              <div slot="description">The XML file to upload for import</div>
              ${this._postCount !== null && this._postCount > 0 ? u`
                    <div slot="message">
                      <uui-tag look="secondary" color="positive"
                        >${this._postCount} posts in uploaded file.</uui-tag
                      >
                    </div>
                  ` : ""}
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="overwrite">Overwrite imported posts?</uui-label>
              <uui-toggle
                id="overwrite"
                name="overwrite"
                ?disabled=${this._formState === "waiting"}
              ></uui-toggle>
              <div slot="description">Check if you want to overwrite posts already imported</div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="publishAll">Publish all posts?</uui-label>
              <uui-toggle
                id="publishAll"
                name="publishAll"
                ?disabled=${this._formState === "waiting"}
              ></uui-toggle>
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
                ?disabled=${this._formState === "waiting"}
              ></uui-input>
              <div slot="description">
                Regex statement used to match content in the blog post to be replaced by the match
                statement. See the Articulate Wiki
                <a
                  href="https://github.com/Shazwazza/Articulate/wiki/Importing#options"
                  rel="noopener noreferrer nofollow"
                  >Importing</a
                >
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
                ?disabled=${this._formState === "waiting"}
              ></uui-input>
              <div slot="description">
                Replacement statement used with the above match statement
              </div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="disqusExport">Export Disqus Xml</uui-label>
              <uui-toggle
                id="disqusExport"
                name="disqusExport"
                ?disabled=${this._formState === "waiting"}
              ></uui-toggle>
              <div slot="description">
                If you would like Articulate to output an XML file that you can use to import the
                comments found in this file in to Disqus
              </div>
            </uui-form-layout-item>
            <uui-form-layout-item>
              <uui-label slot="label" for="importImage"
                >Import First Image from Post Attachments</uui-label
              >
              <uui-toggle id="importImage" name="importImage"></uui-toggle>
              <div slot="description">
                If you would like Articulate to try and import the first image url in the post
                attachments
              </div>
            </uui-form-layout-item>
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
        ${J(this._formError)}
      </uui-box>
    `;
  }
};
W = /* @__PURE__ */ new WeakMap();
V = /* @__PURE__ */ new WeakMap();
G = /* @__PURE__ */ new WeakSet();
vt = function() {
  this._formError = [];
};
X = /* @__PURE__ */ new WeakMap();
c.styles = [
  A,
  mt,
  v`
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
  U("blogml-importer")
], c);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ot = (e) => (t, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const D = globalThis, Q = D.ShadowRoot && (D.ShadyCSS === void 0 || D.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, wt = Symbol(), st = /* @__PURE__ */ new WeakMap();
let Ut = class {
  constructor(t, i, o) {
    if (this._$cssResult$ = !0, o !== wt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = i;
  }
  get styleSheet() {
    let t = this.o;
    const i = this.t;
    if (Q && t === void 0) {
      const o = i !== void 0 && i.length === 1;
      o && (t = st.get(i)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), o && st.set(i, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Bt = (e) => new Ut(typeof e == "string" ? e : e + "", void 0, wt), It = (e, t) => {
  if (Q) e.adoptedStyleSheets = t.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of t) {
    const o = document.createElement("style"), r = D.litNonce;
    r !== void 0 && o.setAttribute("nonce", r), o.textContent = i.cssText, e.appendChild(o);
  }
}, nt = Q ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let i = "";
  for (const o of t.cssRules) i += o.cssText;
  return Bt(i);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: zt, defineProperty: Rt, getOwnPropertyDescriptor: qt, getOwnPropertyNames: Lt, getOwnPropertySymbols: Ft, getPrototypeOf: jt } = Object, m = globalThis, lt = m.trustedTypes, Wt = lt ? lt.emptyScript : "", R = m.reactiveElementPolyfillSupport, C = (e, t) => e, O = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Wt : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let i = e;
  switch (t) {
    case Boolean:
      i = e !== null;
      break;
    case Number:
      i = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(e);
      } catch {
        i = null;
      }
  }
  return i;
} }, Z = (e, t) => !zt(e, t), ut = { attribute: !0, type: String, converter: O, reflect: !1, useDefault: !1, hasChanged: Z };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), m.litPropertyMetadata ?? (m.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class x extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, i = ut) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(t, i), !i.noAccessor) {
      const o = Symbol(), r = this.getPropertyDescriptor(t, o, i);
      r !== void 0 && Rt(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, i, o) {
    const { get: r, set: a } = qt(this.prototype, t) ?? { get() {
      return this[i];
    }, set(s) {
      this[i] = s;
    } };
    return { get: r, set(s) {
      const n = r == null ? void 0 : r.call(this);
      a == null || a.call(this, s), this.requestUpdate(t, n, o);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ut;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const t = jt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const i = this.properties, o = [...Lt(i), ...Ft(i)];
      for (const r of o) this.createProperty(r, i[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const i = litPropertyMetadata.get(t);
      if (i !== void 0) for (const [o, r] of i) this.elementProperties.set(o, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, o] of this.elementProperties) {
      const r = this._$Eu(i, o);
      r !== void 0 && this._$Eh.set(r, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const i = [];
    if (Array.isArray(t)) {
      const o = new Set(t.flat(1 / 0).reverse());
      for (const r of o) i.unshift(nt(r));
    } else t !== void 0 && i.push(nt(t));
    return i;
  }
  static _$Eu(t, i) {
    const o = i.attribute;
    return o === !1 ? void 0 : typeof o == "string" ? o : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((i) => this.enableUpdating = i), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((i) => i(this));
  }
  addController(t) {
    var i;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((i = t.hostConnected) == null || i.call(t));
  }
  removeController(t) {
    var i;
    (i = this._$EO) == null || i.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const o of i.keys()) this.hasOwnProperty(o) && (t.set(o, this[o]), delete this[o]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return It(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((i) => {
      var o;
      return (o = i.hostConnected) == null ? void 0 : o.call(i);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((i) => {
      var o;
      return (o = i.hostDisconnected) == null ? void 0 : o.call(i);
    });
  }
  attributeChangedCallback(t, i, o) {
    this._$AK(t, o);
  }
  _$ET(t, i) {
    var a;
    const o = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, o);
    if (r !== void 0 && o.reflect === !0) {
      const s = (((a = o.converter) == null ? void 0 : a.toAttribute) !== void 0 ? o.converter : O).toAttribute(i, o.type);
      this._$Em = t, s == null ? this.removeAttribute(r) : this.setAttribute(r, s), this._$Em = null;
    }
  }
  _$AK(t, i) {
    var a, s;
    const o = this.constructor, r = o._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const n = o.getPropertyOptions(r), l = typeof n.converter == "function" ? { fromAttribute: n.converter } : ((a = n.converter) == null ? void 0 : a.fromAttribute) !== void 0 ? n.converter : O;
      this._$Em = r, this[r] = l.fromAttribute(i, n.type) ?? ((s = this._$Ej) == null ? void 0 : s.get(r)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(t, i, o) {
    var r;
    if (t !== void 0) {
      const a = this.constructor, s = this[t];
      if (o ?? (o = a.getPropertyOptions(t)), !((o.hasChanged ?? Z)(s, i) || o.useDefault && o.reflect && s === ((r = this._$Ej) == null ? void 0 : r.get(t)) && !this.hasAttribute(a._$Eu(t, o)))) return;
      this.C(t, i, o);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, i, { useDefault: o, reflect: r, wrapped: a }, s) {
    o && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, s ?? i ?? this[t]), a !== !0 || s !== void 0) || (this._$AL.has(t) || (this.hasUpdated || o || (i = void 0), this._$AL.set(t, i)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
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
    let t = !1;
    const i = this._$AL;
    try {
      t = this.shouldUpdate(i), t ? (this.willUpdate(i), (o = this._$EO) == null || o.forEach((r) => {
        var a;
        return (a = r.hostUpdate) == null ? void 0 : a.call(r);
      }), this.update(i)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(i);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var i;
    (i = this._$EO) == null || i.forEach((o) => {
      var r;
      return (r = o.hostUpdated) == null ? void 0 : r.call(o);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((i) => this._$ET(i, this[i]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
}
x.elementStyles = [], x.shadowRootOptions = { mode: "open" }, x[C("elementProperties")] = /* @__PURE__ */ new Map(), x[C("finalized")] = /* @__PURE__ */ new Map(), R == null || R({ ReactiveElement: x }), (m.reactiveElementVersions ?? (m.reactiveElementVersions = [])).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Vt = { attribute: !0, type: String, converter: O, reflect: !1, hasChanged: Z }, Gt = (e = Vt, t, i) => {
  const { kind: o, metadata: r } = i;
  let a = globalThis.litPropertyMetadata.get(r);
  if (a === void 0 && globalThis.litPropertyMetadata.set(r, a = /* @__PURE__ */ new Map()), o === "setter" && ((e = Object.create(e)).wrapped = !0), a.set(i.name, e), o === "accessor") {
    const { name: s } = i;
    return { set(n) {
      const l = t.get.call(this);
      t.set.call(this, n), this.requestUpdate(s, l, e);
    }, init(n) {
      return n !== void 0 && this.C(s, void 0, e, n), n;
    } };
  }
  if (o === "setter") {
    const { name: s } = i;
    return function(n) {
      const l = this[s];
      t.call(this, n), this.requestUpdate(s, l, e);
    };
  }
  throw Error("Unsupported decorator location: " + o);
};
function $t(e) {
  return (t, i) => typeof i == "object" ? Gt(e, t, i) : ((o, r, a) => {
    const s = r.hasOwnProperty(a);
    return r.constructor.createProperty(a, o), s ? Object.getOwnPropertyDescriptor(r, a) : void 0;
  })(e, t, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function B(e) {
  return $t({ ...e, state: !0, attribute: !1 });
}
var Xt = Object.defineProperty, Ht = Object.getOwnPropertyDescriptor, Et = (e) => {
  throw TypeError(e);
}, $ = (e, t, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Ht(t, i) : t, a = e.length - 1, s; a >= 0; a--)
    (s = e[a]) && (r = (o ? s(t, i, r) : s(r)) || r);
  return o && r && Xt(t, i, r), r;
}, Yt = (e, t, i) => t.has(e) || Et("Cannot " + i), Kt = (e, t, i) => (Yt(e, t, "read from private field"), i ? i.call(e) : t.get(e)), Jt = (e, t, i) => t.has(e) ? Et("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), H;
let p = class extends N {
  constructor() {
    super(...arguments), this._formState = void 0, this._formError = [], this._themes = [], this._newThemeName = "", this._selectedTheme = null, Jt(this, H, (e) => {
      this._formError = [], this._newThemeName = e.target.value;
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
    const e = await g.getArticulateThemesDefaultV1();
    if (!e.response.ok) {
      this._formError = b(e.error, "Failed to load themes."), this._formState = "failed";
      return;
    }
    const t = e.data;
    if (!t) {
      this._formState = "failed", this._formError = ["Failed to load themes."];
      return;
    }
    this._themes = (t == null ? void 0 : t.map((i) => i)) ?? [];
  }
  /**
   * Selects a theme to duplicate.
   * @private
   * @param {string} theme - The name of the theme to select.
   */
  _selectTheme(e) {
    this._formError = [], this._selectedTheme = e, this._newThemeName = `${e} - Copy`;
  }
  _handleSelectThemeButtonClick(e, t) {
    e.stopPropagation(), this._selectTheme(t);
  }
  _onCardSelected(e) {
    const i = e.target.getAttribute("data-theme");
    i && this._selectTheme(i);
  }
  _onCardDeselected(e) {
    const i = e.target.getAttribute("data-theme");
    i && i === this._selectedTheme && (this._selectedTheme = null);
  }
  /**
   * Handles form submission for duplicating a theme.
   * @private
   */
  async _duplicateTheme() {
    if (this._formState = "waiting", this._formError = [], !this._selectedTheme || !this._newThemeName) {
      this._formError = ["Please select a theme and enter a new theme name."];
      return;
    }
    const e = await g.postArticulateThemesCopyV1({
      body: {
        themeName: this._selectedTheme,
        newThemeName: this._newThemeName
      }
    });
    if (!e.response.ok) {
      this._formError = b(e.error, "Failed to duplicate theme."), this._formState = "failed";
      return;
    }
    this._formState = "success", await S(this, "Theme duplicated successfully!", "positive", !0), this._selectedTheme = null, this._newThemeName = "";
  }
  /**
   * Renders the theme grid.
   * @private
   * @returns {TemplateResult} The theme grid template.
   */
  _renderThemeGrid() {
    return u`
      <div class="theme-grid">
        ${(this._themes ?? []).map(
      (e) => u`
            <uui-card-media
              class="theme-card"
              .name=${e}
              ?selectable=${this._formState !== "waiting"}
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
        const i = t.target;
        i.style.display = "none";
        const o = i.parentElement;
        if (o && !o.querySelector(":scope > .theme-fallback-initial")) {
          const r = document.createElement("span");
          r.className = "theme-fallback-initial", r.textContent = e.charAt(0).toUpperCase(), o.appendChild(r);
        }
      }}
              />
              <div slot="actions">
                <uui-button
                  look="primary"
                  label="Select Theme ${e}"
                  @click=${(t) => this._handleSelectThemeButtonClick(t, e)}
                  ?disabled=${this._formState === "waiting"}
                >
                  Select
                </uui-button>
              </div>
            </uui-card-media>
          `
    )}
      </div>
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
    const e = this._formState === "waiting" ? "Duplicating..." : "Duplicate";
    return u`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>

        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            id="newThemeName"
            .value=${this._newThemeName}
            @input=${Kt(this, H)}
            required
            ?disabled=${this._formState === "waiting"}
          ></uui-input>
        </uui-form-layout-item>

        <div class="form-actions">
          <uui-button
            look="primary"
            label=${e}
            type="button"
            @click=${() => this._duplicateTheme()}
            ?disabled=${this._formState === "waiting"}
            .state=${this._formState}
          >
            ${e}
          </uui-button>
        </div>
      </div>
    `;
  }
  render() {
    return u`
      <uui-box headline="Theme Duplication">
        ${K(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to customize them yourself. The
            duplicated theme will be copied to the ~/Views/Articulate folder where you can edit it.
            Then you can select this theme from the themes drop down on your Articulate root node to
            use it.
          </p>
        </div>
        <div class="container">${this._renderThemeGrid()} ${this._renderDuplicateForm()}</div>
        ${J(this._formError)}
      </uui-box>
    `;
  }
};
H = /* @__PURE__ */ new WeakMap();
p.styles = [
  A,
  v`
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
        color: var(--uui-color-text-danger);
        text-align: center;
        margin-block: var(--uui-size-layout-1);
      }
    `
];
$([
  $t({ type: String })
], p.prototype, "routerPath", 2);
$([
  B()
], p.prototype, "_formState", 2);
$([
  B()
], p.prototype, "_formError", 2);
$([
  B()
], p.prototype, "_themes", 2);
$([
  B()
], p.prototype, "_selectedTheme", 2);
p = $([
  Ot("copy-theme")
], p);
var Qt = Object.defineProperty, Zt = Object.getOwnPropertyDescriptor, xt = (e, t, i, o) => {
  for (var r = o > 1 ? void 0 : o ? Zt(t, i) : t, a = e.length - 1, s; a >= 0; a--)
    (s = e[a]) && (r = (o ? s(t, i, r) : s(r)) || r);
  return o && r && Qt(t, i, r), r;
};
const te = [
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
let y = class extends N {
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
      ${te.map((e) => {
      var o;
      const i = `${(o = this.routerPath) == null ? void 0 : o.replace(/\/$/, "")}/${e.path}`;
      return u`
          <uui-card-block-type
            class="tool-card"
            name="${e.name}"
            description="${e.description}"
            href=${i}
          >
            <uui-icon name="${e.icon}"></uui-icon>
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
y.styles = [
  A,
  v`
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
xt([
  Y({ type: String })
], y.prototype, "routerPath", 2);
y = xt([
  U("dashboard-options")
], y);
var ee = Object.defineProperty, ie = Object.getOwnPropertyDescriptor, tt = (e, t, i, o) => {
  for (var r = o > 1 ? void 0 : o ? ie(t, i) : t, a = e.length - 1, s; a >= 0; a--)
    (s = e[a]) && (r = (o ? s(t, i, r) : s(r)) || r);
  return o && r && ee(t, i, r), r;
};
let P = class extends N {
  constructor() {
    super(), this._routes = [
      {
        path: "blogml/import",
        component: c,
        setup: (e) => {
          this._routerBasePath && e instanceof c && (e.routerPath = this._routerBasePath);
        }
      },
      {
        path: "blogml/export",
        component: h,
        setup: (e) => {
          this._routerBasePath && e instanceof h && (e.routerPath = this._routerBasePath);
        }
      },
      {
        path: "theme/copy",
        component: p,
        setup: (e) => {
          this._routerBasePath && e instanceof p && (e.routerPath = this._routerBasePath);
        }
      },
      {
        path: "",
        component: y,
        setup: (e) => {
          this._routerBasePath && e instanceof y && (e.routerPath = this._routerBasePath);
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
            @init=${(e) => {
      this._routerBasePath = e.target.absoluteRouterPath;
    }}
          ></umb-router-slot>
        </div>
      </umb-body-layout>
    `;
  }
};
P.styles = [
  A,
  v`
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
tt([
  d()
], P.prototype, "_routerBasePath", 2);
tt([
  d()
], P.prototype, "_routes", 2);
P = tt([
  U("articulate-dashboard")
], P);
export {
  P as default
};
//# sourceMappingURL=dashboard.element-I6e1Rp3_.js.map
