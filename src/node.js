export class Node {
  constructor(type, value) {
    this.type = type;
    value !== undefined && (this.value = value);
    this.ins = [];
  }
  withIns(...ins) {
    this.ins = ins;
    return this;
  }
  flatten() {
    return flatten(this);
  }
  apply(fn) {
    return fn(this);
  }
  apply2(fn) {
    // clock(10).seq(51,52,0,53).apply2(hold).midinote().sine().out()
    return fn(this, this);
  }
}

function visit(node, visited = []) {
  visited.push(node);
  node.ins.forEach((child) => {
    if (!visited.includes(child)) {
      visit(child, visited);
    }
  });
  return visited;
}

function flatten(node) {
  const flat = visit(node);
  return flat.map((node) => {
    let clone = {
      type: node.type,
      params: node.params,
      ins: node.ins.map((child) => flat.indexOf(child) + ""),
    };
    node.value !== undefined && (clone.value = node.value);
    return clone;
  });
}

// TODO: find a cool api to register functions (maybe similar to strudel's register)
// so far, node types added here also have to be added to the compiler, as well as NODE_CLASSES (for audio nodes)
// it would be nice if there was a way to define custom functions / nodes / dsp logic in a single place...

// let index = 0;
export const node = (type, value) => new Node(type, value /* , ++index */);

export function n(value) {
  if (typeof value === "object") {
    return value;
  }
  return node("n", value);
}

export let makeNode = (type, name = type.toLowerCase()) => {
  Node.prototype[name] = function (...args) {
    return node(type).withIns(this, ...args.map((v) => n(v)));
  };
  return (...args) => node(type).withIns(...args.map((v) => n(v)));
};

export let adsr = makeNode("ADSR");
export let clock = makeNode("Clock");
export let clockdiv = makeNode("ClockDiv");
export let distort = makeNode("Distort");
export let noise = makeNode("Noise");
export let pulse = makeNode("Pulse");
export let saw = makeNode("Saw");
export let sine = makeNode("Sine");
export let tri = makeNode("Tri");
export let slide = makeNode("Slide");
export let filter = makeNode("Filter");
export let fold = makeNode("Fold");
export let seq = makeNode("Seq");
export let delay = makeNode("Delay");
export let hold = makeNode("Hold");

// non-audio nodes
export let mul = makeNode("mul");
export let add = makeNode("add");
export let div = makeNode("div");
export let sub = makeNode("sub");
export let mod = makeNode("mod"); // untested
export let range = makeNode("range");
export let midinote = makeNode("midinote");
export let out = makeNode("out");

Node.prototype.perc = function (decay) {
  return this.adsr(0, decay, 0, 0);
};

Node.prototype.over = function (fn) {
  return this.apply((x) => add(x, fn(x)));
};

export function getInletName(type, index) {
  if (!NODE_SCHEMA[type]?.ins?.[index]) {
    return "";
  }
  return NODE_SCHEMA[type].ins[index].name;
}

// not implemented noisecraft nodes
// TODO:
// Greater, Scope, ClockOut, MidiIn, Scope, BitCrush?
// Different Names:
// Add (=add), AudioOut (=out), Const (=n)
// WONT DO:
// delay_read, delay_write, GateSeq, MonoSeq, hold_read, hold_write, Knob, MonoSeq, Nop, Notes (text note), Module

// this schema is currently only relevant for audio nodes, using, flags dynamic & time, + ins[].default
// TODO: compress format?

export const NODE_SCHEMA = {
  ADSR: {
    ins: [
      { name: "gate", default: 0 },
      { name: "att", default: 0.02 },
      { name: "dec", default: 0.1 },
      { name: "sus", default: 0.2 },
      { name: "rel", default: 0.1 },
    ],
    time: true, // if set, the update function will get time as first param
    outs: ["out"],
    params: [],
    description: "ADSR envelope generator",
  },
  range: {
    audio: false,
    ins: [{ name: "in" }, { name: "min" }, { name: "max" }],
  },
  Clock: {
    ins: [{ name: "bpm", default: 120 }],
    outs: [""],
    params: [
      { name: "minVal", default: 60 },
      { name: "maxVal", default: 240 },
      { name: "value", default: 120 },
      { name: "deviceId", default: null },
      { name: "controlId", default: null },
    ],
    description: "MIDI clock signal source with tempo in BPM",
  },
  ClockDiv: {
    ins: [
      { name: "clock", default: 0 },
      { name: "divisor", default: 2 },
    ],
    outs: [""],
    params: [],
    description: "clock signal divider",
  },
  Delay: {
    ins: [
      { name: "in", default: 0 },
      { name: "time", default: 0 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "delay line",
  },
  Distort: {
    ins: [
      { name: "in", default: 0 },
      { name: "amt", default: 0 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "overdrive-style distortion",
  },
  Filter: {
    ins: [
      { name: "in", default: 0 },
      { name: "cutoff", default: 1 },
      { name: "reso", default: 0 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "classic two-pole low-pass filter",
  },
  Fold: {
    ins: [
      { name: "in", default: 0 },
      { name: "rate", default: 0 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "wavefolder",
  },
  Seq: {
    dynamic: true, // dynamic number of inlets
    ins: [
      { name: "clock", default: 0 },
      // 1-Infinity of steps
    ],
    outs: [],
    params: [],
    state: [],
    description: "step sequencer",
  },
  Hold: {
    ins: [
      { name: "in", default: 0 },
      { name: "trig", default: 0 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "sample and hold",
  },
  // MIDI input node
  // chanNo is the channel to accept input from (null means any channel)
  MidiIn: {
    ins: [],
    outs: ["freq", "gate"],
    params: [
      { name: "octaveNo", default: 3 },
      { name: "chanNo", default: null },
    ],
    state: [],
    description: "MIDI note input (cv/gate)",
  },
  Mod: {
    ins: [
      { name: "in0", default: 0 },
      { name: "in1", default: 1 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "floating-point modulo",
  },
  Mul: {
    ins: [
      { name: "in0", default: 1 },
      { name: "in1", default: 1 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "multiply input waveforms",
  },
  Noise: {
    ins: [],
    outs: ["out"],
    params: [
      { name: "minVal", default: -1 },
      { name: "maxVal", default: 1 },
    ],
    state: [],
    description: "white noise source",
  },
  Pulse: {
    ins: [
      { name: "freq", default: 0 },
      { name: "pw", default: 0.5 },
    ],
    outs: ["out"],
    params: [
      { name: "minVal", default: -1 },
      { name: "maxVal", default: 1 },
    ],
    state: [],
    description: "pulse/square oscillator",
  },
  Saw: {
    ins: [{ name: "freq", default: 0 }],
    outs: ["out"],
    params: [
      { name: "minVal", default: -1 },
      { name: "maxVal", default: 1 },
    ],
    state: [],
    description: "sawtooth oscillator",
  },
  /*   Scope: {
    ins: [{ name: "", default: 0 }],
    outs: [],
    params: [
      { name: "minVal", default: -1 },
      { name: "maxVal", default: 1 },
    ],
    state: [],
    description: "scope to plot incoming signals",
    sendRate: 20,
    sendSize: 5,
    historyLen: 150,
  }, */
  Sine: {
    ins: [
      { name: "freq", default: 0 },
      { name: "sync", default: 0 },
    ],
    outs: ["out"],
    params: [
      { name: "minVal", default: -1 },
      { name: "maxVal", default: 1 },
    ],
    state: [],
    description: "sine wave oscillator",
  },
  Slide: {
    ins: [
      { name: "in", default: 0 },
      { name: "rate", default: 1 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "simple slew-rate limiter using a running average",
  },
  Tri: {
    ins: [{ name: "freq", default: 0 }],
    outs: ["out"],
    params: [
      { name: "minVal", default: -1 },
      { name: "maxVal", default: 1 },
    ],
    state: [],
    description: "triangle wave oscillator",
  },
};
