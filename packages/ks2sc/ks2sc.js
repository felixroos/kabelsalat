import { spawn } from "node:child_process";
import readline from "node:readline";
const child = spawn("sclang", [], { stdio: "pipe" });

child.stdout.on("data", (data) => {
  //console.log(`sc: ${data}`);
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

const lerp = (v, min, max) => v * (max - min) + min;
function lerpx(x, min, max, base = 2) {
  const normalized = (Math.pow(base, x) - 1) / (base - 1);
  return lerp(normalized, min, max);
}
const norm2hz = (norm, sampleRate = 44100) =>
  lerpx(Number(norm), 0, sampleRate / 2);

Object.assign(globalThis, {
  out: register(
    "out",
    compileWith((args) => args[0]) // dummy..
  ),
  mul: registerOp("mul", "*"),
  div: registerOp("div", "/"),
  add: registerOp("add", "+"),
  sub: registerOp("sub", "-"),
  saw: registerUgen("saw", "Saw"),
  sine: registerUgen("sine", "SinOsc"),
  lpf: registerUgen("lpf", "RLPF"),
  impulse: registerUgen("impulse", "Impulse"),
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
});

function ks2scd(code) {
  const fn = new Function(`return ${code}`);
  const node = fn();
  const { lines, last } = node.compile();
  const compiled = lines.join("\n");
  const scd = `(s.waitForBoot(){
  (Ndef(\\synth, {
    ${compiled}
    [${last},${last}]
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
rl.prompt();
rl.on("line", (input) => {
  try {
    const scd = ks2scd(input);
    console.log("sclang: \n", scd);
    runScd(scd);
  } catch (err) {
    console.error("error:", err);
  }
  rl.prompt();
});
