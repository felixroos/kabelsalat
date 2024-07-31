import * as core from "@kabelsalat/core/src/index.js";
import * as compiler from "@kabelsalat/core/src/compiler.js";
import * as lib from "@kabelsalat/lib/src/lib.js";
import { AudioView } from "./audioview.js";
import { transpiler } from "@kabelsalat/transpiler";

export class SalatRepl {
  constructor({ onToggle, beforeEval } = {}) {
    this.audio = new AudioView();
    this.onToggle = onToggle;
    this.beforeEval = beforeEval;
    if (typeof window !== "undefined") {
      Object.assign(globalThis, core);
      Object.assign(globalThis, lib);
      Object.assign(globalThis, compiler);
      Object.assign(globalThis, { audio: this.audio });
      Object.assign(globalThis, {
        addUgen: this.registerUgen.bind(this),
      });
      // update state when sliders are moved
      // TODO: remove listener?
      window.addEventListener("message", (e) => {
        if (e.data.type === "KABELSALAT_SET_CONTROL") {
          this.audio.send({
            type: "SET_CONTROL",
            id: e.data.id,
            value: e.data.value,
          });
        }
      });
    }
  }

  registerUgen(type, implementation) {
    this.audio.registerUgen(implementation);
    return lib.registerUgen(type, implementation.name);
  }

  evaluate(code) {
    const transpiled = transpiler(code);
    this.beforeEval?.(transpiled);
    return core.evaluate(transpiled.output);
  }
  async play(node) {
    await this.audio.init();
    this.audio.updateGraph(node);
    this.onToggle?.(true);
  }
  stop() {
    this.audio.stop();
    this.onToggle?.(false);
  }
}
