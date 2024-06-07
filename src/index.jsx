/* @refresh reload */
import { render } from "solid-js/web";
import { assert } from "./util";
import { createSignal, createEffect } from "solid-js";
import "./index.css";
import "./node";
import { node, n, saw, sine } from "./node";
import "./graphviz";
import "./compiler";
import workletUrl from "./worklet.js?url";

class AudioView {
  updateGraph(node) {
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
  let [code, setCode] = createSignal(
    //`sine(sine(2).range(200,210)).mul(.25).out()` // vibrato
    // `sine(110).mul(sine(8).range(1,2)).mul(.25).out()` // tremolo
    // `sine(110).mul(sine(saw(.5).range(1,16)).range(1,2)).mul(.25).out()` // modulated tremolo
    //`saw(sine(8).range(110,114)).mul(.1).out()`
    `sine(n(200).mul(sine(154))).mul(.25).out()`
  );
  let container;
  async function run() {
    const node = eval(code()); // run code TBD: don't use eval
    audio.updateGraph(node); // update dsp
    node.render(container); // update viz
  }
  return (
    <div className="flex flex-col h-full justify-stretch text-teal-600 font-mono">
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
      <textarea
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            run();
          } else if (e.key === "." && e.ctrlKey) {
            stop();
          }
        }}
        className="bg-stone-900 grow shrink-0 p-4 focus:ring-0 outline-0 border-b border-teal-500"
        spellcheck="false"
        value={code()}
        onInput={(e) => setCode(e.target.value)}
      ></textarea>
      <div
        class="bg-stone-900 overflow-auto text-gray-500 grow-0 p-4"
        ref={container}
      >
        run the code to see graph...
      </div>
      <div className="px-4 py-2 border-t border-teal-500">
        <p>
          welcome to kabelsalat. this is a very experimental audio graph live
          coding prototype..
        </p>
        <pre>keyboard: ctrl+enter: start, ctrl+dot: stop</pre>
        <pre>
          functions: n(number) saw(freq) sine(freq) .mul(n) .add(n)
          .range(min,max)
        </pre>
      </div>
    </div>
  );
}

render(() => <App />, document.getElementById("root"));
