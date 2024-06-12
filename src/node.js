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
  flatten(feedback = true) {
    const nodes = flatten(this);
    if (feedback) {
      for (let id in nodes) {
        if (nodes[id].type === "feedback") {
          const [lastSample] = nodes[id].ins;
          // remove cycle
          nodes[id].ins = [];
          nodes.push({ type: "feedback_write", to: id, ins: [lastSample] });
        }
      }
    }
    return nodes;
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
export let feedback_write = makeNode("feedback_write");

// feedback has no input but itself!!!!
export let feedback = (fn) => {
  const fb = node("feedback");
  const out = fn(fb);
  if (!Array.isArray(out)) {
    return fb.withIns(out);
  }
  // when an array is returned, the first thing is looped back and the second thing gets out
  const [feed, play = feed] = out;
  fb.withIns(feed);
  return play;
};

// source + feedback
Node.prototype.feedback = function (fn) {
  return feedback((x) => fn(this.add(x)));
};

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
// GateSeq, MonoSeq, Knob, MonoSeq, Nop, Notes (text note), Module

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
  },
  range: {
    audio: false,
    ins: [{ name: "in" }, { name: "min" }, { name: "max" }],
  },
  Clock: {
    ins: [{ name: "bpm", default: 120 }],
  },
  ClockDiv: {
    ins: [
      { name: "clock", default: 0 },
      { name: "divisor", default: 2 },
    ],
  },
  Delay: {
    ins: [
      { name: "in", default: 0 },
      { name: "time", default: 0 },
    ],
  },
  Distort: {
    ins: [
      { name: "in", default: 0 },
      { name: "amt", default: 0 },
    ],
  },
  Filter: {
    ins: [
      { name: "in", default: 0 },
      { name: "cutoff", default: 1 },
      { name: "reso", default: 0 },
    ],
  },
  Fold: {
    ins: [
      { name: "in", default: 0 },
      { name: "rate", default: 0 },
    ],
  },
  Seq: {
    dynamic: true, // dynamic number of inlets
    ins: [
      { name: "clock", default: 0 },
      // 1-Infinity of steps
    ],
  },
  Hold: {
    ins: [
      { name: "in", default: 0 },
      { name: "trig", default: 0 },
    ],
  },
  feedback: {
    ins: [{ name: "∞", default: 0 }],
  },
  // MIDI input node
  // chanNo is the channel to accept input from (null means any channel)
  MidiIn: {
    ins: [],
  },
  Mod: {
    ins: [
      { name: "in0", default: 0 },
      { name: "in1", default: 1 },
    ],
  },
  Mul: {
    ins: [
      { name: "in0", default: 1 },
      { name: "in1", default: 1 },
    ],
  },
  Noise: {
    ins: [],
  },
  Pulse: {
    ins: [
      { name: "freq", default: 0 },
      { name: "pw", default: 0.5 },
    ],
  },
  Saw: {
    ins: [{ name: "freq", default: 0 }],
  },
  /*   Scope: {
    ins: [{ name: "", default: 0 }],
    outs: [],
    sendRate: 20,
    sendSize: 5,
    historyLen: 150,
  }, */
  Sine: {
    ins: [
      { name: "freq", default: 0 },
      { name: "sync", default: 0 },
    ],
  },
  Slide: {
    ins: [
      { name: "in", default: 0 },
      { name: "rate", default: 1 },
    ],
  },
  Tri: {
    ins: [{ name: "freq", default: 0 }],
  },
};
