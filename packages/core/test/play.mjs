import "../src/compiler.js";
import { AudioGraph } from "../src/audiograph.js";
import fs from "node:fs";
import path from "node:path";
import * as api from "../src/node.js";
import { audiostream } from "./audiostream.mjs";
import chokidar from "chokidar";
import { dirname } from "path";
import { fileURLToPath } from "url";
import Speaker from "speaker";

// detect node version
const minNodeVersion = 20;
const [major] = process.versions.node.split(".").map(Number);
if (major < minNodeVersion) {
  throw new Error(`You need Node.js >= ${minNodeVersion}`);
}

// handle duration and file params
const __dirname = dirname(fileURLToPath(import.meta.url));
// const __dirname = import.meta.dirname; // node 22..

const duration = Number(process.argv[2] || 0);
const file = process.argv[3] || "kabelsalat.js";

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

const watcher = chokidar.watch(filePath, { persistent: true });
watcher.on("change", () => evaluateFile());

let dsp = () => audioGraph.genSample(0)[0];

const options = { sampleRate: 44100, bufferSize: 128, duration };

export const samples = audiostream(dsp, options);

const speaker = new Speaker({
  channels: 1,
  bitDepth: 32,
  sampleRate: 44100,
  float: true,
});

samples.pipe(speaker);
