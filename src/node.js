import { NODE_CLASSES } from "./audiograph";

export class Node {
  constructor(type, value) {
    this.type = type;
    value !== undefined && (this.value = value);
    this.ins = [];
    this._id = s4();
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
  visitKeyed() {
    return visitKeyed(this);
  }
}

// helper function to generate repl ids
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function visit(node, visited = []) {
  visited.push(node);
  node.ins.forEach((n) => {
    if (!visited.find((_n) => _n.id === n.id)) {
      visit(n, visited);
    }
  });
  return visited;
}

function visitKeyed(node, visited = {}) {
  visited[node.id] = node;
  node.ins.forEach((n) => {
    if (!visited[n.id]) {
      visitKeyed(n, visited);
    }
  });
  return visited;
}

// TODO: find a cool api to register functions (maybe similar to strudel's register)
// so far, node types added here also have to be added to the compiler, as well as NODE_CLASSES (for audio nodes)
// it would be nice if there was a way to define custom functions / nodes / dsp logic in a single place...

export const node = (type, value) => new Node(type, value);

export function n(value) {
  if (value.isNode) {
    return value;
  }
  return node("n", value);
}

let makeNode = (type, name = type.toLowerCase()) => {
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
//export let clockOut = makeNode("ClockOut"); // only sends worklet msg so far...
//export let delay = makeNode("Delay"); // requires special compiler feature
//export let hold = makeNode("Hold"); // requires special compiler feature
//export let midiIn = makeNode("MidiIn"); // not implemented
//export let monoSeq = makeNode("MonoSeq"); // state too complex?
//export let gateSeq = makeNode("GateSeq"); // state too complex?

Node.prototype.mul = function (value) {
  return this.connect(n(value).connect(node("mul")));
};
Node.prototype.range = function (min, max) {
  return node("range").withIns(this, n(min), n(max));
};
Node.prototype.add = function (value) {
  return this.connect(n(value).connect(node("add")));
};
Node.prototype.filter = function (cutoff = 1, resonance = 0) {
  return node("Filter").withIns(this, n(cutoff), n(resonance));
};

Node.prototype.out = function () {
  return this.connect(node("out"));
};

export const NODE_SCHEMA = {
  Add: {
    ins: [
      { name: "in0", default: 0 },
      { name: "in1", default: 0 },
    ],
    outs: ["out"],
    params: [],
    description: "add input waveforms",
  },

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

  AudioOut: {
    unique: true,
    ins: [
      { name: "left", default: 0 },
      { name: "right", default: 0 },
    ],
    outs: [],
    params: [],
    description: "stereo sound output",
  },

  /*
    'BitCrush': {
        ins: [
            { name: '', default: 0 }
        ],
        outs: [''],
        params: [
            { name: 'bitdepth', default: 8 },
            { name: 'factor', default: 1 },
        ],
        description: 'bitcrusher distortion',
    },
    */

  /*   Clock: {
    ins: [],
    outs: [""],
    params: [
      { name: "minVal", default: 60 },
      { name: "maxVal", default: 240 },
      { name: "value", default: 120 },
      { name: "deviceId", default: null },
      { name: "controlId", default: null },
    ],
    description: "MIDI clock signal source with tempo in BPM",
  }, */

  /* ClockDiv: {
    ins: [{ name: "division", default: 0 }],
    outs: [""],
    params: [{ name: "factor", default: 2 }],
    description: "clock signal divider",
  }, */

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

  ClockOut: {
    unique: true,
    time: true,
    ins: [{ name: "clock", default: 0 }],
    outs: [],
    params: [],
    description: "MIDI output for clock signal",
  },

  Const: {
    ins: [],
    outs: [""],
    params: [{ name: "value", default: 0 }],
    state: [],
    description: "editable constant value",
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

  // Used during compilation, reads from a delay line
  delay_read: {
    internal: true,
    ins: [{ name: "time", default: 0 }],
    outs: ["out"],
    params: [],
    state: [],
  },

  // Used during compilation, writes to a delay line
  delay_write: {
    internal: true,
    ins: [
      { name: "in", default: 0 },
      { name: "time", default: 0 },
    ],
    outs: [],
    params: [],
    state: [],
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

  Div: {
    ins: [
      { name: "in0", default: 0 },
      { name: "in1", default: 1 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "divide one input by another",
  },

  Equal: {
    ins: [
      { name: "in0", default: 0 },
      { name: "in1", default: 1 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "compare two values (a == b)",
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

  GateSeq: {
    time: true,
    ins: [
      { name: "clock", default: 0 },
      { name: "gateT", default: 0.1 },
    ],
    outs: [],
    params: [],
    state: ["numRows", "patterns", "curPattern"],
    description: "step sequencer with multiple gate outputs",
  },

  Greater: {
    ins: [
      { name: "in0", default: 0 },
      { name: "in1", default: 1 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "compare two values (a > b)",
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

  // Used during compilation, reads from a sample and hold
  hold_read: {
    internal: true,
    ins: [],
    outs: ["out"],
    params: [],
    state: [],
  },

  // Used during compilation, writes to a sample and hold
  hold_write: {
    internal: true,
    ins: [
      { name: "in", default: 0 },
      { name: "trig", default: 0 },
    ],
    outs: [],
    params: [],
    state: [],
  },

  Knob: {
    ins: [],
    outs: [""],
    params: [
      { name: "minVal", default: 0 },
      { name: "maxVal", default: 1 },
      { name: "value", default: 0 },
      { name: "deviceId", default: null },
      { name: "controlId", default: null },
    ],
    state: [],
    description: "parameter control knob",
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

  MonoSeq: {
    time: true,
    ins: [
      { name: "clock", default: 0 },
      { name: "gateT", default: 0.1 },
    ],
    outs: ["freq", "gate"],
    params: [],
    state: ["scaleName", "scaleRoot", "numOctaves", "patterns", "curPattern"],
    description: "monophonic step sequencer",
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

  Nop: {
    ins: [{ name: "", default: 0 }],
    outs: [""],
    params: [],
    description: "pass-through node (no-op)",
  },

  Notes: {
    ins: [],
    outs: [],
    params: [{ name: "text", default: "" }],
    state: [],
    description: "text notes",
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

  Scope: {
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
  },

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

  Sub: {
    ins: [
      { name: "in0", default: 0 },
      { name: "in1", default: 0 },
    ],
    outs: ["out"],
    params: [],
    state: [],
    description: "subtract input waveforms",
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

  Module: {
    // Marked as internal because you can't create a module
    // from the node creation menu
    internal: true,
    ins: [],
    outs: [],
    params: [],
    state: [],
    description: "user-created module (node grouping)",
  },
};

/* console.log(
  "NODE_CLASSES",
  Object.keys(NODE_CLASSES)
    .map(
      (type) =>
        `${type.toLowerCase()}(${NODE_SCHEMA[type].ins
          .map((inlet) => inlet.name)
          .join(", ")})`
    )
    .join(" ")
); */
