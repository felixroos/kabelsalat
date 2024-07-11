import { createEffect, createSignal } from "solid-js";
import { initEditor } from "../codemirror/codemirror";

const [view, setView] = createSignal();
export const codemirrorView = view;

export function Codemirror(props) {
  let cm;
  createEffect(() => {
    if (props.code !== cm.getCode()) {
      cm.setCode(props.code);
    }
  });
  return (
    <div class="resize-none bg-stone-900 shrink-0 focus:ring-0 outline-0 border-0 h-full overflow-hidden">
      <div
        class="w-full max-w-full overflow-hidden h-full"
        ref={(el) => {
          cm = initEditor({
            root: el,
            ...props,
          });
          setView(cm.editor);
        }}
      ></div>
    </div>
  );
}
