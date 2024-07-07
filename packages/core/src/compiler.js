import { Node, nodeRegistry } from "./graph.js";

// this compiler is actually not from noisecraft :)

export function compile(node, options = {}) {
  const { log = false, ugenOffset = 0 } = options;
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
  let thru = (id) => pushVar(id, v(nodes[id].ins[0]));

  const ugens = [];
  let channels;
  for (let id of sorted) {
    const node = nodes[id];
    const vars = nodes[id].ins.map((inlet) => v(inlet));
    const ugenIndex = ugens.length + ugenOffset;

    // is audio node?
    const schema = nodeRegistry.get(node.type);
    if (schema && schema.compile) {
      pushVar(
        id,
        schema.compile(vars, { node, nodes, id, ugenIndex }),
        node.type
      );
      if (schema.ugen) {
        ugens.push(schema.ugen);
      }
      continue;
    }
    if (schema && schema.compileRaw) {
      lines.push(schema.compileRaw(vars, node, v(id)));
      continue;
    }
    if (schema && schema.compilerNoop) {
      continue;
    }
    if (node.type === "dac") {
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
      continue;
    }

    console.warn(`unhandled node type ${nodes[id].type}`);
    thru(id);
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
  lines.push(`return [${channels.map((chan) => `(${chan}*lvl)`).join(", ")}]`);

  const src = lines.join("\n");
  if (log) {
    console.log("compiled code:");
    console.log(src);
  }
  return { src, ugens, ugenOffset };
}

Node.prototype.compile = function (options) {
  return compile(this.dagify(), options);
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
