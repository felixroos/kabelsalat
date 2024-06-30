import { makeNode, Node, register, module } from "./graph";

/**
 * ADSR envelope
 *
 * @name adsr
 * @publicApi
 * @param gate gate signal
 * @param att attack time
 * @param dec decay time
 * @param sus sustain level
 * @param rel release time
 * @example
 * impulse(1).perc(.5)
 * .adsr(.01, .1, .5, .1)
 * .mul(sine(220)).out()
 *
 */
export let adsr = makeNode("ADSR", {
  description: "ADSR envelope",
  ins: [
    { name: "gate", default: 0, description: "gate input" },
    { name: "att", default: 0.02, description: "attack time" },
    { name: "dec", default: 0.1, description: "decay time" },
    { name: "sus", default: 0.2, description: "sustain level" },
    { name: "rel", default: 0.1, description: "release time" },
  ],
  args: ["time"], // if set, the update function will get time as first param
});
export let clock = makeNode("Clock", {
  description: "Clock source, with tempo in BPM",
  ins: [
    {
      name: "bpm",
      default: 120,
      description: "clock tempo in bpm (beats per minute)",
    },
  ],
});
export let clockdiv = makeNode("ClockDiv", {
  description: "Clock signal divider",
  ins: [
    { name: "clock", default: 0, description: "clock input" },
    { name: "divisor", default: 2, description: "tempo divisor" },
  ],
});

export let distort = makeNode("Distort", {
  description: "Overdrive-style distortion",
  examples: [
    `sine(220)
.distort( saw(.5).range(0,1) )
.out()`,
  ],
  ins: [
    { name: "in", default: 0 },
    { name: "amt", default: 0, description: "distortion amount" },
  ],
});

export let noise = makeNode("Noise", {
  description: "White noise source",
  examples: ["noise().out()"],
  ins: [],
});

export let pink = makeNode("PinkNoise", {
  description: "Pink noise source",
  examples: ["pink().out()"],
  ins: [],
});

export let brown = makeNode("BrownNoise", {
  description: "Brown noise source",
  examples: ["brown().out()"],
  ins: [],
});

export let dust = makeNode("Dust", {
  description: "Generates random impulses from 0 to +1.",
  examples: ["dust(200).out()"],
  ins: [
    { name: "density", default: 0, description: "average impulses per second" },
  ],
});

export let pulse = makeNode("Pulse", {
  description: "Pulse wave oscillator",
  examples: ["pulse(110, sine(.1).range(.1,.5)).out()"],
  ins: [
    { name: "freq", default: 0 },
    { name: "pw", default: 0.5, description: "pulse width 0 - 1" },
  ],
});

export let impulse = makeNode("Impulse", {
  description: "Regular single sample impulses (0 - 1)",
  ins: [
    { name: "freq", default: 0 },
    { name: "phase", default: 0 },
  ],
});
export let saw = makeNode("Saw", {
  description: "Sawtooth wave oscillator",
  ins: [{ name: "freq", default: 0 }],
});
export let sine = makeNode("Sine", {
  description: "Sine wave oscillator",
  ins: [
    { name: "freq", default: 0 },
    { name: "sync", default: 0, description: "sync input" },
  ],
});
export let tri = makeNode("Tri", {
  description: "Triangle wave oscillator",
  ins: [{ name: "freq", default: 0 }],
});
export let slide = makeNode("Slide", {
  description: "Slide/portamento node",
  ins: [
    { name: "in", default: 0 },
    { name: "rate", default: 1 },
  ],
});
export let lag = makeNode("Lag", {
  description: "Smoothes a signal. Good for slide / portamento effects.",
  ins: [
    { name: "in", default: 0 },
    { name: "rate", default: 1, description: "60 dB lag time in seconds" },
  ],
});

// feedback_write is a special case in the compiler, so it won't appear here..
export let feedback_read = makeNode("feedback_read", {
  internal: true,
  description: "internal helper node to read the last feedback_write output",
  ins: [],
});
export let slew = makeNode("Slew", {
  description:
    "Limits the slope of an input signal. The slope is expressed in units per second.",
  ins: [
    { name: "in", default: 0 },
    {
      name: "up",
      default: 1,
      description: "Maximum upward slope in units per second",
    },
    {
      name: "dn",
      default: 1,
      description: "Maximum downward slope in units per second",
    },
  ],
});
export let filter = makeNode("Filter", {
  description: "Two-pole low-pass filter",
  ins: [
    { name: "in", default: 0 },
    { name: "cutoff", default: 1 },
    { name: "reso", default: 0 },
  ],
});
export let fold = makeNode("Fold", {
  description: 'Distort incoming audio signal by "folding"',
  ins: [
    { name: "in", default: 0 },
    { name: "rate", default: 0 },
  ],
});
export let seq = makeNode("Seq", {
  description: "Trigger controlled sequencer",
  dynamic: true, // dynamic number of inlets
  ins: [
    { name: "trig", default: 0 },
    { name: "step", default: 0, dynamic: true, description: "step inputs" },
    // 1-Infinity of steps
  ],
});
export let delay = makeNode("Delay", {
  description: "Delay line node",
  ins: [
    { name: "in", default: 0 },
    { name: "time", default: 0 },
  ],
});
export let hold = makeNode("Hold", {
  description: "Sample and hold",
  ins: [
    { name: "in", default: 0 },
    { name: "trig", default: 0 },
  ],
});
/*export let midin = makeNode("MidiIn",{
    ins: [],
});*/
export let midifreq = makeNode("MidiFreq", {
  description:
    "Outputs frequency of midi note in. Multiple instances will do voice allocation",
  ins: [
    {
      name: "channel",
      default: -1,
      description: "Channel filter. Defaults to all channels",
    },
  ],
});
export let midigate = makeNode("MidiGate", {
  description:
    "outputs gate of midi note in. Multiple instances will do voice allocation",
  ins: [{ name: "channel", default: -1 }],
});
export let midicc = makeNode("MidiCC", {
  ins: [
    { name: "ccnumber", default: -1 },
    { name: "channel", default: -1 },
  ],
});
export let audioin = makeNode("AudioIn", {
  description: "External Audio Input, depends on your system input",
  ins: [],
  args: ["input"],
});

// non-audio nodes
export let sin = makeNode("sin", {
  description: "calculates the sine of the input signal",
  audio: false,
  ins: [{ name: "in" }],
});
export let cos = makeNode("cos", {
  description: "calculates the cosine of the input signal",
  audio: false,
  ins: [{ name: "in" }],
});
export let mul = makeNode("mul", {
  description: "multiplies the given signals",
  audio: false,
  ins: [{ name: "in", dynamic: true }],
});
export let add = makeNode("add", {
  description: "sums the given signals",
  audio: false,
  ins: [{ name: "in", dynamic: true }],
});
export let div = makeNode("div", {
  description: "adds the given signals",
  audio: false,
  ins: [{ name: "in", dynamic: true }],
});
export let sub = makeNode("sub", {
  description: "subtracts the given signals",
  audio: false,
  ins: [{ name: "in", dynamic: true }],
});
export let mod = makeNode("mod", {
  description: "calculates the modulo",
  audio: false,
  ins: [{ name: "in" }, { name: "modulo" }],
});
export let range = makeNode("range", {
  description: "Scales the incoming bipolar value to the given range",
  audio: false,
  ins: [{ name: "in" }, { name: "min" }, { name: "max" }],
});
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

// todo: remaining noisecraft nodes
// Greater, ClockOut, Scope, BitCrush?

/* Scope: {
    ins: [{ name: "", default: 0 }],
    sendRate: 20,
    sendSize: 5,
    historyLen: 150,
  }, */
