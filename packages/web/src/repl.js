import * as core from "@kabelsalat/core/src/index.js";
import * as compiler from "@kabelsalat/core/src/compiler.js";
import * as lib from "@kabelsalat/lib/src/lib.js";
import * as strudel from "@kabelsalat/strudel";

import { AudioView } from "./audioview.js";

export class SalatRepl {
  constructor({
    onToggle,
    onToggleRecording,
    beforeEval,
    transpiler,
    localScope = false,
  } = {}) {
    this.audio = new AudioView();
    this.onToggle = onToggle;
    this.transpiler = transpiler;
    this.onToggleRecording = onToggleRecording;
    this.beforeEval = beforeEval;
    this.localScope = localScope;
    const scope = { ...core, ...lib, ...compiler, ...strudel, repl: this };
    if (typeof window !== "undefined") {
      if (!localScope) {
        Object.assign(globalThis, scope);
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
  }

  registerUgen(type, implementation) {
    this.audio.registerUgen(implementation);
    return lib.registerUgen(type, implementation.name);
  }

  evaluate(code) {
    const innerScope = {
      audio: this.audio,
      addUgen: this.registerUgen.bind(this),
      repl: this,
    };
    if (!this.localScope) {
      // re-assign instance specific scope before each eval..
      Object.assign(globalThis, innerScope);
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
        ...scope,
        ...innerScope,
      };
    }
    return core.evaluate(transpiled.output, scope);
  }
  async play(node) {
    await this.audio.init();
    this.audio.updateGraph(node);
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
