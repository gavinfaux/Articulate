import { UmbElementMixin as m } from "@umbraco-cms/backoffice/element-api";
import { UmbChangeEvent as p } from "@umbraco-cms/backoffice/event";
import { html as u, css as _, property as c, state as l, customElement as d } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as f } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as v } from "@umbraco-cms/backoffice/style";
import { A as g, e as w, s as b } from "./notification-utils-CG569HlO.js";
var O = Object.defineProperty, S = Object.getOwnPropertyDescriptor, o = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? S(t, r) : t, n = e.length - 1, h; n >= 0; n--)
    (h = e[n]) && (a = (i ? h(t, r, a) : h(a)) || a);
  return i && a && O(t, r, a), a;
};
let s = class extends m(f) {
  constructor() {
    super(), this._themeSelectOptions = [], this._themeData = [], this._loading = !1, this._error = "", this._fetchThemes();
  }
  updated(e) {
    super.updated(e);
    const t = e.has("value"), r = e.has("_themeData");
    this._themeData.length > 0 && (t || r) && this._rebuildAndSetSelectOptions();
  }
  async _fetchThemes() {
    this._loading = !0, this._error = "";
    try {
      const e = await g.getUmbracoManagementApiV1ArticulateEditorsThemes({
        throwOnError: !0
      });
      if (!e.response.ok) {
        let r;
        try {
          r = await e.response.json();
        } catch {
          r = new Error(
            `API Error: ${e.response.status} ${e.response.statusText}`
          );
        }
        throw r;
      }
      const t = await e.data;
      if (!t)
        throw new Error("Failed to load themes. Review back office logs for more details.");
      this._themeData = (t == null ? void 0 : t.map((r) => ({
        name: r,
        value: r
      }))) ?? [], this._rebuildAndSetSelectOptions();
    } catch (e) {
      const t = w(
        e,
        "Could not load themes. Please check the logs for details."
      );
      this._error = t, await b(this, t, "danger");
    } finally {
      this._loading = !1;
    }
  }
  _rebuildAndSetSelectOptions() {
    if (!this._themeData || this._themeData.length === 0) {
      this._themeSelectOptions.length > 0 && (this._themeSelectOptions = []);
      return;
    }
    const e = this.value, t = this._themeData.map((r) => ({
      name: r.name,
      value: r.value,
      selected: !!e && r.value === e
    }));
    this._themeSelectOptions = t;
  }
  _handleInput(e) {
    const t = e.target.value;
    this.value !== t && (this.value = t, this.dispatchEvent(new p()));
  }
  render() {
    return this._loading ? u`<uui-loader></uui-loader>` : this._error ? u` <uui-tag color="danger">Could not load themes: ${this._error}</uui-tag> ` : u`
      <uui-select
        .options=${this._themeSelectOptions}
        .value=${this.value}
        @change=${this._handleInput}
        label="Select a theme"
      ></uui-select>
    `;
  }
};
s.styles = [
  v,
  _`
      uui-select {
        width: 100%;
      }
    `
];
o([
  c()
], s.prototype, "value", 2);
o([
  c({ attribute: !1 })
], s.prototype, "config", 2);
o([
  l()
], s.prototype, "_themeSelectOptions", 2);
o([
  l()
], s.prototype, "_themeData", 2);
o([
  l()
], s.prototype, "_loading", 2);
o([
  l()
], s.prototype, "_error", 2);
s = o([
  d("articulate-theme-picker-element")
], s);
export {
  s as default
};
//# sourceMappingURL=theme-picker.element.js.map
