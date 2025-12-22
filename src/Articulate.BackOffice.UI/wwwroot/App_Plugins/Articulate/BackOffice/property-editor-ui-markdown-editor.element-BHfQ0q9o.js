import{UmbChangeEvent as t}from"@umbraco-cms/backoffice/event";import{html as e,nothing as i,when as o,unsafeHTML as n,css as r,property as a,query as u,state as s,customElement as l}from"@umbraco-cms/backoffice/external/lit";import{UmbLitElement as d}from"@umbraco-cms/backoffice/lit-element";import{createExtensionApi as c}from"@umbraco-cms/backoffice/extension-api";import{marked as m}from"@umbraco-cms/backoffice/external/marked";import{monaco as h}from"@umbraco-cms/backoffice/external/monaco-editor";import{umbExtensionsRegistry as b}from"@umbraco-cms/backoffice/extension-registry";import{UmbTextStyles as p}from"@umbraco-cms/backoffice/style";import{UMB_MODAL_MANAGER_CONTEXT as g}from"@umbraco-cms/backoffice/modal";import{UmbMediaUrlRepository as f,UMB_MEDIA_PICKER_MODAL as y}from"@umbraco-cms/backoffice/media";import{UmbCodeEditorLoadedEvent as C}from"@umbraco-cms/backoffice/code-editor";import{UmbFormControlMixin as k}from"@umbraco-cms/backoffice/validation";import{sanitizeHTML as v}from"@umbraco-cms/backoffice/utils";var L,E,A,x,N,w,_,S,K,$,M,z,B=Object.defineProperty,I=Object.getOwnPropertyDescriptor,P=t=>{throw TypeError(t)},H=(t,e,i,o)=>{for(var n,r=o>1?void 0:o?I(e,i):e,a=t.length-1;a>=0;a--)(n=t[a])&&(r=(o?n(e,i,r):n(r))||r);return o&&r&&B(e,i,r),r},O=(t,e,i)=>e.has(t)||P("Cannot "+i),q=(t,e,i)=>(O(t,e,"read from private field"),i?i.call(t):e.get(t)),W=(t,e,i)=>e.has(t)?P("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i),R=(t,e,i,o)=>(O(t,e,"write to private field"),e.set(t,i),i),D=(t,e,i)=>(O(t,e,"access private method"),i);let T=class extends(k(d)){constructor(){super(...arguments),W(this,x),this.preview=!1,W(this,L,!1),W(this,E),this._actionExtensions=[],W(this,A,new f(this))}getFormElement(){return this._codeEditor}get readonly(){return q(this,L)}set readonly(t){R(this,L,t),q(this,E)?.monacoEditor?.updateOptions({readOnly:q(this,L)})}_focusEditor(){q(this,E)?.monacoEditor?.focus()}_insertLine(){const t=q(this,E)?.getSelections()[0];if(!t)return;const e=q(this,E)?.monacoModel?.getLineMaxColumn(t.endLineNumber)??1;1===e?q(this,E)?.insertAtPosition("---\n",{lineNumber:t.endLineNumber,column:1}):q(this,E)?.insertAtPosition("\n\n---\n",{lineNumber:t.endLineNumber,column:e}),this._focusEditor()}_insertBetweenSelection(t,e,i){this._focusEditor();const o=q(this,E)?.getSelections()[0];if(!o)return;const n=q(this,E)?.getValueInRange({startLineNumber:o.startLineNumber,endLineNumber:o.endLineNumber,startColumn:o.startColumn-t.length,endColumn:o.endColumn+e.length});n?.startsWith(t)&&n.endsWith(e)&&n.length>t.length+e.length?(q(this,E)?.select({...o,startColumn:o.startColumn+t.length}),q(this,E)?.monacoEditor?.executeEdits("",[{range:{startColumn:o.startColumn-t.length,startLineNumber:o.startLineNumber,endColumn:o.startColumn,endLineNumber:o.startLineNumber},text:""},{range:{startColumn:o.endColumn+t.length,startLineNumber:o.startLineNumber,endColumn:o.endColumn,endLineNumber:o.startLineNumber},text:""}])):(q(this,E)?.insertAtPosition(t,{lineNumber:o.startLineNumber,column:o.startColumn}),q(this,E)?.insertAtPosition(e,{lineNumber:o.endLineNumber,column:o.endColumn+t.length}),q(this,E)?.select({startLineNumber:o.startLineNumber,endLineNumber:o.endLineNumber,startColumn:o.startColumn+t.length,endColumn:o.endColumn+t.length})),o.startColumn===o.endColumn&&o.startLineNumber===o.endLineNumber&&(i&&q(this,E)?.insertAtPosition(i,{lineNumber:o.startLineNumber,column:o.startColumn+t.length}),q(this,E)?.select({startLineNumber:o.startLineNumber,endLineNumber:o.endLineNumber,startColumn:o.startColumn+t.length,endColumn:o.startColumn+t.length+(i?.length??0)}))}_insertAtCurrentLine(t){this._focusEditor();const e=q(this,E)?.getSelections()[0];if(!e)return;const i=q(this,E)?.getValueInRange({...e,startLineNumber:e.startLineNumber-1}),o=q(this,E)?.getValueInRange({...e,startColumn:1});if(o?.startsWith(t)||o?.match(/^[1-9]\d*\.\s.*/))q(this,E)?.monacoEditor?.executeEdits("",[{range:{startColumn:1,startLineNumber:e.startLineNumber,endColumn:1+t.length,endLineNumber:e.startLineNumber},text:""}]);else if(t.match(/^[1-9]\d*\.\s.*/)&&i?.match(/^[1-9]\d*\.\s.*/)){const t=parseInt(i,10);q(this,E)?.insertAtPosition(`${t+1}. `,{lineNumber:e.startLineNumber,column:1})}else q(this,E)?.insertAtPosition(t,{lineNumber:e.startLineNumber,column:1})}_insertQuote(){const t=q(this,E)?.getSelections()[0];if(!t)return;let e=t.startLineNumber;for(;e<=t.endLineNumber;e++){const t=q(this,E)?.getValueInRange({startLineNumber:e,endLineNumber:e,startColumn:1,endColumn:3});t?.startsWith("> ")||q(this,E)?.insertAtPosition("> ",{lineNumber:e,column:1})}this._focusEditor()}render(){return e`
            ${D(this,x,M).call(this)}

            <umb-code-editor
                language="markdown"
                .code=${this.value}
                disable-line-numbers
                disable-minimap
                disable-folding
                @input=${D(this,x,$)}
                @keypress=${D(this,x,K)}
                @loaded=${D(this,x,N)}>
            </umb-code-editor>

            ${D(this,x,z).call(this)}
        `}};L=/* @__PURE__ */new WeakMap,E=/* @__PURE__ */new WeakMap,A=/* @__PURE__ */new WeakMap,x=/* @__PURE__ */new WeakSet,N=function(t){if(t.type===C.TYPE)try{R(this,E,this._codeEditor?.editor),q(this,E)?.monacoEditor?.updateOptions({readOnly:q(this,L)}),this.observe(b.byType("articulateMonacoMarkdownEditorAction"),t=>{t.forEach(async t=>{const e=await c(this,t,[this]);e&&(e.manifest=t);const i={id:t.alias??e.getUnique(),label:this.localize.string(t.meta?.label??e.getLabel()),icon:t.meta?.icon,keybindings:e.getKeybindings(),run:async()=>await e.execute({editor:q(this,E),overlaySize:this.overlaySize})};q(this,E)?.monacoEditor?.addAction(i),this._actionExtensions.push(i),this.requestUpdate("_actionExtensions")})}),D(this,x,w).call(this)}catch(e){console.error(e)}},w=function(){q(this,E)?.monacoEditor?.addAction({label:"Add Heading H2",id:"h2",keybindings:[h.KeyMod.CtrlCmd|h.KeyMod.Shift|h.KeyCode.Digit2],run:()=>this._insertAtCurrentLine("## ")}),q(this,E)?.monacoEditor?.addAction({label:"Add Heading H3",id:"h3",keybindings:[h.KeyMod.CtrlCmd|h.KeyMod.Shift|h.KeyCode.Digit3],run:()=>this._insertAtCurrentLine("### ")}),q(this,E)?.monacoEditor?.addAction({label:"Add Heading H4",id:"h4",keybindings:[h.KeyMod.CtrlCmd|h.KeyMod.Shift|h.KeyCode.Digit4],run:()=>this._insertAtCurrentLine("#### ")}),q(this,E)?.monacoEditor?.addAction({label:"Add Heading H5",id:"h5",keybindings:[h.KeyMod.CtrlCmd|h.KeyMod.Shift|h.KeyCode.Digit5],run:()=>this._insertAtCurrentLine("##### ")}),q(this,E)?.monacoEditor?.addAction({label:"Add Heading H6",id:"h6",keybindings:[h.KeyMod.CtrlCmd|h.KeyMod.Shift|h.KeyCode.Digit6],run:()=>this._insertAtCurrentLine("###### ")}),q(this,E)?.monacoEditor?.addAction({label:"Add Bold Text",id:"b",keybindings:[h.KeyMod.CtrlCmd|h.KeyCode.KeyB],run:()=>this._insertBetweenSelection("**","**","Your Bold Text")}),q(this,E)?.monacoEditor?.addAction({label:"Add Italic Text",id:"i",keybindings:[h.KeyMod.CtrlCmd|h.KeyCode.KeyI],run:()=>this._insertBetweenSelection("*","*","Your Italic Text")}),q(this,E)?.monacoEditor?.addAction({label:"Add Quote",id:"q",keybindings:[h.KeyMod.CtrlCmd|h.KeyMod.Shift|h.KeyCode.Period],run:()=>this._insertQuote()}),q(this,E)?.monacoEditor?.addAction({label:"Add Ordered List",id:"ol",keybindings:[h.KeyMod.CtrlCmd|h.KeyMod.Shift|h.KeyCode.Digit7],run:()=>this._insertAtCurrentLine("1. ")}),q(this,E)?.monacoEditor?.addAction({label:"Add Unordered List",id:"ul",keybindings:[h.KeyMod.CtrlCmd|h.KeyMod.Shift|h.KeyCode.Digit8],run:()=>this._insertAtCurrentLine("- ")}),q(this,E)?.monacoEditor?.addAction({label:"Add Code",id:"code",keybindings:[h.KeyMod.CtrlCmd|h.KeyCode.KeyE],run:()=>this._insertBetweenSelection("`","`","Code")}),q(this,E)?.monacoEditor?.addAction({label:"Add Fenced Code",id:"fenced-code",run:()=>this._insertBetweenSelection("```","```","Code")}),q(this,E)?.monacoEditor?.addAction({label:"Add Horizontal Line",id:"line",run:()=>this._insertLine()}),q(this,E)?.monacoEditor?.addAction({label:"Add Image",id:"image",run:()=>D(this,x,S).call(this)})},_=function(t,e){t.stopPropagation();const i=q(this,E)?.monacoEditor?.getAction(e.id);if(!i)throw new Error(`Action ${e.id} not found in the editor.`);q(this,E)?.monacoEditor?.getAction(e.id)?.run()},S=async function(){const t=q(this,E)?.getSelections()[0];if(!t)return;const e=q(this,E)?.getValueInRange(t)||"enter image description here";this._focusEditor();const i=(await this.getContext(g)).open(this,y);i?.onSubmit().then(async i=>{if(!i)return;const o=i.selection.filter(t=>null!==t),{data:n}=await q(this,A).requestItems(o),r=n?.length?n[0]?.url??"URL":"URL";q(this,E)?.monacoEditor?.executeEdits("",[{range:t,text:`![${e}](${r})`}]),q(this,E)?.select({startColumn:t.startColumn+2,endColumn:t.startColumn+e.length+2,endLineNumber:t.startLineNumber,startLineNumber:t.startLineNumber})}).catch(()=>{}).finally(()=>this._focusEditor())},K=function(t){if("Enter"!==t.key)return;const e=q(this,E)?.getSelections()[0];if(!e)return;const i=q(this,E)?.getValueInRange({...e,startColumn:1}).trimStart();if(i)if(i.startsWith("- ")&&i.length>2)requestAnimationFrame(()=>q(this,E)?.insert("- "));else if(i.match(/^[1-9]\d*\.\s.*/)&&i.length>3){const t=parseInt(i,10);requestAnimationFrame(()=>q(this,E)?.insert(`${t+1}. `))}},$=function(e){e.stopPropagation(),this.value=q(this,E)?.value??"",this.dispatchEvent(new t)},M=function(){return this.readonly?i:e`
            <div id="toolbar">
                <div id="buttons">
                    <uui-button-group>
                        <uui-button
                            compact
                            look="default"
                            label="Heading"
                            title="Heading, &lt;Ctrl+Shift+2&gt;"
                            @click=${()=>q(this,E)?.monacoEditor?.getAction("h2")?.run()}>
                            <umb-icon name="icon-heading-2"></umb-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Bold"
                            title="Bold, &lt;Ctrl+B&gt;"
                            @click=${()=>q(this,E)?.monacoEditor?.getAction("b")?.run()}>
                            <umb-icon name="icon-bold"></umb-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Italic"
                            title="Italic, &lt;Ctrl+I&gt;"
                            @click=${()=>q(this,E)?.monacoEditor?.getAction("i")?.run()}>
                            <umb-icon name="icon-italic"></umb-icon>
                        </uui-button>
                    </uui-button-group>

                    <uui-button-group>
                        <uui-button
                            compact
                            look="default"
                            label="Blockquote"
                            title="Blockquote, &lt;Ctrl+Shift+.&gt;"
                            @click=${()=>q(this,E)?.monacoEditor?.getAction("q")?.run()}>
                            <uui-icon name="icon-blockquote"></uui-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Ordered List"
                            title="Ordered List, &lt;Ctrl+Shift+7&gt;"
                            @click=${()=>q(this,E)?.monacoEditor?.getAction("ol")?.run()}>
                            <uui-icon name="icon-ordered-list"></uui-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Unordered List"
                            title="Unordered List, &lt;Ctrl+Shift+8&gt;"
                            @click=${()=>q(this,E)?.monacoEditor?.getAction("ul")?.run()}>
                            <uui-icon name="icon-bulleted-list"></uui-icon>
                        </uui-button>
                    </uui-button-group>
                    <uui-button-group>
                        <uui-button
                            compact
                            look="default"
                            label="Code"
                            title="Code, &lt;Ctrl+E&gt;"
                            @click=${()=>q(this,E)?.monacoEditor?.getAction("code")?.run()}>
                            <uui-icon name="icon-code"></uui-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Horizontal Rule"
                            title="Horizontal Rule"
                            @click=${()=>q(this,E)?.monacoEditor?.getAction("line")?.run()}>
                            <uui-icon name="icon-horizontal-rule"></uui-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Image"
                            title="Image"
                            @click=${()=>q(this,E)?.monacoEditor?.getAction("image")?.run()}>
                            <uui-icon name="icon-picture"></uui-icon>
                        </uui-button>
                    </uui-button-group>

                    <uui-button-group>
                        ${this._actionExtensions.map(t=>e`
                                <uui-button
                                    compact
                                    look="default"
                                    label=${this.localize.string(t.label)}
                                    title=${this.localize.string(t.label)}
                                    @click=${e=>D(this,x,_).call(this,e,t)}>
                                    ${o(t.icon,()=>e`<uui-icon name=${t.icon}></uui-icon>`,()=>e`<span>${this.localize.string(t.label)}</span>`)}
                                </uui-button>
                            `)}
                    </uui-button-group>
                </div>
                <div id="actions">
                    <uui-button-group>
                        <uui-button
                            compact
                            label="Press F1 for all actions"
                            title="Press F1 for all actions"
                            @click=${()=>{this._focusEditor(),q(this,E)?.monacoEditor?.trigger("","editor.action.quickCommand","")}}>
                            <uui-key>F1</uui-key>
                        </uui-button>
                    </uui-button-group>
                </div>
            </div>
        `},z=function(){if(!this.preview||!this.value)return;const t=m.parse(this.value),i=t?v(t):"";return e`<uui-scroll-container id="preview">${n(i)}</uui-scroll-container>`},T.styles=[p,r`
            :host {
                display: flex;
                flex-direction: column;
            }

            #toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;

                border-radius: var(--uui-border-radius);
                border: 1px solid var(--uui-color-border);
                border-bottom: 0;
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
                box-shadow:
                    0 2px 2px -2px rgba(34, 47, 62, 0.1),
                    0 8px 8px -4px rgba(34, 47, 62, 0.07);

                background-color: var(--uui-color-surface-alt);
                color: var(--color-text);

                position: sticky;
                top: -25px;
                left: 0px;
                right: 0px;
                padding: var(--uui-size-3);
                z-index: 9999999;

                uui-key {
                    text-transform: uppercase;
                }
            }

            #buttons {
                flex: 1;
                display: flex;
                flex-wrap: wrap;
                align-items: center;

                uui-button-group:not(:last-child)::after {
                    content: '';
                    background-color: var(--uui-color-border);
                    width: 1px;
                    place-self: center;
                    height: 22px;
                    margin: 0 var(--uui-size-3);
                }
            }

            umb-code-editor {
                height: 200px;
                border-radius: var(--uui-border-radius);
                border: 1px solid var(--uui-color-border);
                border-top: 0;
                border-top-left-radius: 0;
                border-top-right-radius: 0;
                padding-top: var(--uui-size-3);
            }

            #preview {
                max-height: 400px;
            }

            #preview blockquote {
                border-left: 2px solid var(--uui-color-default-emphasis);
                margin-inline: 0;
                padding-inline: var(--uui-size-3);
            }

            #preview img {
                max-width: 100%;
            }

            #preview hr {
                border: none;
                border-bottom: 1px solid var(--uui-palette-cocoa-black);
            }

            #preview p > code,
            #preview pre {
                border: 1px solid var(--uui-color-divider-emphasis);
                border-radius: var(--uui-border-radius);
                padding: 0 var(--uui-size-1);
                background-color: var(--uui-color-background);
            }
        `],H([a({type:Boolean})],T.prototype,"preview",2),H([a()],T.prototype,"overlaySize",2),H([a({type:Boolean,reflect:!0})],T.prototype,"readonly",1),H([u("umb-code-editor")],T.prototype,"_codeEditor",2),H([s()],T.prototype,"_actionExtensions",2),T=H([l("articulate-input-markdown")],T);var V,F,U=Object.defineProperty,j=Object.getOwnPropertyDescriptor,Q=t=>{throw TypeError(t)},Y=(t,e,i,o)=>{for(var n,r=o>1?void 0:o?j(e,i):e,a=t.length-1;a>=0;a--)(n=t[a])&&(r=(o?n(e,i,r):n(r))||r);return o&&r&&U(e,i,r),r},G=(t,e,i)=>(((t,e,i)=>{e.has(t)||Q("Cannot "+i)})(t,e,"access private method"),i);let J=class extends d{constructor(){var t,e,i;super(...arguments),t=this,(e=V).has(t)?Q("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,i),this.readonly=!1,this._overlaySize="small"}set config(t){t&&(this._preview=t.getValueByAlias("preview"),this._overlaySize=t.getValueByAlias("overlaySize")??"small")}render(){return e`
            <articulate-input-markdown
                .value=${this.value}
                .overlaySize=${this._overlaySize}
                ?preview=${this._preview}
                @change=${G(this,V,F)}
                ?readonly=${this.readonly}></articulate-input-markdown>
        `}};V=/* @__PURE__ */new WeakSet,F=function(e){this.value=e.target.value,this.dispatchEvent(new t)},Y([a()],J.prototype,"value",2),Y([a({type:Boolean,reflect:!0})],J.prototype,"readonly",2),Y([s()],J.prototype,"_preview",2),Y([s()],J.prototype,"_overlaySize",2),J=Y([l("articulate-property-editor-ui-markdown-editor")],J);export{J as ArticulatePropertyEditorUIMarkdownEditorElement,J as element};
//# sourceMappingURL=property-editor-ui-markdown-editor.element-BHfQ0q9o.js.map
