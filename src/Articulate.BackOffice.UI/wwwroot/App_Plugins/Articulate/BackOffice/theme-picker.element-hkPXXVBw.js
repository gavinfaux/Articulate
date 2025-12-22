import{UmbElementMixin as e}from"@umbraco-cms/backoffice/element-api";import{html as t,css as r,property as o,state as s,customElement as a}from"@umbraco-cms/backoffice/external/lit";import{UmbLitElement as i}from"@umbraco-cms/backoffice/lit-element";import{UmbPropertyValueChangeEvent as c}from"@umbraco-cms/backoffice/property-editor";import{UmbTextStyles as l}from"@umbraco-cms/backoffice/style";import{a as h,f as n}from"./error-utils-D4otH6pl.js";var m=Object.defineProperty,p=Object.getOwnPropertyDescriptor,u=(e,t,r,o)=>{for(var s,a=o>1?void 0:o?p(t,r):t,i=e.length-1;i>=0;i--)(s=e[i])&&(a=(o?s(t,r,a):s(a))||a);return o&&a&&m(t,r,a),a};let d=class extends(e(i)){constructor(){super(),this._themeSelectOptions=[],this._error=null}async connectedCallback(){super.connectedCallback(),this._fetchThemes()}updated(e){super.updated(e),e.has("value")&&this._themeSelectOptions.length>0&&(this._themeSelectOptions=this._themeSelectOptions.map(e=>({...e,selected:!!this.value&&e.value===this.value})))}async _fetchThemes(){this._error=null;const e=await h.getEditorsThemePickerThemes();if(!e.response.ok||!e.data)return void(this._error=n(e.error,"Failed to load themes from the server."));const t=e.data;this._themeSelectOptions=t.map(e=>({name:e,value:e,selected:!!this.value&&e===this.value}))}_handleInput(e){const t=e.target.value;this.value!==t&&(this.value=t,this.dispatchEvent(new c))}render(){return this._error?t` <span style="color: var(--uui-color-danger);">${this._error.title}</span> `:t`
      <uui-select
        .options=${this._themeSelectOptions}
        .value=${this.value}
        @change=${this._handleInput}
        label="Select a theme"></uui-select>
    `}};d.styles=[l,r`
      uui-select {
        width: 100%;
      }
    `],u([o()],d.prototype,"value",2),u([o({attribute:!1})],d.prototype,"config",2),u([s()],d.prototype,"_themeSelectOptions",2),u([s()],d.prototype,"_error",2),d=u([a("theme-picker-element")],d);export{d as default};
//# sourceMappingURL=theme-picker.element-hkPXXVBw.js.map
