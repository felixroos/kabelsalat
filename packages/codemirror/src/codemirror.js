import { EditorView, minimalSetup } from "codemirror";
import { kabelsalatTheme } from "./theme.js";
import { javascript } from "@codemirror/lang-javascript";
import { widgetPlugin } from "./widgets.js";
import { flashField } from "./flash.js";

export function initEditor({ root, code, onChange, onEvaluate, onStop }) {
  let editor = new EditorView({
    extensions: [
      //basicSetup,
      minimalSetup,
      kabelsalatTheme,
      flashField,
      widgetPlugin,
      EditorView.lineWrapping,
      javascript(),
      EditorView.updateListener.of((v) => {
        if (v.docChanged) {
          onChange?.(v.state.doc.toString());
        }
      }),
    ],
    parent: root,
  });
  const setCode = (code) => {
    const changes = {
      from: 0,
      to: editor.state.doc.length,
      insert: code,
    };
    editor.dispatch({ changes });
  };
  setCode(code);

  const getCode = () => editor.state.doc.toString();

  root.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.code === "Enter") {
      const code = editor.state.doc.toString();
      onEvaluate?.(code);
    } else if (e.ctrlKey && e.key === ".") {
      onStop?.();
    }
  });
  return { setCode, getCode, editor };
}
