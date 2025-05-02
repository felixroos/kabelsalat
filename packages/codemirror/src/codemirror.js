import { EditorView, minimalSetup } from "codemirror";
import { kabelsalatTheme } from "./theme.js";
import { javascript } from "@codemirror/lang-javascript";
import { insertNewline } from "@codemirror/commands";
import { widgetPlugin } from "./widgets.js";
import { flashField } from "./flash.js";
import { keybindings } from "./keybindings.js";
import {
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { bracketMatching } from "@codemirror/language";
import { Compartment, Prec } from "@codemirror/state";

export function initEditor({
  root,
  code,
  settings,
  onChange,
  onEvaluate,
  onStop,
}) {
  const keybindingsCompartment = new Compartment();
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
      keybindingsCompartment.of(keybindings(settings.keybindings)),
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
          {
            key: "Enter",
            run: (view) => {
              insertNewline(view);
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

  const setKeybindings = (bindings) => {
    editor.dispatch({
      effects: keybindingsCompartment.reconfigure(keybindings(bindings)),
    });
  };

  return { setCode, getCode, editor, setKeybindings };
}
