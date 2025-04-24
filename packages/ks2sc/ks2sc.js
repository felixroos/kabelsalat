import { spawn } from "node:child_process";
import readline from "node:readline";
const child = spawn("sclang", [], { stdio: "pipe" });

child.stdout.on("data", (data) => {
  //  console.log(`sc: ${data}`);
});

child.stderr.on("data", (data) => {
  console.error(`sclang error: ${data}`);
});

child.on("close", (code) => {
  console.log(`sclang exited with code ${code}`);
});

class Node {
  constructor(type, ins, compileSelf) {
    this.type = type;
    this.ins = ins;
    this.compileSelf = compileSelf;
  }
}
// registers a function on the node class + standalone
let register = (type, compile) => {
  Node.prototype[type] = function (...args) {
    return new Node(type, [this, ...args], compile);
  };
  return (...args) => new Node(type, args, compile);
};
// sort nodes by dependencies (using generator function to be able to step through)
function* topoSort(node, visited = new Set()) {
  if (!(node instanceof Node) || visited.has(node)) {
    return; // constant values or already visited nodes
  }
  visited.add(node);
  for (let input of node.ins) {
    yield* topoSort(input, visited);
  }
  yield node;
}
// convert node to code + metadata
Node.prototype.compile = function () {
  let nodes = Array.from(topoSort(this));
  const getRef = (input) =>
    typeof input !== "object" ? input : `v${nodes.indexOf(input)}`;
  let lines = [];
  for (let id in nodes) {
    const node = nodes[id];
    const args = node.ins.map(getRef);
    const ref = getRef(node);
    lines.push(node.compileSelf(node, ref, args));
  }
  const last = getRef(nodes[nodes.length - 1]);
  return { lines, last };
};

Node.prototype.apply = function (fn) {
  return fn(this);
};

// the following code uses the above graph lib
// to implement the dummy math language
const compileWith = (fn) => (_, ref, args) => `var ${ref} = ${fn(args)};`;
const registerUgen = (name, ugen, getArgs = (x) => x) =>
  register(
    name,
    compileWith((args) => `${ugen}.ar(${getArgs(args).join(",")})`)
  );
const registerOp = (name, op) =>
  register(
    name,
    compileWith((args) => args.join(op))
  );

// RLPF with res 0 sounds awful
let compileLPF = compileWith(
  ([input, freq, res = 0]) =>
    //`RLPF.ar(${input}, ${freq}.asAudioRateInput.exprange(1.0,SampleRate.ir/2), ${res}+1)`
    `MoogVCF.ar(${input}, ${freq}.asAudioRateInput.exprange(1.0,SampleRate.ir/2), ${res})`
  //`MoogVCF.ar(${input}, ${freq}.asAudioRateInput.exprange(1.0,SampleRate.ir/2), ${res})`
  //`MoogLadder.ar(${input}, ${freq}.asAudioRateInput.exprange(1.0,SampleRate.ir/2), ${res})`
); // todo: map exponentially without killing my system audio

Object.assign(globalThis, {
  register,
  Node,
  /* out: register(
    "out",
    compileWith((args) => args[0]) // dummy..
  ), */
  mul: registerOp("mul", "*"),
  div: registerOp("div", "/"),
  add: registerOp("add", "+"),
  sub: registerOp("sub", "-"),
  saw: registerUgen("saw", "Saw"),
  sine: registerUgen("sine", "SinOsc"),
  //lpf: registerUgen("lpf", "RLPF"),
  lpf: register("lpf", compileLPF),
  filter: register("filter", compileLPF),
  impulse: registerUgen("impulse", "Impulse"),
  clockdiv: registerUgen("clockdiv", "PulseDivider"),
  adsr: register(
    "adsr",
    compileWith(
      ([gate, a = 0.1, d = 0.2, s = 0.5, r = 0.2]) => `EnvGen.ar(
  Env.adsr(${a},${d},${s},${r}), 
  gate: Trig.ar(${gate}, ${a})
)`
    )
    // the Trig prolongs the gate to at least be as long as the attack phase
    // maybe that will cause problems when the gate is longer.. yesss
  ),
  delay: register(
    "delay",
    compileWith(
      ([input, time = 0]) =>
        `DelayN.ar(${input},  maxdelaytime: 10, delaytime: ${time})`
    )
  ),
  // delay example:
  // impulse(1).adsr(0.01, 0.2, 0.0, 0.2).apply((imp) => imp.mul(sine(200)).add(imp.delay(0.1).mul(sine(300))))
  distort: registerUgen("distort", "AnalogVintageDistortion"),
  // distort example:
  // saw(55).add(saw(55.7)).lpf(800).distort(.5).div(4)
  hold: registerUgen("hold", "Latch"),
  // noise().hold(impulse(2)).mul(sine(200))
  noise: registerUgen("noise", "WhiteNoise"),
  brown: registerUgen("brown", "BrownNoise"),
  dust: registerUgen("dust", "Dust"),
  pink: registerUgen("pink", "PinkNoise"),
  pulse: register(
    "pulse",
    compileWith(([freq = 1, pw = 0.5]) => `LFPulse.ar(${freq}, 0, ${pw})*2-1`)
  ),
  zaw: registerUgen("zaw", "LFSaw"),
  tri: registerUgen("tri", "LFTri"),
  // noise().add(1).div(2).mul(800).hold(impulse(4)).lag(.4).sine()
  lag: registerUgen("lag", "Lag"),
  slew: registerUgen("slew", "Slew"),
  bpf: registerUgen("bpf", "BPF"),
  fold: register(
    "fold",
    compileWith(
      ([input, rate = 1]) => `Fold.ar(${input}*${rate}, lo: -1, hi: 1)`
    )
  ),
  // impulse(2).seq(220,330,440,550).sine()
  seq: register(
    "seq",
    compileWith(
      ([trig, ...values]) =>
        `Demand.ar(${trig}, 0, Dseq([${values.join(",")}], inf))`
    )
  ),
  // impulse(1).seq(0,1).pick(sine(220),sine(330)).out()
  pick: register(
    "pick",
    compileWith(
      ([index, ...values]) => `Select.ar(${index}, [${values.join(",")}])`
    )
  ),
  // audioin
  // midiin
  // midigate
  // signal / cc / midicc
  remap: register(
    "remap",
    compileWith(
      ([input, imin = -1, imax = 1, omin, omax]) =>
        `${input}.linlin(${imin},${imax},${omin},${omax})`
    )
  ),
  range: register(
    "range",
    compileWith(
      (
        [input, min = -1, max = 1] // tbd: curve option
      ) => `((${input}+1)*0.5)*(${max}-${min})+${min}`
    )
  ),
  // sine(220).mul(4).clip().out()
  clip: register(
    "clip",
    compileWith(
      ([input, min = -1, max = 1]) => `Clip.ar(${input}, ${min},${max})`
    )
  ),
  trig: register(
    "trig",
    compileWith(([input]) => `Trig.ar(${input}, SampleDur.ir)`)
  ),
  midinote: register(
    "midinote",
    compileWith(([input]) => `${input}.midicps`)
  ),
  n: register(
    "n",
    compileWith(([input]) => `${input}`)
  ),
}); // tbd: n

Object.assign(globalThis, {
  perc: register("perc", (trig, decay) => trig.adsr(0, 0, 1, decay)),
});

function ks2scd(code) {
  const prelude = `
  Node.prototype.out = function () {
    globalThis.outNode = this;
  }`;
  //globalThis.out = out;
  const fn = new Function(`${prelude}; ${code}`); //  globalThis.outNode = sine(442)
  const res = fn();
  globalThis.outNode = globalThis.outNode ?? res;
  //console.log("outNode", globalThis.outNode);
  if (!globalThis.outNode) {
    throw new Error("no output node. you must call .out() at the end");
  }
  const { lines, last } = globalThis.outNode.compile();
  const compiled = lines.join("\n");
  const scd = `(s.waitForBoot(){
  (Ndef(\\synth, {
    ${compiled}
    [${last},${last}]*0.3
  }).play;)
})`;
  return scd;
}

function runScd(code) {
  const oneline = code.replaceAll("\n", "");
  child.stdin.write(oneline + "\n");
}

// repl
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  //terminal: false,
  prompt: "kabelsalat> ",
});

function evaluate(code) {
  try {
    console.log("\n");
    const scd = ks2scd(code);
    console.log("sclang: \n", scd);
    runScd(scd);
  } catch (err) {
    console.error("error:", err);
  }
  rl.clearLine(process.stdout, 0);
  rl.prompt();
}

let buffer = [];
let debounceTimeout = null;
const DEBOUNCE_DELAY = 100;

rl.prompt();
rl.on("line", (line) => {
  buffer.push(line);
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    const code = buffer.join("\n");
    evaluate(code);
    buffer = [];
  }, DEBOUNCE_DELAY);
});
