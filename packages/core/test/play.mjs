// node play.mjs | sox -traw -r44100 -b32 -e float - -tcoreaudio

import { AudioWriter } from "./audiowriter.mjs";
import "../src/compiler.js";
import { AudioGraph } from "../src/audiograph.js";
import fs from "node:fs";
import * as api from "../src/node.js";

let code;
try {
  code = fs.readFileSync("./patches/acidmachine.js", "utf8");
} catch (err) {
  console.error(err);
}

function evaluate(code) {
  Object.assign(globalThis, api);
  let nodes = [];
  api.Node.prototype.out = function () {
    nodes.push(this);
  };
  try {
    Function(code)();
    const node = api.dac(...nodes).exit();
    return node;
  } catch (err) {
    console.error(err);
    return api.n(0);
  }
}

const node = evaluate(code).dagify();

const unit = node.compile();
const audioGraph = new AudioGraph(44100);
audioGraph.parseMsg({ type: "NEW_UNIT", unit });

const options = { sampleRate: 44100, bufferSize: 2048 };
const writer = new AudioWriter(() => audioGraph.genSample(0)[0], options);

writer.start();
