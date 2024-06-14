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
    Function(code)();
    const node = api.dac(...nodes);
    return node;
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
