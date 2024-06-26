import "@kabelsalat/core/src/compiler.js";
import { AudioGraph } from "@kabelsalat/core/src/audiograph.js";
import fs from "node:fs";
import path from "node:path";
import * as api from "@kabelsalat/core/src/node.js";
import { audiostream } from "./audiostream.js";
import chokidar from "chokidar";
import Speaker from "speaker";
import yesno from "yesno";

let logo = `
▄ •▄  ▄▄▄· ▄▄▄▄· ▄▄▄ .▄▄▌  .▄▄ ·  ▄▄▄· ▄▄▌   ▄▄▄· ▄▄▄▄▄
█▌▄▌▪▐█ ▀█ ▐█ ▀█▪▀▄.▀·██•  ▐█ ▀. ▐█ ▀█ ██•  ▐█ ▀█ •██  
▐▀▀▄·▄█▀▀█ ▐█▀▀█▄▐▀▀▪▄██▪  ▄▀▀▀█▄▄█▀▀█ ██▪  ▄█▀▀█  ▐█.▪
▐█.█▌▐█ ▪▐▌██▄▪▐█▐█▄▄▌▐█▌▐▌▐█▄▪▐█▐█ ▪▐▌▐█▌▐▌▐█ ▪▐▌ ▐█▌·
·▀  ▀ ▀  ▀ ·▀▀▀▀  ▀▀▀ .▀▀▀  ▀▀▀▀  ▀  ▀ .▀▀▀  ▀  ▀  ▀▀▀ 
`;

console.log(logo.trim());

// detect node version
const minNodeVersion = 20;
const [major] = process.versions.node.split(".").map(Number);
if (major < minNodeVersion) {
  throw new Error(`You need Node.js >= ${minNodeVersion}`);
}

let file = process.argv[2];
if (!file) {
  console.log("no input file given -> using `kabelsalat.js`");
  console.info("tip: you can also run `npx @kabelsalat/cli path/to/file.js`");
  file = "kabelsalat.js";
}
const fileExists = fs.existsSync(file);
if (!fileExists) {
  const shouldCreate = await yesno({
    question: `file "${file}" not found. Do you want to create it? [y/n]`,
  });
  if (shouldCreate) {
    let defaultPatch = "sine([220,331]).mul(sine(3).range(.5,1)).out()";
    fs.writeFile(file, defaultPatch, (err) => {
      if (err) {
        console.error("Could not write file:");
        throw err;
      }
    });
  } else {
    console.log("ok, thx, bye..");
    process.exit();
  }
}
// ...

const filePath = path.resolve(process.cwd(), file);
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
    // console.log(code);
    const t = performance.now();
    update(code);
    const took = performance.now() - t;
    console.log(`evaluation took ${took.toFixed(1)}ms`);
  } catch (err) {
    console.error(err);
  }
}

evaluateFile();

const watcher = chokidar.watch(filePath, { persistent: true });
watcher.on("change", () => evaluateFile());

let dsp = () => audioGraph.genSample(0);

const options = { bufferSize: 128, channels: 2 };

export const samples = audiostream(dsp, options);

const speaker = new Speaker({
  channels: 2,
  bitDepth: 32,
  sampleRate: 44100,
  float: true,
  samplesPerFrame: 256,
});

samples.pipe(speaker);
