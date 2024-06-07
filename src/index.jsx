/* @refresh reload */
import { render } from "solid-js/web";
import { createSignal, createEffect } from "solid-js";
import "./index.css";
import "./lib";
import { node, n, saw, sine } from "./lib";
import "./graphviz";
import "./compiler";

// library
function App() {
  //let [code, setCode] = createSignal("saw(n(220).mul(saw(2))).out()");
  let [code, setCode] = createSignal(
    //"saw(220).add(saw(2).mul(.2)).mul(.5).out()"
    //"saw(220).add(saw(2).range(0,.5)).mul(.5).out()"
    //"sine(200).add(sine(4).range(0,-.5)).out()"// "n(.5).range(100,200).out()" // worx
    //`sine(sine(101).range(100,200)).mul(.125).out()`
    `sine(sine(2).range(200,210)).mul(.5).out()`
    //`saw(sine(8).range(110,114)).mul(.1).out()`
  );
  let container, scriptNode;
  let ac = new AudioContext();
  function stop() {
    if (scriptNode) {
      scriptNode.disconnect();
    }
  }
  function run() {
    console.log("eval");
    const node = eval(code());
    node.render(container);
    const gen = node.compile();
    stop();
    let type = "audio";
    if (type === "single") {
      console.log("result:", gen());
      return;
    }
    if (type === "poll") {
      for (let i = 0; i < 441; i++) {
        console.log(gen());
      }
      return;
    }
    if (type === "audio") {
      scriptNode = ac.createScriptProcessor(4096, 1, 1);
      scriptNode.onaudioprocess = (audioProcessingEvent) => {
        const outputBuffer = audioProcessingEvent.outputBuffer;
        for (
          let channel = 0;
          channel < outputBuffer.numberOfChannels;
          channel++
        ) {
          const outputData = outputBuffer.getChannelData(channel);
          for (let sample = 0; sample < outputBuffer.length; sample++) {
            // make output equal to the same as the input
            outputData[sample] = gen();
          }
        }
      };
      scriptNode.connect(ac.destination);
    }
  }
  return (
    <div className="flex flex-col h-full justify-stretch">
      <textarea
        onClick={async () => {
          await ac.resume();
        }}
        onKeyPress={(e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            run();
          } else if (e.key === "." && e.ctrlKey) {
            stop();
          }
        }}
        className="bg-stone-800 text-white grow shrink-0"
        value={code()}
        onInput={(e) => setCode(e.target.value)}
      ></textarea>
      <div class="bg-stone-900 overflow-auto grow-0" ref={container}></div>
    </div>
  );
}

render(() => <App />, document.getElementById("root"));
