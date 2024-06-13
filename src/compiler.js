import { Node, NODE_SCHEMA } from "./node.js";

// this compiler is actually not from noisecraft :)

Node.prototype.compile = function () {
  console.log("compile", this);
  const nodes = this.flatten(true);
  // console.log("flat", nodes);
  const sorted = topoSort(nodes);
  let lines = [];
  let v = (id) => (nodes[id].type === "n" ? nodes[id].value : `n${id}`);
  let pushVar = (id, value, comment) =>
    lines.push(
      `const ${v(id)} = ${value};${comment ? ` /* ${comment} */` : ""}`
    );
  let u = (id, ...ins) => `nodes[${id}].update(${ins.join(", ")})`;
  let ut = (id, ...ins) => `nodes[${id}].update(time, ${ins.join(", ")})`; // some functions want time as first arg (without being an inlet)
  let infix = (a, op, b) => `(${a} ${op} ${b})`;
  let thru = (id) => pushVar(id, v(nodes[id].ins[0]));
  const infixOperators = {
    add: "+",
    mul: "*",
    sub: "-",
    div: "/",
    mod: "%",
  };
  const audioThreadNodes = [];
  let dac;
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
    // is audio node?
    if (NODE_SCHEMA[node.type] && NODE_SCHEMA[node.type].audio !== false) {
      const comment = node.type;
      const addTime = NODE_SCHEMA[node.type].time;
      const dynamic = NODE_SCHEMA[node.type].dynamic;
      const ufn = addTime ? ut : u;
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
      pushVar(id, ufn(index, ...passedVars), comment);
      continue;
    }
    switch (node.type) {
      case "n": {
        // do nothing, n values are written directly
        // pushVar(id, node.value, "n");
        break;
      }
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
      case "midinote": {
        const [note] = vars;
        const calc = `(2 ** ((${note} - 69) / 12) * 440)`;
        pushVar(id, calc, "midinote");
        break;
      }
      case "dac": {
        if (!vars.length) {
          console.warn(`no input.. call .out() to play`);
          dac = 0;
          break;
        }
        if (dac) {
          console.warn(`multiple use of dac node.. using last call`);
        }
        dac = `(${vars.join(" + ")})*0.3`;
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
  if (dac === undefined) {
    console.log("no .dac() node used...");
    return { src: `return [0,0]`, nodes, audioThreadNodes };
  }
  lines.push(`return [${dac}, ${dac}]`);

  const src = lines.join("\n");
  console.log("compiled code:");
  console.log(src);
  return { src, nodes, audioThreadNodes };
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
