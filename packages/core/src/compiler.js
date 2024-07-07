import { Node, nodeRegistry } from "./graph.js";

export function compile(node, options = {}) {
  const {
    log = false,
    ugenOffset = 0,
    fallbackType = "thru",
    constType = "n",
    varPrefix = "n",
  } = options;
  log && console.log("compile", node);
  const nodes = node.flatten(true);
  // log && console.log("flat", nodes);
  const sorted = topoSort(nodes);
  let lines = [];
  let v = (id) =>
    nodes[id].type === constType ? nodes[id].value : `${varPrefix}${id}`;
  const ugens = [];
  for (let id of sorted) {
    const node = nodes[id];
    const vars = nodes[id].ins.map((inlet) => v(inlet));
    const ugenIndex = ugens.length + ugenOffset;

    let schema = nodeRegistry.get(node.type);
    if (!schema) {
      console.warn(
        `unhandled node type "${nodes[id].type}". falling back to "${fallbackType}"`
      );
      schema = nodeRegistry.get(fallbackType);
    }
    if (schema.ugen) {
      ugens.push(schema.ugen);
    }
    const meta = { vars, node, nodes, id, ugenIndex, name: v(id) };
    if (schema.compile) {
      lines.push(schema.compile(meta));
    }
  }

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

  let S = []; // Set of nodes with no incoming edges
  let L = []; // List sorted in reverse topological order
  let remEdges = new Set(); // Map of input-side edges removed from the graph
  let outEdges = new Map(); // Map of each node to a list of outgoing edges

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
