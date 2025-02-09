import { createSignal, onCleanup, onMount, Show } from "solid-js";
import "@kabelsalat/graphviz";
import { SalatRepl } from "@kabelsalat/web";
import { Icon } from "./Icon";
import { Reference } from "./Reference";
import { $settings, Settings } from "./Settings";
import { examples } from "../examples";
import { persistentAtom } from "@nanostores/persistent";
import { useStore } from "@nanostores/solid";
import { $history, addToHistory, History } from "./History";
import { Codemirror, codemirrorView } from "./Codemirror";
import { flash, updateWidgets } from "@kabelsalat/codemirror";
import { transpiler } from "@kabelsalat/transpiler";

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

let vizSettings = { resolveModules: false };

let TAB_GRAPH = "graph";
let TAB_DOCS = "docs";
let TAB_PATCHES = "browse";
let TAB_SETTINGS = "settings";

const panels = [TAB_GRAPH, TAB_PATCHES, TAB_DOCS, TAB_SETTINGS];

function getURLCode() {
  let url = new URL(window.location);
  let patch = window.location.hash
    ? window.location.hash.slice(1)
    : url.searchParams.get("p"); // legacy..

  if (patch) {
    return hash2code(patch);
  }
  return "";
}

function getInitialCode() {
  return getURLCode() || $history.get()[0]?.code || defaultPatch;
}

function updateCode(code) {
  let url = new URL(window.location);
  const hash = code2hash(code);
  window.location.hash = hash;
  const firstLine = code.split("\n")[0].slice(0, 30);
  document.title = firstLine;
  addToHistory(code);
}

export function Repl() {
  const settings = useStore($settings);
  let [started, setStarted] = createSignal(false);
  let [recording, setRecording] = createSignal(false);
  const repl = new SalatRepl({
    transpiler,
    onToggle: (_started) => setStarted(_started),
    onToggleRecording: (_recording) => setRecording(_recording),
    beforeEval: (transpiled) => {
      updateWidgets(codemirrorView(), transpiled.widgets);
      flash(codemirrorView());
    },
  });

  const activePanel = useStore($activePanel);
  const initialCode = getInitialCode();
  let [code, setCode] = createSignal(initialCode);
  let [zen, setZen] = createSignal(false);
  let [graph, setGraph] = createSignal();
  let [error, setError] = createSignal();
  let handleError = (err) => setError(err.message);
  let clearError = (err) => setError();
  const welcomeHidden = useStore($hideWelcome);

  let evaluate = () => {
    const node = repl.evaluate(code());
    setGraph(node);
    return node;
  };

  let container;
  async function run(_code = code()) {
    try {
      // reset fadeTime?
      setCode(_code);
      // await repl.audio.init(); // init also called in repl.play ...
      const node = evaluate();
      node.render(container, vizSettings); // update viz
      updateCode(_code);
      repl.play(node);
      clearError();
    } catch (err) {
      handleError(err);
      console.error(err);
    }
  }
  // todo: make sure clicking anchor links doesn't trigger this..
  // let handlePopState = () => setCode(getURLCode());

  return (
    <div class="flex flex-col h-full max-h-full justify-stretch text-teal-600 font-mono">
      <Show when={!zen()}>
        <div class="px-4 py-2 space-x-8 font-bold border-b border-stone-800 flex justify-between items-center select-none">
          <div
            class={`font-bold font-mono text-xl
        bg-gradient-to-r from-teal-400 to-fuchsia-300 inline-block text-transparent bg-clip-text cursor-pointer`}
            onClick={() => setZen((z) => !z)}>
            🔌 kabelsalat
          </div>
          <Show when={!zen()}>
            <div class="flex justify-start items-center space-x-4 font-light">
              <button
                onClick={() => (started() ? repl.stop() : run())}
                class="items-center flex space-x-1 hover:opacity-50">
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
                class="items-center flex space-x-1 hover:opacity-50">
                <Icon type="refresh" />
                <span class="hidden sm:block">run</span>
              </button>
              <button
                onClick={() =>
                  recording() ? repl.stopRecording() : repl.record()
                }
                class="items-center flex space-x-1 hover:opacity-50">
                {!recording() ? (
                  <>
                    <Icon type="record" />
                    <span class="hidden sm:block">rec</span>
                  </>
                ) : (
                  <>
                    <Icon type="recordstop" />
                    <span class="hidden sm:block">rec.stop</span>
                  </>
                )}
              </button>
              <a
                class="items-center flex space-x-1 hover:opacity-50"
                href="/learn">
                <Icon type="learn" />
                <span class="hidden sm:block">learn</span>
              </a>
            </div>
          </Show>
        </div>
      </Show>
      <Show when={zen()}>
        <div
          class={`font-bold font-mono text-xl ${
            started() ? "animate-pulse" : ""
          } 
        bg-gradient-to-r from-teal-400 to-fuchsia-300 inline-block text-transparent bg-clip-text cursor-pointer fixed top-2 right-4 z-10`}
          onClick={() => setZen((z) => !z)}>
          🔌
        </div>
      </Show>
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
      <div
        class={`grid flex-auto shrink grow overflow-hidden ${
          zen() ? `sm:grid-cols-1` : "sm:grid-cols-2"
        }`}>
        <Codemirror
          settings={settings()}
          code={code()}
          onChange={setCode}
          onEvaluate={() => run()}
          onStop={() => repl.stop()}
        />
        <Show when={!zen()}>
          <div
            class={`hidden sm:flex flex-col h-full overflow-hidden border-l border-stone-800`}>
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
                    }>
                    {panel}
                  </div>
                )}
              </For>
            </nav>
            <div
              id="scroll-container"
              class={`select-none bg-stone-900 overflow-auto text-gray-500 p-4 grow-0 h-full`}>
              <Show when={activePanel() === TAB_GRAPH}>
                <div
                  ref={(el) => {
                    container = el;
                    try {
                      const node = graph() || evaluate();
                      node.render(container, vizSettings);
                      clearError();
                    } catch (err) {
                      handleError(err);
                    }
                  }}></div>
              </Show>
              <Show when={activePanel() === TAB_DOCS}>
                <div class="prose prose-invert">
                  <h2>reference</h2>
                  <Reference />
                </div>
              </Show>
              <Show when={activePanel() === TAB_SETTINGS}>
                <div class="prose prose-invert">
                  <Settings />
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
                        onClick={() => run(example.code)}>
                        {example.label}
                      </a>
                    </div>
                  )}
                </For>
                <History code={code()} run={run} />
              </Show>
            </div>
          </div>
        </Show>
      </div>
      {!!error() && (
        <div class="px-4 py-4 animate-pulse border-t border-stone-800 grow-0 text-sm text-red-500 flex items-center justify-between">
          {error()}
        </div>
      )}
    </div>
  );
}

export function unicodeToBase64(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  const base64String = btoa(String.fromCharCode(...utf8Bytes));
  return base64String;
}

export function base64ToUnicode(base64String) {
  const utf8Bytes = new Uint8Array(
    atob(base64String)
      .split("")
      .map((char) => char.charCodeAt(0))
  );
  const decodedText = new TextDecoder().decode(utf8Bytes);
  return decodedText;
}

export function code2hash(code) {
  return encodeURIComponent(unicodeToBase64(code));
}

export function hash2code(hash) {
  return base64ToUnicode(decodeURIComponent(hash));
}
