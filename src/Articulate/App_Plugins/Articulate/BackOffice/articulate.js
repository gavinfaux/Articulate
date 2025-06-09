import { UMB_AUTH_CONTEXT as he } from "@umbraco-cms/backoffice/auth";
import { A as $, e as _, s as g, a as p, c as pe } from "./notification-utils-CG569HlO.js";
import { css as P, property as F, state as c, customElement as k, html as u, unsafeHTML as ee } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as S } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as M } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as te } from "@umbraco-cms/backoffice/modal";
async function ie(i) {
  try {
    const e = await $.getUmbracoManagementApiV1ArticulateBlogArchiveid({
      throwOnError: !0
    });
    if (!e.response.ok) {
      let t;
      try {
        t = await e.response.json();
      } catch {
        t = new Error(
          `API Error: ${e.response.status} ${e.response.statusText}`
        );
      }
      throw t;
    }
    return e.data;
  } catch (e) {
    const t = _(
      e,
      "Could not fetch ArticulateArchive doctype UDI. Please check logs."
    );
    throw await g(i, t, "danger"), e;
  }
}
async function oe(i, e) {
  if (!e) return "No node selected";
  try {
    const t = await $.getUmbracoManagementApiV1ArticulateBlogNodename({
      query: { id: e },
      throwOnError: !0
    });
    if (!t.response.ok) {
      let o;
      try {
        o = await t.response.json();
      } catch {
        o = new Error(
          `API Error: ${t.response.status} ${t.response.statusText}`
        );
      }
      throw o;
    }
    return t.data;
  } catch (t) {
    const o = _(
      t,
      "Could not fetch node name. Please check logs."
    );
    throw await g(i, o, "danger"), t;
  }
}
async function re(i, e, t) {
  const o = i.open(t, "UMB_DOCUMENT_PICKER_MODAL", {
    data: {
      multiple: !1,
      filter: (r) => {
        var s;
        return ((s = r.documentType) == null ? void 0 : s.unique) === e;
      }
    }
  });
  try {
    const r = await o.onSubmit();
    return r && r.selection && r.selection.length > 0 ? r.selection[0] ?? null : null;
  } catch (r) {
    const s = _(r, "Node picker modal failed. Please check logs.");
    throw await g(t, s, "danger"), r;
  }
}
const se = P`
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
var me = Object.defineProperty, ge = Object.getOwnPropertyDescriptor, v = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? ge(e, t) : e, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(e, t, r) : a(r)) || r);
  return o && r && me(e, t, r), r;
};
let d = class extends S {
  constructor() {
    super(), this._isSubmitting = !1, this._formMessageType = "", this._formMessageText = "", this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = "No node selected", this._archiveDoctypeUdi = "", this.consumeContext(te, (i) => {
      this._modalManagerContext = i;
    });
  }
  async connectedCallback() {
    super.connectedCallback(), await this._fetchArchiveDoctypeUdi();
  }
  async _fetchArchiveDoctypeUdi() {
    this._archiveDoctypeUdi = await ie(this);
  }
  // _showMessage removed; use setFormMessage(this, type, message) instead
  async _openNodePicker() {
    if (!this._modalManagerContext) return;
    const i = await re(
      this._modalManagerContext,
      this._archiveDoctypeUdi,
      this
    );
    i && (this._selectedBlogNodeUdi = i, await this._fetchNodeName(i), this.requestUpdate("_selectedBlogNodeName"), this.requestUpdate("_selectedBlogNodeUdi"));
  }
  async _fetchNodeName(i) {
    this._selectedBlogNodeName = await oe(this, i), this.requestUpdate("_selectedBlogNodeName");
  }
  async _handleSubmit(i) {
    if (i.preventDefault(), this._isSubmitting) return;
    const e = i.target, t = new FormData(e), o = e.querySelector('uui-button[look="primary"]');
    if (!o) return;
    if (p(this, "", ""), !this._selectedBlogNodeUdi) {
      p(this, "error", "Please select an Articulate blog node to export from.");
      return;
    }
    const r = t.get("embedImages") === "on", s = {
      articulateNodeId: this._selectedBlogNodeUdi,
      exportImagesAsBase64: r
    };
    try {
      this._isSubmitting = !0, o.setAttribute("state", "waiting");
      const a = await $.postUmbracoManagementApiV1ArticulateBlogPostExport({
        body: s
      });
      if (!a.response.ok) {
        let m;
        try {
          m = await a.response.json();
        } catch {
          m = new Error(
            `API Error: ${a.response.status} ${a.response.statusText}`
          );
        }
        throw m;
      }
      const l = a.data;
      let n = "BlogML export completed successfully.";
      l && l.downloadUrl && (n = `BlogML export completed. <a href="${l.downloadUrl.startsWith("http") ? l.downloadUrl : `${window.location.origin}${l.downloadUrl}`}" target="_blank">Download exported file</a>.`), p(this, "positive", n), e.reset(), this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = "No node selected", this.requestUpdate();
    } catch (a) {
      console.error("BlogML Export Error:", a);
      const l = _(
        a,
        "Export failed. Please check the logs for more details."
      );
      await g(this, l, "danger"), p(this, "error", l);
    } finally {
      this._isSubmitting = !1, o.setAttribute("state", "default");
    }
  }
  render() {
    return this.routerPath ? u`
      <uui-box headline="BlogML Exporter">
        <div slot="header-actions">
          <uui-button
            label="Back to Articulate dashboard options"
            look="outline"
            compact
            href=${this.routerPath || "/umbraco/section/settings/dashboard/articulate"}
          >
            ← Back
          </uui-button>
        </div>
        <uui-form @submit=${this._handleSubmit}>
          <uui-form-layout-item>
            <uui-label for="blogNodeDisplay" required slot="label">Articulate blog node</uui-label>
            <div slot="description">Choose the Articulate blog node to export from</div>
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
                label=${this._selectedBlogNodeUdi ? "Change" : "Add"}
                @click=${this._openNodePicker}
              ></uui-button>
            </div>
            <input type="hidden" name="blogNodeId" .value=${this._selectedBlogNodeUdi || ""} />
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="embedImages" slot="label">Embed images?</uui-label>
            <div slot="description">
              Check if you want to embed images as base64 data in the output file. Useful if your
              site isn't going to be HTTP accessible to the site you will be importing on.
            </div>
            <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
          </uui-form-layout-item>
          <uui-form-validation-message
            class="${this._formMessageType === "positive" ? "form-message-positive" : this._formMessageType === "error" ? "form-message-error" : ""}"
          >
            ${ee(this._formMessageText)}
          </uui-form-validation-message>
          <div class="form-actions">
            <uui-button look="primary" label="Submit">Submit</uui-button>
          </div>
        </uui-form>
      </uui-box>
    ` : u`<uui-loader-bar></uui-loader-bar>`;
  }
};
d.styles = [
  M,
  se,
  P`
      .form-message-positive {
        color: var(--uui-color-positive-emphasis);
      }
      .form-message-error {
        color: var(--uui-color-danger-emphasis);
      }
      .node-picker-container {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
      }
    `
];
v([
  F({ type: String })
], d.prototype, "routerPath", 2);
v([
  c()
], d.prototype, "_isSubmitting", 2);
v([
  c()
], d.prototype, "_formMessageType", 2);
v([
  c()
], d.prototype, "_formMessageText", 2);
v([
  c()
], d.prototype, "_selectedBlogNodeUdi", 2);
v([
  c()
], d.prototype, "_selectedBlogNodeName", 2);
v([
  c()
], d.prototype, "_archiveDoctypeUdi", 2);
d = v([
  k("articulate-blogml-exporter")
], d);
var fe = Object.defineProperty, be = Object.getOwnPropertyDescriptor, w = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? be(e, t) : e, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(e, t, r) : a(r)) || r);
  return o && r && fe(e, t, r), r;
};
let h = class extends S {
  constructor() {
    super(), this._isSubmitting = !1, this._formMessageType = "", this._formMessageText = "", this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = null, this._archiveDoctypeUdi = "", this.consumeContext(te, (i) => {
      this._modalManagerContext = i;
    });
  }
  async connectedCallback() {
    super.connectedCallback(), await this._fetchArchiveDoctypeUdi();
  }
  async _fetchArchiveDoctypeUdi() {
    try {
      this._archiveDoctypeUdi = await ie(this);
    } catch (i) {
      console.error("Error fetching ArticulateArchive doctype UDI:", i);
      const e = _(
        i,
        "Could not fetch ArticulateArchive doctype UDI. Please check logs."
      );
      await g(this, e, "danger");
    }
  }
  async _openNodePicker() {
    if (!this._modalManagerContext) return;
    const i = await re(
      this._modalManagerContext,
      this._archiveDoctypeUdi,
      this
    );
    i && (this._selectedBlogNodeUdi = i, await this._fetchNodeName(i), this.requestUpdate("_selectedBlogNodeName"), this.requestUpdate("_selectedBlogNodeUdi"));
  }
  async _fetchNodeName(i) {
    this._selectedBlogNodeName = await oe(this, i), this.requestUpdate("_selectedBlogNodeName");
  }
  async _handleSubmit(i) {
    if (i.preventDefault(), this._isSubmitting) return;
    const e = i.target, t = new FormData(e), o = e.querySelector('uui-button[look="primary"]');
    if (!o) return;
    p(this, "", "");
    const r = this._selectedBlogNodeUdi, s = e.elements.namedItem("importFile"), a = s && s.files ? s.files[0] : null;
    if (!r) {
      p(this, "error", "Please select an Articulate blog node to import to.");
      return;
    }
    if (!a || a.size === 0) {
      p(this, "error", "Please select a BlogML file to import.");
      return;
    }
    try {
      this._isSubmitting = !0, o.setAttribute("state", "waiting"), p(this, "", "Uploading file, please wait...");
      const l = new FormData();
      l.append(a.name, a);
      const n = await $.postUmbracoManagementApiV1ArticulateBlogPostInit({
        body: l,
        // hey-api handles FormData directly
        throwOnError: !0
      });
      if (!n.response.ok) {
        let b;
        try {
          b = await n.response.json();
        } catch {
          b = new Error(
            `File Upload API Error: ${n.response.status} ${n.response.statusText}`
          );
        }
        throw b;
      }
      const m = n.data;
      if (!m || !m.temporaryFileName)
        throw new Error("File upload initialization failed: No temporary file name returned.");
      p(this, "", `File uploaded. Importing ${m.postCount} posts...`);
      const O = {
        articulateNodeId: r,
        overwrite: t.get("overwrite") === "on",
        publish: t.get("publish") === "on",
        regexMatch: t.get("regexMatch") || "",
        regexReplace: t.get("regexReplace") || "",
        tempFile: m.temporaryFileName,
        exportDisqusXml: t.get("disqusExport") === "on",
        importFirstImage: t.get("importImage") === "on"
      }, A = await $.postUmbracoManagementApiV1ArticulateBlogPostImport({
        body: O,
        throwOnError: !0
      });
      if (!A.response.ok) {
        let b;
        try {
          b = await A.response.json();
        } catch {
          b = new Error(
            `Import API Error: ${A.response.status} ${A.response.statusText}`
          );
        }
        throw b;
      }
      const U = A.data;
      let G = "BlogML import completed successfully.";
      U && U.downloadUrl && (G = `BlogML import completed. <a href="${U.downloadUrl.startsWith("http") ? U.downloadUrl : `${window.location.origin}${U.downloadUrl}`}" target="_blank">Download import log/status</a>.`), p(this, "positive", G), e.reset(), this._selectedBlogNodeUdi = null, this._selectedBlogNodeName = null, this.requestUpdate();
    } catch (l) {
      console.error("BlogML Import Error:", l);
      const n = _(
        l,
        "Import failed. Please check the logs for more details."
      );
      await g(this, n, "danger");
    } finally {
      this._isSubmitting = !1, o.setAttribute("state", "default");
    }
  }
  render() {
    return this.routerPath ? u`
      <uui-box headline="BlogML Importer">
        <div slot="header-actions">
          <uui-button
            label="Back to Articulate dashboard options"
            look="outline"
            compact
            href=${this.routerPath || "/umbraco/section/settings/dashboard/articulate"}
          >
            ← Back
          </uui-button>
        </div>
        <uui-form @submit=${this._handleSubmit}>
          <uui-form-layout-item>
            <uui-label for="blogNodeDisplay" slot="label" required>Articulate blog node</uui-label>
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
            <input type="hidden" name="blogNodeValue" .value=${this._selectedBlogNodeUdi || ""} />
            <div slot="description">Choose the Articulate blog node to import to</div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="importFile">BlogML import file</uui-label>
            <uui-input-file id="importFile" name="importFile"></uui-input-file>
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
            <uui-input id="regexMatch" name="regexMatch"></uui-input>
            <div slot="description">
              Regex statement used to match content in the blog post to be replaced by the match
              statement
            </div>
          </uui-form-layout-item>
          <uui-form-layout-item>
            <uui-label for="regexReplace" slot="label">Regex replacement statement</uui-label>
            <uui-input id="regexReplace" name="regexReplace"></uui-input>
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
          <uui-form-validation-message
            class="${this._formMessageType === "positive" ? "form-message-positive" : this._formMessageType === "error" ? "form-message-error" : ""}"
          >
            ${ee(this._formMessageText)}
          </uui-form-validation-message>
          <div class="form-actions">
            <uui-button look="primary" label="Submit">Submit</uui-button>
          </div>
        </uui-form>
      </uui-box>
    ` : u`<uui-loader-bar></uui-loader-bar>`;
  }
};
h.styles = [
  M,
  se,
  P`
      .form-message-positive {
        color: var(--uui-color-positive-emphasis);
      }

      .form-message-error {
        color: var(--uui-color-danger-emphasis);
      }
      .node-picker-container {
        display: flex;
        align-items: center;
      }
    `
];
w([
  F({ type: String })
], h.prototype, "routerPath", 2);
w([
  c()
], h.prototype, "_isSubmitting", 2);
w([
  c()
], h.prototype, "_formMessageType", 2);
w([
  c()
], h.prototype, "_formMessageText", 2);
w([
  c()
], h.prototype, "_selectedBlogNodeUdi", 2);
w([
  c()
], h.prototype, "_selectedBlogNodeName", 2);
w([
  c()
], h.prototype, "_archiveDoctypeUdi", 2);
h = w([
  k("articulate-blogml-importer")
], h);
var ye = Object.defineProperty, _e = Object.getOwnPropertyDescriptor, ae = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? _e(e, t) : e, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(e, t, r) : a(r)) || r);
  return o && r && ye(e, t, r), r;
};
const ve = [
  {
    path: "blogml/import",
    name: "BlogML Importer",
    icon: "sync",
    description: "Import content from any BlogML compatible platform"
  },
  {
    path: "blogml/export",
    name: "BlogML Exporter",
    icon: "download",
    description: "Export content to any BlogML compatible platform"
  },
  {
    path: "theme/collection",
    name: "Themes",
    icon: "wand",
    description: "Manage customization of Articulate themes"
  }
];
let x = class extends S {
  render() {
    return this.routerPath ? u`
      <uui-box headline="Options">
        <div class="tools-grid">
          ${ve.map((i) => {
      var o;
      const t = `${(o = this.routerPath) == null ? void 0 : o.replace(/\/$/, "")}/${i.path}`;
      return u`
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
        </div>
      </uui-box>
    ` : u`<uui-loader-bar></uui-loader-bar>`;
  }
};
x.styles = [
  M,
  P`
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
ae([
  F({ type: String })
], x.prototype, "routerPath", 2);
x = ae([
  k("articulate-dashboard-options")
], x);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const we = (i) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(i, e);
  }) : customElements.define(i, e);
};
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const D = globalThis, V = D.ShadowRoot && (D.ShadyCSS === void 0 || D.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, le = Symbol(), K = /* @__PURE__ */ new WeakMap();
let $e = class {
  constructor(e, t, o) {
    if (this._$cssResult$ = !0, o !== le) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (V && e === void 0) {
      const o = t !== void 0 && t.length === 1;
      o && (e = K.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), o && K.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const xe = (i) => new $e(typeof i == "string" ? i : i + "", void 0, le), Ee = (i, e) => {
  if (V) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const o = document.createElement("style"), r = D.litNonce;
    r !== void 0 && o.setAttribute("nonce", r), o.textContent = t.cssText, i.appendChild(o);
  }
}, J = V ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const o of e.cssRules) t += o.cssText;
  return xe(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Pe, defineProperty: Ae, getOwnPropertyDescriptor: Ue, getOwnPropertyNames: Ne, getOwnPropertySymbols: Te, getPrototypeOf: Se } = Object, y = globalThis, Y = y.trustedTypes, Me = Y ? Y.emptyScript : "", L = y.reactiveElementPolyfillSupport, T = (i, e) => i, B = { toAttribute(i, e) {
  switch (e) {
    case Boolean:
      i = i ? Me : null;
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
} }, W = (i, e) => !Pe(i, e), Q = { attribute: !0, type: String, converter: B, reflect: !1, useDefault: !1, hasChanged: W };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), y.litPropertyMetadata ?? (y.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class N extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Q) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const o = Symbol(), r = this.getPropertyDescriptor(e, o, t);
      r !== void 0 && Ae(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, o) {
    const { get: r, set: s } = Ue(this.prototype, e) ?? { get() {
      return this[t];
    }, set(a) {
      this[t] = a;
    } };
    return { get: r, set(a) {
      const l = r == null ? void 0 : r.call(this);
      s == null || s.call(this, a), this.requestUpdate(e, l, o);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Q;
  }
  static _$Ei() {
    if (this.hasOwnProperty(T("elementProperties"))) return;
    const e = Se(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(T("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(T("properties"))) {
      const t = this.properties, o = [...Ne(t), ...Te(t)];
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
      for (const r of o) t.unshift(J(r));
    } else e !== void 0 && t.push(J(e));
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
    return Ee(e, this.constructor.elementStyles), e;
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
    var s;
    const o = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, o);
    if (r !== void 0 && o.reflect === !0) {
      const a = (((s = o.converter) == null ? void 0 : s.toAttribute) !== void 0 ? o.converter : B).toAttribute(t, o.type);
      this._$Em = e, a == null ? this.removeAttribute(r) : this.setAttribute(r, a), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var s, a;
    const o = this.constructor, r = o._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const l = o.getPropertyOptions(r), n = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((s = l.converter) == null ? void 0 : s.fromAttribute) !== void 0 ? l.converter : B;
      this._$Em = r, this[r] = n.fromAttribute(t, l.type) ?? ((a = this._$Ej) == null ? void 0 : a.get(r)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(e, t, o) {
    var r;
    if (e !== void 0) {
      const s = this.constructor, a = this[e];
      if (o ?? (o = s.getPropertyOptions(e)), !((o.hasChanged ?? W)(a, t) || o.useDefault && o.reflect && a === ((r = this._$Ej) == null ? void 0 : r.get(e)) && !this.hasAttribute(s._$Eu(e, o)))) return;
      this.C(e, t, o);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: o, reflect: r, wrapped: s }, a) {
    o && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), s !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || o || (t = void 0), this._$AL.set(e, t)), r === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
        for (const [s, a] of this._$Ep) this[s] = a;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [s, a] of r) {
        const { wrapped: l } = a, n = this[s];
        l !== !0 || this._$AL.has(s) || n === void 0 || this.C(s, void 0, a, n);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (o = this._$EO) == null || o.forEach((r) => {
        var s;
        return (s = r.hostUpdate) == null ? void 0 : s.call(r);
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
N.elementStyles = [], N.shadowRootOptions = { mode: "open" }, N[T("elementProperties")] = /* @__PURE__ */ new Map(), N[T("finalized")] = /* @__PURE__ */ new Map(), L == null || L({ ReactiveElement: N }), (y.reactiveElementVersions ?? (y.reactiveElementVersions = [])).push("2.1.0");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ce = { attribute: !0, type: String, converter: B, reflect: !1, hasChanged: W }, De = (i = Ce, e, t) => {
  const { kind: o, metadata: r } = t;
  let s = globalThis.litPropertyMetadata.get(r);
  if (s === void 0 && globalThis.litPropertyMetadata.set(r, s = /* @__PURE__ */ new Map()), o === "setter" && ((i = Object.create(i)).wrapped = !0), s.set(t.name, i), o === "accessor") {
    const { name: a } = t;
    return { set(l) {
      const n = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(a, n, i);
    }, init(l) {
      return l !== void 0 && this.C(a, void 0, i, l), l;
    } };
  }
  if (o === "setter") {
    const { name: a } = t;
    return function(l) {
      const n = this[a];
      e.call(this, l), this.requestUpdate(a, n, i);
    };
  }
  throw Error("Unsupported decorator location: " + o);
};
function ne(i) {
  return (e, t) => typeof t == "object" ? De(i, e, t) : ((o, r, s) => {
    const a = r.hasOwnProperty(s);
    return r.constructor.createProperty(s, o), a ? Object.getOwnPropertyDescriptor(r, s) : void 0;
  })(i, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function H(i) {
  return ne({ ...i, state: !0, attribute: !1 });
}
var Be = Object.defineProperty, ke = Object.getOwnPropertyDescriptor, ue = (i) => {
  throw TypeError(i);
}, C = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? ke(e, t) : e, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(e, t, r) : a(r)) || r);
  return o && r && Be(e, t, r), r;
}, ce = (i, e, t) => e.has(i) || ue("Cannot " + t), Z = (i, e, t) => (ce(i, e, "read from private field"), t ? t.call(i) : e.get(i)), I = (i, e, t) => e.has(i) ? ue("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(i) : e.set(i, t), Oe = (i, e, t) => (ce(i, e, "access private method"), t), q, de, R, j;
let f = class extends S {
  constructor() {
    super(...arguments), I(this, q), this._isLoading = !1, this._themes = [], this._newThemeName = "", this._selectedTheme = null, I(this, R, (i) => {
      this._newThemeName = i.target.value;
    }), I(this, j, () => {
      this._selectedTheme = null;
    });
  }
  async connectedCallback() {
    super.connectedCallback(), await Oe(this, q, de).call(this);
  }
  _selectTheme(i) {
    this._selectedTheme = i, this._newThemeName = `${i} - Copy`, this.requestUpdate();
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
  async _duplicateTheme() {
    if (this._isLoading || !this._selectedTheme || !this._newThemeName) return;
    const i = {
      body: {
        themeName: this._selectedTheme,
        newThemeName: this._newThemeName
      },
      url: "/umbraco/management/api/v1/articulate/themes/copy"
    };
    try {
      this._isLoading = !0;
      const e = await $.postUmbracoManagementApiV1ArticulateThemesCopy({
        ...i,
        throwOnError: !0
      });
      if (!e.response.ok) {
        let o;
        try {
          o = await e.response.json();
        } catch {
          o = new Error(
            `API Error: ${e.response.status} ${e.response.statusText}`
          );
        }
        throw o;
      }
      const t = await e.data;
      if (!t)
        throw new Error("Failed to duplicate theme. Review back office logs for more details.");
      await g(
        this,
        `Theme '${this._selectedTheme}' duplicated to 'wwwroot/Views/Articulate/${t}'`,
        "positive"
      ), this._selectedTheme = null, this._newThemeName = "", this.requestUpdate();
    } catch (e) {
      const t = _(
        e,
        "Failed to duplicate theme. Review back office logs for more details."
      );
      await g(this, t, "danger");
    } finally {
      this._isLoading = !1;
    }
  }
  _renderThemeGrid() {
    var i, e;
    return this._isLoading && !(((i = this._themes) == null ? void 0 : i.length) ?? 0) ? u`<uui-loader-bar animationDuration="1.5" style="color: blue"></uui-loader-bar>` : (((e = this._themes) == null ? void 0 : e.length) ?? 0) > 0 ? u`
        <div class="theme-grid">
          ${(this._themes ?? []).map(
      (t) => u`
              <uui-card-media
                class="theme-card"
                .name=${t}
                ?selectable=${!0}
                ?selected=${this._selectedTheme === t}
                selectOnly
                @selected=${this._onCardSelected}
                @deselected=${this._onCardDeselected}
                data-theme=${t}
              >
                <img
                  class="theme-preview-img"
                  src="/App_Plugins/Articulate/BackOffice/assets/theme-${t.toLowerCase()}.png"
                  alt="${t} theme preview"
                  loading="lazy"
                  @error=${(o) => {
        const r = o.target;
        r.style.display = "none";
        const s = r.parentElement;
        if (s && !s.querySelector(":scope > .theme-fallback-initial")) {
          const a = document.createElement("span");
          a.className = "theme-fallback-initial", a.textContent = t.charAt(0).toUpperCase(), s.appendChild(a);
        }
      }}
                />
                <div slot="actions">
                  <uui-button
                    look="primary"
                    label="Select Theme ${t}"
                    @click=${(o) => this._handleSelectThemeButtonClick(o, t)}
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
  _renderDuplicateForm() {
    if (!this._selectedTheme)
      return u``;
    const i = this._isLoading ? "Duplicating..." : "Duplicate";
    return u`
      <div class="duplicate-form">
        <h3>Duplicate '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>

        <uui-form-layout-item>
          <uui-label for="newThemeName" slot="label" required>New theme name</uui-label>
          <uui-input
            id="newThemeName"
            .value=${this._newThemeName}
            @input=${Z(this, R)}
            required
            ?disabled=${this._isLoading}
          ></uui-input>
        </uui-form-layout-item>

        <div class="form-actions">
          <uui-button
            look="primary"
            color="positive"
            label="Duplicate"
            type="button"
            @click=${this._duplicateTheme}
            ?disabled=${!this._newThemeName || this._isLoading}
            .state=${this._isLoading ? "waiting" : ""}
          >
            ${i}
          </uui-button>

          <uui-button
            look="secondary"
            label="Cancel"
            @click=${Z(this, j)}
            ?disabled=${this._isLoading}
          >
            Cancel
          </uui-button>
        </div>
      </div>
    `;
  }
  render() {
    return this.routerPath ? u`
      <uui-box headline="Theme Customization">
        <div slot="header-actions">
          <uui-button
            label="Back to Articulate dashboard options"
            look="outline"
            compact
            .href=${this.routerPath || "/umbraco/section/settings/dashboard/articulate"}
          >
            ← Back
          </uui-button>
        </div>
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
    ` : u`<uui-loader></uui-loader>`;
  }
};
q = /* @__PURE__ */ new WeakSet();
de = async function() {
  this._isLoading = !0;
  try {
    const i = await $.getUmbracoManagementApiV1ArticulateThemesAll({
      throwOnError: !0
    });
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
      throw new Error("Failed to load themes. Review back office logs for more details.");
    this._themes = (e == null ? void 0 : e.map((t) => t)) ?? [];
  } catch (i) {
    this._themes = [];
    const e = _(
      i,
      "Could not load themes. Please check the logs for more details."
    );
    await g(this, e, "danger");
  } finally {
    this._isLoading = !1, this.requestUpdate();
  }
};
R = /* @__PURE__ */ new WeakMap();
j = /* @__PURE__ */ new WeakMap();
f.styles = [
  M,
  P`
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
C([
  ne({ type: String })
], f.prototype, "routerPath", 2);
C([
  H()
], f.prototype, "_isLoading", 2);
C([
  H()
], f.prototype, "_themes", 2);
C([
  H()
], f.prototype, "_selectedTheme", 2);
f = C([
  we("articulate-duplicate-theme")
], f);
var ze = Object.defineProperty, Le = Object.getOwnPropertyDescriptor, X = (i, e, t, o) => {
  for (var r = o > 1 ? void 0 : o ? Le(e, t) : e, s = i.length - 1, a; s >= 0; s--)
    (a = i[s]) && (r = (o ? a(e, t, r) : a(r)) || r);
  return o && r && ze(e, t, r), r;
};
let E = class extends S {
  constructor() {
    super(), this._routes = [
      {
        path: "blogml/import",
        component: h,
        setup: (i) => {
          this._routerBasePath && i instanceof h && (i.routerPath = this._routerBasePath);
        }
      },
      {
        path: "blogml/export",
        component: d,
        setup: (i) => {
          this._routerBasePath && i instanceof d && (i.routerPath = this._routerBasePath);
        }
      },
      {
        path: "theme/collection",
        component: f,
        setup: (i) => {
          this._routerBasePath && i instanceof f && (i.routerPath = this._routerBasePath);
        }
      },
      {
        path: "",
        component: x,
        setup: (i) => {
          this._routerBasePath && i instanceof x && (i.routerPath = this._routerBasePath);
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
            @init=${(i) => {
      this._routerBasePath = i.target.absoluteRouterPath;
    }}
          ></umb-router-slot>
        </div>
      </umb-body-layout>
    `;
  }
};
E.styles = [
  M,
  P`
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
X([
  c()
], E.prototype, "_routerBasePath", 2);
X([
  c()
], E.prototype, "_routes", 2);
E = X([
  k("articulate-dashboard-root")
], E);
const Ie = {
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
}, qe = Ie, Ge = (i, e) => {
  e.register(qe), i.consumeContext(he, (t) => {
    const o = t == null ? void 0 : t.getOpenApiConfiguration();
    pe.setConfig({
      auth: (o == null ? void 0 : o.token) ?? void 0,
      baseUrl: (o == null ? void 0 : o.base) ?? "",
      credentials: (o == null ? void 0 : o.credentials) ?? "same-origin"
    });
  });
};
export {
  Ge as onInit
};
//# sourceMappingURL=articulate.js.map
