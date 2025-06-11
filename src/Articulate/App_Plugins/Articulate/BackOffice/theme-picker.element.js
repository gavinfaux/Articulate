import { UmbElementMixin as p } from "@umbraco-cms/backoffice/element-api";
import { UmbChangeEvent as c } from "@umbraco-cms/backoffice/event";
import { html as u, css as _, property as m, state as l, customElement as d } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as f } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as v } from "@umbraco-cms/backoffice/style";
import { A as g, e as b, s as w } from "./notification-utils-AoMs4ers.js";
var S = Object.defineProperty, O = Object.getOwnPropertyDescriptor, o = (e, t, r, i) => {
  for (var s = i > 1 ? void 0 : i ? O(t, r) : t, n = e.length - 1, h; n >= 0; n--)
    (h = e[n]) && (s = (i ? h(t, r, s) : h(s)) || s);
  return i && s && S(t, r, s), s;
};
let a = class extends p(f) {
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
      const e = await g.getUmbracoManagementApiV1ArticulateEditorsThemes();
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
      const t = e.data;
      if (!t)
        throw new Error("No theme data returned from the server.");
      this._themeData = t.map((r) => ({
        name: r,
        value: r
      })), this._rebuildAndSetSelectOptions();
    } catch (e) {
      const t = b(e, "Failed to load themes");
      this._error = t, await w(this, t, "danger");
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
    this.value !== t && (this.value = t, this.dispatchEvent(new c()));
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
a.styles = [
  v,
  _`
      uui-select {
        width: 100%;
      }
    `
];
o([
  m()
], a.prototype, "value", 2);
o([
  m({ attribute: !1 })
], a.prototype, "config", 2);
o([
  l()
], a.prototype, "_themeSelectOptions", 2);
o([
  l()
], a.prototype, "_themeData", 2);
o([
  l()
], a.prototype, "_loading", 2);
o([
  l()
], a.prototype, "_error", 2);
a = o([
  d("articulate-theme-picker-element")
], a);
export {
  a as default
};
//# sourceMappingURL=theme-picker.element.js.map
