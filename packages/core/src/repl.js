import { AudioView } from "./audioview.js";
import * as api from "./node.js";

export class SalatRepl {
  constructor() {
    this.audio = new AudioView();
    Object.assign(globalThis, api);
  }
  evaluate(code) {
    return api.evaluate(code);
  }
  async play(node) {
    if (!this.audio.isRunning) {
      await this.audio.init();
    }
    this.audio.updateGraph(node);
  }
  stop() {
    this.audio.stop();
  }
}
