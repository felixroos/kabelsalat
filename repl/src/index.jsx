import { createSignal, onCleanup, onMount } from "solid-js";
import { render } from "solid-js/web";
import "./graphviz";
import "./index.css";
import { SalatRepl } from "@kabelsalat/core";

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
.filter(
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

function App() {
  const repl = new SalatRepl();

  function getURLCode() {
    let urlCode = window.location.hash.slice(1);
    if (urlCode) {
      urlCode = atob(urlCode);
    }
    return urlCode || "";
  }

  const initialCode = getURLCode() || defaultPatch;
  let [code, setCode] = createSignal(initialCode);
  let [inited, setInited] = createSignal(false);
  let [hideCode, setHideCode] = createSignal(false);
  let container;
  async function run() {
    const node = repl.evaluate(code());
    node.render(container, vizSettings); // update viz
    window.location.hash = "#" + btoa(code());
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
  let handlePopState = () => setCode(getURLCode());
  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("popstate", handlePopState);
  });
  onCleanup(() => {
    document.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("popstate", handlePopState);
  });

  return (
    <div
      class="flex flex-col h-full max-h-full justify-stretch text-teal-600 font-mono"
      onClick={() => {
        !inited() && run();
        setInited(true);
      }}
    >
      <div class="px-4 py-2 space-x-8 font-bold border-b border-teal-500 flex">
        <marquee class="text-teal-100 w-32">
          KABƎL.SALAT.KABƎL.SALAT.KABƎL.SALAT.KABƎL.SALAT.KABƎL.SALAT
        </marquee>
        <div class="text-yellow-400">
          {!inited() && "click somewhere to play"}
        </div>
      </div>
      <div class="grid grid-cols-2 flex-auto shrink grow overflow-hidden">
        {!hideCode() && (
          <textarea
            class="bg-stone-900 shrink-0 p-4 focus:ring-0 outline-0 border-r border-teal-500"
            spellcheck="false"
            value={code()}
            onInput={(e) => setCode(e.target.value)}
          ></textarea>
        )}
        <div
          class={`bg-stone-900 overflow-auto text-gray-500 p-4 grow-0${
            hideCode() ? " col-span-2" : ""
          }`}
          ref={(el) => {
            container = el;
            repl.evaluate(code()).render(container, vizSettings);
          }}
        ></div>
      </div>
      <div class="px-4 py-2 border-t border-teal-500 grow-0">
        <div class="float-right">
          <a href="https://github.com/felixroos/kabelsalat" target="_blank">
            code on github
          </a>
        </div>
        <p>
          welcome to kabelsalat. this is a very experimental audio graph live
          coding prototype.
        </p>
        <pre>keyboard: ctrl+enter: start, ctrl+dot: stop</pre>
        <code>
          utility functions:{" "}
          {`n(number) .mul(n) .add(n) .range(min,max) .apply(fn)`}
        </code>
        <br />
        <code>
          audio functions:{" "}
          {`adsr(gate, att, dec, sus, rel) clock(bpm) clockdiv(clock, divisor) distort(in, amt) noise() pulse(freq, pw) saw(freq) sine(freq, sync) tri(freq) slide(in, rate) filter(in, cutoff, reso) fold(in, rate) seq(clock, ...steps) delay(in, time) hold(in, trig)`}
        </code>
        {/* clockout(clock) */}
        {/* midiin() */}
        {/* monoseq(clock, gateT) */}
        {/* gateseq(clock, gateT) */}
        <pre></pre>
      </div>
    </div>
  );
}

// make sure html is empy (for hot reloading)
document.getElementById("root").innerHTML = "";

render(() => <App />, document.getElementById("root"));
