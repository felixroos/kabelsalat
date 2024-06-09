import { Node, NODE_SCHEMA } from "./node.js";

// this compiler is actually not from noisecraft :)

const audioNodeDefaults = {};

for (let type in NODE_SCHEMA) {
  audioNodeDefaults[type] = NODE_SCHEMA[type].ins.map((inlet) => inlet.default);
}

Node.prototype.compile = function () {
  const nodes = this.visitKeyed();
  const graph = { nodes };
  // const sorted = Object.keys(nodes).reverse();
  const sorted = topoSort(graph); // do we need this?
  let lines = [];
  let v = (id) => `_${id}`;
  let pushVar = (id, value, comment) =>
    lines.push(`const ${v(id)} = ${value};${comment ? ` // ${comment}` : ""}`);
  let u = (id, ...ins) => `nodes['${id}'].update(${ins.join(", ")})`;
  let ut = (id, ...ins) => `nodes['${id}'].update(time, ${ins.join(", ")})`; // some functions want time as first arg (without being an inlet)
  let infix = (a, op, b) => `(${a} ${op} ${b})`;
  let inlets = (id) => nodes[id].ins;
  let inletVars = (id, defaultValues, comment, addTime = false) => {
    const vars = defaultValues.map((fallback, i) =>
      nodes[id].ins[i] ? v(nodes[id].ins[i].id) : fallback
    );
    const ufn = addTime ? ut : u;
    pushVar(id, ufn(id, ...vars), comment);
  };
  let dynamicInletVars = (id, addTime, comment) => {
    const vars = nodes[id].ins.map((inlet) => v(inlet.id));
    const ufn = addTime ? ut : u;
    pushVar(id, ufn(id, ...vars), comment);
  };
  let op2 = (id, op, comment) => {
    const ins = inlets(id);
    const a = v(ins[0].id);
    const b = v(ins[1].id);
    pushVar(id, infix(a, op, b), infix(ins[0].type, op, ins[1].type));
  };
  let thru = (id) => pushVar(id, v(nodes[id].ins[0].id));
  for (let id of sorted) {
    const node = nodes[id];
    switch (node.type) {
      case "n": {
        pushVar(id, node.value, "n");
        break;
      }
      case "mul": {
        op2(id, "*");
        break;
      }
      case "range": {
        const bipolar = v(nodes[id].ins[0].id);
        const min = v(nodes[id].ins[1].id);
        const max = v(nodes[id].ins[2].id);
        // bipolar [-1,1] to unipolar [0,1] => (v+1)/2
        const unipolar = infix(infix(bipolar, "+", 1), "*", 0.5);
        // (bip+1)/2
        // var = val*(max-min)+min
        const range = infix(max, "-", min);
        const calc = infix(infix(unipolar, "*", range), "+", min);
        pushVar(id, calc, "val*(max-min)+min");
        break;
      }
      case "add": {
        op2(id, "+");
        break;
      }
      case "out": {
        const sum = v(node.ins[0].id);
        const lvl = 0.3; // turn down to avoid clipping
        lines.push(`return [${sum}*${lvl},${sum}*${lvl}]`);
        break;
      }
      default: {
        if (NODE_SCHEMA[node.type]) {
          if (NODE_SCHEMA[node.type].dynamic) {
            dynamicInletVars(id, NODE_SCHEMA[node.type].time, node.type);
          } else {
            inletVars(
              id,
              audioNodeDefaults[node.type],
              node.type,
              NODE_SCHEMA[node.type].time
            );
          }
          break;
        }
        console.warn(`unhandled node type ${nodes[id].type}`);
        thru(id);
      }
    }
  }
  const src = lines.join("\n");
  console.log("code");
  console.log(src);
  return { src, nodes };
};

// taken from noisecraft
// https://github.com/maximecb/noisecraft
// LICENSE: GPL-2.0

export function topoSort(graph) {
  // Count the number of input edges going into a node
  function countInEdges(nodeId) {
    let node = graph.nodes[nodeId];
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
  let remEdges = new WeakSet();

  // Map of each node to a list of outgoing edges
  let outEdges = new Map();

  // Populate the initial list of nodes without input edges
  for (let nodeId in graph.nodes) {
    if (countInEdges(nodeId) == 0) {
      S.push(nodeId);
    }
  }

  // Initialize the set of list of output edges for each node
  for (let nodeId in graph.nodes) {
    outEdges.set(nodeId, []);
  }

  // Populate the list of output edges for each node
  for (let nodeId in graph.nodes) {
    let node = graph.nodes[nodeId];

    // For each input of this node
    for (let i = 0; i < node.ins.length; ++i) {
      let edge = node.ins[i];

      if (!edge) continue;

      //let [srcId, srcPort] = node.ins[i];
      let srcId = node.ins[i].id;
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

  // If the topological ordering doesn't include all the nodes
  if (L.length != Object.keys(graph.nodes).length) {
    throw SyntaxError("graph contains cycles");
  }

  return L;
}
