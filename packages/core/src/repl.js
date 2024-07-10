import { AudioView } from "./audioview.js";
import * as api from "./index.js";
import * as compiler from "./compiler.js";

export class SalatRepl {
  constructor({ onToggle } = {}) {
    this.audio = new AudioView();
    this.onToggle = onToggle;
    if (typeof window !== "undefined") {
      Object.assign(globalThis, api);
      Object.assign(globalThis, compiler);
      Object.assign(globalThis, { audio: this.audio });
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
  evaluate(code) {
    return api.evaluate(code);
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
