import { html as h, nothing as R, when as q, unsafeHTML as T, css as W, property as f, query as F, state as _, customElement as L } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as k } from "@umbraco-cms/backoffice/lit-element";
import { createExtensionApi as Q } from "@umbraco-cms/backoffice/extension-api";
import { marked as Y } from "@umbraco-cms/backoffice/external/marked";
import { monaco as s } from "@umbraco-cms/backoffice/external/monaco-editor";
import { umbExtensionsRegistry as G } from "@umbraco-cms/backoffice/extension-registry";
import { UmbChangeEvent as w } from "@umbraco-cms/backoffice/event";
import { UmbTextStyles as X } from "@umbraco-cms/backoffice/style";
import { UMB_MODAL_MANAGER_CONTEXT as J } from "@umbraco-cms/backoffice/modal";
import { UmbMediaUrlRepository as Z, UMB_MEDIA_PICKER_MODAL as j } from "@umbraco-cms/backoffice/media";
import { UmbCodeEditorLoadedEvent as V } from "@umbraco-cms/backoffice/code-editor";
import { UmbFormControlMixin as tt } from "@umbraco-cms/backoffice/validation";
import { sanitizeHTML as et } from "@umbraco-cms/backoffice/utils";
var it = Object.defineProperty, ot = Object.getOwnPropertyDescriptor, x = (t) => {
  throw TypeError(t);
}, g = (t, e, r, n) => {
  for (var a = n > 1 ? void 0 : n ? ot(e, r) : e, l = t.length - 1, u; l >= 0; l--)
    (u = t[l]) && (a = (n ? u(e, r, a) : u(a)) || a);
  return n && a && it(e, r, a), a;
}, E = (t, e, r) => e.has(t) || x("Cannot " + r), i = (t, e, r) => (E(t, e, "read from private field"), r ? r.call(t) : e.get(t)), C = (t, e, r) => e.has(t) ? x("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), N = (t, e, r, n) => (E(t, e, "write to private field"), e.set(t, r), r), c = (t, e, r) => (E(t, e, "access private method"), r), b, o, A, d, M, S, $, K, P, z, I, U;
let m = class extends tt(
  k
) {
  constructor() {
    super(...arguments), C(this, d), this.preview = !1, C(this, b, !1), C(this, o), this._actionExtensions = [], C(this, A, new Z(this));
  }
  getFormElement() {
    return this._codeEditor;
  }
  get readonly() {
    return i(this, b);
  }
  set readonly(t) {
    N(this, b, t), i(this, o)?.monacoEditor?.updateOptions({ readOnly: i(this, b) });
  }
  _focusEditor() {
    i(this, o)?.monacoEditor?.focus();
  }
  _insertLine() {
    const t = i(this, o)?.getSelections()[0];
    if (!t) return;
    const e = i(this, o)?.monacoModel?.getLineMaxColumn(t.endLineNumber) ?? 1;
    e === 1 ? i(this, o)?.insertAtPosition(`---
`, {
      lineNumber: t.endLineNumber,
      column: 1
    }) : i(this, o)?.insertAtPosition(`

---
`, {
      lineNumber: t.endLineNumber,
      column: e
    }), this._focusEditor();
  }
  _insertBetweenSelection(t, e, r) {
    this._focusEditor();
    const n = i(this, o)?.getSelections()[0];
    if (!n) return;
    const a = i(this, o)?.getValueInRange({
      startLineNumber: n.startLineNumber,
      endLineNumber: n.endLineNumber,
      startColumn: n.startColumn - t.length,
      endColumn: n.endColumn + e.length
    });
    a?.startsWith(t) && a.endsWith(e) && a.length > t.length + e.length ? (i(this, o)?.select({ ...n, startColumn: n.startColumn + t.length }), i(this, o)?.monacoEditor?.executeEdits("", [
      {
        range: {
          startColumn: n.startColumn - t.length,
          startLineNumber: n.startLineNumber,
          endColumn: n.startColumn,
          endLineNumber: n.startLineNumber
        },
        text: ""
      },
      {
        range: {
          startColumn: n.endColumn + t.length,
          startLineNumber: n.startLineNumber,
          endColumn: n.endColumn,
          endLineNumber: n.startLineNumber
        },
        text: ""
      }
    ])) : (i(this, o)?.insertAtPosition(t, {
      lineNumber: n.startLineNumber,
      column: n.startColumn
    }), i(this, o)?.insertAtPosition(e, {
      lineNumber: n.endLineNumber,
      column: n.endColumn + t.length
    }), i(this, o)?.select({
      startLineNumber: n.startLineNumber,
      endLineNumber: n.endLineNumber,
      startColumn: n.startColumn + t.length,
      endColumn: n.endColumn + t.length
    })), n.startColumn === n.endColumn && n.startLineNumber === n.endLineNumber && (r && i(this, o)?.insertAtPosition(r, {
      lineNumber: n.startLineNumber,
      column: n.startColumn + t.length
    }), i(this, o)?.select({
      startLineNumber: n.startLineNumber,
      endLineNumber: n.endLineNumber,
      startColumn: n.startColumn + t.length,
      endColumn: n.startColumn + t.length + (r?.length ?? 0)
    }));
  }
  _insertAtCurrentLine(t) {
    this._focusEditor();
    const e = i(this, o)?.getSelections()[0];
    if (!e) return;
    const r = i(this, o)?.getValueInRange({
      ...e,
      startLineNumber: e.startLineNumber - 1
    }), n = i(this, o)?.getValueInRange({ ...e, startColumn: 1 });
    if (n?.startsWith(t) || n?.match(/^[1-9]\d*\.\s.*/))
      i(this, o)?.monacoEditor?.executeEdits("", [
        {
          range: {
            startColumn: 1,
            startLineNumber: e.startLineNumber,
            endColumn: 1 + t.length,
            endLineNumber: e.startLineNumber
          },
          text: ""
        }
      ]);
    else if (t.match(/^[1-9]\d*\.\s.*/) && r?.match(/^[1-9]\d*\.\s.*/)) {
      const a = parseInt(r, 10);
      i(this, o)?.insertAtPosition(`${a + 1}. `, {
        lineNumber: e.startLineNumber,
        column: 1
      });
    } else
      i(this, o)?.insertAtPosition(t, {
        lineNumber: e.startLineNumber,
        column: 1
      });
  }
  _insertQuote() {
    const t = i(this, o)?.getSelections()[0];
    if (!t) return;
    let e = t.startLineNumber;
    for (e; e <= t.endLineNumber; e++)
      i(this, o)?.getValueInRange({
        startLineNumber: e,
        endLineNumber: e,
        startColumn: 1,
        endColumn: 3
      })?.startsWith("> ") || i(this, o)?.insertAtPosition("> ", {
        lineNumber: e,
        column: 1
      });
    this._focusEditor();
  }
  render() {
    return h`
            ${c(this, d, I).call(this)}

            <umb-code-editor
                language="markdown"
                .code=${this.value}
                disable-line-numbers
                disable-minimap
                disable-folding
                @input=${c(this, d, z)}
                @keypress=${c(this, d, P)}
                @loaded=${c(this, d, M)}>
            </umb-code-editor>

            ${c(this, d, U).call(this)}
        `;
  }
};
b = /* @__PURE__ */ new WeakMap();
o = /* @__PURE__ */ new WeakMap();
A = /* @__PURE__ */ new WeakMap();
d = /* @__PURE__ */ new WeakSet();
M = function(t) {
  if (t.type === V.TYPE)
    try {
      N(this, o, this._codeEditor?.editor), i(this, o)?.monacoEditor?.updateOptions({ readOnly: i(this, b) }), this.observe(G.byType("monacoMarkdownEditorAction"), (e) => {
        e.forEach(async (r) => {
          const n = await Q(this, r, [this]), a = {
            id: r.alias ?? n.getUnique(),
            label: this.localize.string(r.meta?.label ?? n.getLabel()),
            icon: r.meta?.icon,
            keybindings: n.getKeybindings(),
            run: async () => await n.execute({ editor: i(this, o), overlaySize: this.overlaySize })
          };
          i(this, o)?.monacoEditor?.addAction(a), this._actionExtensions.push(a), this.requestUpdate("_actionExtensions");
        });
      }), c(this, d, S).call(this);
    } catch (e) {
      console.error(e);
    }
};
S = function() {
  i(this, o)?.monacoEditor?.addAction({
    label: "Add Heading H1",
    id: "h1",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyMod.Shift | s.KeyCode.Digit1],
    run: () => this._insertAtCurrentLine("# ")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Heading H2",
    id: "h2",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyMod.Shift | s.KeyCode.Digit2],
    run: () => this._insertAtCurrentLine("## ")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Heading H3",
    id: "h3",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyMod.Shift | s.KeyCode.Digit3],
    run: () => this._insertAtCurrentLine("### ")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Heading H4",
    id: "h4",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyMod.Shift | s.KeyCode.Digit4],
    run: () => this._insertAtCurrentLine("#### ")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Heading H5",
    id: "h5",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyMod.Shift | s.KeyCode.Digit5],
    run: () => this._insertAtCurrentLine("##### ")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Heading H6",
    id: "h6",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyMod.Shift | s.KeyCode.Digit6],
    run: () => this._insertAtCurrentLine("###### ")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Bold Text",
    id: "b",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyCode.KeyB],
    run: () => this._insertBetweenSelection("**", "**", "Your Bold Text")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Italic Text",
    id: "i",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyCode.KeyI],
    run: () => this._insertBetweenSelection("*", "*", "Your Italic Text")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Quote",
    id: "q",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyMod.Shift | s.KeyCode.Period],
    run: () => this._insertQuote()
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Ordered List",
    id: "ol",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyMod.Shift | s.KeyCode.Digit7],
    run: () => this._insertAtCurrentLine("1. ")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Unordered List",
    id: "ul",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyMod.Shift | s.KeyCode.Digit8],
    run: () => this._insertAtCurrentLine("- ")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Code",
    id: "code",
    keybindings: [s.KeyMod.CtrlCmd | s.KeyCode.KeyE],
    run: () => this._insertBetweenSelection("`", "`", "Code")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Fenced Code",
    id: "fenced-code",
    run: () => this._insertBetweenSelection("```", "```", "Code")
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Horizontal Line",
    id: "line",
    run: () => this._insertLine()
  }), i(this, o)?.monacoEditor?.addAction({
    label: "Add Image",
    id: "image",
    //keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ], // What keybinding would be good for image?
    run: () => c(this, d, K).call(this)
    // TODO: Update when media picker is complete.
  });
};
$ = function(t, e) {
  if (t.stopPropagation(), !i(this, o)?.monacoEditor?.getAction(e.id)) throw new Error(`Action ${e.id} not found in the editor.`);
  i(this, o)?.monacoEditor?.getAction(e.id)?.run();
};
K = async function() {
  const t = i(this, o)?.getSelections()[0];
  if (!t) return;
  const e = i(this, o)?.getValueInRange(t) || "enter image description here";
  this._focusEditor(), (await this.getContext(J)).open(this, j)?.onSubmit().then(async (a) => {
    if (!a) return;
    const l = a.selection.filter((D) => D !== null), { data: u } = await i(this, A).requestItems(l), O = u?.length ? u[0]?.url ?? "URL" : "URL";
    i(this, o)?.monacoEditor?.executeEdits("", [
      {
        range: t,
        text: `![${e}](${O})`
      }
    ]), i(this, o)?.select({
      startColumn: t.startColumn + 2,
      endColumn: t.startColumn + e.length + 2,
      // +2 because of ![
      endLineNumber: t.startLineNumber,
      startLineNumber: t.startLineNumber
    });
  }).catch(() => {
  }).finally(() => this._focusEditor());
};
P = function(t) {
  if (t.key !== "Enter") return;
  const e = i(this, o)?.getSelections()[0];
  if (!e) return;
  const r = i(this, o)?.getValueInRange({ ...e, startColumn: 1 }).trimStart();
  if (r) {
    if (r.startsWith("- ") && r.length > 2)
      requestAnimationFrame(() => i(this, o)?.insert("- "));
    else if (r.match(/^[1-9]\d*\.\s.*/) && r.length > 3) {
      const n = parseInt(r, 10);
      requestAnimationFrame(() => i(this, o)?.insert(`${n + 1}. `));
    }
  }
};
z = function(t) {
  t.stopPropagation(), this.value = i(this, o)?.value ?? "", this.dispatchEvent(new w());
};
I = function() {
  return this.readonly ? R : h`
            <div id="toolbar">
                <div id="buttons">
                    <uui-button-group>
                        <uui-button
                            compact
                            look="default"
                            label="Heading"
                            title="Heading, &lt;Ctrl+Shift+1&gt;"
                            @click=${() => i(this, o)?.monacoEditor?.getAction("h1")?.run()}>
                            <umb-icon name="icon-heading-1"></umb-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Bold"
                            title="Bold, &lt;Ctrl+B&gt;"
                            @click=${() => i(this, o)?.monacoEditor?.getAction("b")?.run()}>
                            <umb-icon name="icon-bold"></umb-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Italic"
                            title="Italic, &lt;Ctrl+I&gt;"
                            @click=${() => i(this, o)?.monacoEditor?.getAction("i")?.run()}>
                            <umb-icon name="icon-italic"></umb-icon>
                        </uui-button>
                    </uui-button-group>

                    <uui-button-group>
                        <uui-button
                            compact
                            look="default"
                            label="Blockquote"
                            title="Blockquote, &lt;Ctrl+Shift+.&gt;"
                            @click=${() => i(this, o)?.monacoEditor?.getAction("q")?.run()}>
                            <uui-icon name="icon-blockquote"></uui-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Ordered List"
                            title="Ordered List, &lt;Ctrl+Shift+7&gt;"
                            @click=${() => i(this, o)?.monacoEditor?.getAction("ol")?.run()}>
                            <uui-icon name="icon-ordered-list"></uui-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Unordered List"
                            title="Unordered List, &lt;Ctrl+Shift+8&gt;"
                            @click=${() => i(this, o)?.monacoEditor?.getAction("ul")?.run()}>
                            <uui-icon name="icon-bulleted-list"></uui-icon>
                        </uui-button>
                    </uui-button-group>
                    <uui-button-group>
                        <uui-button
                            compact
                            look="default"
                            label="Code"
                            title="Code, &lt;Ctrl+E&gt;"
                            @click=${() => i(this, o)?.monacoEditor?.getAction("code")?.run()}>
                            <uui-icon name="icon-code"></uui-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Horizontal Rule"
                            title="Horizontal Rule"
                            @click=${() => i(this, o)?.monacoEditor?.getAction("line")?.run()}>
                            <uui-icon name="icon-horizontal-rule"></uui-icon>
                        </uui-button>
                        <uui-button
                            compact
                            look="default"
                            label="Image"
                            title="Image"
                            @click=${() => i(this, o)?.monacoEditor?.getAction("image")?.run()}>
                            <uui-icon name="icon-picture"></uui-icon>
                        </uui-button>
                    </uui-button-group>

                    <uui-button-group>
                        ${this._actionExtensions.map(
    (t) => h`
                                <uui-button
                                    compact
                                    look="default"
                                    label=${this.localize.string(t.label)}
                                    title=${this.localize.string(t.label)}
                                    @click=${(e) => c(this, d, $).call(this, e, t)}>
                                    ${q(
      t.icon,
      () => h`<uui-icon name=${t.icon}></uui-icon>`,
      () => h`<span>${this.localize.string(t.label)}</span>`
    )}
                                </uui-button>
                            `
  )}
                    </uui-button-group>
                </div>
                <div id="actions">
                    <uui-button-group>
                        <uui-button
                            compact
                            label="Press F1 for all actions"
                            title="Press F1 for all actions"
                            @click=${() => {
    this._focusEditor(), i(this, o)?.monacoEditor?.trigger("", "editor.action.quickCommand", "");
  }}>
                            <uui-key>F1</uui-key>
                        </uui-button>
                    </uui-button-group>
                </div>
            </div>
        `;
};
U = function() {
  if (!this.preview || !this.value) return;
  const t = Y.parse(this.value), e = t ? et(t) : "";
  return h`<uui-scroll-container id="preview">${T(e)}</uui-scroll-container>`;
};
m.styles = [
  X,
  W`
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
        `
];
g([
  f({ type: Boolean })
], m.prototype, "preview", 2);
g([
  f()
], m.prototype, "overlaySize", 2);
g([
  f({ type: Boolean, reflect: !0 })
], m.prototype, "readonly", 1);
g([
  F("umb-code-editor")
], m.prototype, "_codeEditor", 2);
g([
  _()
], m.prototype, "_actionExtensions", 2);
m = g([
  L("umb-input-markdown")
], m);
var nt = Object.defineProperty, rt = Object.getOwnPropertyDescriptor, H = (t) => {
  throw TypeError(t);
}, y = (t, e, r, n) => {
  for (var a = n > 1 ? void 0 : n ? rt(e, r) : e, l = t.length - 1, u; l >= 0; l--)
    (u = t[l]) && (a = (n ? u(e, r, a) : u(a)) || a);
  return n && a && nt(e, r, a), a;
}, st = (t, e, r) => e.has(t) || H("Cannot " + r), at = (t, e, r) => e.has(t) ? H("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), ut = (t, e, r) => (st(t, e, "access private method"), r), v, B;
let p = class extends k {
  constructor() {
    super(...arguments), at(this, v), this.readonly = !1, this._overlaySize = "small";
  }
  set config(t) {
    t && (this._preview = t.getValueByAlias("preview"), this._overlaySize = t.getValueByAlias("overlaySize") ?? "small");
  }
  render() {
    return h`
			<umb-input-markdown
				.value=${this.value}
				.overlaySize=${this._overlaySize}
				?preview=${this._preview}
				@change=${ut(this, v, B)}
				?readonly=${this.readonly}></umb-input-markdown>
		`;
  }
};
v = /* @__PURE__ */ new WeakSet();
B = function(t) {
  this.value = t.target.value, this.dispatchEvent(new w());
};
y([
  f()
], p.prototype, "value", 2);
y([
  f({ type: Boolean, reflect: !0 })
], p.prototype, "readonly", 2);
y([
  _()
], p.prototype, "_preview", 2);
y([
  _()
], p.prototype, "_overlaySize", 2);
p = y([
  L("articulate-property-editor-ui-markdown-editor")
], p);
export {
  p as UmbPropertyEditorUIArticulateMarkdownEditorElement,
  p as element
};
//# sourceMappingURL=property-editor-ui-markdown-editor.element-UZXc7HKT.js.map
