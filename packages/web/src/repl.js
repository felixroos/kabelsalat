import * as core from "@kabelsalat/core/src/index.js";
import * as compiler from "@kabelsalat/core/src/compiler.js";
import * as lib from "@kabelsalat/lib/src/lib.js";
import { AudioView } from "./audioview.js";

export class SalatRepl {
  constructor({
    onToggle,
    onToggleRecording,
    beforeEval,
    transpiler,
    localScope = false,
    outputNode = null,
  } = {}) {
    this.outputNode = outputNode;
    this.audio = new AudioView(this.outputNode);
    this.onToggle = onToggle;
    this.transpiler = transpiler;
    this.onToggleRecording = onToggleRecording;
    this.beforeEval = beforeEval;
    this.localScope = localScope;
    if (typeof window !== "undefined") {
      if (!localScope) {
        Object.assign(globalThis, core);
        Object.assign(globalThis, lib);
        Object.assign(globalThis, compiler);
        Object.assign(globalThis, { repl: this });
      }
      // update state when sliders are moved
      // TODO: remove listener?
      // TODO: could this get problematic for multiple SalatRepl instances in parallel?
      window.addEventListener("message", (e) => {
        if (e.data.type === "KABELSALAT_SET_CONTROL") {
          this.audio.setControl(e.data.id, e.data.value);
        }
      });
    }
    const self = this;
    // this is the "dynamic" alternative to .out
    core.Node.prototype.spawn = function (channels = [0, 1], duration) {
      self.audio.spawn(this.output(channels).exit(), duration);
    };
  }

  registerUgen(type, implementation) {
    this.audio.registerUgen(implementation);
    return lib.registerUgen(type, implementation.name);
  }

  evaluate(code) {
    if (!this.localScope) {
      // re-assign instance specific scope before each eval..
      Object.assign(globalThis, { audio: this.audio });
      Object.assign(globalThis, {
        addUgen: this.registerUgen.bind(this),
      });
    }
    let transpiled;
    if (this.transpiler) {
      transpiled = this.transpiler(code);
    } else {
      transpiled = { output: code };
    }
    this.beforeEval?.(transpiled);
    let scope;
    if (this.localScope) {
      scope = {
        ...core,
        ...lib,
        ...compiler,
        audio: this.audio,
        addUgen: this.registerUgen.bind(this),
        repl: this,
      };
    }
    return core.evaluate(transpiled.output, scope);
  }
  async play(node) {
    await this.audio.init();
    if (node.ins.length) {
      this.audio.spawn(node);
    }
    this.onToggle?.(true);
  }
  run(code) {
    const node = this.evaluate(code);
    this.play(node);
  }
  stop() {
    this.stopRecording();
    this.audio.stop();
    this.onToggle?.(false);
  }
  record() {
    this.audio.record();
    this.onToggleRecording?.(true);
  }
  stopRecording() {
    this.audio.stopRecording();
    this.onToggleRecording?.(false);
  }
}
