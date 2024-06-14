import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import "./graphviz";
import "./index.css";
import { SalatRepl } from "@kabelsalat/core";

const tremoloSine = `sine(220)
.mul(sine(4).range(.5,1))
.out()`;

function App() {
  const repl = new SalatRepl();

  let urlCode = window.location.hash.slice(1);
  if (urlCode) {
    urlCode = atob(urlCode);
    console.log("loaded code from url!");
  }
  const initialCode = urlCode || tremoloSine;
  let [code, setCode] = createSignal(initialCode);
  let container;
  async function run() {
    const node = repl.evaluate(code());
    node.render(container); // update viz
    window.location.hash = "#" + btoa(code());
    repl.play(node);
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
              repl.stop();
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
          onClick={() => run()}
        >
          run the code to see graph... (tap somewhere here on mobile)
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

render(() => <App />, document.getElementById("root"));
