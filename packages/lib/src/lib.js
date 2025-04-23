import {
  n,
  registerNode,
  Node,
  register,
  module,
  node,
} from "@kabelsalat/core";
import * as js from "./lang/js.js";
import * as c from "./lang/c.js";

const langs = {
  js,
  c,
};

export const registerUgen = (type, className) =>
  registerNode(type, {
    ugen: className,
    compile: ({ vars, ...meta }) => langs[meta.lang].defUgen(meta, ...vars),
  });

export let time = register("time", (code) => new Node("time", code), {
  tags: ["meta"],
  description: "Returns elapsed time in seconds",
  compile: ({ name, lang }) => langs[lang].def(name, "time"),
});

export let raw = register(
  "raw",
  (input, code) => new Node("raw", code).withIns(n(input)),
  {
    ins: [
      { name: "in" },
      {
        name: "code",
        description:
          "expression with variable `t` being the elapsed time and `$input` the input.",
      },
    ],
    tags: ["meta"],
    description: "Raw code node, expects floats between -1 and 1",
    compile: ({ vars, node, name }) => `let $input = ${vars[0]}; 
const ${name} = (${node.value}); // raw`,
    examples: [
      `sine(4).range(.5,1)
.raw("(time*110%1*2-1)*$input")
.out()`,
    ],
  }
);

export let bytebeat = register(
  "bytebeat",
  (t, code) => new Node("bytebeat", code).withIns(n(t)),
  {
    ins: [
      { name: "t", description: "time in samples" },
      {
        name: "code",
        description: "bytebeat code with variable `t`",
      },
    ],
    tags: ["meta"],
    description: "Bytebeat node, expects numbers from 0 to 255",
    examples: [
      `time().mul(8000).bytebeat\`
// Fractalized Past
// by: lhphr
// from: https://dollchan.net/btb/res/3.html#69

(t>>10^t>>11)%5*((t>>14&3^t>>15&1)+1)*t%99+((3+(t>>14&3)-(t>>16&1))/3*t%99&64)
\`.out()`,
    ],
    compile: ({ vars, node, name }) => `let t = ${vars[0]}; 
const ${name} = ((${node.value}) & 255) / 127.5 - 1; // bytebeat`,
  }
);

export let floatbeat = register(
  "floatbeat",
  (t, code) => new Node("bytebeat", code).withIns(n(t)),
  {
    ins: [
      { name: "t", description: "time in samples" },
      {
        name: "code",
        description: "floatbeat code with variable `t`",
      },
    ],
    tags: ["meta"],
    description: "Raw code node, expects numbers from -1 to 1",
    compile: ({ vars, node, name }) => {
      return `let t = ${vars[0]}; const ${name} = (${node.value}); // floatbeat`;
    },
  }
);

export let adsr = registerNode("adsr", {
  ugen: "ADSRNode",
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
  compile: ({
    vars: [gate = 0, att = 0.02, dec = 0.1, sus = 0.2, rel = 0.1],
    ...meta
  }) => langs[meta.lang].defUgen(meta, "time", gate, att, dec, sus, rel),
});
export let ar = module(
  "ar",
  (gate = 0, attack = 0.02, release = 0.1) => gate.adsr(attack, 0, 1, release),
  {
    tags: ["envelope"],
    description: "AR envelope",
    examples: [`impulse(1).ad(.01, .1).mul(sine(220)).out()`],
    ins: [
      { name: "trig", default: 0, description: "gate input" },
      { name: "att", default: 0.02, description: "attack time" },
      { name: "rel", default: 0.1, description: "release time" },
    ],
  }
);
export let ad = module(
  "ad",
  (gate = 0, attack = 0.02, decay = 0.1) => gate.adsr(attack, decay, 0, decay),
  {
    tags: ["envelope"],
    description: "AD envelope",
    examples: [`impulse(1).ad(.01, .1).mul(sine(220)).out()`],
    ins: [
      { name: "trig", default: 0, description: "gate input" },
      { name: "att", default: 0.02, description: "attack time" },
      { name: "dec", default: 0.1, description: "decay time" },
    ],
  }
);

export let clock = registerNode("clock", {
  ugen: "Clock",
  internal: true, // impulse is the preferred way..
  tags: ["regular", "clock"],
  description: "Clock source, with tempo in BPM",
  examples: [`clock(120).clockdiv(16).mul(sine(220)).out()`],
  ins: [
    {
      name: "bpm",
      default: 120,
      description: "clock tempo in bpm (beats per minute)",
    },
  ],
  compile: ({ vars: [bpm = 120], ...meta }) =>
    langs[meta.lang].defUgen(meta, bpm),
});
export let clockdiv = registerNode("clockdiv", {
  ugen: "ClockDiv",
  tags: ["clock", "trigger"],
  description: "Clock signal divider",
  examples: [`impulse(8).clockdiv(2).ad(.1,.1).mul(sine(220)).out()`],
  ins: [
    { name: "clock", default: 0, description: "clock input" },
    { name: "divisor", default: 2, description: "tempo divisor" },
  ],
  compile: ({ vars: [clock = 0, divisor = 2], ...meta }) =>
    langs[meta.lang].defUgen(meta, clock, divisor),
});

export let distort = registerNode("distort", {
  ugen: "Distort",
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
  compile: ({ vars: [input = 0, amt = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, amt),
});

export let noise = registerNode("noise", {
  ugen: "NoiseOsc",
  tags: ["source", "noise"],
  description: "White noise source",
  examples: ["noise().mul(.25).out()"],
  ins: [],
  compile: ({ lang, ...meta }) => langs[lang].defUgen(meta),
});

// todo: how to show "pink" in reference?
export let pink = registerNode("pink", {
  ugen: "PinkNoise",
  tags: ["source", "noise"],
  description: "Pink noise source",
  examples: ["pink().mul(.5).out()"],
  ins: [],
  compile: ({ lang, ...meta }) => langs[lang].defUgen(meta),
});

export let brown = registerNode("brown", {
  ugen: "BrownNoiseOsc",
  tags: ["source", "noise"],
  description: "Brown noise source",
  examples: ["brown().out()"],
  ins: [],
  compile: ({ lang, ...meta }) => langs[lang].defUgen(meta),
});

export let dust = registerNode("dust", {
  ugen: "DustOsc",
  tags: ["trigger", "noise", "source"],
  description: "Generates random impulses from 0 to +1.",
  examples: ["dust(200).out()"],
  ins: [
    { name: "density", default: 0, description: "average impulses per second" },
  ],
  compile: ({ vars: [density = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, density),
});

export let impulse = registerNode("impulse", {
  ugen: "ImpulseOsc",
  tags: ["regular", "trigger"],
  description: "Regular single sample impulses (0 - 1)",
  examples: ["impulse(10).out()"],
  ins: [
    { name: "freq", default: 0 },
    { name: "phase", default: 0 },
  ],
  compile: ({ vars: [freq = 0, phase = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, freq, phase),
});

export let saw = registerNode("saw", {
  ugen: "SawOsc",
  tags: ["regular", "waveform", "source"],
  description: "Sawtooth wave oscillator with anti aliasing",
  examples: ["saw(110).mul(.5).out()"],
  ins: [{ name: "freq", default: 0 }],
  compile: ({ vars: [freq = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, freq),
});

export let zaw = registerNode("zaw", {
  ugen: "ZawOsc",
  tags: ["regular", "waveform", "source"],
  description:
    "Sawtooth wave oscillator with sharp edges. Use saw for anti aliased variant.",
  examples: ["zaw(110).mul(.5).out()"],
  ins: [{ name: "freq", default: 0 }],
  compile: ({ vars: [freq = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, freq),
});

export let sine = registerNode("sine", {
  tags: ["regular", "waveform", "source"],
  ugen: "SineOsc",
  description: "Sine wave oscillator",
  examples: ["sine(220).out()"],
  ins: [
    { name: "freq", default: 0 },
    { name: "sync", default: 0, description: "sync input" },
    { name: "phase", default: 0, description: "phase offset" },
  ],
  compile: ({ vars: [freq = 0, sync = 0, phase = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, freq, sync, phase),
});
export let tri = registerNode("tri", {
  ugen: "TriOsc",
  tags: ["regular", "waveform", "source"],
  description: "Triangle wave oscillator",
  examples: ["tri(220).out()"],
  ins: [{ name: "freq", default: 0 }],
  compile: ({ vars: [freq = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, freq),
});

export let pulse = registerNode("pulse", {
  ugen: "PulseOsc",
  tags: ["regular", "waveform", "source"],
  description: "Pulse wave oscillator",
  examples: ["pulse(220, sine(.1).range(.1,.5)).mul(.5).out()"],
  ins: [
    { name: "freq", default: 0 },
    { name: "pw", default: 0.5, description: "pulse width 0 - 1" },
  ],
  compile: ({ vars: [freq = 0, pw = 0.5], ...meta }) =>
    langs[meta.lang].defUgen(meta, freq, pw),
});

export let slide = registerNode("slide", {
  ugen: "Slide",
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
  compile: ({ vars: [input = 0, rate = 1], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, rate),
});
export let lag = registerNode("lag", {
  ugen: "Lag",
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
  compile: ({ vars: [input = 0, rate = 1], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, rate),
});

export let slew = registerNode("slew", {
  ugen: "Slew",
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
  compile: ({ vars: [input = 0, up = 1, dn = 1], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, up, dn),
});
export let filter = registerNode("filter", {
  ugen: "Filter",
  tags: ["fx", "filter"],
  internal: true,
  description: "Two-pole low-pass filter",
  examples: [`saw(55).lpf( sine(1).range(.4,.8) ).out()`],
  ins: [
    { name: "in", default: 0 },
    { name: "cutoff", default: 1 },
    { name: "reso", default: 0 },
  ],
  compile: ({ vars: [input = 0, cutoff = 1, reso = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, cutoff, reso),
});
export let fold = registerNode("fold", {
  ugen: "Fold",
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
  compile: ({ vars: [input = 0, rate = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, rate),
});
export let seq = registerNode("seq", {
  ugen: "Sequence",
  tags: ["sequencer"],
  description: "Trigger controlled sequencer",
  examples: [
    `impulse(2).seq(220,330,440,550)
.sine().out()`,
  ],
  ins: [
    { name: "trig", default: 0 },
    { name: "step", default: 0, dynamic: true, description: "step inputs" },
    // 1-Infinity of steps
  ],
  compile: ({ vars, ...meta }) => langs[meta.lang].defUgen(meta, ...vars),
});
export let delay = registerNode("delay", {
  ugen: "Delay",
  tags: ["fx"],
  description: "Delay line node",
  examples: [
    `impulse(1).ad(.01,.2).mul(sine(220))
.add(x=>x.delay(.1).mul(.8)).out()`,
  ],
  ins: [
    { name: "in", default: 0 },
    { name: "time", default: 0 },
  ],
  compile: ({ vars: [input = 0, time = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, time),
});
export let hold = registerNode("hold", {
  ugen: "Hold",
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
  compile: ({ vars: [input = 0, trig = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, trig),
});
/*export let midin = registerNode("MidiIn",{
    ins: [],
});*/
export let midifreq = registerNode("midifreq", {
  ugen: "MidiFreq",
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
  compile: ({ vars: [channel = -1], ...meta }) =>
    langs[meta.lang].defUgen(meta, channel),
});
export let midigate = registerNode("midigate", {
  ugen: "MidiGate",
  tags: ["external", "midi"],
  description:
    "outputs gate of midi note in. Multiple instances will do voice allocation",
  examples: [`midigate().lag(1).mul(sine(220)).out()`],
  ins: [{ name: "channel", default: -1 }],
  compile: ({ vars: [channel = -1], ...meta }) =>
    langs[meta.lang].defUgen(meta, channel),
});
export let midicc = registerNode("midicc", {
  ugen: "MidiCC",
  tags: ["external", "midi"],
  description: "outputs bipolar value of given midi cc number",
  examples: [`midicc(74).range(100,200).sine().out()`],
  ins: [
    { name: "ccnumber", default: -1 },
    { name: "channel", default: -1 },
  ],
  compile: ({ vars: [ccnumber = -1, channel = -1], ...meta }) =>
    langs[meta.lang].defUgen(meta, ccnumber, channel),
});

export let cc = registerNode("cc", {
  ugen: "CC",
  tags: ["external"],
  description: "CC control",
  ins: [
    { name: "id", default: 0 },
    { name: "value", default: 0 },
  ],
  compile: ({ vars: [id], ...meta }) => {
    return langs[meta.lang].defUgen(meta, id);
  },
});

export let audioin = registerNode("audioin", {
  ugen: "AudioIn",
  tags: ["source", "external"],
  description: "External Audio Input, depends on your system input",
  examples: [`audioin().add(x=>x.delay(.1).mul(.8)).out()`],
  ins: [],
  compile: (meta) => langs[meta.lang].defUgen(meta, "input"),
});

// non-audio nodes
export let log = registerNode("log", {
  tags: ["math"],
  description: "calculates the logarithm (base 10) of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].log(input)),
});
export let exp = registerNode("exp", {
  tags: ["math"],
  description: "raises e to the power of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].exp(input)),
});
export let pow = registerNode("pow", {
  tags: ["math"],
  description: "raises the input to the given power",
  ins: [{ name: "in" }, { name: "power" }],
  compile: ({ vars: [input = 0, power = 1], name, lang }) =>
    langs[lang].def(name, langs[lang].pow(input, power)),
});
export let sin = registerNode("sin", {
  tags: ["math"],
  description: "calculates the sine of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].defSin(input)),
});
export let cos = registerNode("cos", {
  tags: ["math"],
  description: "calculates the cosine of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].defCos(input)),
});
export let acos = registerNode("acos", {
  tags: ["math"],
  description: "calculates the acos of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].defAcos(input)),
});
export let asin = registerNode("asin", {
  tags: ["math"],
  description: "calculates the asin of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].defAsin(input)),
});
export let atan = registerNode("atan", {
  tags: ["math"],
  description: "calculates the atan of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].defAtan(input)),
});
export let mul = registerNode("mul", {
  tags: ["math"],
  description: "Multiplies the given signals.",
  examples: [`sine(220).mul( sine(4).range(.25,1) ).out()`],
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name, lang }) =>
    langs[lang].def(name, vars.join(" * ") || 0),
});
export let add = registerNode("add", {
  tags: ["math"],
  description: "sums the given signals",
  examples: [`n([0,3,7,10]).add(60).midinote().sine().mix(2).out()`],
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name, lang }) =>
    langs[lang].def(name, vars.join(" + ") || 0),
});
export let div = registerNode("div", {
  tags: ["math"],
  description: "adds the given signals",
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name, lang }) =>
    langs[lang].def(name, vars.join(" / ") || 0),
});
export let sub = registerNode("sub", {
  tags: ["math"],
  description: "subtracts the given signals",
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name, lang }) =>
    langs[lang].def(name, vars.join(" - ") || 0),
});
export let mod = registerNode("mod", {
  tags: ["math"],
  description: "calculates the modulo",
  examples: [`add(x=>x.add(.003).mod(1)).out()`],
  ins: [{ name: "in" }, { name: "modulo" }],
  compile: ({ vars, name, lang }) =>
    langs[lang].def(name, langs[lang].mod(...vars) || 0),
});
export let abs = registerNode("abs", {
  tags: ["math"],
  description: "returns the absolute value of the signal",
  ins: [{ name: "in" }],
  examples: [`sine(440).abs().out()`],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].abs(input)),
});
export let round = registerNode("round", {
  tags: ["math"],
  description: "Rounds the signal to the nearest integer",
  ins: [{ name: "in" }],
  examples: [`sine(440.5).round().out()`],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].round(input)),
});
export let clamp = registerNode("clamp", {
  tags: ["math"],
  description: "Clamps the signal to stay within the given range",
  ins: [{ name: "in" }, { name: "min" }, { name: "max" }],
  examples: [`sine(440.5).clamp(-.6,.6).out()`],
  compile: ({ vars: [input = 0, min = -1, max = 1], name, lang }) => {
    const minV = langs[lang].min(min, max);
    const maxV = langs[lang].max(min, max);
    const clamped = langs[lang].min(langs[lang].max(input, minV), maxV);
    return langs[lang].def(name, clamped);
  },
});
export let floor = registerNode("floor", {
  tags: ["math"],
  description: "Rounds the signal down",
  ins: [{ name: "in" }],
  examples: [`sine(440.5).floor().out()`],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].floor(input)),
});
export let ceil = registerNode("ceil", {
  tags: ["math"],
  description: "Rounds the signal up",
  ins: [{ name: "in" }],
  examples: [`sine(440.5).ceil().out()`],
  compile: ({ vars: [input = 0], name, lang }) =>
    langs[lang].def(name, langs[lang].ceil(input)),
});
export let min = registerNode("min", {
  tags: ["math"],
  description: "returns the minimum of the given signals",
  examples: [
    `impulse(4).apply(x => min(x.seq(0,3,2), x.seq(0,7,0,5,0)).add(48).midinote().sine()).out()`,
  ],
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name, lang }) =>
    langs[lang].def(name, vars.reduce(langs[lang].min) || 0),
});
export let max = registerNode("max", {
  tags: ["math"],
  description: "returns the maximum of the given signals",
  examples: [
    `impulse(4).apply(x => max(x.seq(0,3,2), x.seq(0,7,0,5,0)).add(48).midinote().sine()).out()`,
  ],
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name, lang }) =>
    langs[lang].def(name, vars.reduce(langs[lang].max) || 0),
});
export let argmin = registerNode("argmin", {
  tags: ["math"],
  description: "returns the index of the minimum of the given signals",
  examples: [
    `argmin(saw(1), saw(3), saw(5)).mul(12).add(48).midinote().sine().out()`,
  ],
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name, lang }) =>
    langs[lang].def(
      name,
      langs[lang].pair_b(
        vars.map(langs[lang].pair_make).reduce(langs[lang].pair_a_min)
      ) || 0
    ),
});
export let argmax = registerNode("argmax", {
  tags: ["math"],
  description: "returns the index of the maximum of the given signals",
  examples: [
    `argmax(saw(1), saw(3), saw(5)).mul(12).add(48).midinote().sine().out()`,
  ],
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name, lang }) =>
    langs[lang].def(
      name,
      langs[lang].pair_b(
        vars.map(langs[lang].pair_make).reduce(langs[lang].pair_a_max)
      ) || 0
    ),
});
export let greater = registerNode("greater", {
  tags: ["logic"],
  description: "returns 1 if input is greater then threshold",
  ins: [{ name: "in" }, { name: "threshold" }],
  examples: [
    `greater(sine(1),0)
.bipolar().range(100,200)
.sine().out()`,
  ],
  compile: ({ vars: [a = 0, b = 0], name, lang }) =>
    langs[lang].def(name, `${a} > ${b}`),
});
export let xor = registerNode("xor", {
  tags: ["logic"],
  description: "returns 1 if exactly one of the inputs is 1",
  ins: [{ name: "a" }, { name: "b" }],
  compile: ({ vars: [a = 0, b = 0], name, lang }) =>
    langs[lang].def(name, `${a} != ${b} ? 1 : 0`),
});
export let and = registerNode("and", {
  tags: ["logic"],
  description: "returns 1 if both inputs are 1",
  ins: [{ name: "a" }, { name: "b" }],
  compile: ({ vars: [a = 0, b = 0], name, lang }) =>
    langs[lang].def(name, `${a} && ${b} ? 1 : 0`),
});
export let or = registerNode("or", {
  tags: ["logic"],
  description: "returns 1 if one or both inputs are 1",
  ins: [{ name: "a" }, { name: "b" }],
  compile: ({ vars: [a = 0, b = 0], name, lang }) =>
    langs[lang].def(name, `${a} || ${b} ? 1 : 0`),
});
export let bool = registerNode("bool", {
  tags: ["logic"],
  description: "returns 1 signal is non zero. inspired by genish",
  ins: [{ name: "a" }],
  compile: ({ vars: [a = 0], name, lang }) =>
    langs[lang].def(name, `(${a} === 0 ? 0 : 1)`),
});
export let range = registerNode("range", {
  tags: ["math"],
  description: "Scales the incoming bipolar value to the given range.",
  examples: [`sine(.5).range(.25,1).mul(sine(440)).out()`],
  ins: [{ name: "in" }, { name: "min" }, { name: "max" }],
  compile: ({ vars, name, lang }) => {
    const [bipolar, min, max, curve = 1] = vars;
    // bipolar [-1,1] to unipolar [0,1] => (v+1)/2
    const unipolar = `((${bipolar} + 1) * 0.5)`;
    const shaped = curve === 1 ? unipolar : langs[lang].pow(unipolar, curve);
    return langs[lang].def(name, `${shaped} * (${max} - ${min}) + ${min}`);
  },
});

export let remap = registerNode("remap", {
  ugen: "Remap",
  tags: ["math"],
  description: "Remaps input from one value range to another",
  ins: [
    { name: "in" },
    { name: "inmin" },
    { name: "inmax" },
    { name: "outmin" },
    { name: "outmax" },
  ],
  // examples: [`sine(440).abs().out()`],
  compile: ({
    vars: [input = 0, inmin = -1, inmax = 1, outmin = -1, outmax = 1],
    ...meta
  }) => langs[meta.lang].defUgen(meta, input, inmin, inmax, outmin, outmax),
});

export let thru = registerNode("thru", {
  compile: ({ name, vars, lang }) => langs[lang].def(name, vars[0], "thru"),
});

export let rangex = module(
  "rangex",
  (sig, min, max) => {
    let logmin = log(min);
    let range = log(max).sub(logmin);
    let uni = sig.unipolar();
    let l = uni.mul(range).add(logmin);
    return exp(l);
  },
  {
    tags: ["math"],
    description: "exponential range",
    ins: [{ name: "in" }, { name: "min" }, { name: "max" }],
    examples: [`sine([1,3]).rangex(100, 2e3).sine().out()`],
  }
);

export let midinote = registerNode("midinote", {
  compile: ({ vars: [note], name, lang }) =>
    langs[lang].def(name, langs[lang].midinote(note)),
  tags: ["math"],
  description: "convert midi number to frequency",
  ins: [{ name: "midi" }],
  examples: [
    `impulse(4).seq(0,3,7,12).add(60)
.midinote().sine().out()`,
  ],
});

export let src = registerNode("src", {
  internal: true,
  compile: ({ vars: [id = 0], name, lang, ...meta }) => {
    return langs[lang].def(name, meta.getSource(id), `read source ${id}`);
  },
});

export let output = registerNode("output", {
  internal: true,
  ugen: "Output",
  compile: ({ vars: [input, id = 0], name, lang, ...meta }) => {
    const o = meta.getOutput(id);
    const s = meta.getSource(id);
    // o = output register, used for playback
    // s = source register, used for feedback
    // an output adds to the existing o register + sets the s register
    // the o register is cleared before each loop, so we write the same value to the s register
    // the s register is used by src to read the last output
    return [
      langs[lang].def(o, [o, input].join(" + "), `+ output ${id}`),
      langs[lang].def(s, o, `write source ${id}`),
    ].join("\n");
  },
});

export let poly = registerNode("poly");
export let PI = n(Math.PI);

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
  (input, cutoff, resonance = 0) => input.sub(input.lpf(cutoff, resonance)),
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

export let bpf = registerNode("bpf", {
  ugen: "BPF",
  ins: [{ name: "in" }, { name: "cutoff" }, { name: "reso" }],
  description: "high pass filter",
  tags: ["fx", "filter"],
  compile: ({ vars: [input = 0, cutoff = 1, reso = 0], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, cutoff, reso),
});

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

export let pick = registerNode("pick", {
  tags: ["multi-channel"],
  ugen: "Pick",
  description: "Pick",
  ins: [{ name: "index" }, { name: "inputs", dynamic: true }],
  compile: ({ vars, ...meta }) => langs[meta.lang].defUgen(meta, ...vars),
});

export let clip = registerNode("clip", {
  tags: ["fx"],
  ugen: "Clip",
  description: "Hard limits the signal between lo and hi.",
  ins: [{ name: "input" }, { name: "lo" }, { name: "hi" }],
  compile: ({ vars: [input = 0, lo = -1, hi = 1], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, lo, hi),
});

export let trig = registerNode("trig", {
  tags: ["trigger"],
  ugen: "Trig",
  description:
    "Emits a trigger impulse whenever the signal becomes positive. Useful to turn gates into triggers.",
  ins: [
    { name: "input", default: 0 },
    { name: "lo", default: -1 },
    { name: "hi", default: 1 },
  ],
  compile: ({ vars: [input = 0, lo = -1, hi = 1], ...meta }) =>
    langs[meta.lang].defUgen(meta, input, lo, hi),
  examples: [
    `pulse(2)
.trig() // comment out to hear difference
.ar(.01,.2)
.mul(sine(200)).out()`,
  ],
});

export let split = register(
  "split",
  (input, fn) => {
    if (input.type !== "poly") {
      return fn([input]);
    }
    return fn(input.ins);
  },
  {
    ins: [{ name: "input" }, { name: "fn" }],
    tags: ["multi-channel"],
    description:
      "apply fn to an array of signals, one for each channel in input",
    examples: [`sine([220,330,550]).split(chs => add(...chs)).out()`],
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
    compile: ({ vars, name, lang }) =>
      langs[lang].def(name, `(${vars.join(" + ")})`),
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
  }
);

// legacy...
Node.prototype.feedback = function (fn) {
  return this.add(fn);
};
export let feedback = (fn) => add(fn);

// todo: remaining noisecraft nodes
// ClockOut, Scope, BitCrush?

/* Scope: {
    ins: [{ name: "", default: 0 }],
    sendRate: 20,
    sendSize: 5,
    historyLen: 150,
  }, */

// no-widget fallback
export let B = n;
export let _ = n;

let _mouseX = module("mouseX", () => cc("mouseX"), {
  ins: [],
  description: "X position of mouse, bipolar range",
  tags: ["external"],
  examples: [`mouseX.range(100,800).sine().out()`],
});
export let mouseX = _mouseX();
let _mouseY = module("mouseY", () => cc("mouseY"), {
  ins: [],
  description: "Y position of mouse, bipolar range",
  tags: ["external"],
  examples: [`mouseY.range(800,100).sine().out()`],
});
export let mouseY = _mouseY();
