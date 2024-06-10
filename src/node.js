export class Node {
  constructor(type, value, id = s4()) {
    this.type = type;
    value !== undefined && (this.value = value);
    this.ins = [];
    this._id = id;
    this.params = { minVal: -1, maxVal: 1 }; // TODO: how to handle this?
  }
  get id() {
    return `${this._id}`; //:${this.type}`;
  }
  prop(name) {
    return this.value[name];
  }
  get isNode() {
    return true;
  }
  addConnection(node) {
    node.ins.push(this);
    return node;
  }
  isConnectedTo(node) {
    return this.ins.find((n) => n.id === node.id);
  }
  withIns(...ins) {
    this.ins = ins;
    return this;
  }
  connect(node) {
    if (this.isConnectedTo(node)) {
      return node;
    }
    this.addConnection(node);
    return node;
  }
  get label() {
    let str = this.type;
    if (this.value !== undefined) {
      str += ` =${this.value}`;
    }
    return str;
  }
  show(parent) {
    //const connections = this.connections.filter(
    const connections = this.ins.filter((to) => !parent || parent.id !== to.id);
    let str = this.label;
    if (!connections.length) {
      return str;
    }
    str += " <->";
    if (connections.length === 1) {
      return `${str} ${connections[0].show(this)}`;
    }
    return `${str} [${connections.map((node) => node.show(this)).join(", ")}]`;
  }
  visit() {
    return visit(this);
  }
  apply(fn) {
    return fn(this);
  }
  apply2(fn) {
    // clock(10).seq(51,52,0,53).apply2(hold).midinote().sine().out()
    return fn(this, this);
  }
}

// helper function to generate repl ids
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function visit(node, visited = {}) {
  visited[node.id] = node;
  node.ins.forEach((n) => {
    if (!visited[n.id]) {
      visit(n, visited);
    }
  });
  return visited;
}

// TODO: find a cool api to register functions (maybe similar to strudel's register)
// so far, node types added here also have to be added to the compiler, as well as NODE_CLASSES (for audio nodes)
// it would be nice if there was a way to define custom functions / nodes / dsp logic in a single place...

// let index = 0;
export const node = (type, value) => new Node(type, value /* , ++index */);

export function n(value) {
  if (value.isNode) {
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
