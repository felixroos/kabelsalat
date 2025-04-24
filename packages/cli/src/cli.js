#!/usr/bin/env node

import * as core from "@kabelsalat/core/src/index.js";
import * as lib from "@kabelsalat/lib/src/index.js";
// for some reason, node will always take main and not module file...
import { AudioGraph } from "@kabelsalat/core/src/audiograph.js";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { audiostream } from "./audiostream.js";
import chokidar from "chokidar";
import Speaker from "speaker";
import yesno from "yesno";
import navigator from "jzz";

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
const fileExists = existsSync(file);
if (!fileExists) {
  const shouldCreate = await yesno({
    question: `file "${file}" not found. Do you want to create it? [y/n]`,
  });
  if (shouldCreate) {
    let defaultPatch = "sine([220,331]).mul(sine(3).range(.5,1)).out()";
    try {
      await fs.writeFile(file, defaultPatch);
    } catch (err) {
      if (err) {
        console.error("Could not write file:");
        throw err;
      }
    }
    console.log(`file ${file} created!`);
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

// init midi
const { MIDI, parseMidiMessage } = core;
const midi = new MIDI(navigator);
midi.on("midimessage", (_, message) => {
  const msg = parseMidiMessage(message);
  msg && audioGraph.parseMsg(msg);
});

Object.assign(globalThis, core);
Object.assign(globalThis, lib);
function update(code) {
  try {
    const node = core.evaluate(code);
    const unit = node.compile();
    audioGraph.parseMsg({ type: "SPAWN_UNIT", unit });
  } catch (err) {
    console.log("evaluation error:");
    console.log(err);
  }
}

async function evaluateFile() {
  try {
    const code = await fs.readFile(filePath, { encoding: "utf8" });
    // console.log(code);
    const t = performance.now();
    console.log("evaluating...");
    update(code);
    const took = performance.now() - t;
    console.log(`success! evaluation took ${took.toFixed(1)}ms`);
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
