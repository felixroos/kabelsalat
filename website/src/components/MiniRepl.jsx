import { createSignal } from "solid-js";
import "@kabelsalat/graphviz";
import { SalatRepl } from "@kabelsalat/web";
import { Icon } from "./Icon";

let vizSettings = {
  resolveModules: false,
  dagify: false,
  rankdir: "LR",
  size: 12,
};

export function MiniRepl(props) {
  const initialCode = props.code;
  let [code, setCode] = createSignal(initialCode);
  let [started, setStarted] = createSignal(false);
  const repl = new SalatRepl({ onToggle: (_started) => setStarted(_started) });
  let container;
  async function run() {
    const node = repl.evaluate(code());
    !props.hideGraph && node.render(container, vizSettings); // update viz
    repl.play(node);
  }
  let handleKeydown = (e) => {
    // console.log("key", e.code);
    if (e.key === "Enter" && (e.ctrlKey || e.altKey)) {
      run();
    } else if (e.code === "Period" && (e.ctrlKey || e.altKey)) {
      repl.stop();
      e.preventDefault();
    }
  };

  return (
    <div class="flex flex-col overflow-hidden rounded-md my-4 border border-teal-500 text-teal-600 font-mono">
      <div class="flex bg-teal-600 text-white">
        <button
          class="w-14 hover:bg-teal-700 flex justify-center p-1 border-r border-teal-500"
          onClick={() => (started() ? repl.stop() : run())}
        >
          <Show when={!started()} fallback={<Icon type="stop" />}>
            <Icon type="play" />
          </Show>
        </button>
        <button
          class="w-14 hover:bg-teal-700 flex justify-center py-1"
          onClick={() => run()}
        >
          <Icon type="refresh" />
        </button>
      </div>
      <div class="flex border-b border-stone-700 overflow-hidden">
        <textarea
          rows={Math.min(code().split("\n").length, 10)}
          class="resize-none bg-stone-900 shrink-0 p-4 focus:ring-0 outline-0 grow border-0"
          spellcheck="false"
          value={code()}
          onInput={(e) => setCode(e.target.value)}
          onKeyDown={handleKeydown}
        >
          {code()}
        </textarea>
      </div>
      {!props.hideGraph && (
        <div
          class={`bg-stone-900 overflow-auto text-gray-500 p-4 grow-0 text-center max-h-[400px]`}
          ref={(el) => {
            container = el;
            repl.evaluate(code()).render(container, vizSettings);
          }}
        ></div>
      )}
    </div>
  );
}
