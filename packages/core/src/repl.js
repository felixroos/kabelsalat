import { AudioView } from "./audioview.js";
import * as api from "./node.js";

export class SalatRepl {
  constructor() {
    this.audio = new AudioView();
    Object.assign(globalThis, api);
  }
  evaluate(code) {
    let nodes = [];
    api.Node.prototype.out = function () {
      nodes.push(this);
    };
    try {
      Function(code)();
      const node = api.dac(...nodes).exit();
      return node;
    } catch (err) {
      console.error(err);
      return api.n(0);
    }
  }
  async play(node) {
    if (!this.audio.isRunning) {
      await this.audio.init();
    }
    node.dagify();
    this.audio.updateGraph(node);
  }
  stop() {
    this.audio.stop();
  }
}
