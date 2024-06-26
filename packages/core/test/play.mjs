// node play.mjs | sox -traw -r44100 -b32 -e float - -tcoreaudio

import "../src/compiler.js";
import { AudioGraph } from "../src/audiograph.js";
import fs from "node:fs";
import path from "node:path";
import * as api from "../src/node.js";
import { audiostream } from "./audiostream.mjs";
import chokidar from "chokidar";
import { dirname } from "path";
import { fileURLToPath } from "url";
// import { spawn } from "child_process";

// detect node version
const minNodeVersion = 20;
const [major] = process.versions.node.split(".").map(Number);
if (major < minNodeVersion) {
  throw new Error(`You need Node.js >= ${minNodeVersion}`);
}

// handle duration and file params
const __dirname = dirname(fileURLToPath(import.meta.url));
// const __dirname = import.meta.dirname; // node 22..

const flags = process.argv.filter((arg) => arg.startsWith("-"));
const args = process.argv.filter((arg) => !arg.startsWith("--"));
const watchMode = flags.includes("-w");

const duration = Number(args[2] || 0);
const file = args[3] || "kabelsalat.js";

const filePath = path.resolve(__dirname, file);
// console.log("filePath", filePath);

// create audio graph
const audioGraph = new AudioGraph(44100);

Object.assign(globalThis, api);
function update(code) {
  const node = api.evaluate(code);
  const unit = node.compile(node);
  audioGraph.parseMsg({ type: "NEW_UNIT", unit });
}

async function evaluateFile() {
  try {
    const code = fs.readFileSync(filePath, { encoding: "utf8" });
    //console.log(code);
    update(code);
  } catch (err) {
    console.error(err);
  }
}

evaluateFile();

if (watchMode) {
  const watcher = chokidar.watch(filePath, { persistent: true });
  watcher.on("change", () => evaluateFile());
}

let dsp = () => audioGraph.genSample(0)[0];

const options = { sampleRate: 44100, bufferSize: 256, duration };

export const samples = audiostream(dsp, options);

samples.pipe(process.stdout);

/* const fifoPath = "/tmp/soxpipe";
const fifoStream = fs.createWriteStream(fifoPath);
samples.pipe(fifoStream); */

/* setTimeout(() => {
  // samples.pipe(process.stdout);
  const player = spawn("sox", [
    "-traw",
    "-r44100",
    "-b32",
    "-e",
    "float",
    // "-",
    fifoPath,
    "-tcoreaudio",
    "--buffer",
    "1024",
  ]);
  // Handle stderr data
  player.stderr.pipe(process.stdout);
}, 200); */

/* const player = spawn("ffplay", [
  "-f",
  "f32le",
  "-ar",
  "44100",
  "-nodisp",
  "-autoexit",
  "-",
]); 
samples.pipe(player.stdin);
*/
