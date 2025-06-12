import { html as _, nothing as at, when as dt, unsafeHTML as lt, css as ct, property as k, query as mt, state as M, customElement as Y } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as G } from "@umbraco-cms/backoffice/lit-element";
import { UmbChangeEvent as X } from "@umbraco-cms/backoffice/event";
import { UmbCodeEditorLoadedEvent as ht } from "@umbraco-cms/backoffice/code-editor";
import { createExtensionApi as bt } from "@umbraco-cms/backoffice/extension-api";
import { umbExtensionsRegistry as pt } from "@umbraco-cms/backoffice/extension-registry";
import { marked as gt } from "@umbraco-cms/backoffice/external/marked";
import { monaco as d } from "@umbraco-cms/backoffice/external/monaco-editor";
import { UmbMediaUrlRepository as ft, UMB_MEDIA_PICKER_MODAL as yt } from "@umbraco-cms/backoffice/media";
import { UMB_MODAL_MANAGER_CONTEXT as Ct } from "@umbraco-cms/backoffice/modal";
import { UmbTextStyles as vt } from "@umbraco-cms/backoffice/style";
import { sanitizeHTML as _t } from "@umbraco-cms/backoffice/utils";
import { UmbFormControlMixin as Et } from "@umbraco-cms/backoffice/validation";
var At = Object.defineProperty, Lt = Object.getOwnPropertyDescriptor, J = (t) => {
  throw TypeError(t);
}, L = (t, e, i, o) => {
  for (var s = o > 1 ? void 0 : o ? Lt(e, i) : e, u = t.length - 1, a; u >= 0; u--)
    (a = t[u]) && (s = (o ? a(e, i, s) : a(s)) || s);
  return o && s && At(e, i, s), s;
}, S = (t, e, i) => e.has(t) || J("Cannot " + i), n = (t, e, i) => (S(t, e, "read from private field"), i ? i.call(t) : e.get(t)), x = (t, e, i) => e.has(t) ? J("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), Z = (t, e, i, o) => (S(t, e, "write to private field"), e.set(t, i), i), y = (t, e, i) => (S(t, e, "access private method"), i), E, r, $, p, j, V, tt, et, it, ot, nt, rt;
let C = class extends Et(G) {
  constructor() {
    super(...arguments), x(this, p), this.preview = !1, x(this, E, !1), x(this, r), this._actionExtensions = [], x(this, $, new ft(this));
  }
  getFormElement() {
    return this._codeEditor;
  }
  get readonly() {
    return n(this, E);
  }
  set readonly(t) {
    var e, i;
    Z(this, E, t), (i = (e = n(this, r)) == null ? void 0 : e.monacoEditor) == null || i.updateOptions({ readOnly: n(this, E) });
  }
  _focusEditor() {
    var t, e;
    (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null || e.focus();
  }
  _insertLine() {
    var i, o, s, u, a;
    const t = (i = n(this, r)) == null ? void 0 : i.getSelections()[0];
    if (!t) return;
    const e = ((s = (o = n(this, r)) == null ? void 0 : o.monacoModel) == null ? void 0 : s.getLineMaxColumn(t.endLineNumber)) ?? 1;
    e === 1 ? (u = n(this, r)) == null || u.insertAtPosition(`---
`, {
      lineNumber: t.endLineNumber,
      column: 1
    }) : (a = n(this, r)) == null || a.insertAtPosition(`

---
`, {
      lineNumber: t.endLineNumber,
      column: e
    }), this._focusEditor();
  }
  _insertBetweenSelection(t, e, i) {
    var u, a, l, c, h, m, b, g, f, v;
    this._focusEditor();
    const o = (u = n(this, r)) == null ? void 0 : u.getSelections()[0];
    if (!o) return;
    const s = (a = n(this, r)) == null ? void 0 : a.getValueInRange({
      startLineNumber: o.startLineNumber,
      endLineNumber: o.endLineNumber,
      startColumn: o.startColumn - t.length,
      endColumn: o.endColumn + e.length
    });
    s != null && s.startsWith(t) && s.endsWith(e) && s.length > t.length + e.length ? ((l = n(this, r)) == null || l.select({
      ...o,
      startColumn: o.startColumn + t.length
    }), (h = (c = n(this, r)) == null ? void 0 : c.monacoEditor) == null || h.executeEdits("", [
      {
        range: {
          startColumn: o.startColumn - t.length,
          startLineNumber: o.startLineNumber,
          endColumn: o.startColumn,
          endLineNumber: o.startLineNumber
        },
        text: ""
      },
      {
        range: {
          startColumn: o.endColumn + t.length,
          startLineNumber: o.startLineNumber,
          endColumn: o.endColumn,
          endLineNumber: o.startLineNumber
        },
        text: ""
      }
    ])) : ((m = n(this, r)) == null || m.insertAtPosition(t, {
      lineNumber: o.startLineNumber,
      column: o.startColumn
    }), (b = n(this, r)) == null || b.insertAtPosition(e, {
      lineNumber: o.endLineNumber,
      column: o.endColumn + t.length
    }), (g = n(this, r)) == null || g.select({
      startLineNumber: o.startLineNumber,
      endLineNumber: o.endLineNumber,
      startColumn: o.startColumn + t.length,
      endColumn: o.endColumn + t.length
    })), o.startColumn === o.endColumn && o.startLineNumber === o.endLineNumber && (i && ((f = n(this, r)) == null || f.insertAtPosition(i, {
      lineNumber: o.startLineNumber,
      column: o.startColumn + t.length
    })), (v = n(this, r)) == null || v.select({
      startLineNumber: o.startLineNumber,
      endLineNumber: o.endLineNumber,
      startColumn: o.startColumn + t.length,
      endColumn: o.startColumn + t.length + ((i == null ? void 0 : i.length) ?? 0)
    }));
  }
  _insertAtCurrentLine(t) {
    var s, u, a, l, c, h, m;
    this._focusEditor();
    const e = (s = n(this, r)) == null ? void 0 : s.getSelections()[0];
    if (!e) return;
    const i = (u = n(this, r)) == null ? void 0 : u.getValueInRange({
      ...e,
      startLineNumber: e.startLineNumber - 1
    }), o = (a = n(this, r)) == null ? void 0 : a.getValueInRange({ ...e, startColumn: 1 });
    if (o != null && o.startsWith(t) || o != null && o.match(/^[1-9]\d*\.\s.*/))
      (c = (l = n(this, r)) == null ? void 0 : l.monacoEditor) == null || c.executeEdits("", [
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
    else if (t.match(/^[1-9]\d*\.\s.*/) && (i != null && i.match(/^[1-9]\d*\.\s.*/))) {
      const b = parseInt(i, 10);
      (h = n(this, r)) == null || h.insertAtPosition(`${b + 1}. `, {
        lineNumber: e.startLineNumber,
        column: 1
      });
    } else
      (m = n(this, r)) == null || m.insertAtPosition(t, {
        lineNumber: e.startLineNumber,
        column: 1
      });
  }
  _insertQuote() {
    var i, o, s;
    const t = (i = n(this, r)) == null ? void 0 : i.getSelections()[0];
    if (!t) return;
    let e = t.startLineNumber;
    for (e; e <= t.endLineNumber; e++) {
      const u = (o = n(this, r)) == null ? void 0 : o.getValueInRange({
        startLineNumber: e,
        endLineNumber: e,
        startColumn: 1,
        endColumn: 3
      });
      u != null && u.startsWith("> ") || (s = n(this, r)) == null || s.insertAtPosition("> ", {
        lineNumber: e,
        column: 1
      });
    }
    this._focusEditor();
  }
  render() {
    return _`
      ${y(this, p, nt).call(this)}

      <umb-code-editor
        language="markdown"
        .code=${this.value}
        disable-line-numbers
        disable-minimap
        disable-folding
        @input=${y(this, p, ot)}
        @keypress=${y(this, p, it)}
        @loaded=${y(this, p, j)}
      >
      </umb-code-editor>

      ${y(this, p, rt).call(this)}
    `;
  }
};
E = /* @__PURE__ */ new WeakMap();
r = /* @__PURE__ */ new WeakMap();
$ = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakSet();
j = function(t) {
  var e, i, o;
  if (t.type === ht.TYPE)
    try {
      Z(this, r, (e = this._codeEditor) == null ? void 0 : e.editor), (o = (i = n(this, r)) == null ? void 0 : i.monacoEditor) == null || o.updateOptions({ readOnly: n(this, E) }), this.observe(pt.byType("monacoMarkdownEditorAction"), (s) => {
        s.forEach(async (u) => {
          var c, h, m, b;
          const a = await bt(this, u, [this]), l = {
            id: u.alias ?? a.getUnique(),
            label: this.localize.string(((c = u.meta) == null ? void 0 : c.label) ?? a.getLabel()),
            icon: (h = u.meta) == null ? void 0 : h.icon,
            keybindings: a.getKeybindings(),
            run: async () => await a.execute({ editor: n(this, r), overlaySize: this.overlaySize })
          };
          (b = (m = n(this, r)) == null ? void 0 : m.monacoEditor) == null || b.addAction(l), this._actionExtensions.push(l), this.requestUpdate("_actionExtensions");
        });
      }), y(this, p, V).call(this);
    } catch (s) {
      console.error(s);
    }
};
V = function() {
  var t, e, i, o, s, u, a, l, c, h, m, b, g, f, v, K, P, z, I, U, H, B, O, D, R, q, T, W, F, Q;
  (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null || e.addAction({
    label: "Add Heading H1",
    id: "h1",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyMod.Shift | d.KeyCode.Digit1],
    run: () => this._insertAtCurrentLine("# ")
  }), (o = (i = n(this, r)) == null ? void 0 : i.monacoEditor) == null || o.addAction({
    label: "Add Heading H2",
    id: "h2",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyMod.Shift | d.KeyCode.Digit2],
    run: () => this._insertAtCurrentLine("## ")
  }), (u = (s = n(this, r)) == null ? void 0 : s.monacoEditor) == null || u.addAction({
    label: "Add Heading H3",
    id: "h3",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyMod.Shift | d.KeyCode.Digit3],
    run: () => this._insertAtCurrentLine("### ")
  }), (l = (a = n(this, r)) == null ? void 0 : a.monacoEditor) == null || l.addAction({
    label: "Add Heading H4",
    id: "h4",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyMod.Shift | d.KeyCode.Digit4],
    run: () => this._insertAtCurrentLine("#### ")
  }), (h = (c = n(this, r)) == null ? void 0 : c.monacoEditor) == null || h.addAction({
    label: "Add Heading H5",
    id: "h5",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyMod.Shift | d.KeyCode.Digit5],
    run: () => this._insertAtCurrentLine("##### ")
  }), (b = (m = n(this, r)) == null ? void 0 : m.monacoEditor) == null || b.addAction({
    label: "Add Heading H6",
    id: "h6",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyMod.Shift | d.KeyCode.Digit6],
    run: () => this._insertAtCurrentLine("###### ")
  }), (f = (g = n(this, r)) == null ? void 0 : g.monacoEditor) == null || f.addAction({
    label: "Add Bold Text",
    id: "b",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyCode.KeyB],
    run: () => this._insertBetweenSelection("**", "**", "Your Bold Text")
  }), (K = (v = n(this, r)) == null ? void 0 : v.monacoEditor) == null || K.addAction({
    label: "Add Italic Text",
    id: "i",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyCode.KeyI],
    run: () => this._insertBetweenSelection("*", "*", "Your Italic Text")
  }), (z = (P = n(this, r)) == null ? void 0 : P.monacoEditor) == null || z.addAction({
    label: "Add Quote",
    id: "q",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyMod.Shift | d.KeyCode.Period],
    run: () => this._insertQuote()
  }), (U = (I = n(this, r)) == null ? void 0 : I.monacoEditor) == null || U.addAction({
    label: "Add Ordered List",
    id: "ol",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyMod.Shift | d.KeyCode.Digit7],
    run: () => this._insertAtCurrentLine("1. ")
  }), (B = (H = n(this, r)) == null ? void 0 : H.monacoEditor) == null || B.addAction({
    label: "Add Unordered List",
    id: "ul",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyMod.Shift | d.KeyCode.Digit8],
    run: () => this._insertAtCurrentLine("- ")
  }), (D = (O = n(this, r)) == null ? void 0 : O.monacoEditor) == null || D.addAction({
    label: "Add Code",
    id: "code",
    keybindings: [d.KeyMod.CtrlCmd | d.KeyCode.KeyE],
    run: () => this._insertBetweenSelection("`", "`", "Code")
  }), (q = (R = n(this, r)) == null ? void 0 : R.monacoEditor) == null || q.addAction({
    label: "Add Fenced Code",
    id: "fenced-code",
    run: () => this._insertBetweenSelection("```", "```", "Code")
  }), (W = (T = n(this, r)) == null ? void 0 : T.monacoEditor) == null || W.addAction({
    label: "Add Horizontal Line",
    id: "line",
    run: () => this._insertLine()
  }), (Q = (F = n(this, r)) == null ? void 0 : F.monacoEditor) == null || Q.addAction({
    label: "Add Image",
    id: "image",
    //keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ], // What keybinding would be good for image?
    run: () => y(this, p, et).call(this)
    // TODO: Update when media picker is complete.
  });
};
tt = function(t, e) {
  var o, s, u, a, l;
  if (t.stopPropagation(), !((s = (o = n(this, r)) == null ? void 0 : o.monacoEditor) == null ? void 0 : s.getAction(e.id))) throw new Error(`Action ${e.id} not found in the editor.`);
  (l = (a = (u = n(this, r)) == null ? void 0 : u.monacoEditor) == null ? void 0 : a.getAction(e.id)) == null || l.run();
};
et = async function() {
  var s, u;
  const t = (s = n(this, r)) == null ? void 0 : s.getSelections()[0];
  if (!t) return;
  const e = ((u = n(this, r)) == null ? void 0 : u.getValueInRange(t)) || "enter image description here";
  this._focusEditor();
  const o = (await this.getContext(Ct)).open(this, yt);
  o == null || o.onSubmit().then(async (a) => {
    var m, b, g, f;
    if (!a) return;
    const l = a.selection.filter((v) => v !== null), { data: c } = await n(this, $).requestItems(l), h = c != null && c.length ? ((m = c[0]) == null ? void 0 : m.url) ?? "URL" : "URL";
    (g = (b = n(this, r)) == null ? void 0 : b.monacoEditor) == null || g.executeEdits("", [
      {
        range: t,
        text: `![${e}](${h})`
      }
    ]), (f = n(this, r)) == null || f.select({
      startColumn: t.startColumn + 2,
      endColumn: t.startColumn + e.length + 2,
      // +2 because of ![
      endLineNumber: t.startLineNumber,
      startLineNumber: t.startLineNumber
    });
  }).catch(() => {
  }).finally(() => this._focusEditor());
};
it = function(t) {
  var o, s;
  if (t.key !== "Enter") return;
  const e = (o = n(this, r)) == null ? void 0 : o.getSelections()[0];
  if (!e) return;
  const i = (s = n(this, r)) == null ? void 0 : s.getValueInRange({ ...e, startColumn: 1 }).trimStart();
  if (i) {
    if (i.startsWith("- ") && i.length > 2)
      requestAnimationFrame(() => {
        var u;
        return (u = n(this, r)) == null ? void 0 : u.insert("- ");
      });
    else if (i.match(/^[1-9]\d*\.\s.*/) && i.length > 3) {
      const u = parseInt(i, 10);
      requestAnimationFrame(() => {
        var a;
        return (a = n(this, r)) == null ? void 0 : a.insert(`${u + 1}. `);
      });
    }
  }
};
ot = function(t) {
  var e;
  t.stopPropagation(), this.value = ((e = n(this, r)) == null ? void 0 : e.value) ?? "", this.dispatchEvent(new X());
};
nt = function() {
  return this.readonly ? at : _`
      <div id="toolbar">
        <div id="buttons">
          <uui-button-group>
            <uui-button
              compact
              look="default"
              label="Heading"
              title="Heading, &lt;Ctrl+Shift+1&gt;"
              @click=${() => {
    var t, e, i;
    return (i = (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null ? void 0 : e.getAction("h1")) == null ? void 0 : i.run();
  }}
            >
              <umb-icon name="icon-heading-1"></umb-icon>
            </uui-button>
            <uui-button
              compact
              look="default"
              label="Bold"
              title="Bold, &lt;Ctrl+B&gt;"
              @click=${() => {
    var t, e, i;
    return (i = (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null ? void 0 : e.getAction("b")) == null ? void 0 : i.run();
  }}
            >
              <umb-icon name="icon-bold"></umb-icon>
            </uui-button>
            <uui-button
              compact
              look="default"
              label="Italic"
              title="Italic, &lt;Ctrl+I&gt;"
              @click=${() => {
    var t, e, i;
    return (i = (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null ? void 0 : e.getAction("i")) == null ? void 0 : i.run();
  }}
            >
              <umb-icon name="icon-italic"></umb-icon>
            </uui-button>
          </uui-button-group>

          <uui-button-group>
            <uui-button
              compact
              look="default"
              label="Blockquote"
              title="Blockquote, &lt;Ctrl+Shift+.&gt;"
              @click=${() => {
    var t, e, i;
    return (i = (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null ? void 0 : e.getAction("q")) == null ? void 0 : i.run();
  }}
            >
              <uui-icon name="icon-blockquote"></uui-icon>
            </uui-button>
            <uui-button
              compact
              look="default"
              label="Ordered List"
              title="Ordered List, &lt;Ctrl+Shift+7&gt;"
              @click=${() => {
    var t, e, i;
    return (i = (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null ? void 0 : e.getAction("ol")) == null ? void 0 : i.run();
  }}
            >
              <uui-icon name="icon-ordered-list"></uui-icon>
            </uui-button>
            <uui-button
              compact
              look="default"
              label="Unordered List"
              title="Unordered List, &lt;Ctrl+Shift+8&gt;"
              @click=${() => {
    var t, e, i;
    return (i = (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null ? void 0 : e.getAction("ul")) == null ? void 0 : i.run();
  }}
            >
              <uui-icon name="icon-bulleted-list"></uui-icon>
            </uui-button>
          </uui-button-group>
          <uui-button-group>
            <uui-button
              compact
              look="default"
              label="Code"
              title="Code, &lt;Ctrl+E&gt;"
              @click=${() => {
    var t, e, i;
    return (i = (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null ? void 0 : e.getAction("code")) == null ? void 0 : i.run();
  }}
            >
              <uui-icon name="icon-code"></uui-icon>
            </uui-button>
            <uui-button
              compact
              look="default"
              label="Horizontal Rule"
              title="Horizontal Rule"
              @click=${() => {
    var t, e, i;
    return (i = (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null ? void 0 : e.getAction("line")) == null ? void 0 : i.run();
  }}
            >
              <uui-icon name="icon-horizontal-rule"></uui-icon>
            </uui-button>
            <uui-button
              compact
              look="default"
              label="Image"
              title="Image"
              @click=${() => {
    var t, e, i;
    return (i = (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null ? void 0 : e.getAction("image")) == null ? void 0 : i.run();
  }}
            >
              <uui-icon name="icon-picture"></uui-icon>
            </uui-button>
          </uui-button-group>

          <uui-button-group>
            ${this._actionExtensions.map(
    (t) => _`
                <uui-button
                  compact
                  look="default"
                  label=${this.localize.string(t.label)}
                  title=${this.localize.string(t.label)}
                  @click=${(e) => y(this, p, tt).call(this, e, t)}
                >
                  ${dt(
      t.icon,
      () => _`<uui-icon name=${t.icon}></uui-icon>`,
      () => _`<span>${this.localize.string(t.label)}</span>`
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
    var t, e;
    this._focusEditor(), (e = (t = n(this, r)) == null ? void 0 : t.monacoEditor) == null || e.trigger("", "editor.action.quickCommand", "");
  }}
            >
              <uui-key>F1</uui-key>
            </uui-button>
          </uui-button-group>
        </div>
      </div>
    `;
};
rt = function() {
  if (!this.preview || !this.value) return;
  const t = gt.parse(this.value), e = t ? _t(t) : "";
  return _`<uui-scroll-container id="preview"
      >${lt(e)}</uui-scroll-container
    >`;
};
C.styles = [
  vt,
  ct`
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
          content: "";
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
L([
  k({ type: Boolean })
], C.prototype, "preview", 2);
L([
  k()
], C.prototype, "overlaySize", 2);
L([
  k({ type: Boolean, reflect: !0 })
], C.prototype, "readonly", 1);
L([
  mt("umb-code-editor")
], C.prototype, "_codeEditor", 2);
L([
  M()
], C.prototype, "_actionExtensions", 2);
C = L([
  Y("umb-input-markdown")
], C);
var kt = Object.defineProperty, wt = Object.getOwnPropertyDescriptor, st = (t) => {
  throw TypeError(t);
}, w = (t, e, i, o) => {
  for (var s = o > 1 ? void 0 : o ? wt(e, i) : e, u = t.length - 1, a; u >= 0; u--)
    (a = t[u]) && (s = (o ? a(e, i, s) : a(s)) || s);
  return o && s && kt(e, i, s), s;
}, xt = (t, e, i) => e.has(t) || st("Cannot " + i), Nt = (t, e, i) => e.has(t) ? st("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), Mt = (t, e, i) => (xt(t, e, "access private method"), i), N, ut;
let A = class extends G {
  constructor() {
    super(...arguments), Nt(this, N), this.readonly = !1, this._overlaySize = "small";
  }
  set config(t) {
    t && (this._preview = t.getValueByAlias("preview"), this._overlaySize = t.getValueByAlias("overlaySize") ?? "small");
  }
  render() {
    return _`
      <umb-input-markdown
        .value=${this.value}
        .overlaySize=${this._overlaySize}
        ?preview=${this._preview}
        @change=${Mt(this, N, ut)}
        ?readonly=${this.readonly}
      ></umb-input-markdown>
    `;
  }
};
N = /* @__PURE__ */ new WeakSet();
ut = function(t) {
  this.value = t.target.value, this.dispatchEvent(new X());
};
w([
  k()
], A.prototype, "value", 2);
w([
  k({ type: Boolean, reflect: !0 })
], A.prototype, "readonly", 2);
w([
  M()
], A.prototype, "_preview", 2);
w([
  M()
], A.prototype, "_overlaySize", 2);
A = w([
  Y("articulate-property-editor-ui-markdown-editor")
], A);
export {
  A as UmbPropertyEditorUIArticulateMarkdownEditorElement,
  A as element
};
//# sourceMappingURL=property-editor-ui-markdown-editor.element-ByRKICRp.js.map
