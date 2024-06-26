export class Node {
  constructor(type, value) {
    this.type = type;
    value !== undefined && (this.value = value);
    this.ins = [];
  }
  // connect nodes to input node(s), return this node
  withIns(...ins) {
    this.ins = ins;
    return this;
  }
  withValue(value) {
    this.value = value;
    return this;
  }
  addInput(node) {
    this.ins.push(node);
    return this;
  }
  flatten() {
    return flatten(this);
  }
  dagify() {
    return dagify(this);
  }
  apply(fn) {
    return fn(this);
  }
  apply2(fn) {
    // clock(10).seq(51,52,0,53).apply2(hold).midinote().sine().out()
    return fn(this, this);
  }
  clone() {
    return new Node(this.type, this.value).withIns(...this.ins);
  }
  map(fn) {
    if (this.type !== "poly") {
      return fn(this);
    }
    return poly(...this.ins.map(fn));
  }
  dfs(fn, visited) {
    return this.apply((node) => dfs(node, fn, visited));
  }
  log(fn = (x) => x) {
    console.log(fn(this));
    return this;
  }
}

let dfs = (node, fn, visited = []) => {
  node = fn(node, visited);
  visited.push(node);
  node.ins = node.ins.map((input) => {
    if (visited.includes(input)) {
      return input;
    }
    return dfs(input, fn, visited);
  });
  return node;
};

/// MODULES

Node.prototype.asModuleInput = function (name) {
  this.inputOf = name;
  return this;
};

Node.prototype.asModuleOutput = function (name) {
  this.outputOf = name;
  return this;
};

// user facing function to create modules
// inputs and output are annotated so that viz can ignore inner nodes
export function module(name, fn, schema) {
  return register(
    name,
    (...args) => {
      args = args.map((input) => parseInput(input).asModuleInput(name));
      return fn(...args).asModuleOutput(name);
    },
    schema
  );
}

// converts a registered module into a json string
// unused atm... not sure if this is feasible
export function exportModule(name) {
  const mod = modules.get(name);
  const inputs = Array.from({ length: mod.length }, (_, i) =>
    node(`$INPUT${i}`)
  );
  const exported = mod(...inputs);
  return JSON.stringify(exported, null, 2);
}

// returns true if the given node forms a cycle with "me" (or is me)
function loopsToMe(node, me) {
  if (node === me) {
    return true;
  }
  if (node.ins.length === 0) {
    return false;
  }
  for (let neighbor of node.ins) {
    if (neighbor.ins.includes(me)) {
      return true;
    }
    return loopsToMe(neighbor, me);
  }
}

// transforms the graph into a dag, where cycles are broken into feedback_read and feedback_write nodes
function dagify(node) {
  let visitedNodes = [];
  function dfs(currentNode) {
    if (visitedNodes.includes(currentNode)) {
      // currentNode has one or more cycles, find them...
      const feedbackSources = currentNode.ins.filter((input) =>
        loopsToMe(input, currentNode)
      );
      if (!feedbackSources.length) {
        // it might happen that we end up here again after dagification..
        return;
      }
      feedbackSources.forEach((feedbackSource) => {
        const feedbackInlet = currentNode.ins.indexOf(feedbackSource);
        const feedbackReader = new Node("feedback_read");
        currentNode.ins[feedbackInlet] = feedbackReader;
        const feedbackWriter = new Node("feedback_write");
        feedbackWriter.ins = [feedbackSource];
        feedbackWriter.to = feedbackReader;
        node.ins.push(feedbackWriter);
      });
      return;
    }
    visitedNodes.push(currentNode);
    if (!currentNode.ins.length) {
      return;
    }
    for (const neighbor of currentNode.ins) {
      dfs(neighbor);
    }
  }
  dfs(node);
  return node;
}

function visit(node, visited = []) {
  visited.push(node);
  node.ins.forEach((child) => {
    if (!visited.includes(child)) {
      visit(child, visited);
    }
  });
  return visited;
}

function flatten(node) {
  const flat = visit(node);
  return flat.map((node) => {
    let clone = {
      ...node,
      type: node.type,
      ins: node.ins.map((child) => flat.indexOf(child) + ""),
    };
    node.value !== undefined && (clone.value = node.value);
    node.to !== undefined && (clone.to = flat.indexOf(node.to));
    return clone;
  });
}

export function evaluate(code) {
  // make sure to call Object.assign(globalThis, api);
  let nodes = [];
  Node.prototype.out = function () {
    nodes.push(this);
  };
  try {
    Function(code)();
    const node = dac(...nodes).exit();
    return node;
  } catch (err) {
    console.error(err);
    return n(0);
  }
}

// TODO: find a cool api to register functions (maybe similar to strudel's register)
// so far, node types added here also have to be added to the compiler, as well as NODE_CLASSES (for audio nodes)
// it would be nice if there was a way to define custom functions / nodes / dsp logic in a single place...

// let index = 0;
export const node = (type, value) => new Node(type, value /* , ++index */);

export function n(value) {
  if (Array.isArray(value)) {
    return poly(...value.map((v) => n(v)));
  }
  if (typeof value === "object") {
    return value;
  }
  return node("n", value);
  //return parseInput(value);
}

const polyType = "poly";
const outputType = "dac";

function parseInput(input, node) {
  if (Array.isArray(input)) {
    input = new Node(polyType).withIns(...input);
  }
  if (input.type === polyType) {
    // mind bending here we go
    return input.withIns(...input.ins.map((arg) => parseInput(arg, input)));
  }
  if (typeof input === "function") {
    return node.apply(input);
  }
  if (typeof input === "object") {
    // is node
    return input;
  }
  if (typeof input === "number" && !isNaN(input)) {
    return n(input);
  }
  console.log(
    `invalid input type "${typeof input}" for node of type, falling back to 0. The input was:`,
    input
  );
  return 0;
}

Node.prototype.inherit = function (parent) {
  parent.inputOf && (this.inputOf = parent.inputOf);
  parent.outputOf && (this.outputOf = parent.outputOf);
  return this;
};

function getNode(type, ...args) {
  const next = node(type);
  args = args.map((arg) => parseInput(arg, next));
  // gets channels per arg
  const expansions = args.map((arg) => {
    if (arg.type === polyType) {
      return arg.ins.length;
    }
    return 1;
  });
  // max channels to expand. the 1 is to make sure empty args won't break!
  const maxExpansions = Math.max(1, ...expansions);
  // no expansion early exit
  if (maxExpansions === 1) {
    return next.withIns(...args.map(parseInput));
  }

  // dont expand dac node, but instead input all channels
  if (type === outputType) {
    const inputs = args
      .map((arg) => {
        if (arg.type === polyType) {
          return arg.ins.map((input) => input.inherit(arg));
        }
        return arg;
      })
      .flat();
    return node(outputType).withIns(...inputs);
  }

  // multichannel expansion:
  // node([a,b,c], [x,y]) => expand(node(a,x), node(b,y), node(c,x))
  const expanded = Array.from({ length: maxExpansions }, (_, i) => {
    const inputs = args.map((arg) => {
      if (arg.type === polyType) {
        const input = arg.ins[i % arg.ins.length];
        return input.inherit(arg);
      }
      return parseInput(arg);
    });
    return new Node(type).withIns(...inputs);
  });
  return new Node(polyType).withIns(...expanded);
}

export let nodeRegistry = new Map();

// todo: dedupe with register?
export let makeNode = (type, schema) => {
  const { name = type.toLowerCase() } = schema || {};
  schema && nodeRegistry.set(type, schema);
  Node.prototype[name] = function (...args) {
    return getNode(type, this, ...args);
  };
  return (...args) => {
    return getNode(type, ...args);
  };
};

export let register = (name, fn, schema) => {
  schema && nodeRegistry.set(name, schema);
  Node.prototype[name] = function (...args) {
    return fn(this, ...args);
  };
  return fn;
};

export function getInletName(type, index) {
  const schema = nodeRegistry.get(type);
  if (!schema?.ins?.[index]) {
    return "";
  }
  return schema.ins[index].name;
}

// is this needed?
Node.prototype.over = function (fn) {
  return this.apply((x) => add(x, fn(x)));
};
