/* @refresh reload */
import { render } from "solid-js/web";
import { createSignal, createEffect } from "solid-js";
import "./index.css";
import "./lib";
import { node, n, saw } from "./lib";
import "./graphviz";

// library
function App() {
  let [code, setCode] = createSignal("saw(n(220).mul(saw(2))).out()");
  let container;
  createEffect(() => {
    try {
      const node = eval(code());
      console.log("code", code());
      console.log("node", node.show());
      node.render(container);
    } catch (err) {
      console.log("er", err);
    }
  });
  return (
    <div className="grid h-full">
      <textarea
        className="bg-stone-800 text-white"
        value={code()}
        onInput={(e) => setCode(e.target.value)}
      ></textarea>
      <div class="bg-stone-900" ref={container}></div>
    </div>
  );
}

render(() => <App />, document.getElementById("root"));
