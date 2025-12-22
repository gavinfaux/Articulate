import{html as t,nothing as e,css as i,property as o,state as r,query as a,customElement as s}from"@umbraco-cms/backoffice/external/lit";import{UmbLitElement as n}from"@umbraco-cms/backoffice/lit-element";import{UmbTextStyles as l}from"@umbraco-cms/backoffice/style";import{UMB_MODAL_MANAGER_CONTEXT as u}from"@umbraco-cms/backoffice/modal";import{UmbValidationContext as c}from"@umbraco-cms/backoffice/validation";import{UMB_AUTH_CONTEXT as h}from"@umbraco-cms/backoffice/auth";import{f as d,B as m,T as p}from"./error-utils-D4otH6pl.js";import{UMB_DOCUMENT_PICKER_MODAL as f}from"@umbraco-cms/backoffice/document";import{UMB_NOTIFICATION_CONTEXT as g}from"@umbraco-cms/backoffice/notification";async function b(t,e){try{const i=t.getOpenApiConfiguration(),o=i?.token;if("function"!=typeof o)throw new Error("Could not get authorization token function.");const r=await o(),a=`/umbraco/management/api/v1/document/${e}`,s=await fetch(a,{method:"GET",headers:{Accept:"application/json",Authorization:`Bearer ${r}`}});if(!s.ok)throw new Error(`API request failed with status ${s.status}`);const n=await s.json();return n.variants?.[0]??null}catch(i){return console.error(`Failed to fetch ArticulateArchive node ${e} with custom fetch`,i),null}}async function v(t){try{const e=t.getOpenApiConfiguration(),i=e?.token;if("function"!=typeof i)throw new Error("Could not get authorization token function.");const o=await i(),r=`/umbraco/management/api/v1/item/document-type/search?${new URLSearchParams({query:"Articulate",skip:"0",take:"1",isElement:"false"}).toString()}`,a=await fetch(r,{method:"GET",headers:{Accept:"application/json",Authorization:`Bearer ${o}`}});if(!a.ok)throw new Error(`API request failed with status ${a.status}`);const s=await a.json();return s.items?.[0]?.id??void 0}catch(e){return void console.error("Failed to fetch Articulate document type with custom fetch",e)}}async function _(t,e,i){try{const o=t.open(i,f,{data:{multiple:!1,pickableFilter:t=>t.documentType?.unique===e}}),r=await o.onSubmit();return r&&r.selection&&r.selection[0]?r.selection[0]:null}catch(o){return console.error(o,"Node picker failed"),null}}function y(t,e,i){t._formState="failed",t._formError=d(e,i),t.resetState()}async function $(t,e,i,o=!1){const r=await t.getContext(g);r?o?r.stay(i,{data:{message:e}}):r.peek(i,{data:{message:e}}):console.error("UMB_NOTIFICATION_CONTEXT not found. Could not display notification.",{contextHost:t,message:e})}function w(e){return t`
    <div slot="header-actions">
      <uui-button
        label="Back to Articulate dashboard options"
        look="outline"
        compact
        href=${e||"/umbraco/section/settings/dashboard/articulate"}>
        ← Back
      </uui-button>
    </div>
  `}function x(i){if(!i)return console.info("At validation event: renderErrorMessage returning nothing as errors object is null"),e;const{title:o,details:r}=i;return t`
    <div class="articulate-error-box">
      <strong>${o}</strong>
      ${r.length>0?t`
            <ul class="articulate-error-list">
              ${r.map(e=>t` <li>${e}</li> `)}
            </ul>
          `:e}
    </div>
  `}const A=i`
  uui-box {
    margin-top: var(--uui-size-space-6);
    max-width: var(--uui-size-content);
    margin-inline: auto;
  }
`,k=i`
  .container {
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
  uui-input {
    width: auto;
  }
  .form-actions {
    margin-top: var(--uui-size-space-6);
    text-align: right;
  }
`,C=i`
  .node-picker-container {
    display: flex;
    align-items: center;
    gap: var(--uui-size-space-3);
  }
`,N=i`
  .articulate-error-box {
    padding: var(--uui-size-space-4);
    margin-block: 1rem;
    border: 1px solid var(--uui-color-danger-standalone);
    color: var(--uui-color-danger);
    border-radius: var(--uui-border-radius);
  }

  .articulate-error-list {
    margin: 0;
    padding-left: 20px;
    list-style-position: inside;
  }
`,E=i`
  :host {
    display: block;
    padding: var(--uui-size-space-5);
  }
  @media (max-width: 768px) {
    :host {
      padding: var(--uui-size-space-3);
    }
  }
`;var B,S,T,M,z,P=Object.defineProperty,D=Object.getOwnPropertyDescriptor,F=t=>{throw TypeError(t)},I=(t,e,i,o)=>{for(var r,a=o>1?void 0:o?D(e,i):e,s=t.length-1;s>=0;s--)(r=t[s])&&(a=(o?r(e,i,a):r(a))||a);return o&&a&&P(e,i,a),a},R=(t,e,i)=>(((t,e,i)=>{e.has(t)||F("Cannot "+i)})(t,e,"read from private field"),i?i.call(t):e.get(t)),U=(t,e,i)=>e.has(t)?F("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i);let O=class extends n{constructor(){super(),this._formState=void 0,this._formError=null,this._articulateBlogNode=void 0,this._selectedBlogNodeName="",this._archiveDoctypeUdi=void 0,U(this,B,new c(this)),U(this,S,(t,e)=>{const i=window.URL.createObjectURL(t),o=document.createElement("a");o.style.display="none",o.href=i,o.download=e,document.body.appendChild(o),o.click(),window.URL.revokeObjectURL(i),o.remove()}),U(this,T,t=>t instanceof Blob),U(this,M,async t=>{if(t.preventDefault(),this._form){try{await R(this,B).validate()}catch(e){return void y(this,e,"Validation Failed")}if(!this._articulateBlogNode){const t=new Error("A blog node must be selected before exporting.");return t.name="Validation Error",void y(this,t,t.name)}if("waiting"!==this._formState){this._formState="waiting",this._formError=null;try{await R(this,z).call(this),this._formState="success",await $(this,"BlogML exported successfully!","positive"),this.resetState(!0)}catch(e){y(this,e,"Export Failed")}}}}),U(this,z,async()=>{const t="on"===new FormData(this._form).get("embedImages"),e={articulateBlogNode:this._articulateBlogNode,exportImagesAsBase64:t},i=await m.postBlogmlExport({body:e});if(!i.response.ok||!i.data)throw i.error||new Error("The server returned an invalid response during export.");const o=i.data;if(!R(this,T).call(this,o))throw new Error("The server did not return a file. Please check the server logs.");const r=i.response.headers.get("content-disposition");let a="blog-export.xml";if(r){const t=r.match(/filename\*="UTF-8''([^"]+)"/);if(t&&t.length>1&&t[1])a=t[1];else{const t=r.match(/filename="?([^"]+)"?/);t&&t.length>1&&t[1]&&(a=t[1])}}R(this,S).call(this,o,a)}),this._handleReset=t=>{t.preventDefault(),this.resetState(!0)},this.consumeContext(u,t=>{this._modalManagerContext=t}),this.consumeContext(h,t=>{this._authContext=t})}async connectedCallback(){if(super.connectedCallback(),this._archiveDoctypeUdi=await v(this._authContext),null===this._archiveDoctypeUdi){const t=new Error("Could not find the Articulate Archive document type. Please ensure Articulate is installed correctly.");t.name="Configuration Error",y(this,t,t.name)}}resetState(t=!1){t&&(this._form?.reset(),this._formState=void 0,this._formError=null,this._articulateBlogNode=void 0,this._selectedBlogNodeName="")}async _openNodePicker(){if(!this._archiveDoctypeUdi)return;this._formError=null;const t=await _(this._modalManagerContext,this._archiveDoctypeUdi,this);if(t){const e=await b(this._authContext,t);if(!e)return void y(this,new Error(`Could not find a node with UDI: ${t}`),"Node Not Found");this._articulateBlogNode=t,this._selectedBlogNodeName=e.name}}get _submitButtonColor(){return this._articulateBlogNode?"positive":"primary"}render(){return t`
      <uui-box headline="BlogML Exporter" headlinevariant="h2">
        ${w(this.routerPath)}
        <uui-form>
          <form
            id="blogMlExportForm"
            @submit=${R(this,M)}
            @input=${()=>{this._formError=null,this._formState=void 0}}>
            <uui-form-validation-message>
              <uui-form-layout-item>
                <div class="node-picker-container">
                  <uui-label for="articulateBlogNode" slot="label" required>Articulate blog node</uui-label>
                  <uui-input
                    id="articulateBlogNode"
                    name="articulateBlogNode"
                    placeholder="No node selected"
                    .value=${this._selectedBlogNodeName}
                    readonly
                    required
                    required-message="You must select a blog node"
                    style="flex-grow: 1;"></uui-input>
                  <uui-button
                    look="outline"
                    label=${this._articulateBlogNode?"Change":"Choose"}
                    @click=${this._openNodePicker}></uui-button>
                </div>
                <div slot="description">Choose the Articulate blog node to export from</div>
              </uui-form-layout-item>
              <uui-form-layout-item>
                <uui-label slot="label" for="embedImages">Embed images?</uui-label>
                <uui-toggle id="embedImages" name="embedImages"></uui-toggle>
                <div slot="description">
                  Check if you want to embed images as base64 data in the output file. Useful if your site isn't going
                  to be HTTP accessible to the site you will be importing on.
                </div>
              </uui-form-layout-item>
            </uui-form-validation-message>

            <div class="form-actions">
              <uui-button
                type="submit"
                look="primary"
                .color=${this._submitButtonColor}
                .state=${this._formState}
                label="Submit"></uui-button>
              <uui-button type="reset" look="secondary" label="Reset" @click=${this._handleReset}></uui-button>
            </div>
          </form>
        </uui-form>
        ${this._formError?x(this._formError):""}
      </uui-box>
    `}};B=/* @__PURE__ */new WeakMap,S=/* @__PURE__ */new WeakMap,T=/* @__PURE__ */new WeakMap,M=/* @__PURE__ */new WeakMap,z=/* @__PURE__ */new WeakMap,O.styles=[l,l,l,E,A,N,k,C],I([o({type:String})],O.prototype,"routerPath",2),I([r()],O.prototype,"_formState",2),I([r()],O.prototype,"_formError",2),I([r()],O.prototype,"_articulateBlogNode",2),I([r()],O.prototype,"_selectedBlogNodeName",2),I([a("#blogMlExportForm")],O.prototype,"_form",2),O=I([s("blogml-exporter")],O);const H=globalThis,j=H.trustedTypes,q=j?j.createPolicy("lit-html",{createHTML:t=>t}):void 0,W="$lit$",L=`lit$${Math.random().toFixed(9).slice(2)}$`,V="?"+L,X=`<${V}>`,Y=document,K=()=>Y.createComment(""),G=t=>null===t||"object"!=typeof t&&"function"!=typeof t,Z=Array.isArray,J="[ \t\n\f\r]",Q=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,tt=/-->/g,et=/>/g,it=RegExp(`>|${J}(?:([^\\s"'>=/]+)(${J}*=${J}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),ot=/'/g,rt=/"/g,at=/^(?:script|style|textarea|title)$/i,st=/* @__PURE__ */Symbol.for("lit-noChange"),nt=/* @__PURE__ */Symbol.for("lit-nothing"),lt=/* @__PURE__ */new WeakMap,ut=Y.createTreeWalker(Y,129);function ct(t,e){if(!Z(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==q?q.createHTML(e):e}class ht{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let r=0,a=0;const s=t.length-1,n=this.parts,[l,u]=((t,e)=>{const i=t.length-1,o=[];let r,a=2===e?"<svg>":3===e?"<math>":"",s=Q;for(let n=0;n<i;n++){const e=t[n];let i,l,u=-1,c=0;for(;c<e.length&&(s.lastIndex=c,l=s.exec(e),null!==l);)c=s.lastIndex,s===Q?"!--"===l[1]?s=tt:void 0!==l[1]?s=et:void 0!==l[2]?(at.test(l[2])&&(r=RegExp("</"+l[2],"g")),s=it):void 0!==l[3]&&(s=it):s===it?">"===l[0]?(s=r??Q,u=-1):void 0===l[1]?u=-2:(u=s.lastIndex-l[2].length,i=l[1],s=void 0===l[3]?it:'"'===l[3]?rt:ot):s===rt||s===ot?s=it:s===tt||s===et?s=Q:(s=it,r=void 0);const h=s===it&&t[n+1].startsWith("/>")?" ":"";a+=s===Q?e+X:u>=0?(o.push(i),e.slice(0,u)+W+e.slice(u)+L+h):e+L+(-2===u?n:h)}return[ct(t,a+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]})(t,e);if(this.el=ht.createElement(l,i),ut.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=ut.nextNode())&&n.length<s;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(W)){const e=u[a++],i=o.getAttribute(t).split(L),s=/([.?@])?(.*)/.exec(e);n.push({type:1,index:r,name:s[2],strings:i,ctor:"."===s[1]?gt:"?"===s[1]?bt:"@"===s[1]?vt:ft}),o.removeAttribute(t)}else t.startsWith(L)&&(n.push({type:6,index:r}),o.removeAttribute(t));if(at.test(o.tagName)){const t=o.textContent.split(L),e=t.length-1;if(e>0){o.textContent=j?j.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],K()),ut.nextNode(),n.push({type:2,index:++r});o.append(t[e],K())}}}else if(8===o.nodeType)if(o.data===V)n.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(L,t+1));)n.push({type:7,index:r}),t+=L.length-1}r++}}static createElement(t,e){const i=Y.createElement("template");return i.innerHTML=t,i}}function dt(t,e,i=t,o){if(e===st)return e;let r=void 0!==o?i._$Co?.[o]:i._$Cl;const a=G(e)?void 0:e._$litDirective$;return r?.constructor!==a&&(r?._$AO?.(!1),void 0===a?r=void 0:(r=new a(t),r._$AT(t,i,o)),void 0!==o?(i._$Co??=[])[o]=r:i._$Cl=r),void 0!==r&&(e=dt(t,r._$AS(t,e.values),r,o)),e}class mt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,o=(t?.creationScope??Y).importNode(e,!0);ut.currentNode=o;let r=ut.nextNode(),a=0,s=0,n=i[0];for(;void 0!==n;){if(a===n.index){let e;2===n.type?e=new pt(r,r.nextSibling,this,t):1===n.type?e=new n.ctor(r,n.name,n.strings,this,t):6===n.type&&(e=new _t(r,this,t)),this._$AV.push(e),n=i[++s]}a!==n?.index&&(r=ut.nextNode(),a++)}return ut.currentNode=Y,o}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class pt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,o){this.type=2,this._$AH=nt,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=dt(this,t,e),G(t)?t===nt||null==t||""===t?(this._$AH!==nt&&this._$AR(),this._$AH=nt):t!==this._$AH&&t!==st&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>Z(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==nt&&G(this._$AH)?this._$AA.nextSibling.data=t:this.T(Y.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,o="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=ht.createElement(ct(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new mt(o,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=lt.get(t.strings);return void 0===e&&lt.set(t.strings,e=new ht(t)),e}k(t){Z(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const r of t)o===e.length?e.push(i=new pt(this.O(K()),this.O(K()),this,this.options)):i=e[o],i._$AI(r),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class ft{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,o,r){this.type=1,this._$AH=nt,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=nt}_$AI(t,e=this,i,o){const r=this.strings;let a=!1;if(void 0===r)t=dt(this,t,e,0),a=!G(t)||t!==this._$AH&&t!==st,a&&(this._$AH=t);else{const o=t;let s,n;for(t=r[0],s=0;s<r.length-1;s++)n=dt(this,o[i+s],e,s),n===st&&(n=this._$AH[s]),a||=!G(n)||n!==this._$AH[s],n===nt?t=nt:t!==nt&&(t+=(n??"")+r[s+1]),this._$AH[s]=n}a&&!o&&this.j(t)}j(t){t===nt?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class gt extends ft{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===nt?void 0:t}}class bt extends ft{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==nt)}}class vt extends ft{constructor(t,e,i,o,r){super(t,e,i,o,r),this.type=5}_$AI(t,e=this){if((t=dt(this,t,e,0)??nt)===st)return;const i=this._$AH,o=t===nt&&i!==nt||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==nt&&(i===nt||o);o&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class _t{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){dt(this,t)}}const yt=H.litHtmlPolyfillSupport;yt?.(ht,pt),(H.litHtmlVersions??=[]).push("3.3.1");let $t=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};const wt={},xt=(At=class extends $t{constructor(){super(...arguments),this.key=nt}render(t,e){return this.key=t,e}update(t,[e,i]){return e!==this.key&&(((t,e=wt)=>{t._$AH=e})(t),this.key=e),i}},(...t)=>({_$litDirective$:At,values:t}));var At,kt,Ct,Nt,Et,Bt,St,Tt,Mt,zt,Pt=Object.defineProperty,Dt=Object.getOwnPropertyDescriptor,Ft=t=>{throw TypeError(t)},It=(t,e,i,o)=>{for(var r,a=o>1?void 0:o?Dt(e,i):e,s=t.length-1;s>=0;s--)(r=t[s])&&(a=(o?r(e,i,a):r(a))||a);return o&&a&&Pt(e,i,a),a},Rt=(t,e,i)=>(((t,e,i)=>{e.has(t)||Ft("Cannot "+i)})(t,e,"read from private field"),i?i.call(t):e.get(t)),Ut=(t,e,i)=>e.has(t)?Ft("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i);let Ot=class extends n{constructor(){super(),this._formState=void 0,this._formError=null,this._articulateBlogNode=void 0,this._selectedBlogNodeName="",this._postCount=void 0,this._formRenderKey=0,this._archiveDoctypeUdi=void 0,Ut(this,kt,new c(this)),Ut(this,Ct,(t,e)=>{const i=window.URL.createObjectURL(t),o=document.createElement("a");o.style.display="none",o.href=i,o.download=e,document.body.appendChild(o),o.click(),window.URL.revokeObjectURL(i),o.remove()}),Ut(this,Nt,t=>t instanceof Blob),Ut(this,Et,t=>"object"==typeof t&&null!==t&&"temporaryFileName"in t&&"string"==typeof t.temporaryFileName&&"postCount"in t&&"number"==typeof t.postCount),Ut(this,Bt,t=>"object"==typeof t&&null!==t&&"postCount"in t&&"authorCount"in t&&"commentCount"in t&&"completed"in t),Ut(this,St,async t=>{if(t.preventDefault(),!this._form)return;try{await Rt(this,kt).validate()}catch(r){return void y(this,r,"Validation Failed")}const e=new FormData(this._form),i=e.get("importFile"),o=[{isValid:!!this._articulateBlogNode,message:"A blog node must be selected before importing."},{isValid:i&&i.size>0,message:"A BlogML file must be selected for import."}].find(t=>!t.isValid);if(o){const t=new Error(o.message);return t.name="Validation Error",void y(this,t,t.name)}if("waiting"!==this._formState){this._formState="waiting",this._formError=null,this._postCount=void 0;try{const t=await Rt(this,Tt).call(this,i);this._postCount=t.postCount,this.requestUpdate("_postCount");const o=await Rt(this,Mt).call(this,e,t.temporaryFileName);"on"===e.get("exportDisqusXml")&&o.commentCount>0&&await Rt(this,zt).call(this),this._formState="success";const r="on"===e.get("exportDisqusXml")&&o.commentCount>0?`${o.commentCount} comments exported.`:"on"===e.get("exportDisqusXml")?"No comments found to export.":"";await $(this,`BlogML imported successfully! ${o.authorCount} authors, ${this._postCount} posts imported. ${r}`,"positive",!0),this.resetState(!0)}catch(r){y(this,r,"Import Failed")}}}),Ut(this,Tt,async t=>{const e=await m.postBlogmlImportFile({body:{importFile:t}});if(!e.response.ok||!Rt(this,Et).call(this,e.data))throw e.error||new Error("The server returned an invalid response when uploading the file.");if(!e.data.temporaryFileName||e.data.postCount<=0)throw new Error("The blog import file appears to be empty or invalid.");return e.data}),Ut(this,Mt,async(t,e)=>{const i={articulateBlogNode:this._articulateBlogNode,overwrite:"on"===t.get("overwrite"),publish:"on"===t.get("publish"),regexMatch:t.get("regexMatch")||"",regexReplace:t.get("regexReplace")||"",tempFile:e,exportDisqusXml:"on"===t.get("exportDisqusXml"),importFirstImage:"on"===t.get("importFirstImage")},o=await m.postBlogmlImport({body:i});if(!o.response.ok||!Rt(this,Bt).call(this,o.data))throw o.error||new Error("The server returned an invalid response when finalizing the import.");if(!o.data.completed)throw new Error("The server indicated that the import failed to complete.");return o.data}),Ut(this,zt,async()=>{const t=await m.getBlogmlExportDisqus();if(!t.response.ok||!t.data)throw t.error||new Error("Failed to export Disqus comments.");const e=t.data;if(!Rt(this,Nt).call(this,e))throw new Error("Invalid file received for Disqus export.");const i=t.response.headers.get("content-disposition");let o="disqus-comments.xml";if(i){const t=i.match(/filename\*="UTF-8''([^"]+)"/);if(t&&t.length>1&&t[1])o=t[1];else{const t=i.match(/filename="?([^"]+)"?/);t&&t.length>1&&t[1]&&(o=t[1])}}Rt(this,Ct).call(this,e,o)}),this._handleReset=t=>{t.preventDefault(),this.resetState(!0)},this.consumeContext(u,t=>{this._modalManagerContext=t}),this.consumeContext(h,t=>{this._authContext=t})}async connectedCallback(){if(super.connectedCallback(),this._archiveDoctypeUdi=await v(this._authContext),null===this._archiveDoctypeUdi){const t=new Error("Could not find the Articulate Archive document type. Please ensure Articulate is installed correctly.");t.name="Configuration Error",y(this,t,t.name)}}resetState(t=!1){this._postCount=void 0,t&&(this._formState=void 0,this._formError=null,this._articulateBlogNode=void 0,this._selectedBlogNodeName="",this._formRenderKey++)}async _openNodePicker(){if(!this._archiveDoctypeUdi)return;this._formError=null;const t=await _(this._modalManagerContext,this._archiveDoctypeUdi,this);if(t){const e=await b(this._authContext,t);if(!e)return void y(this,new Error(`Could not find a node with UDI: ${t}`),"Node Not Found");this._articulateBlogNode=t,this._selectedBlogNodeName=e.name}}render(){return t`
      <uui-box headline="BlogML Importer" headlinevariant="h2">
        ${w(this.routerPath)}
        <uui-form>
          ${xt(this._formRenderKey,t`
              <form
                id="blogMlImportForm"
                @submit=${Rt(this,St)}
                @input=${()=>{this._formError=null,this._formState=void 0}}>
                <uui-form-validation-message>
                  <uui-form-layout-item>
                    <div class="node-picker-container">
                      <uui-label for="articulateBlogNode" slot="label" required>Articulate blog node</uui-label>
                      <uui-input
                        id="articulateBlogNode"
                        name="articulateBlogNode"
                        placeholder="No node selected"
                        .value=${this._selectedBlogNodeName}
                        readonly
                        required
                        required-message="You must select a blog node"
                        style="flex-grow: 1;"></uui-input>
                      <uui-button
                        look="outline"
                        label=${this._articulateBlogNode?"Change":"Choose"}
                        @click=${this._openNodePicker}></uui-button>
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
                      tabindex="0"></uui-input-file>
                    <div slot="description">The XML file to upload for import</div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="overwrite">Overwrite imported posts?</uui-label>
                    <uui-toggle id="overwrite" name="overwrite"></uui-toggle>
                    <div slot="description">Check if you want to overwrite posts already imported</div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="publish">Publish all posts?</uui-label>
                    <uui-toggle id="publish" name="publish"></uui-toggle>
                    <div slot="description">Check if you want all imported posts to be published</div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label for="regexMatch" slot="label">Regex match expression</uui-label>
                    <uui-input
                      id="regexMatch"
                      style="--auto-width-text-margin-right: 20px"
                      name="regexMatch"
                      auto-width
                      placeholder="Example to match: (@example.old)"></uui-input>
                    <div slot="description">
                      Regex statement used to match content in the blog post to be replaced by the match statement. See
                      the Articulate Wiki Importing page for more information.
                    </div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label for="regexReplace" slot="label">Regex replacement statement</uui-label>
                    <uui-input
                      id="regexReplace"
                      style="--auto-width-text-margin-right: 20px"
                      name="regexReplace"
                      auto-width
                      placeholder="Example replacement: @example.new"></uui-input>
                    <div slot="description">Replacement statement used with the above match statement</div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="exportDisqusXml">Export Disqus Xml</uui-label>
                    <uui-toggle id="exportDisqusXml" name="exportDisqusXml"></uui-toggle>
                    <div slot="description">
                      If you would like Articulate to output an XML file that you can use to import the comments found
                      in this file in to Disqus
                    </div>
                  </uui-form-layout-item>
                  <uui-form-layout-item>
                    <uui-label slot="label" for="importFirstImage">Import First Image from Post Attachments</uui-label>
                    <uui-toggle id="importFirstImage" name="importFirstImage"></uui-toggle>
                    <div slot="description">
                      If you would like Articulate to try and import the first image url in the post attachments
                    </div>
                  </uui-form-layout-item>
                </uui-form-validation-message>
                <div class="form-actions">
                  ${void 0!==this._postCount&&this._postCount>0?t`
                        <uui-tag look="secondary" color="positive" style="margin-right: 1em;">
                          ${this._postCount} posts in uploaded file.
                        </uui-tag>
                      `:""}
                  <uui-button type="submit" look="primary" .state=${this._formState} color="primary" label="Submit">
                    Submit
                  </uui-button>
                  <uui-button type="button" look="secondary" @click=${this._handleReset} label="Reset">
                    Reset
                  </uui-button>
                </div>
              </form>
            `)}
        </uui-form>

        ${this._formError?x(this._formError):""}
      </uui-box>
    `}};kt=/* @__PURE__ */new WeakMap,Ct=/* @__PURE__ */new WeakMap,Nt=/* @__PURE__ */new WeakMap,Et=/* @__PURE__ */new WeakMap,Bt=/* @__PURE__ */new WeakMap,St=/* @__PURE__ */new WeakMap,Tt=/* @__PURE__ */new WeakMap,Mt=/* @__PURE__ */new WeakMap,zt=/* @__PURE__ */new WeakMap,Ot.styles=[l,l,E,A,N,k,C],It([o({type:String})],Ot.prototype,"routerPath",2),It([r()],Ot.prototype,"_formState",2),It([r()],Ot.prototype,"_formError",2),It([r()],Ot.prototype,"_articulateBlogNode",2),It([r()],Ot.prototype,"_selectedBlogNodeName",2),It([r()],Ot.prototype,"_postCount",2),It([r()],Ot.prototype,"_formRenderKey",2),It([a("#blogMlImportForm")],Ot.prototype,"_form",2),Ot=It([s("blogml-importer")],Ot);var Ht,jt,qt,Wt,Lt,Vt,Xt,Yt,Kt,Gt,Zt,Jt,Qt=Object.defineProperty,te=Object.getOwnPropertyDescriptor,ee=t=>{throw TypeError(t)},ie=(t,e,i,o)=>{for(var r,a=o>1?void 0:o?te(e,i):e,s=t.length-1;s>=0;s--)(r=t[s])&&(a=(o?r(e,i,a):r(a))||a);return o&&a&&Qt(e,i,a),a},oe=(t,e,i)=>e.has(t)||ee("Cannot "+i),re=(t,e,i)=>(oe(t,e,"read from private field"),i?i.call(t):e.get(t)),ae=(t,e,i)=>e.has(t)?ee("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i),se=(t,e,i)=>(oe(t,e,"access private method"),i);let ne=class extends n{constructor(){super(...arguments),ae(this,jt),this._formState=void 0,this._formError=null,this._themes=[],this._selectedTheme=void 0,this._themeName=void 0,ae(this,Ht,new c(this)),ae(this,Yt,t=>{this._formError=null,this._formState=void 0,this._themeName=t.target.value}),ae(this,Gt,t=>{t.preventDefault(),this.resetState(!0)})}async connectedCallback(){super.connectedCallback(),await se(this,jt,qt).call(this)}resetState(t=!1){t&&(this._formState=void 0,this._formError=null,this._selectedTheme=void 0,this._themeName=void 0)}get _submitButtonColor(){return this._selectedTheme&&this._themeName?"positive":"primary"}render(){return t`
      <uui-box headline="Theme Options">
        ${w(this.routerPath)}
        <div class="container">
          <p>
            You can duplicate any of Articulate's built-in themes to use as a template for your own theme. The
            duplicated theme will be copied to the ~/Views/Articulate folder where you can edit it. You can select this
            theme from the themes drop down on your Articulate root node to use it.
          </p>
        </div>
        <div class="container">${se(this,jt,Zt).call(this)} ${se(this,jt,Jt).call(this)}</div>
        ${this._formError?x(this._formError):""}
      </uui-box>
    `}};Ht=/* @__PURE__ */new WeakMap,jt=/* @__PURE__ */new WeakSet,qt=async function(){try{const t=await p.getThemeDefault();if(!t.response.ok||!t.data)throw t.error||new Error("The list of themes could not be retrieved from the server.");this._themes=t.data?.map(t=>t)??[]}catch(t){y(this,t,"Could not load themes")}},Wt=function(t){this.resetState(!0),this._selectedTheme=t,this._themeName=`Custom${t}Theme`},Lt=function(t,e){t.stopPropagation(),se(this,jt,Wt).call(this,e)},Vt=function(t){const e=t.target.getAttribute("data-theme");e&&se(this,jt,Wt).call(this,e)},Xt=function(t){const e=t.target.getAttribute("data-theme");e&&e===this._selectedTheme&&this.resetState(!0)},Yt=/* @__PURE__ */new WeakMap,Kt=async function(t){if(t.preventDefault(),this._form){try{await re(this,Ht).validate()}catch(e){return void y(this,e,"Validation Failed")}if(!this._selectedTheme||!this._themeName){const t=new Error("Please select a theme to copy and provide the theme name.");return t.name="Validation Error",void y(this,t,t.name)}if("waiting"!==this._formState){this._formState="waiting",this._formError=null;try{const t=await p.postThemeCopy({body:{themeName:this._selectedTheme,newThemeName:this._themeName}});if(!t.response.ok)throw t.error||new Error("Failed to copy theme.");this._formState="success",await $(this,"Theme copied successfully!","positive"),this.resetState(!0)}catch(e){y(this,e,"Copy Failed")}}}},Gt=/* @__PURE__ */new WeakMap,Zt=function(){return t`
      <div class="theme-grid">
        ${(this._themes??[]).map(e=>t`
            <uui-card-media
              class="theme-card"
              .name=${e}
              ?selectable=${"waiting"!==this._formState}
              ?selected=${this._selectedTheme===e}
              selectOnly
              @selected=${se(this,jt,Vt)}
              @deselected=${se(this,jt,Xt)}
              data-theme=${e}
              role="radio"
              aria-checked=${this._selectedTheme===e}
              aria-label=${`Select theme ${e}`}
              tabindex="0">
              <img
                class="theme-preview-img"
                src="/App_Plugins/Articulate/BackOffice/assets/theme-${e.toLowerCase()}.png"
                alt="${e} theme preview"
                loading="lazy"
                @error=${t=>{const i=t.target;i.style.display="none";const o=i.parentElement;if(o&&!o.querySelector(":scope > .theme-fallback-initial")){const t=document.createElement("span");t.className="theme-fallback-initial",t.textContent=e.charAt(0).toUpperCase(),o.appendChild(t)}}} />
              <div slot="actions">
                <uui-button
                  look="primary"
                  label="Select Theme ${e}"
                  @click=${t=>se(this,jt,Lt).call(this,t,e)}>
                  Select
                </uui-button>
              </div>
            </uui-card-media>
          `)}
      </div>
    `},Jt=function(){return this._selectedTheme?t`
      <div class="duplicate-form">
        <h3>Copy '${this._selectedTheme}' Theme</h3>
        <p>Create a copy of this theme that you can customize.</p>
        <uui-form>
          <form
            @submit=${se(this,jt,Kt)}
            @input=${()=>{this._formError=null,this._formState=void 0}}>
            <uui-form-validation-message>
              <uui-form-layout-item>
                <uui-label for="themeName" slot="label" required>Theme name</uui-label>
                <uui-input
                  id="themeName"
                  name="themeName"
                  .value=${this._themeName??""}
                  @input=${re(this,Yt)}
                  required
                  required-message="You must provide a name for the theme."
                  label="Theme name"></uui-input>
              </uui-form-layout-item>
            </uui-form-validation-message>
            <div class="form-actions">
              <uui-button
                id="duplicateButton"
                type="submit"
                look="primary"
                .color=${this._submitButtonColor}
                .state=${this._formState}>
                Create Theme
              </uui-button>
              <uui-button id="cancelButton" type="reset" look="secondary" @click=${re(this,Gt)}>
                Cancel
              </uui-button>
            </div>
          </form>
        </uui-form>
      </div>
    `:t``},ne.styles=[l,E,A,N,k,i`
      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--uui-size-space-6);
        margin-bottom: var(--uui-size-space-6);
      }
      .theme-card {
        cursor: pointer;
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 200px;
        aspect-ratio: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .theme-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
        transition: all 0.2s ease;
      }
      .theme-preview-img {
        border-bottom: 1px solid var(--uui-color-border);
        object-fit: none;
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        box-sizing: border-box;
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
        margin-top: var(--uui-size-space-6);
        border-top: 1px solid var(--uui-color-divider);
        padding: var(--uui-size-space-3);
      }

      .duplicate-form h3 {
        margin-top: 0;
      }
    `],ie([o({type:String})],ne.prototype,"routerPath",2),ie([r()],ne.prototype,"_formState",2),ie([r()],ne.prototype,"_formError",2),ie([r()],ne.prototype,"_themes",2),ie([r()],ne.prototype,"_selectedTheme",2),ie([r()],ne.prototype,"_themeName",2),ie([a("form")],ne.prototype,"_form",2),ne=ie([s("theme-options")],ne);var le=Object.defineProperty,ue=Object.getOwnPropertyDescriptor,ce=(t,e,i,o)=>{for(var r,a=o>1?void 0:o?ue(e,i):e,s=t.length-1;s>=0;s--)(r=t[s])&&(a=(o?r(e,i,a):r(a))||a);return o&&a&&le(e,i,a),a};const he=[{path:"blogml/import",name:"BlogML Import",icon:"icon-download-alt",description:"Import content from any BlogML compatible platform"},{path:"blogml/export",name:"BlogML Export",icon:"icon-out",description:"Export content to any BlogML compatible platform"},{path:"theme/options",name:"Theme Options",icon:"icon-color-bucket",description:"Create or customize Articulate themes"}];let de=class extends n{constructor(){super(...arguments),this.routerPath=""}render(){return t`
      <uui-box headline="Articulate Options" headlinevariant="h2">
        <div slot="header-actions">
          <uui-button look="default" compact href="https://github.com/Shazwazza/Articulate/wiki" label="Wiki">
            <uui-icon name="icon-help-alt" label="Wiki"></uui-icon>
          </uui-button>
        </div>
        <div class="tools-grid">
          ${he.map(e=>{const i=this.routerPath?.replace(/\/$/,""),o=`${i}/${e.path}`;return t`
              <uui-card-block-type class="tool-card" name="${e.name}" description="${e.description}" href=${o}>
                <uui-icon name="${e.icon}"></uui-icon>
              </uui-card-block-type>
            `})}
        </div>
      </uui-box>
    `}};de.styles=[l,E,A,i`
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--uui-size-space-4);
      }

      [slot='header-actions'] {
        display: flex;
        gap: var(--uui-size-space-2);
      }

      [slot='header-actions'] > uui-button {
        font-size: var(--uui-size-6, 18px);
      }

      .tool-card {
        border: 1px solid var(--uui-color-border-emphasis);
        width: 100%;
        height: 200px;
        aspect-ratio: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        align-items: center;
        justify-content: space-between;
        padding: var(--uui-size-space-2);
      }
      .tool-card uui-icon {
        font-size: var(--uui-size-12, 36px);
        margin-top: var(--uui-size-space-6);
      }
      .tool-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
        transition: all 0.2s ease;
      }
    `],ce([o({type:String})],de.prototype,"routerPath",2),de=ce([s("dashboard-options")],de);var me=Object.defineProperty,pe=Object.getOwnPropertyDescriptor,fe=(t,e,i,o)=>{for(var r,a=o>1?void 0:o?pe(e,i):e,s=t.length-1;s>=0;s--)(r=t[s])&&(a=(o?r(e,i,a):r(a))||a);return o&&a&&me(e,i,a),a};let ge=class extends n{constructor(){super();const t=t=>e=>{this._routerBasePath&&e instanceof t&&(e.routerPath=this._routerBasePath)};this._routes=[{path:"blogml/import",component:Ot,setup:t(Ot)},{path:"blogml/export",component:O,setup:t(O)},{path:"theme/options",component:ne,setup:t(ne)},{path:"",component:de,setup:t(de)},{path:"**",component:async()=>(await import("@umbraco-cms/backoffice/router")).UmbRouteNotFoundElement}]}render(){return t`
      <umb-body-layout>
        <div slot="header" class="header-container">
          <div class="articulate-header">
            <h1 class="header-title">Articulate Management</h1>
            <div class="header-logo">ã</div>
          </div>
        </div>
        <div class="dashboard-container">
          <umb-router-slot
            .routes=${this._routes}
            @init=${t=>{this._routerBasePath=t.target.absoluteRouterPath}}></umb-router-slot>
        </div>
        <footer slot="footer">
          <p slot="footer-info" class="articulate-footer-info">Articulate | Version: ${"6.0.0-gec99a33fec"}</p>
        </footer>
      </umb-body-layout>
    `}};ge.styles=[l,E,i`
      .dashboard-container {
        max-width: var(--uui-size-content-large);
        margin: 0 auto;
        padding: 0 var(--uui-size-space-3);
      }

      .header-container {
        width: 100%;
        padding: 0 var(--uui-size-space-3);
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
      .articulate-footer-info {
        text-align: right;
        font-size: 0.8em;
        color: var(--uui-color-border-standalone);
      }

      @media (max-width: 768px) {
        .articulate-header {
          padding: 1rem 0.7rem;
        }
      }
    `],fe([r()],ge.prototype,"_routerBasePath",2),fe([r()],ge.prototype,"_routes",2),ge=fe([s("articulate-dashboard")],ge);export{ge as default};
//# sourceMappingURL=dashboard.element-Du7pJhex.js.map
