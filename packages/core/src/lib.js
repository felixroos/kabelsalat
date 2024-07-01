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
 *
 *
 */
export let adsr = makeNode("adsr", {
  tags: ["envelope"],
  description: "ADSR envelope",
  examples: [
    `impulse(1).perc(.5)
.adsr(.01, .1, .5, .1)
.mul(sine(220)).out()`,
  ],
  ins: [
    { name: "gate", default: 0, description: "gate input" },
    { name: "att", default: 0.02, description: "attack time" },
    { name: "dec", default: 0.1, description: "decay time" },
    { name: "sus", default: 0.2, description: "sustain level" },
    { name: "rel", default: 0.1, description: "release time" },
  ],
  args: ["time"], // if set, the update function will get time as first param
});
export let clock = makeNode("clock", {
  tags: ["regular", "clock"],
  internal: true, // disable for now...
  description: "Clock source, with tempo in BPM",
  examples: [`clock(120).clockdiv(16).mul(sine(220)).out()`],
  ins: [
    {
      name: "bpm",
      default: 120,
      description: "clock tempo in bpm (beats per minute)",
    },
  ],
});
export let clockdiv = makeNode("clockdiv", {
  tags: ["clock"],
  internal: true, // disable for now...
  description: "Clock signal divider",
  examples: [`clock(120).clockdiv(16).mul(sine(220)).out()`],
  ins: [
    { name: "clock", default: 0, description: "clock input" },
    { name: "divisor", default: 2, description: "tempo divisor" },
  ],
});

export let distort = makeNode("distort", {
  tags: ["fx", "distortion"],
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

export let noise = makeNode("noise", {
  tags: ["source", "noise"],
  description: "White noise source",
  examples: ["noise().mul(.25).out()"],
  ins: [],
});

// todo: how to show "pink" in reference?
export let pink = makeNode("pink", {
  tags: ["source", "noise"],
  description: "Pink noise source",
  examples: ["pink().mul(.5).out()"],
  ins: [],
});

export let brown = makeNode("brown", {
  tags: ["source", "noise"],
  description: "Brown noise source",
  examples: ["brown().out()"],
  ins: [],
});

export let dust = makeNode("dust", {
  tags: ["trigger", "noise", "source"],
  description: "Generates random impulses from 0 to +1.",
  examples: ["dust(200).out()"],
  ins: [
    { name: "density", default: 0, description: "average impulses per second" },
  ],
});

export let impulse = makeNode("impulse", {
  tags: ["regular", "trigger"],
  description: "Regular single sample impulses (0 - 1)",
  examples: ["impulse(10).out()"],
  ins: [
    { name: "freq", default: 0 },
    { name: "phase", default: 0 },
  ],
});
export let saw = makeNode("saw", {
  tags: ["regular", "waveform", "source"],
  description: "Sawtooth wave oscillator",
  examples: ["saw(110).mul(.5).out()"],
  ins: [{ name: "freq", default: 0 }],
});
export let sine = makeNode("sine", {
  tags: ["regular", "waveform", "source"],
  description: "Sine wave oscillator",
  examples: ["sine(220).out()"],
  ins: [
    { name: "freq", default: 0 },
    { name: "sync", default: 0, description: "sync input" },
  ],
});
export let tri = makeNode("tri", {
  tags: ["regular", "waveform", "source"],
  description: "Triangle wave oscillator",
  examples: ["tri(220).out()"],
  ins: [{ name: "freq", default: 0 }],
});

export let pulse = makeNode("pulse", {
  tags: ["regular", "waveform", "source"],
  description: "Pulse wave oscillator",
  examples: ["pulse(220, sine(.1).range(.1,.5)).mul(.5).out()"],
  ins: [
    { name: "freq", default: 0 },
    { name: "pw", default: 0.5, description: "pulse width 0 - 1" },
  ],
});

export let slide = makeNode("slide", {
  tags: ["fx"],
  internal: true,
  description: "Slide/portamento node",
  examples: [
    `impulse(2).seq(55,110,220,330)
.slide(4).sine().out()`,
  ],
  ins: [
    { name: "in", default: 0 },
    { name: "rate", default: 1 },
  ],
});
export let lag = makeNode("lag", {
  tags: ["fx"],
  description: "Smoothes a signal. Good for slide / portamento effects.",
  examples: [
    `impulse(2).seq(220,330,440,550)
.lag(.4).sine().out()`,
  ],
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
export let slew = makeNode("slew", {
  tags: ["fx"],
  description:
    "Limits the slope of an input signal. The slope is expressed in units per second.",
  examples: [`pulse(800).slew(4000, 4000).out()`],
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
export let filter = makeNode("filter", {
  tags: ["fx", "filter"],
  internal: true,
  description: "Two-pole low-pass filter",
  examples: [`saw(55).lpf( sine(1).range(.4,.8) ).out()`],
  ins: [
    { name: "in", default: 0 },
    { name: "cutoff", default: 1 },
    { name: "reso", default: 0 },
  ],
});
export let fold = makeNode("fold", {
  tags: ["fx", "distortion", "limiter"],
  description: 'Distort incoming audio signal by "folding"',
  examples: [
    `sine(55)
.fold( sine(.5).range(0.2,4) )
.out()`,
  ],
  ins: [
    { name: "in", default: 0 },
    { name: "rate", default: 0 },
  ],
});
export let seq = makeNode("seq", {
  tags: ["sequencer"],
  description: "Trigger controlled sequencer",
  examples: [
    `impulse(2).seq(220,330,440,550)
.sine().out()`,
  ],
  dynamic: true, // dynamic number of inlets
  ins: [
    { name: "trig", default: 0 },
    { name: "step", default: 0, dynamic: true, description: "step inputs" },
    // 1-Infinity of steps
  ],
});
export let delay = makeNode("delay", {
  tags: ["fx"],
  description: "Delay line node",
  examples: [
    `impulse(1).perc(.4).mul(sine(220))
.add(x=>x.delay(.1).mul(.8)).out()`,
  ],
  ins: [
    { name: "in", default: 0 },
    { name: "time", default: 0 },
  ],
});
export let hold = makeNode("hold", {
  tags: ["fx"],
  description: "Sample and hold",
  examples: [
    `noise().hold(impulse(2))
.range(220,880).sine().out()`,
  ],
  ins: [
    { name: "in", default: 0 },
    { name: "trig", default: 0 },
  ],
});
/*export let midin = makeNode("MidiIn",{
    ins: [],
});*/
export let midifreq = makeNode("midifreq", {
  tags: ["external", "midi"],
  description:
    "Outputs frequency of midi note in. Multiple instances will do voice allocation",
  examples: [`midifreq().sine().out()`],
  ins: [
    {
      name: "channel",
      default: -1,
      description: "Channel filter. Defaults to all channels",
    },
  ],
});
export let midigate = makeNode("midigate", {
  tags: ["external", "midi"],
  description:
    "outputs gate of midi note in. Multiple instances will do voice allocation",
  examples: [`midigate().lag(1).mul(sine(220)).out()`],
  ins: [{ name: "channel", default: -1 }],
});
export let midicc = makeNode("midicc", {
  tags: ["external", "midi"],
  description: "outputs bipolar value of given midi cc number",
  examples: [`midicc(74).range(100,200).sine().out()`],
  ins: [
    { name: "ccnumber", default: -1 },
    { name: "channel", default: -1 },
  ],
});
export let audioin = makeNode("audioin", {
  tags: ["source", "external"],
  description: "External Audio Input, depends on your system input",
  examples: [`audioin().add(x=>x.delay(.1).mul(.8)).out()`],
  ins: [],
  args: ["input"],
});

// non-audio nodes
export let sin = makeNode("sin", {
  tags: ["math"],
  internal: true, // tbd find example
  description: "calculates the sine of the input signal",
  audio: false,
  ins: [{ name: "in" }],
});
export let cos = makeNode("cos", {
  tags: ["math"],
  internal: true, // tbd find example
  description: "calculates the cosine of the input signal",
  audio: false,
  ins: [{ name: "in" }],
});
export let mul = makeNode("mul", {
  tags: ["math"],
  description: "Multiplies the given signals.",
  examples: [`sine(220).mul( sine(4).range(.25,1) ).out()`],
  audio: false,
  ins: [{ name: "in", dynamic: true }],
});
export let add = makeNode("add", {
  tags: ["math"],
  description: "sums the given signals",
  examples: [`n([0,3,7,10]).add(60).midinote().sine().mix(2).out()`],
  audio: false,
  ins: [{ name: "in", dynamic: true }],
});
export let div = makeNode("div", {
  tags: ["math"],
  description: "adds the given signals",
  audio: false,
  ins: [{ name: "in", dynamic: true }],
});
export let sub = makeNode("sub", {
  tags: ["math"],
  description: "subtracts the given signals",
  audio: false,
  ins: [{ name: "in", dynamic: true }],
});
export let mod = makeNode("mod", {
  tags: ["math"],
  description: "calculates the modulo",
  examples: [`add(x=>x.add(.003).mod(1)).out()`],
  audio: false,
  ins: [{ name: "in" }, { name: "modulo" }],
});
export let range = makeNode("range", {
  tags: ["math"],
  description: "Scales the incoming bipolar value to the given range.",
  examples: [`sine(.5).range(.25,1).mul(sine(440)).out()`],
  audio: false,
  ins: [{ name: "in" }, { name: "min" }, { name: "max" }],
});
export let midinote = makeNode("midinote");
export let dac = makeNode("dac");
export let exit = makeNode("exit");
export let poly = makeNode("poly");
export let PI = new Node("PI");

export let fork = register(
  "fork",
  (input, times = 1) =>
    poly(...Array.from({ length: times }, () => input.clone())),
  {
    ins: [{ name: "in" }, { name: "times" }],
    tags: ["multi-channel"],
    description: "split the signal into n channels",
    examples: [`dust(4).fork(2).adsr(.1).mul(sine(220)).out()`],
  }
);

export let perc = module("perc", (gate, decay) => gate.adsr(0, 0, 1, decay), {
  tags: ["envelope"],
  description: "percussive envelope. usable with triggers or gates",
  ins: [{ name: "gate" }, { name: "release" }],
  examples: [`impulse(4).perc(.1).mul( pink() ).out()`],
});

export let hpf = module(
  "hpf",
  (input, cutoff, resonance = 0) =>
    input.lpf(1, resonance).sub(input.lpf(cutoff, resonance)),
  {
    ins: [{ name: "in" }, { name: "cutoff" }, { name: "reso" }],
    description: "high pass filter",
    tags: ["fx", "filter"],
    examples: [`tri([220,331,442]).mix().hpf(sine(.5).range(0,.9)).out()`],
  }
);
export let lpf = module("lpf", filter, {
  ins: [{ name: "in" }, { name: "cutoff" }, { name: "reso" }],
  description: "low pass filter",
  tags: ["fx", "filter"],
  examples: [`saw(55).lpf( sine(1).range(.4,.8) ).out()`],
}); // alias

export let lfnoise = module("lfnoise", (freq) => noise().hold(impulse(freq)), {
  ins: [{ name: "freq" }],
  description: "low frequency stepped noise.",
  tags: ["regular", "noise"],
  examples: [`lfnoise(4).range(200,800).sine().out()`],
});

export let bipolar = module(
  "bipolar",
  (unipolar) => n(unipolar).mul(2).sub(1),
  {
    ins: [{ name: "in" }],
    description: "convert unipolar [0,1] signal to bipolar [-1,1]",
    tags: ["math"],
    // examples: [], // tbd
  }
);
export let unipolar = module(
  "unipolar",
  (bipolar) => n(bipolar).add(1).div(2),
  {
    ins: [{ name: "in" }],
    description: "convert bipolar [-1,1] signal to unipolar [0,1]",
    tags: ["math"],
    // examples: [], // tbd
  }
);

// modules currently don't support returning a poly node because it won't get resolved (too late)
export let pan = module(
  "pan",
  (input, pos) => {
    // (pos+1)/2 * PI/2 = (pos+1) * PI * 0.25
    // n(pos).unipolar().mul(PI).div(2)
    // n(pos).add(1).div(2).mul(PI).div(2)
    pos = n(pos).add(1).mul(PI, 0.25);
    return input.mul([cos(pos), sin(pos)]); // this returns a poly which doesn't work with module
  },
  {
    ins: [
      { name: "in" },
      {
        name: "pos",
        description: "bipolar position: -1 = left, 0 = center, 1 = right",
      },
    ],
    description: "pans signal to stereo position. splits signal path in 2",
    tags: ["multi-channel"],
    examples: [`sine(220).pan(sine(.25)).out()`],
  }
);

export let mix = register(
  "mix",
  (input, channels = 1) => {
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
  },
  {
    description: `mixes down multiple channels. Useful to make sure you get a mono or stereo signal out at the end. 
When mixing down to 2 channels, the input channels are equally distributed over the stereo image, e.g. 3 channels are panned [-1,0,1]`,
    ins: [
      { name: "in" },
      {
        name: "channels",
        default: 1,
        description: "how many channels to mix down to. Only supports 1 and 2",
      },
    ],
    tags: ["multi-channel"],
    examples: [`sine([220,330,440]).mix(2).out()`],
    audio: false,
  }
);

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
