import { EditorView, minimalSetup } from "codemirror";
import { kabelsalatTheme } from "./theme.js";
import { javascript } from "@codemirror/lang-javascript";
import { widgetPlugin } from "./widgets.js";
import { flashField } from "./flash.js";
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import { bracketMatching } from "@codemirror/language";
import { Prec } from "@codemirror/state";

export function initEditor({ root, code, onChange, onEvaluate, onStop }) {
  let editor = new EditorView({
    extensions: [
      //basicSetup,
      lineNumbers(),
      [highlightActiveLine(), highlightActiveLineGutter()],
      bracketMatching({ brackets: "()[]{}<>" }),
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
      Prec.highest(
        keymap.of([
          {
            key: "Ctrl-Enter",
            run: () => onEvaluate?.(),
          },
          {
            key: "Alt-Enter",
            run: () => onEvaluate?.(),
          },
          {
            key: "Ctrl-.",
            run: () => onStop?.(),
          },
          {
            key: "Alt-.",
            run: () => {
              onStop?.();
              return true;
            },
          },
        ])
      ),
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

  return { setCode, getCode, editor };
}
