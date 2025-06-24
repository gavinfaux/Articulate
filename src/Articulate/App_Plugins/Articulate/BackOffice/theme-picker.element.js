import { UmbElementMixin as u } from "@umbraco-cms/backoffice/element-api";
import { UmbChangeEvent as c } from "@umbraco-cms/backoffice/event";
import { html as m, css as _, property as p, state as l, customElement as d } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as f } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as v } from "@umbraco-cms/backoffice/style";
import { A as S, h as O } from "./error-utils-BqJ7wuVX.js";
var b = Object.defineProperty, g = Object.getOwnPropertyDescriptor, i = (e, t, r, h) => {
  for (var a = h > 1 ? void 0 : h ? g(t, r) : t, n = e.length - 1, o; n >= 0; n--)
    (o = e[n]) && (a = (h ? o(t, r, a) : o(a)) || a);
  return h && a && b(t, r, a), a;
};
let s = class extends u(f) {
  constructor() {
    super(), this._themeSelectOptions = [], this._themeData = [], this._error = "", this._fetchThemes();
  }
  updated(e) {
    super.updated(e);
    const t = e.has("value"), r = e.has("_themeData");
    this._themeData.length > 0 && (t || r) && this._rebuildAndSetSelectOptions();
  }
  async _fetchThemes() {
    this._error = "";
    const e = await S.getUmbracoManagementApiV1ArticulateEditorsThemes();
    if (!e.response.ok) {
      this._error = await O(e.response, "Failed to load themes.");
      return;
    }
    const t = e.data;
    if (!t) {
      this._error = "No theme data returned from the server.";
      return;
    }
    this._themeData = t.map((r) => ({
      name: r,
      value: r
    })), this._rebuildAndSetSelectOptions();
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
    return this._error && this._error.length > 0 ? m`<span class="text-danger">${this._error}</span>` : m`
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
i([
  p()
], s.prototype, "value", 2);
i([
  p({ attribute: !1 })
], s.prototype, "config", 2);
i([
  l()
], s.prototype, "_themeSelectOptions", 2);
i([
  l()
], s.prototype, "_themeData", 2);
i([
  l()
], s.prototype, "_error", 2);
s = i([
  d("articulate-theme-picker-element")
], s);
export {
  s as default
};
//# sourceMappingURL=theme-picker.element.js.map
