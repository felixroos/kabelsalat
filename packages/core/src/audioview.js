import "./compiler.js"; // Node.prototype.compile
import { assert } from "./utils.js";
import { MIDI, parseMidiMessage } from "./midi.js";

// what follows are attempts at importing the worklet as a url
// the problem: when ?url is used, the worklet.js file itself is not bundled.
// the import "import { AudioGraph } from "./audiograph.js";" does not work when bundling iife
// also see: https://github.com/vitejs/vite/issues/6757

// /assets/worklet-FAueYngB.js
// iife: DOMException: The user aborted a request.
// mjs: works
import workletUrl from "./worklet.js?worker&url";

// ae(t){return new Worker("/assets/worklet-FAueYngB.js",{name:t?.name})}
// iife: DOMException: The user aborted a request.
// mjs: DOMException: The user aborted a request.
//import workletUrl from "./worklet.js?worker";

// data:text/javascript;base64,aW1wb3.....
// iife: TypeError: Failed to resolve module specifier "./audiograph.js". Invalid relative url or base scheme isn't hierarchical.
// mjs: TypeError: Failed to resolve module specifier "./audiograph.js". Invalid relative url or base scheme isn't hierarchical.
//import workletUrl from "./worklet.js?url";

// workletUrl.toString() = data:text/javascript;base64,aW1wb3.....
// iife: TypeError: Failed to resolve module specifier "./audiograph.js". Invalid relative url or base scheme isn't hierarchical.
// mjs: TypeError: Failed to resolve module specifier "./audiograph.js". Invalid relative url or base scheme isn't hierarchical.
//const workletUrl = new URL("./worklet.js", import.meta.url);

// potential solutions:
// https://github.com/vitejs/vite/issues/15431#issuecomment-1870052169 // didn't work:

/* const modules = import.meta.glob(["./worklet.js"]);
// get the path of the built module.
const importPathRegex = /import\(['"]([^'"]+)['"]\)/;
const importStatement = Object.values(modules)[0].toString();
console.log("importStatement", importStatement);
const match = importStatement.match(importPathRegex);
let workletUrl = "";
if (match) {
  const path = match[1];
  workletUrl = path;
  } */

// https://stackoverflow.com/questions/76324021/how-to-package-npm-module-with-audioworklet // not tried yet

// console.log("workletUrl", workletUrl);

export class AudioView {
  constructor() {
    this.ugenOffset = 0;
  }
  async updateGraph(node) {
    const { src, audioThreadNodes } = node.compile({
      log: true,
      ugenOffset: this.ugenOffset,
    });
    if (
      !this.midiInited &&
      audioThreadNodes.some((node) => node.startsWith("Midi"))
    ) {
      this.initMidi();
    }
    if (!this.audioIn && audioThreadNodes.some((node) => node === "AudioIn")) {
      await this.initAudioIn();
    }

    this.send({
      type: "NEW_UNIT",
      unit: { src, audioThreadNodes, ugenOffset: this.ugenOffset },
    });
    this.ugenOffset += audioThreadNodes.length;
  }

  async initAudioIn() {
    console.log("init audio input...");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    const inputNode = this.audioCtx.createMediaStreamSource(stream);
    inputNode.connect(this.audioWorklet);
  }
  initMidi() {
    console.log("init midi input...");
    this.midiInited = true;
    const midi = new MIDI();
    midi.on("midimessage", (_, message) => {
      const msg = parseMidiMessage(message);
      msg && this.send(msg);
    });
  }

  /**
   * Send a message to the audio thread (audio worket)
   */
  send(msg) {
    assert(msg instanceof Object);

    if (!this.audioWorklet) return;

    this.audioWorklet.port.postMessage(msg);
  }

  async init() {
    if (this.audioCtx) {
      return;
    }
    assert(!this.audioCtx);

    this.audioCtx = new AudioContext({
      latencyHint: "interactive",
      sampleRate: 44100,
    });
    // This seems to be necessary for Safari
    this.audioCtx.resume();

    await this.audioCtx.audioWorklet.addModule(workletUrl);

    this.audioWorklet = new AudioWorkletNode(
      this.audioCtx,
      "sample-generator",
      {
        outputChannelCount: [2],
      }
    );
    // Callback to receive messages from the audioworklet
    this.audioWorklet.port.onmessage = (msg) => {
      // console.log("msg from worklet", msg);
      const type = msg.data.type;
      if (type === "STOP") {
        const lash = 200;
        setTimeout(() => this.destroy(), msg.data.fadeTime * 1000 + lash);
      }
    };
    this.audioWorklet.connect(this.audioCtx.destination);
  }

  get isRunning() {
    return !!this.audioCtx;
  }

  destroy() {
    this.audioWorklet.disconnect();
    this.audioWorklet = null;

    this.audioCtx.close();
    this.audioCtx = null;
  }

  /**
   * Stop audio playback
   */
  stop() {
    assert(this.audioCtx);
    this.send({ type: "STOP" });
  }

  set fadeTime(fadeTime) {
    this.send({ type: "FADE_TIME", fadeTime });
  }
}
