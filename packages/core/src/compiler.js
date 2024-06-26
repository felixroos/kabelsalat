import { Node, NODE_SCHEMA } from "./node.js";

// this compiler is actually not from noisecraft :)

function compile(node, options = {}) {
  const { log = false } = options;
  log && console.log("compile", node);
  const nodes = node.flatten(true);
  // log && console.log("flat", nodes);
  const sorted = topoSort(nodes);
  let lines = [];
  let v = (id) => (nodes[id].type === "n" ? nodes[id].value : `n${id}`);
  let pushVar = (id, value, comment) =>
    lines.push(
      `const ${v(id)} = ${value};${comment ? ` /* ${comment} */` : ""}`
    );
  let infix = (a, op, b) => `(${a} ${op} ${b})`;
  let thru = (id) => pushVar(id, v(nodes[id].ins[0]));
  const infixOperators = {
    add: "+",
    mul: "*",
    sub: "-",
    div: "/",
    mod: "%",
  };
  const mathFunctions = {
    sin: "sin",
    cos: "cos",
  };
  const audioThreadNodes = [];
  let channels;
  for (let id of sorted) {
    const node = nodes[id];
    const vars = nodes[id].ins.map((inlet) => v(inlet));
    // is infix operator node?
    if (infixOperators[node.type]) {
      const op = infixOperators[node.type];
      const calc = vars.join(` ${op} `);
      const comment = nodes[id].ins
        .map((inlet) => nodes[inlet].type)
        .join(` ${op} `);
      pushVar(id, calc, comment);
      continue;
    }
    // is math function?
    if (mathFunctions[node.type]) {
      const fn = mathFunctions[node.type];
      const calc = `Math.${fn}(${vars.join(", ")})`;
      const comment = fn;
      pushVar(id, calc, comment);
      continue;
    }
    // is audio node?
    if (NODE_SCHEMA[node.type] && NODE_SCHEMA[node.type].audio !== false) {
      const comment = node.type;
      const dynamic = NODE_SCHEMA[node.type].dynamic;
      let passedVars = vars;
      if (!dynamic) {
        // defaults could theoretically also be set inside update function
        // but that might be bad for the jit compiler, as it needs to check for undefined values?
        passedVars = NODE_SCHEMA[node.type].ins.map(
          (inlet, i) => vars[i] ?? inlet.default
        );
      }
      const index = audioThreadNodes.length;
      audioThreadNodes.push(node.type);
      if (node.type === "feedback_read") {
        // remap indices
        // we need to rewrite the "to" value to the audio node index (instead of flat node index)
        const writer = nodes.find(
          (node) => node.type === "feedback_write" && String(node.to) === id
        );
        writer.to = index;
      }
      const args = NODE_SCHEMA[node.type].args || []; // some nodes want time or inputs
      const params = args.concat(passedVars);
      const call = `nodes[${index}].update(${params.join(", ")})`;
      pushVar(id, call, comment);
      continue;
    }
    if (["n", "exit"].includes(node.type)) {
      // do nothing: n is handled directly, exit just joins dac and feedback targets
      continue;
    }
    switch (node.type) {
      case "range": {
        const [bipolar, min, max] = vars;
        // bipolar [-1,1] to unipolar [0,1] => (v+1)/2
        const unipolar = infix(infix(bipolar, "+", 1), "*", 0.5);
        // var = val*(max-min)+min
        const range = infix(max, "-", min);
        const calc = infix(infix(unipolar, "*", range), "+", min);
        pushVar(id, calc, "range");
        break;
      }
      case "mix": {
        const calc = `(${vars.join(" + ")})`;
        pushVar(id, calc, "mix");
        break;
      }
      case "midinote": {
        const [note] = vars;
        const calc = `(2 ** ((${note} - 69) / 12) * 440)`;
        pushVar(id, calc, "midinote");
        break;
      }
      case "dac": {
        if (channels) {
          console.log("multiple uses of dac not allowed");
          break;
        }
        if (!vars.length) {
          console.warn(`no input.. call .out() to play`);
          channels = [0, 0];
          break;
        }
        channels = vars;
        break;
      }
      case "feedback_write": {
        // write to var because it's an input to dac (because otherwise the write node would not be part of the graph)
        lines.push(
          `const ${v(id)} = nodes[${node.to}].write(${
            vars[0]
          }); // feedback_write`
        );
        break;
      }
      default: {
        console.warn(`unhandled node type ${nodes[id].type}`);
        thru(id);
      }
    }
  }
  if (channels === undefined) {
    console.log("no .dac() node used...");
    channels = [0, 0];
  } else if (channels.length === 1) {
    // make mono if only one channel
    channels = [channels[0], channels[0]];
  } else if (channels.length > 2) {
    console.warn("returned more than 2 channels.. using first 2");
    channels = channels.slice(0, 2);
  }
  lines.push(`return [${channels.map((chan) => `(${chan}*0.3)`).join(", ")}]`);

  const src = lines.join("\n");
  if (log) {
    console.log("compiled code:");
    console.log(src);
  }
  return { src, nodes, audioThreadNodes };
}

Node.prototype.compile = function (options) {
  return compile(this.dagify().resolveModules(), options);
};

// taken from noisecraft
// https://github.com/maximecb/noisecraft
// LICENSE: GPL-2.0

export function topoSort(nodes) {
  // Count the number of input edges going into a node
  function countInEdges(nodeId) {
    let node = nodes[nodeId];
    let numIns = 0;

    for (let i = 0; i < node.ins.length; ++i) {
      let edge = node.ins[i];

      if (!edge) continue;

      if (remEdges.has(edge)) continue;

      numIns++;
    }

    return numIns;
  }

  // Set of nodes with no incoming edges
  let S = [];

  // List sorted in reverse topological order
  let L = [];

  // Map of input-side edges removed from the graph
  let remEdges = new Set();

  // Map of each node to a list of outgoing edges
  let outEdges = new Map();

  // Populate the initial list of nodes without input edges
  for (let nodeId in nodes) {
    if (countInEdges(nodeId) == 0) {
      S.push(nodeId);
    }
  }
  // Initialize the set of list of output edges for each node
  for (let nodeId in nodes) {
    outEdges.set(nodeId, []);
  }

  // Populate the list of output edges for each node
  for (let nodeId in nodes) {
    let node = nodes[nodeId];

    // For each input of this node
    for (let i = 0; i < node.ins.length; ++i) {
      let edge = node.ins[i];
      if (edge === undefined) continue;

      let srcId = node.ins[i];
      let srcOuts = outEdges.get(srcId);
      srcOuts.push([nodeId, edge]);
    }
  }

  // While we have nodes with no inputs
  while (S.length > 0) {
    // Remove a node from S, add it at the end of L
    var nodeId = S.pop();
    L.push(nodeId);

    // Get the list of output edges for this node
    let nodeOuts = outEdges.get(nodeId);

    // For each outgoing edge
    for (let [dstId, edge] of nodeOuts) {
      // Mark the edge as removed
      remEdges.add(edge);

      // If the node has no more incoming edges
      if (countInEdges(dstId) == 0) S.push(dstId);
    }
  }
  L = Array.from(new Set(L)); // <--- had to add this to make .apply(x=>x.mul(x)) work
  // hopefully doesn't break anything

  // If the topological ordering doesn't include all the nodes
  if (L.length != Object.keys(nodes).length) {
    throw SyntaxError("graph contains cycles");
  }

  return L;
}
