import { UmbElementMixin as u } from "@umbraco-cms/backoffice/element-api";
import { html as m, css as c, property as p, state as h, customElement as _ } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as d } from "@umbraco-cms/backoffice/lit-element";
import { UmbPropertyValueChangeEvent as f } from "@umbraco-cms/backoffice/property-editor";
import { UmbTextStyles as v } from "@umbraco-cms/backoffice/style";
import { A as S, f as O } from "./error-utils-CM2ch-oG.js";
var b = Object.defineProperty, y = Object.getOwnPropertyDescriptor, o = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? y(t, r) : t, l = e.length - 1, n; l >= 0; l--)
    (n = e[l]) && (a = (i ? n(t, r, a) : n(a)) || a);
  return i && a && b(t, r, a), a;
};
let s = class extends u(d) {
  constructor() {
    super(), this._themeSelectOptions = [], this._themeData = [], this._error = [];
  }
  async connectedCallback() {
    super.connectedCallback(), this._fetchThemes();
  }
  updated(e) {
    super.updated(e);
    const t = e.has("value"), r = e.has("_themeData");
    this._themeData.length > 0 && (t || r) && this._rebuildAndSetSelectOptions();
  }
  async _fetchThemes() {
    this._error = [];
    const e = await S.getArticulateEditorsThemesV1();
    if (!e.response.ok) {
      this._error = O(e.error, "Failed to load themes.");
      return;
    }
    const t = e.data;
    if (!t) {
      this._error = ["No theme data returned from the server."];
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
    this.value !== t && (this.value = t, this.dispatchEvent(new f()));
  }
  render() {
    return this._error && this._error.length > 0 ? m`<span style="color: var(--uui-color-danger);">${this._error[0]}</span>` : m`
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
  c`
      uui-select {
        width: 100%;
      }
    `
];
o([
  p()
], s.prototype, "value", 2);
o([
  p({ attribute: !1 })
], s.prototype, "config", 2);
o([
  h()
], s.prototype, "_themeSelectOptions", 2);
o([
  h()
], s.prototype, "_themeData", 2);
o([
  h()
], s.prototype, "_error", 2);
s = o([
  _("theme-picker-element")
], s);
export {
  s as default
};
//# sourceMappingURL=theme-picker.element-LQAJK5gC.js.map
