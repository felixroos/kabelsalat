import { makeNode, Node, register, module } from "./graph";

export let adsr = makeNode("ADSR");
export let clock = makeNode("Clock");
export let clockdiv = makeNode("ClockDiv");
export let distort = makeNode("Distort");
export let noise = makeNode("Noise");
export let pinknoise = makeNode("PinkNoise");
export let pink = makeNode("PinkNoise");
export let brown = makeNode("BrownNoise");
export let dust = makeNode("Dust");
export let pulse = makeNode("Pulse");
export let impulse = makeNode("Impulse");
export let saw = makeNode("Saw");
export let sine = makeNode("Sine");
export let tri = makeNode("Tri");
export let slide = makeNode("Slide");
export let slew = makeNode("Slew");
export let lag = makeNode("Lag");
export let filter = makeNode("Filter");
export let fold = makeNode("Fold");
export let seq = makeNode("Seq");
export let delay = makeNode("Delay");
export let hold = makeNode("Hold");
// export let midin = makeNode("MidiIn");
export let midifreq = makeNode("MidiFreq");
export let midigate = makeNode("MidiGate");
export let midicc = makeNode("MidiCC");
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
export let poly = makeNode("poly");
export let PI = new Node("PI");

export let fork = register("fork", (input, times = 1) =>
  poly(...Array.from({ length: times }, () => input.clone()))
);

export let perc = module("perc", (gate, release) =>
  gate.adsr(0, 0, 1, release)
);

export let hpf = module("hpf", (input, cutoff, resonance = 0) =>
  input.filter(1, resonance).sub(input.filter(cutoff, resonance))
);
export let lpf = module("lpf", filter); // alias

export let lfnoise = module("lfnoise", (freq) => noise().hold(impulse(freq)));

export let bipolar = module("bipolar", (unipolar) => n(unipolar).mul(2).sub(1));
export let unipolar = module("unipolar", (bipolar) => n(bipolar).add(1).div(2));

// modules currently don't support returning a poly node because it won't get resolved (too late)
export let pan = module("pan", (input, pos) => {
  // (pos+1)/2 * PI/2 = (pos+1) * PI * 0.25
  // n(pos).unipolar().mul(PI).div(2)
  // n(pos).add(1).div(2).mul(PI).div(2)
  pos = n(pos).add(1).mul(PI, 0.25);
  return input.mul([cos(pos), sin(pos)]); // this returns a poly which doesn't work with module
});

export let mix = register("mix", (input, channels = 1) => {
  if (![1, 2].includes(channels)) {
    channels = 2;
    console.warn("mix only supports 1 or 2 channels atm.. falling back to 2");
  }
  if (input.type !== "poly") {
    return input;
  }
  if (channels === 2) {
    const panned = input.ins.map((inlet, i, ins) => {
      // we can do this at eval time: channels are fixed!
      const pos = (i / (ins.length - 1)) * 2 - 1;
      const deg = ((pos + 1) * Math.PI) / 4;
      const stereo = inlet.mul([Math.cos(deg), Math.sin(deg)]);
      return stereo.inherit(input);
    });
    return add(...panned);
  }
  input.ins = input.ins.map((inlet) => inlet.inherit(input));
  return node("mix").withIns(...input.ins);
});

// legacy...
Node.prototype.feedback = function (fn) {
  return this.add(fn);
};
export let feedback = (fn) => add(fn);

// not implemented noisecraft nodes
// TODO:
// Greater, ClockOut, Scope, BitCrush?
// Different Names:
// Add (=add), AudioOut (=out), Const (=n)
// WONT DO:
// GateSeq, MonoSeq, Knob, MonoSeq, Nop, Notes (text note), Module

// this schema is currently only relevant for audio nodes, using, flags dynamic & time, + ins[].default
// TODO: compress format?

export function getInletName(type, index) {
  if (!NODE_SCHEMA[type]?.ins?.[index]) {
    return "";
  }
  return NODE_SCHEMA[type].ins[index].name;
}

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
    ins: [{ name: "channel", default: -1 }],
  },
  MidiFreq: {
    ins: [{ name: "channel", default: -1 }],
  },
  MidiCC: {
    ins: [
      { name: "ccnumber", default: -1 },
      { name: "channel", default: -1 },
    ],
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
  PinkNoise: {
    ins: [],
  },
  BrownNoise: {
    ins: [],
  },
  Dust: {
    ins: [{ name: "density", default: 0 }],
  },
  Pulse: {
    ins: [
      { name: "freq", default: 0 },
      { name: "pw", default: 0.5 },
    ],
  },
  Impulse: {
    ins: [
      { name: "freq", default: 0 },
      { name: "phase", default: 0 },
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
  Lag: {
    ins: [
      { name: "in", default: 0 },
      { name: "rate", default: 1 },
    ],
  },
  Slew: {
    ins: [
      { name: "in", default: 0 },
      { name: "up", default: 1 },
      { name: "dn", default: 1 },
    ],
  },
  Tri: {
    ins: [{ name: "freq", default: 0 }],
  },
};
