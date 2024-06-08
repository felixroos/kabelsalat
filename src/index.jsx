/* @refresh reload */
import { render } from "solid-js/web";
import { assert } from "./utils";
import { createSignal, createEffect } from "solid-js";
import "./index.css";
import * as api from "./node.js";
import "./graphviz";
import "./compiler";
import workletUrl from "./worklet.js?worker&url";

Object.assign(globalThis, api);

class AudioView {
  updateGraph(node) {
    console.log("node", node);
    const { src, nodes } = node.compile();
    this.send({
      type: "NEW_UNIT",
      unit: { src, nodes },
    });
  }

  /**
   * Send a message to the audio thread (audio worket)
   */
  send(msg) {
    assert(msg instanceof Object);

    if (!this.audioWorklet) return;

    this.audioWorklet.port.postMessage(msg);
  }

  async init() {
    assert(!this.audioCtx);

    this.audioCtx = new AudioContext({
      latencyHint: "interactive",
      sampleRate: 44100,
    });
    await this.audioCtx.audioWorklet.addModule(workletUrl);
    this.audioWorklet = new AudioWorkletNode(
      this.audioCtx,
      "sample-generator",
      {
        outputChannelCount: [2],
      }
    );
    // Callback to receive messages from the audioworklet
    this.audioWorklet.port.onmessage = (msg) => {
      console.log("msg from worklet", msg);
    };
    this.audioWorklet.connect(this.audioCtx.destination);
  }

  /**
   * Stop audio playback
   */
  stopAudio() {
    assert(this.audioCtx);

    this.audioWorklet.disconnect();
    this.audioWorklet = null;

    this.audioCtx.close();
    this.audioCtx = null;
  }
}

const audio = new AudioView();

document.addEventListener("click", () => {
  !audio.audioCtx && audio.init();
});

// library
function App() {
  let urlCode = window.location.hash.slice(1);
  if (urlCode) {
    urlCode = atob(urlCode);
    console.log("loaded code from url!");
  }
  const initialCode = urlCode || `sine(n(200).mul(sine(154))).mul(.25).out()`;
  let [code, setCode] = createSignal(initialCode);
  let container;
  async function run() {
    const body = `return ${code()}`;

    console.log("run", body);
    const node = Function(body)();

    audio.updateGraph(node); // update dsp
    window.location.hash = "#" + btoa(code());
    node.render(container); // update viz
  }
  return (
    <div className="flex flex-col  h-full max-h-full justify-stretch text-teal-600 font-mono ">
      <div className="px-4 py-2  font-bold border-b border-teal-500 flex">
        <marquee className="text-teal-100">KABƎL.SALAT</marquee>
        <marquee className="text-teal-200">KABƎL.SALAT</marquee>
        <marquee className="text-teal-300">KABƎL.SALAT</marquee>
        <marquee className="text-teal-400">KABƎL.SALAT</marquee>
        <marquee className="text-teal-500">KABƎL.SALAT</marquee>
        <marquee className="text-teal-600">KABƎL.SALAT</marquee>
        <marquee className="text-teal-700">KABƎL.SALAT</marquee>
        <marquee className="text-teal-800">KABƎL.SALAT</marquee>
        <marquee className="text-teal-900">KABƎL.SALAT</marquee>
      </div>
      <div className="grid grid-cols-2 flex-auto">
        <textarea
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              run();
            } else if (e.key === "." && e.ctrlKey) {
              stop();
            }
          }}
          className="bg-stone-900 shrink-0 p-4 focus:ring-0 outline-0 border-r border-teal-500"
          spellcheck="false"
          value={code()}
          onInput={(e) => setCode(e.target.value)}
        ></textarea>
        <div
          class="bg-stone-900 overflow-auto text-gray-500 p-4 grow-0"
          ref={container}
        >
          run the code to see graph...
        </div>
      </div>
      <div className="px-4 py-2 border-t border-teal-500 grow-0">
        <div className="float-right">
          <a href="https://github.com/felixroos/kabelsalat" target="_blank">
            code on github
          </a>
        </div>
        <p>
          welcome to kabelsalat. this is a very experimental audio graph live
          coding prototype..
        </p>
        <pre>keyboard: ctrl+enter: start, ctrl+dot: stop</pre>
        <code>
          utility functions: n(number) .mul(n) .add(n) .range(min,max){" "}
        </code>
        <br />
        <code>
          audio functions:{" "}
          {`adsr(gate, att, dec, sus, rel) clock() clockdiv() clockout(clock) delay(in, time) distort(in, amt) hold(in, trig) noise() pulse(freq, pw) saw(freq) sine(freq, sync) tri(freq) slide(in, rate) filter(in, cutoff, reso) fold(in, rate) midiin() monoseq(clock, gateT) gateseq(clock, gateT)`}
        </code>
        <pre></pre>
      </div>
    </div>
  );
}

render(() => <App />, document.getElementById("root"));
