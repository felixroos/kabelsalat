import { assert } from "@kabelsalat/lib/src/utils.js";
import "@kabelsalat/core/src/compiler.js"; // Node.prototype.compile
import { MIDI, parseMidiMessage } from "@kabelsalat/lib/src/midi.js";
import { Mouse } from "@kabelsalat/lib/src/mouse.js";
import workletUrl from "./worklet.js?worker&url";
import recorderUrl from "./recorder.js?worker&url";
import { audioBuffersToWav } from "./wav.js";
import { register } from "@kabelsalat/core";
import * as js from "@kabelsalat/lib/src/lang/js.js";

export class AudioView {
  constructor() {
    this.ugens = new Map();
  }
  async updateGraph(node) {
    const { src, ugens, registers } = node.compile({
      log: false,
    });
    this.initMouse();
    if (
      !this.midiInited &&
      ugens.some((ugen) => ugen.type.startsWith("Midi"))
    ) {
      this.initMidi();
    }
    if (!this.audioIn && ugens.some((ugen) => ugen.type === "AudioIn")) {
      await this.initAudioIn();
    }
    this.sendUgens();
    this.send({
      type: "NEW_UNIT",
      unit: { src, ugens, registers },
    });
  }

  // ugen is expected to be a class
  registerUgen(ugen) {
    this.ugens.set(ugen.name, ugen);
  }
  sendUgens() {
    for (let [name, ugen] of this.ugens) {
      this.send({
        type: "SET_UGEN",
        className: name,
        ugen: ugen + "",
      });
    }
  }

  scheduleMessage(msg, time) {
    this.send({
      type: "SCHEDULE_MSG",
      msg,
      time,
    });
  }

  setControl(id, value, time) {
    const msg = {
      type: "SET_CONTROL",
      id,
      value,
    };
    if (time) {
      this.send({ type: "SCHEDULE_MSG", time, msg });
    } else {
      this.send(msg);
    }
  }

  // controls: { id, value, time }[]
  setControls(controls) {
    const msg = {
      type: "BATCH_MSG",
      messages: controls.map((c) => {
        const msg = { type: "SET_CONTROL", id: c.id, value: c.value };
        if (c.time === undefined) {
          return msg;
        }
        return {
          type: "SCHEDULE_MSG",
          time: c.time,
          msg,
        };
      }),
    };
    this.send(msg);
  }

  async initAudioIn() {
    console.log("init audio input...");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
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
  initMouse() {
    this.mouse = new Mouse();
    this.mouse.on("move", (x, y) => {
      this.setControl("mouseX", x);
      this.setControl("mouseY", y);
    });
  }

  /**
   * Send a message to the audio thread (audio worket)
   */
  send(msg) {
    assert(msg instanceof Object);
    // make sure to init before callilng send..
    if (!this.audioWorklet) {
      // console.warn("message sent before audioworklet was ready...", msg);
      return;
    }

    this.audioWorklet.port.postMessage(msg);
  }

  async init() {
    if (this.audioCtx) {
      // console.warn("no context");
      return;
    }
    assert(!this.audioCtx);

    this.audioCtx = new AudioContext({
      latencyHint: "interactive",
      sampleRate: 44100,
    });
    // This seems to be necessary for Safari
    await this.audioCtx.resume();

    if (!this.audioCtx.audioWorklet) {
      throw new Error(
        "Audio cannot be loaded: non-secure origin? (AudioContext.audioWorklet is undefined)"
      );
    }

    await this.audioCtx.audioWorklet.addModule(workletUrl);
    await this.audioCtx.audioWorklet.addModule(recorderUrl);

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
      window.postMessage({
        type: "KABELSALAT_WORKLET_MSG",
        msg: msg.data,
      });
      const type = msg.data.type;
      if (type === "STOP") {
        const lash = 200;
        setTimeout(() => this.destroy(), msg.data.fadeTime * 1000 + lash);
      }
    };

    this.recorder = new window.AudioWorkletNode(this.audioCtx, "recorder");
    this.audioWorklet.connect(this.recorder);
    this.sendUgens();
    this.recorder.connect(this.audioCtx.destination);

    this.recorder.port.onmessage = (e) => {
      if (e.data.eventType === "data") {
        this.recordedBuffers.push(e.data.audioBuffer);
      }
      if (e.data.eventType === "stop") {
        console.log("recording stopped");
        const bytes = audioBuffersToWav(
          this.recordedBuffers,
          this.audioCtx.sampleRate,
          2
        );
        downloadFile(bytes, "kabelsalat.wav", "audio/wav");
        this.recordedBuffers = [];
      }
    };

    if (this.recordOnPlay) {
      this.record();
    }
  }

  destroy() {
    this.audioWorklet?.disconnect();
    this.audioWorklet = null;

    this.recorder?.disconnect();
    this.recorder = null;

    this.audioCtx?.close();
    this.audioCtx = null;
  }

  /**
   * Stop audio playback
   */
  stop() {
    this.audioCtx && this.send({ type: "STOP" });
    this.mouse?.detach();
  }

  record() {
    if (!this.audioCtx) {
      this.recordOnPlay = true;
      return;
    }

    this.recordedBuffers = [];
    this.recorder.parameters.get("isRecording").setValueAtTime(1, 0);
    console.log("recording started");
  }

  stopRecording() {
    this.recordOnPlay = false;

    if (!this.audioCtx) {
      return;
    }

    this.recorder.parameters.get("isRecording").setValueAtTime(0, 0);
  }

  set fadeTime(fadeTime) {
    this.send({ type: "FADE_TIME", fadeTime });
  }
}

// Trigger a file download in the browser
function downloadFile(bytes, filename, mimeType) {
  const blob = new Blob([bytes], { type: mimeType });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

let listeners = new Map();
export let signal = register(
  "signal",
  (input, id, callback) => {
    if (listeners.has(id)) {
      // will this work with multichannel expansion?
      window.removeEventListener("message", listeners.get(id));
    }
    window.addEventListener("message", function handler(e) {
      if (
        e.data.type === "KABELSALAT_WORKLET_MSG" &&
        e.data.msg.type === "TRIG_MSG" &&
        e.data.msg.id === id
      ) {
        const value = callback(id, e.data.msg.time);
        if (!isNaN(value)) {
          // TODO: pass time
          window.postMessage({
            type: "KABELSALAT_SET_CONTROL",
            value,
            id,
          });
        } else if (value !== undefined) {
          console.warn(
            `expected number from "on" callback with id "${id}", got "${value}" instead.`
          );
        }
      }
      listeners.set(id, handler);
    });
    return getNode("signal", input, id);
  },
  {
    ugen: "Signal",
    compile: ({ vars: [input, id], ...meta }) => {
      return js.defUgen(meta, input, id, "time");
    },
  }
);
