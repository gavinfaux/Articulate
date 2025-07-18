import { UmbElementMixin as c } from "@umbraco-cms/backoffice/element-api";
import { html as h, css as m, property as p, state as u, customElement as f } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as v } from "@umbraco-cms/backoffice/lit-element";
import { UmbPropertyValueChangeEvent as _ } from "@umbraco-cms/backoffice/property-editor";
import { UmbTextStyles as d } from "@umbraco-cms/backoffice/style";
import { a as y, f as O } from "./error-utils-CUHXtQBu.js";
var b = Object.defineProperty, S = Object.getOwnPropertyDescriptor, a = (e, t, r, o) => {
  for (var s = o > 1 ? void 0 : o ? S(t, r) : t, i = e.length - 1, n; i >= 0; i--)
    (n = e[i]) && (s = (o ? n(t, r, s) : n(s)) || s);
  return o && s && b(t, r, s), s;
};
let l = class extends c(v) {
  constructor() {
    super(), this._themeSelectOptions = [], this._error = null;
  }
  async connectedCallback() {
    super.connectedCallback(), this._fetchThemes();
  }
  updated(e) {
    super.updated(e), e.has("value") && this._themeSelectOptions.length > 0 && (this._themeSelectOptions = this._themeSelectOptions.map((t) => ({
      ...t,
      selected: !!this.value && t.value === this.value
    })));
  }
  /**
   * Fetches the available themes from the server and populates the select options.
   * @private
   * @async
   */
  async _fetchThemes() {
    this._error = null;
    const e = await y.getArticulateEditorsThemePickerThemes();
    if (!e.response.ok || !e.data) {
      this._error = O(e.error, "Failed to load themes from the server.");
      return;
    }
    const t = e.data;
    this._themeSelectOptions = t.map((r) => ({
      name: r,
      value: r,
      selected: !!this.value && r === this.value
    }));
  }
  /**
   * Handles the change event from the select input, updates the value, and dispatches a change event.
   * @param {Event} event The input change event.
   * @private
   */
  _handleInput(e) {
    const t = e.target.value;
    this.value !== t && (this.value = t, this.dispatchEvent(new _()));
  }
  render() {
    return this._error ? h`
        <span style="color: var(--uui-color-danger);">${this._error.title}</span>
      ` : h`
      <uui-select
        .options=${this._themeSelectOptions}
        .value=${this.value}
        @change=${this._handleInput}
        label="Select a theme"
      ></uui-select>
    `;
  }
};
l.styles = [
  d,
  m`
      uui-select {
        width: 100%;
      }
    `
];
a([
  p()
], l.prototype, "value", 2);
a([
  p({ attribute: !1 })
], l.prototype, "config", 2);
a([
  u()
], l.prototype, "_themeSelectOptions", 2);
a([
  u()
], l.prototype, "_error", 2);
l = a([
  f("theme-picker-element")
], l);
export {
  l as default
};
