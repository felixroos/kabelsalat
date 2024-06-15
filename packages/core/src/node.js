export class Node {
  constructor(type, value) {
    this.type = type;
    value !== undefined && (this.value = value);
    this.ins = [];
  }
  // connect nodes to input node(s), return this node
  withIns(...ins) {
    this.ins = ins;
    return this;
  }
  addInput(node) {
    this.ins.push(node);
    return this;
  }
  flatten() {
    return flatten(this);
  }
  dagify() {
    return dagify(this);
  }
  apply(fn) {
    return fn(this);
  }
  apply2(fn) {
    // clock(10).seq(51,52,0,53).apply2(hold).midinote().sine().out()
    return fn(this, this);
  }
}

// returns true if the given node forms a cycle with "me" (or is me)
function loopsToMe(node, me) {
  if (node === me) {
    return true;
  }
  if (node.ins.length === 0) {
    return false;
  }
  for (let neighbor of node.ins) {
    if (neighbor.ins.includes(me)) {
      return true;
    }
    return loopsToMe(neighbor, me);
  }
}

// transforms the graph into a dag, where cycles are broken into feedback_read and feedback_write nodes
function dagify(node) {
  let visitedNodes = [];
  function dfs(currentNode) {
    if (visitedNodes.includes(currentNode)) {
      // currentNode has one or more cycles, find them...
      const feedbackSources = currentNode.ins.filter((input) =>
        loopsToMe(input, currentNode)
      );
      if (!feedbackSources.length) {
        // it might happen that we end up here again after dagification..
        return;
      }
      feedbackSources.forEach((feedbackSource) => {
        const feedbackInlet = currentNode.ins.indexOf(feedbackSource);
        const feedbackReader = new Node("feedback_read");
        currentNode.ins[feedbackInlet] = feedbackReader;
        const feedbackWriter = new Node("feedback_write");
        feedbackWriter.ins = [feedbackSource];
        feedbackWriter.to = feedbackReader;
        node.ins.push(feedbackWriter);
      });
      return;
    }
    visitedNodes.push(currentNode);
    if (!currentNode.ins.length) {
      return;
    }
    for (const neighbor of currentNode.ins) {
      dfs(neighbor);
    }
  }
  dfs(node);
  return node;
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
    node.to !== undefined && (clone.to = flat.indexOf(node.to));
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

const expansionType = "zip";
const outputType = "dac";

function parseInput(input) {
  if (typeof input === "object") {
    // is node
    return input;
  }
  if (typeof input === "number" && !isNaN(input)) {
    return n(input);
  }
  console.log(
    `invalid input type "${typeof input}" for node of type, falling back to 0. The input was:`,
    input
  );
  return 0;
}

function getNode(type, ...args) {
  const next = node(type);
  args = args.map((arg) => {
    // desugar array input to expand node
    if (Array.isArray(arg)) {
      console.log("arr", arg);
      return new Node(expansionType).withIns(...arg);
    }
    if (typeof arg === "function") {
      return next.apply(arg);
    }
    return arg;
  });

  // gets channels per arg
  const expansions = args.map((arg) => {
    if (arg.type === expansionType) {
      return arg.ins.length;
    }
    return 1;
  });
  // max channels to expand. the 1 is to make sure empty args won't break!
  const maxExpansions = Math.max(1, ...expansions);

  // no expansion early exit
  if (maxExpansions === 1) {
    return next.withIns(...args.map(parseInput));
  }
  // dont expand dac node, but instead input all channels
  if (type === outputType) {
    const inputs = args
      .map((arg) => {
        if (arg.type === expansionType) {
          return arg.ins;
        }
        return arg;
      })
      .flat();
    return node(outputType).withIns(...inputs);
  }

  // multichannel expansion:
  // node([a,b,c], [x,y]) => expand(node(a,x), node(b,y), node(c,x))
  const expanded = Array.from({ length: maxExpansions }, (_, i) => {
    const inputs = args.map((arg) => {
      if (arg.type === expansionType) {
        return parseInput(arg.ins[i % arg.ins.length]);
      }
      return parseInput(arg);
    });
    return new Node(type).withIns(...inputs);
  });
  return new Node(expansionType).withIns(...expanded);
}

export let makeNode = (type, name = type.toLowerCase()) => {
  Node.prototype[name] = function (...args) {
    return getNode(type, this, ...args);
  };
  return (...args) => {
    return getNode(type, ...args);
  };
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
// export let midin = makeNode("MidiIn");
export let midifreq = makeNode("MidiFreq");
export let midigate = makeNode("MidiGate");
export let audioin = makeNode("AudioIn");

// non-audio nodes
export let sin = makeNode("sin");
export let cos = makeNode("cos");
export let mul = makeNode("mul");
export let add = makeNode("add");
export let div = makeNode("div");
export let sub = makeNode("sub");
export let mod = makeNode("mod"); // untested
export let range = makeNode("range");
export let midinote = makeNode("midinote");
export let dac = makeNode("dac");
export let exit = makeNode("exit");
export let zip = makeNode("zip");

// legacy...
Node.prototype.feedback = function (fn) {
  return this.add(fn);
};
export let feedback = (fn) => add(fn);

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
// Greater, ClockOut, Scope, BitCrush?
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
    args: ["time"], // if set, the update function will get time as first param
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
  feedback_read: {
    ins: [],
  },
  // feedback_write is a special case in the compiler, so it won't appear here..
  AudioIn: {
    ins: [],
    args: ["input"],
  },
  MidiIn: {
    ins: [],
  },
  MidiGate: {
    ins: [],
  },
  MidiFreq: {
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
  /* Scope: {
    ins: [{ name: "", default: 0 }],
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
