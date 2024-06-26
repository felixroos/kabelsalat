// node play.mjs | sox -traw -r44100 -b32 -e float - -tcoreaudio

import "../src/compiler.js";
import { AudioGraph } from "../src/audiograph.js";
import fs from "node:fs";
import path from "node:path";
import * as api from "../src/node.js";
import { audiostream } from "./audiostream.mjs";
import watch from "node-watch";
import { dirname } from "path";
import { fileURLToPath } from "url";

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
    // console.log("// file evaluated", evt, filename);
    const code = fs.readFileSync(filePath, { encoding: "utf8" });
    //console.log(code);
    update(code);
  } catch (err) {
    console.error(err);
  }
}

evaluateFile();

watchMode && watch(filePath, { recursive: true }, () => evaluateFile());
let dsp = () => audioGraph.genSample(0)[0];

const options = { sampleRate: 44100, bufferSize: 2048, duration };

export const writer = audiostream(dsp, options);

writer.pipe(process.stdout);
