import {
  n,
  registerNode,
  Node,
  register,
  module,
  nodeRegistry,
  assert,
} from "@kabelsalat/core";

export let def = (name, value, comment) =>
  `const ${name} = ${value};${comment ? ` /* ${comment} */` : ""}`;
export let defUgen = (meta, ...args) => {
  return def(
    meta.name,
    `nodes[${meta.ugenIndex}].update(${args.join(",")})`,
    meta.node.type
  );
};

export const registerUgen = (type, className) =>
  registerNode(type, {
    ugen: className,
    compile: ({ vars, ...meta }) => defUgen(meta, ...vars),
  });

export let time = register("time", (code) => new Node("time", code), {
  tags: ["meta"],
  description: "Returns elapsed time in seconds",
  compile: ({ name }) => def(name, "time"),
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
  }) => defUgen(meta, "time", gate, att, dec, sus, rel),
});
export let ad = module(
  "ad",
  (gate = 0, attack = 0.02, decay = 0.1) => gate.adsr(attack, 0, 1, decay),
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
  compile: ({ vars: [bpm = 120], ...meta }) => defUgen(meta, bpm),
});
export let clockdiv = registerNode("clockdiv", {
  ugen: "ClockDiv",
  tags: ["clock"],
  description: "Clock signal divider",
  examples: [`impulse(8).clockdiv(2).ad(.1,.1).mul(sine(220)).out()`],
  ins: [
    { name: "clock", default: 0, description: "clock input" },
    { name: "divisor", default: 2, description: "tempo divisor" },
  ],
  compile: ({ vars: [clock = 0, divisor = 2], ...meta }) =>
    defUgen(meta, clock, divisor),
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
    defUgen(meta, input, amt),
});

export let noise = registerNode("noise", {
  ugen: "NoiseOsc",
  tags: ["source", "noise"],
  description: "White noise source",
  examples: ["noise().mul(.25).out()"],
  ins: [],
  compile: defUgen,
});

// todo: how to show "pink" in reference?
export let pink = registerNode("pink", {
  ugen: "PinkNoise",
  tags: ["source", "noise"],
  description: "Pink noise source",
  examples: ["pink().mul(.5).out()"],
  ins: [],
  compile: defUgen,
});

export let brown = registerNode("brown", {
  ugen: "BrownNoiseOsc",
  tags: ["source", "noise"],
  description: "Brown noise source",
  examples: ["brown().out()"],
  ins: [],
  compile: defUgen,
});

export let dust = registerNode("dust", {
  ugen: "DustOsc",
  tags: ["trigger", "noise", "source"],
  description: "Generates random impulses from 0 to +1.",
  examples: ["dust(200).out()"],
  ins: [
    { name: "density", default: 0, description: "average impulses per second" },
  ],
  compile: ({ vars: [density = 0], ...meta }) => defUgen(meta, density),
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
    defUgen(meta, freq, phase),
});
export let saw = registerNode("saw", {
  ugen: "SawOsc",
  tags: ["regular", "waveform", "source"],
  description: "Sawtooth wave oscillator",
  examples: ["saw(110).mul(.5).out()"],
  ins: [{ name: "freq", default: 0 }],
  compile: ({ vars: [freq = 0], ...meta }) => defUgen(meta, freq),
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
    defUgen(meta, freq, sync, phase),
});
export let tri = registerNode("tri", {
  ugen: "TriOsc",
  tags: ["regular", "waveform", "source"],
  description: "Triangle wave oscillator",
  examples: ["tri(220).out()"],
  ins: [{ name: "freq", default: 0 }],
  compile: ({ vars: [freq = 0], ...meta }) => defUgen(meta, freq),
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
  compile: ({ vars: [freq = 0, pw = 0.5], ...meta }) => defUgen(meta, freq, pw),
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
    defUgen(meta, input, rate),
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
    defUgen(meta, input, rate),
});

// feedback_write doesn't need a creation function, because it's created internally in dagify
nodeRegistry.set("feedback_write", {
  internal: true,
  tags: ["innards"],
  description: "Writes to the feedback buffer. Not intended for direct use",
  compile: ({ vars, node, name }) =>
    def(name, `nodes[${node.to}].write(${vars[0]})`, "feedback_write"),
});
export let feedback_read = registerNode("feedback_read", {
  ugen: "Feedback",
  internal: true,
  description: "internal helper node to read the last feedback_write output",
  ins: [],
  compile: ({ vars, ...meta }) => {
    const { nodes, id, ugenIndex } = meta;
    // remap indices
    // we need to rewrite the "to" value to the audio node index (instead of flat node index)
    const writer = nodes.find(
      (node) => node.type === "feedback_write" && String(node.to) === id
    );
    writer.to = ugenIndex;
    return defUgen(meta, ...vars);
  },
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
    defUgen(meta, input, up, dn),
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
    defUgen(meta, input, cutoff, reso),
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
    defUgen(meta, input, rate),
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
  compile: ({ vars, ...meta }) => defUgen(meta, ...vars),
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
    defUgen(meta, input, time),
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
    defUgen(meta, input, trig),
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
  compile: ({ vars: [channel = -1], ...meta }) => defUgen(meta, channel),
});
export let midigate = registerNode("midigate", {
  ugen: "MidiGate",
  tags: ["external", "midi"],
  description:
    "outputs gate of midi note in. Multiple instances will do voice allocation",
  examples: [`midigate().lag(1).mul(sine(220)).out()`],
  ins: [{ name: "channel", default: -1 }],
  compile: ({ vars: [channel = -1], ...meta }) => defUgen(meta, channel),
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
    defUgen(meta, ccnumber, channel),
});

export let cc = registerNode("cc", {
  ugen: "CC",
  tags: ["external"],
  description: "CC control",
  ins: [
    { name: "value", default: 0 },
    { name: "min", default: 0 },
    { name: "max", default: 1 },
    { name: "step", default: 0 },
  ],
  compile: ({ vars, ...meta }) => {
    // const [_, value, min, max, step] = vars;
    const types = vars.map((v) => typeof v);
    assert(
      !types.find((type) => !["number", "undefined"].includes(type)),
      "_ only accepts static numbers"
    );
    return defUgen(meta);
  },
});

export let audioin = registerNode("audioin", {
  ugen: "AudioIn",
  tags: ["source", "external"],
  description: "External Audio Input, depends on your system input",
  examples: [`audioin().add(x=>x.delay(.1).mul(.8)).out()`],
  ins: [],
  compile: (meta) => defUgen(meta, "input"),
});

// non-audio nodes
export let log = registerNode("log", {
  tags: ["math"],
  description: "calculates the logarithm (base 10) of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name }) => def(name, `Math.log(${input})`),
});
export let exp = registerNode("exp", {
  tags: ["math"],
  description: "raises e to the power of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name }) => def(name, `Math.exp(${input})`),
});
export let pow = registerNode("pow", {
  tags: ["math"],
  description: "raises the input to the given power",
  ins: [{ name: "in" }, { name: "power" }],
  compile: ({ vars: [input = 0, power = 1], name }) =>
    def(name, `Math.pow(${input},${power})`),
});
export let sin = registerNode("sin", {
  tags: ["math"],
  description: "calculates the sine of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name }) => def(name, `Math.sin(${input})`),
});
export let cos = registerNode("cos", {
  tags: ["math"],
  description: "calculates the cosine of the input signal",
  ins: [{ name: "in" }],
  compile: ({ vars: [input = 0], name }) => def(name, `Math.cos(${input})`),
});
export let mul = registerNode("mul", {
  tags: ["math"],
  description: "Multiplies the given signals.",
  examples: [`sine(220).mul( sine(4).range(.25,1) ).out()`],
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name }) => def(name, vars.join(" * ") || 0),
});
export let add = registerNode("add", {
  tags: ["math"],
  description: "sums the given signals",
  examples: [`n([0,3,7,10]).add(60).midinote().sine().mix(2).out()`],
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name }) => def(name, vars.join(" + ") || 0),
});
export let div = registerNode("div", {
  tags: ["math"],
  description: "adds the given signals",
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name }) => def(name, vars.join(" / ") || 0),
});
export let sub = registerNode("sub", {
  tags: ["math"],
  description: "subtracts the given signals",
  ins: [{ name: "in", dynamic: true }],
  compile: ({ vars, name }) => def(name, vars.join(" - ") || 0),
});
export let mod = registerNode("mod", {
  tags: ["math"],
  description: "calculates the modulo",
  examples: [`add(x=>x.add(.003).mod(1)).out()`],
  ins: [{ name: "in" }, { name: "modulo" }],
  compile: ({ vars, name }) => def(name, vars.join(" % ") || 0),
});
export let greater = registerNode("greater", {
  tags: ["logic"],
  description: "returns 1 if input is greater then threshold",
  ins: [{ name: "in" }, { name: "threshold" }],
  compile: ({ vars: [a = 0, b = 0], name }) => def(name, `${a} > ${b}`),
});
export let xor = registerNode("xor", {
  tags: ["logic"],
  description: "returns 1 if exactly one of the inputs is 1",
  ins: [{ name: "a" }, { name: "b" }],
  compile: ({ vars: [a = 0, b = 0], name }) =>
    def(name, `${a} != ${b} ? 1 : 0`),
});
export let and = registerNode("and", {
  tags: ["logic"],
  description: "returns 1 if both inputs are 1",
  ins: [{ name: "a" }, { name: "b" }],
  compile: ({ vars: [a = 0, b = 0], name }) =>
    def(name, `${a} && ${b} ? 1 : 0`),
});
export let or = registerNode("or", {
  tags: ["logic"],
  description: "returns 1 if one or both inputs are 1",
  ins: [{ name: "a" }, { name: "b" }],
  compile: ({ vars: [a = 0, b = 0], name }) =>
    def(name, `${a} || ${b} ? 1 : 0`),
});
export let range = registerNode("range", {
  tags: ["math"],
  description: "Scales the incoming bipolar value to the given range.",
  examples: [`sine(.5).range(.25,1).mul(sine(440)).out()`],
  ins: [{ name: "in" }, { name: "min" }, { name: "max" }],
  compile: ({ vars, name }) => {
    const [bipolar, min, max, curve = 1] = vars;
    // bipolar [-1,1] to unipolar [0,1] => (v+1)/2
    const unipolar = `((${bipolar} + 1) * 0.5)`;
    const shaped = curve === 1 ? unipolar : `Math.pow(${unipolar}, ${curve})`;
    return def(name, `${shaped} * (${max} - ${min}) + ${min}`);
  },
});

export let thru = registerNode("thru", {
  compile: ({ name, vars }) => def(name, vars[0], "thru"),
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
  compile: ({ vars: [note], name }) =>
    def(name, `(2 ** ((${note} - 69) / 12) * 440)`),
  tags: ["math"],
  description: "convert midi number to frequency",
  ins: [{ name: "midi" }],
  examples: [
    `impulse(4).seq(0,3,7,12).add(60)
.midinote().sine().out()`,
  ],
});
export let dac = registerNode("dac", {
  internal: true,
  compile: ({ vars }) => {
    let channels;
    if (!vars.length) {
      console.warn(`no input.. call .out() to play`);
      channels = [0, 0];
    } else {
      channels = vars;
    }
    if (channels.length === 1) {
      // make mono if only one channel
      channels = [channels[0], channels[0]];
    } else if (channels.length > 2) {
      console.warn("returned more than 2 channels.. using first 2");
      channels = channels.slice(0, 2);
    }
    return `return [${channels.map((chan) => `(${chan}*lvl)`).join(",")}]`;
  },
});
export let exit = registerNode("exit", { internal: true });
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
    compile: ({ vars, name }) => def(name, `(${vars.join(" + ")})`),
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
/* 
function quantize(value, scale) {
  const scaleLength = scale.length;
  const octave = 12;

  // Normalize the value to be within 0 to 11
  let normalizedValue = ((value % octave) + octave) % octave;

  // Find the closest scale value
  let closest = scale.reduce((prev, curr) => {
    return Math.abs(curr - normalizedValue) < Math.abs(prev - normalizedValue)
      ? curr
      : prev;
  });

  // Adjust the closest value to account for the original octave
  let adjustment = Math.floor(value / octave) * octave;
  let result = closest + adjustment;

  // Ensure the result is closest to the original value considering the overflow
  if (result - value > 6) result -= octave;
  if (value - result > 6) result += octave;

  return result;
}

// Examples
console.log(quantize(2, [0, 3, 5, 7, 10])); // 3
console.log(quantize(13, [0, 3, 5, 7, 10])); // 12
console.log(quantize(-3, [0, 3, 5, 7, 10])); // -2

/////////////

function quantize(value, scale) {
  const octave = 12;

  // Normalize the value to be within 0 to 11
  let normalizedValue = ((value % octave) + octave) % octave;

  // Find the closest scale value
  let closest = scale[0];
  let minDistance = Math.abs(normalizedValue - closest);

  for (let i = 1; i < scale.length; i++) {
    let distance = Math.abs(normalizedValue - scale[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closest = scale[i];
    }
  }

  // Adjust the closest value to account for the original octave
  let adjustment = Math.floor(value / octave) * octave;
  let result = closest + adjustment;

  // Ensure the result is closest to the original value considering the overflow
  if (result - value > 6) result -= octave;
  if (value - result > 6) result += octave;

  return result;
}

// Examples
console.log(quantize(2, [0, 3, 5, 7, 10])); // 3
console.log(quantize(13, [0, 3, 5, 7, 10])); // 12
console.log(quantize(-3, [0, 3, 5, 7, 10])); // -2

//////////
function quantize(value, scale) {
  const octave = 12;

  // Normalize the value to be within 0 to 11
  let normalizedValue = ((value % octave) + octave) % octave;

  // Find the closest scale value
  let closest = scale[0];
  let minDistance = Math.abs(normalizedValue - closest);

  for (let i = 1; i < scale.length; i++) {
    let distance = Math.abs(normalizedValue - scale[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closest = scale[i];
    }
  }

  // Adjust the closest value to account for the original octave
  let adjustment = Math.floor(value / octave) * octave;
  let result = closest + adjustment;

  // Ensure the result is closest to the original value considering the overflow
  if (result - value > 6) result -= octave;
  if (value - result > 6) result += octave;

  return result;
}

// Examples
console.log(quantize(2, [0, 3, 5, 7, 10])); // 3
console.log(quantize(13, [0, 3, 5, 7, 10])); // 12
console.log(quantize(-3, [0, 3, 5, 7, 10])); // -2

//////

function quantize(value, scale) {
  const octave = 12;

  // Normalize the value to be within 0 to 11
  let normalizedValue = value % octave;
  if (normalizedValue < 0) {
    normalizedValue += octave;
  }

  // Binary search to find the closest scale value
  let low = 0;
  let high = scale.length - 1;
  let closest = scale[0];

  while (low <= high) {
    let mid = (low + high) >> 1; // Same as Math.floor((low + high) / 2)
    let midVal = scale[mid];

    if (midVal === normalizedValue) {
      closest = midVal;
      break;
    } else if (midVal < normalizedValue) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }

    // Update the closest value
    if (
      Math.abs(midVal - normalizedValue) < Math.abs(closest - normalizedValue)
    ) {
      closest = midVal;
    }
  }

  // Adjust the closest value to account for the original octave
  let adjustment = Math.floor(value / octave) * octave;
  let result = closest + adjustment;

  // Simplified overflow/underflow adjustment
  if (result - value > 6) {
    result -= octave;
  } else if (value - result > 6) {
    result += octave;
  }

  return result;
}

// Examples
console.log(quantize(2, [0, 3, 5, 7, 10])); // 3
console.log(quantize(13, [0, 3, 5, 7, 10])); // 12
console.log(quantize(-3, [0, 3, 5, 7, 10])); // -2
 */
