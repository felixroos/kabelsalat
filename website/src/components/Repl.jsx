import { Show, createSignal, onCleanup, onMount } from "solid-js";
import "@kabelsalat/graphviz";
import { SalatRepl } from "@kabelsalat/lib";
import { Icon } from "./Icon";
import { Reference } from "./Reference";
import { examples } from "../examples";
import { persistentAtom } from "@nanostores/persistent";
import { useStore } from "@nanostores/solid";
import { History, addToHistory, $history } from "./History";
import { Codemirror, codemirrorView } from "./Codemirror";
import { updateWidgets } from "@kabelsalat/codemirror";

export const $hideWelcome = persistentAtom("hideWelcome", "false");
const hideWelcome = () => $hideWelcome.set("true");
export const $activePanel = persistentAtom("activePanel", "graph");
const setActivePanel = (v) => $activePanel.set(v);

const defaultPatch = `// let's create some notes
let note = clock(150) // clock at 150bpm
.clockdiv(32) // divide clock by 32
.seq(64,0,0,67,0,0,62,0) // use clock for sequence

// use the notes to trigger an envelope
let env = note
.adsr(
  .01, // attack
  sine(.1).range(.1, .3), // modulated decay
  .5 // sustain
)
.mul(.75) // evelope amount

note
.hold(note) // hold notes above zeroes
.midinote() // convert midi numbers to freq
.pulse(.2) // pulse wave with .2 width
.lpf(
  sine(.1).range(.7,.8).mul(env), // modulated cutoff
  // env.mul(.5) // resonance with envelope
)
.mul(env) // amplitude envelope
.add(
  // feedback delay
  x=>x.delay(sine(.03).range(.1,.5)) // modulated delay time
      .mul(.9) // feedback amount
)
.mul(.5) // master level
.out() // send to output`;

let vizSettings = { resolveModules: false, dagify: false };

let TAB_GRAPH = "graph";
let TAB_DOCS = "docs";
let TAB_PATCHES = "browse";
const panels = [TAB_GRAPH, TAB_PATCHES, TAB_DOCS];

function getURLCode() {
  let url = new URL(window.location);
  let patch = url.searchParams.get("p");

  // assume it's a legacy link with "#" when a bit longer.. shorter hash links collide with docs
  if (!patch && window.location.hash.length > 25) {
    patch = window.location.hash.slice(1);
  }

  if (patch) {
    return atob(patch);
  }
  return "";
}

function getInitialCode() {
  return getURLCode() || $history.get()[0]?.code || defaultPatch;
}

function updateCode(code) {
  let url = new URL(window.location);
  url.searchParams.set("p", btoa(code));
  window.history.pushState({}, "", url);
  const firstLine = code.split("\n")[0].slice(0, 30);
  document.title = "🔌" + firstLine;
  addToHistory(code);
}

export function Repl() {
  let [started, setStarted] = createSignal(false);
  const repl = new SalatRepl({
    onToggle: (_started) => setStarted(_started),
    beforeEval: (transpiled) => {
      updateWidgets(codemirrorView(), transpiled.widgets);
    },
  });

  const activePanel = useStore($activePanel);
  const initialCode = getInitialCode();
  let [code, setCode] = createSignal(initialCode);
  let [hideCode, setHideCode] = createSignal(false);
  const welcomeHidden = useStore($hideWelcome);

  let container;
  async function run(_code = code()) {
    // reset fadeTime?
    setCode(_code);
    await repl.audio.init();
    const node = repl.evaluate(_code);
    node.render(container, vizSettings); // update viz
    updateCode(_code);
    repl.play(node);
  }
  let handleKeydown = (e) => {
    // console.log("key", e.code);
    if (e.key === "Enter" && (e.ctrlKey || e.altKey)) {
      run();
    } else if (e.code === "Period" && (e.ctrlKey || e.altKey)) {
      repl.stop();
      e.preventDefault();
    } else if (e.key === "l" && e.ctrlKey) {
      setHideCode((hide) => !hide);
    }
  };
  // todo: make sure clicking anchor links doesn't trigger this..
  let handlePopState = () => setCode(getURLCode());
  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    // window.addEventListener("popstate", handlePopState);
  });
  onCleanup(() => {
    document.removeEventListener("keydown", handleKeydown);
    // window.removeEventListener("popstate", handlePopState);
  });

  return (
    <div class="flex flex-col h-full max-h-full justify-stretch text-teal-600 font-mono">
      <div class="px-4 py-2 space-x-8 font-bold border-b border-stone-800 flex justify-between items-center select-none">
        <div
          class={`font-bold font-mono text-xl
        bg-gradient-to-r from-teal-400 to-fuchsia-300 inline-block text-transparent bg-clip-text
        `}
        >
          🔌 kabelsalat
        </div>
        <div class="flex justify-start items-center space-x-4 font-light">
          <button
            onClick={() => (started() ? repl.stop() : run())}
            class="items-center flex space-x-1 hover:opacity-50"
          >
            {!started() ? (
              <>
                <Icon type="play" />
                <span class="animate-pulse hidden sm:block">play</span>
              </>
            ) : (
              <>
                <Icon type="stop" />
                <span class="hidden sm:block">stop</span>
              </>
            )}
          </button>
          <button
            onClick={() => run()}
            class="items-center flex space-x-1 hover:opacity-50"
          >
            <Icon type="refresh" />
            <span class="hidden sm:block">run</span>
          </button>
          <a
            class="items-center flex space-x-1 hover:opacity-50"
            href="/learn"
          >
            <Icon type="learn" />
            <span class="hidden sm:block">learn</span>
          </a>
        </div>
      </div>
      {welcomeHidden() === "false" && (
        <div class="px-4 py-2 border-b border-stone-800 grow-0 text-sm text-stone-400 flex items-center justify-between">
          <div>
            <p>
              👋 welcome to kabelsalat, a very experimental audio graph live
              coding prototype.{" "}
              <a class="underline" href="/learn">
                learn more
              </a>
            </p>
            <p class="hidden sm:block">
              👉 keyboard shortcuts:{" "}
              <span class="bg-stone-700">ctrl + enter</span> to run,{" "}
              <span class="bg-stone-700">ctrl + .</span> to stop
            </p>
          </div>
          <div>
            <button class="underline" onClick={() => hideWelcome()}>
              dismiss
            </button>
          </div>
        </div>
      )}
      <div class="grid sm:grid-cols-2 flex-auto shrink grow overflow-hidden">
        {!hideCode() && <Codemirror code={code()} onChange={setCode} />}
        <div
          class={`hidden sm:flex flex-col h-full overflow-hidden${
            hideCode() ? " col-span-2" : " border-l border-stone-800"
          }`}
        >
          <nav class={`border-b border-stone-800 py-0 px-4 flex space-x-4`}>
            <For each={panels}>
              {(panel) => (
                <div
                  onClick={() => setActivePanel(panel)}
                  class={
                    `select-none hover:opacity-50 cursor-pointer text-teal-600 py-1 ` +
                    (activePanel() === panel
                      ? `border-b-2 border-teal-600`
                      : "")
                  }
                >
                  {panel}
                </div>
              )}
            </For>
          </nav>
          <div
            class={`select-none bg-stone-900 overflow-auto text-gray-500 p-4 grow-0 h-full`}
          >
            <Show when={activePanel() === TAB_GRAPH}>
              <div
                ref={(el) => {
                  container = el;
                  repl.evaluate(code()).render(container, vizSettings);
                }}
              ></div>
            </Show>
            <Show when={activePanel() === TAB_DOCS}>
              <div class="prose prose-invert">
                <h2>reference</h2>
                <Reference />
              </div>
            </Show>
            <Show when={activePanel() === TAB_PATCHES}>
              <h2 class="text-xl text-white pb-4">examples</h2>
              <For each={examples}>
                {(example) => (
                  <div class="not-prose">
                    <a
                      class={`text-teal-600 cursor-pointer hover:opacity-50${
                        code() === example.code
                          ? " border-b border-teal-600"
                          : ""
                      }`}
                      onClick={() => run(example.code)}
                    >
                      {example.label}
                    </a>
                  </div>
                )}
              </For>
              <History code={code()} run={run} />
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
