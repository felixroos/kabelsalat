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
  ins: [
    { name: "gate", default: 0 },
    { name: "att", default: 0.02 },
    { name: "dec", default: 0.1 },
    { name: "sus", default: 0.2 },
    { name: "rel", default: 0.1 },
  ],
  args: ["time"], // if set, the update function will get time as first param
});
export let clock = makeNode("Clock", {
  ins: [{ name: "bpm", default: 120 }],
});
export let clockdiv = makeNode("ClockDiv", {
  ins: [
    { name: "clock", default: 0 },
    { name: "divisor", default: 2 },
  ],
});

/**
 * Overdrive-style distortion
 *
 * @name distort
 * @publicApi
 * @param in signal input
 * @param amt distortion amount
 * @example
 * sine(220)
 * .distort( saw(.5).range(0,1) )
 * .out()
 *
 */
export let distort = makeNode("Distort", {
  ins: [
    { name: "in", default: 0 },
    { name: "amt", default: 0 },
  ],
});

/**
 * White noise source
 *
 * @name noise
 * @publicApi
 * @example
 * noise().out()
 *
 */
export let noise = makeNode("Noise", {
  ins: [],
});

/**
 * Pink noise source
 *
 * @name pink
 * @publicApi
 * @example
 * pink().out()
 *
 */
export let pink = makeNode("PinkNoise", {
  ins: [],
});
/**
 * Brown noise source
 *
 * @name brown
 * @publicApi
 * @example
 * brown().out()
 *
 */
export let brown = makeNode("BrownNoise", {
  ins: [],
});
/**
 * Generates random impulses from 0 to +1.
 *
 * @name dust
 * @publicApi
 * @example
 * dust(200).out()
 *
 */
export let dust = makeNode("Dust", {
  ins: [{ name: "density", default: 0 }],
});
/**
 * Pulse wave oscillator
 *
 * @name pulse
 * @publicApi
 * @example
 * pulse(110, sine(.1).range(.1,.5)).out()
 *
 */
export let pulse = makeNode("Pulse", {
  ins: [
    { name: "freq", default: 0 },
    { name: "pw", default: 0.5 },
  ],
});
export let impulse = makeNode("Impulse", {
  ins: [
    { name: "freq", default: 0 },
    { name: "phase", default: 0 },
  ],
});
export let saw = makeNode("Saw", {
  ins: [{ name: "freq", default: 0 }],
});
export let sine = makeNode("Sine", {
  ins: [
    { name: "freq", default: 0 },
    { name: "sync", default: 0 },
  ],
});
export let tri = makeNode("Tri", {
  ins: [{ name: "freq", default: 0 }],
});
export let slide = makeNode("Slide", {
  ins: [
    { name: "in", default: 0 },
    { name: "rate", default: 1 },
  ],
});

// feedback_write is a special case in the compiler, so it won't appear here..
export let feedback_read = makeNode("feedback_read", {
  ins: [],
});
export let slew = makeNode("Slew", {
  ins: [
    { name: "in", default: 0 },
    { name: "up", default: 1 },
    { name: "dn", default: 1 },
  ],
});
export let lag = makeNode("Lag", {
  ins: [
    { name: "in", default: 0 },
    { name: "rate", default: 1 },
  ],
});
export let filter = makeNode("Filter", {
  ins: [
    { name: "in", default: 0 },
    { name: "cutoff", default: 1 },
    { name: "reso", default: 0 },
  ],
});
export let fold = makeNode("Fold", {
  ins: [
    { name: "in", default: 0 },
    { name: "rate", default: 0 },
  ],
});
export let seq = makeNode("Seq", {
  dynamic: true, // dynamic number of inlets
  ins: [
    { name: "clock", default: 0 },
    // 1-Infinity of steps
  ],
});
export let delay = makeNode("Delay", {
  ins: [
    { name: "in", default: 0 },
    { name: "time", default: 0 },
  ],
});
export let hold = makeNode("Hold", {
  ins: [
    { name: "in", default: 0 },
    { name: "trig", default: 0 },
  ],
});
/*export let midin = makeNode("MidiIn",{
    ins: [],
});*/
export let midifreq = makeNode("MidiFreq", {
  ins: [{ name: "channel", default: -1 }],
});
export let midigate = makeNode("MidiGate", {
  ins: [{ name: "channel", default: -1 }],
});
export let midicc = makeNode("MidiCC", {
  ins: [
    { name: "ccnumber", default: -1 },
    { name: "channel", default: -1 },
  ],
});
export let audioin = makeNode("AudioIn", {
  ins: [],
  args: ["input"],
});

// non-audio nodes
export let sin = makeNode("sin");
export let cos = makeNode("cos");
export let mul = makeNode("mul", {
  ins: [
    { name: "in0", default: 1 },
    { name: "in1", default: 1 },
  ],
});
export let add = makeNode("add");
export let div = makeNode("div");
export let sub = makeNode("sub");
export let mod = makeNode("mod", {
  ins: [
    { name: "in0", default: 0 },
    { name: "in1", default: 1 },
  ],
});
export let range = makeNode("range", {
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
