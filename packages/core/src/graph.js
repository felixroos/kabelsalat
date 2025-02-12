export class Node {
  constructor(type, value) {
    this.type = type;
    value !== undefined && (this.value = value);
    this.ins = [];
  }
  static parseInput(input, node) {
    if (typeof input === "function") {
      if (!node) {
        throw new Error(
          "tried to parse function input without without passing node.."
        );
      }
      return input(node);
    }
    if (typeof input === "object") {
      // is node
      return input;
    }
    if (typeof input === "number" && !isNaN(input)) {
      return n(input);
    }
    if (typeof input === "string") {
      return n(input);
    }
    console.log(
      `invalid input type "${typeof input}" for node of type "${
        node.type
      }", falling back to 0. The input was:`,
      input
    );
    return 0;
  }
}
export const node = (type, value) => new Node(type, value);

export let nodeRegistry = new Map();

const polyType = "poly";
const outputType = "exit";

Node.prototype.inherit = function (parent) {
  parent.inputOf && (this.inputOf = parent.inputOf);
  parent.outputOf && (this.outputOf = parent.outputOf);
  return this;
};

Node.prototype.toObject = function () {
  return JSON.parse(JSON.stringify(this));
};
Node.prototype.stringify = function () {
  return JSON.stringify(this, null, 2).replaceAll('"', "'");
};

export function getNode(type, ...args) {
  let maxExpansions = 1;
  args = args.map((arg) => {
    // desugar array to poly node
    if (Array.isArray(arg)) {
      if (arg.length === 1) {
        return arg[0]; // don't poly for 1
      }
      arg = new Node(polyType).withIns(...arg);
    }
    if (typeof arg === "function") {
      // if we have a feedback function, we need to check if it expands
      const peek = arg(new Node("peek")); // the input node type doesn't matter
      if (peek.type === polyType) {
        maxExpansions = Math.max(peek.ins.length, maxExpansions);
      }
    }
    if (arg.type === polyType) {
      maxExpansions = Math.max(arg.ins.length, maxExpansions);
    }
    return arg;
  });

  // early exit if no expansion is happening
  if (maxExpansions === 1) {
    const next = node(type);
    return next.withIns(...args.map((arg) => Node.parseInput(arg, next))); //
  }

  // dont expand exit node, but instead input all channels
  if (type === outputType) {
    const inputs = args
      .map((arg) => {
        if (arg.type === polyType) {
          // we expect arg.ins to not contain functions..
          return arg.ins.map((arg) => Node.parseInput(arg).inherit(arg));
        }
        return arg;
      })
      .flat();
    return node(outputType).withIns(...inputs);
  }

  // multichannel expansion:
  // node([a,b,c], [x,y]) => expand(node(a,x), node(b,y), node(c,x))
  const expanded = Array.from({ length: maxExpansions }, (_, i) => {
    const cloned = new Node(type);
    const inputs = args.map((arg) => {
      if (arg.type === polyType) {
        const input = Node.parseInput(arg.ins[i % arg.ins.length], cloned);
        return input.inherit(arg);
      }
      arg = Node.parseInput(arg, cloned); // wire up cloned node for feedback..
      if (arg.type === polyType) {
        // this can happen when arg was a function that contained multichannel expansion...
        arg = arg.ins[i];
      }
      return arg;
    });
    return cloned.withIns(...inputs);
  });
  return new Node(polyType).withIns(...expanded);
}

export function getInletName(type, index) {
  const schema = nodeRegistry.get(type);
  if (!schema?.ins?.[index]) {
    return "";
  }
  return schema.ins[index].name;
}

export let registerNode = (type, schema) =>
  register(type, (...args) => getNode(type, ...args), schema);

////////

nodeRegistry.set("register", {
  tags: ["meta"],
  graph: false,
  description:
    "Registers a new Node function. Sets it on the prototype + returns the function itself. Like `module` but doesn't hide complexity in graph viz.",
  examples: [
    `let kick = register('kick', gate => gate.adsr(0,.11,0,.11)
.apply(env => env.mul(env)
  .mul(158)
  .sine(env)
  .distort(.85)
))
impulse(2).kick().out()`,
  ],
});
export let register = (name, fn, schema) => {
  schema && nodeRegistry.set(name, schema);
  Node.prototype[name] = function (...args) {
    return fn(this, ...args);
  };
  return fn;
};

nodeRegistry.set("module", {
  tags: ["meta"],
  graph: true,
  description:
    "Creates a module. Like `register`, but the graph viz will hide the internal complexity of the module.",
  examples: [
    `let kick = module('kick', gate => gate.adsr(0,.11,0,.11)
.apply(env => env.mul(env)
  .mul(158)
  .sine(env)
  .distort(.85)
))
impulse(2).kick().out()`,
  ],
});
let moduleId = 0;
export function module(name, fn, schema) {
  return register(
    name,
    (...args) => {
      const id = moduleId++;
      // TODO: support function as arg for feedback => parseInput expects 2 args
      args = args.map((input, i) =>
        Node.parseInput(input).asModuleInput?.(name, id, i)
      );
      return fn(...args).asModuleOutput?.(name, id);
    },
    schema
  );
}

nodeRegistry.set("n", {
  tags: ["math"],
  description: "Constant value node. Turns a number into a Node.",
  ins: [{ name: "value", default: 0 }],
});
export function n(value) {
  if (Array.isArray(value)) {
    return poly(...value.map((v) => n(v)));
  }
  if (typeof value === "object") {
    return value;
  }
  return node("n", value);
}

nodeRegistry.set("out", {
  tags: ["meta"],
  description: "Sends the node to the audio output",
});

nodeRegistry.set("withIns", {
  internal: true,
  tags: ["innards"],
  description: "Sets the inputs of a node. Returns the node itself",
  ins: [{ name: "in", dynamic: true }],
});
Node.prototype.withIns = function (...ins) {
  this.ins = ins;
  return this;
};

nodeRegistry.set("flatten", {
  internal: true,
  tags: ["innards"],
  description:
    "Flattens the node to a list of all nodes in the graph, where each Node's ins are now indices",
});
Node.prototype.flatten = function () {
  return flatten(this);
};

nodeRegistry.set("apply", {
  graph: true,
  tags: ["meta"],
  description:
    "Applies the given function to the Node. Useful when a node has to be used multiple times.",
  examples: [
    `impulse(4)
.apply(imp=>imp
  .seq(110,220,330,440)
  .sine()
  .mul( imp.ad(.1,.1) )
).out()`,
  ],
});
Node.prototype.apply = function (fn) {
  return fn(this);
};

nodeRegistry.set("clone", {
  internal: true,
  tags: ["innards"],
  description: "Clones the node",
});
Node.prototype.clone = function () {
  return new Node(this.type, this.value).withIns(...this.ins);
};

nodeRegistry.set("map", {
  tags: ["meta"],
  description:
    "Applies the given function to all ins if it's poly node. Otherwise it applies the function to itself.",
  examples: [
    `n([110,220,330])
.map( freq=>freq.mul([1,1.007]).saw().mix() )
.mix(2).mul(.5).out()`,
  ],
});
Node.prototype.map = function (fn) {
  if (this.type !== "poly") {
    return fn(this);
  }
  return poly(...this.ins.map(fn));
};

Node.prototype.channel = function (ch) {
  if (this.type !== "poly") {
    return this;
  }
  return this.ins[ch % this.ins.length];
};

nodeRegistry.set("select", {
  tags: ["meta"],
  graph: true,
  description:
    "Find the first occurence of the given type up in the graph and returns the match. Useful to exit a feedback loop at another point.",
  examples: [
    `sine(220).mul(impulse(1).ad(.001,.2))
.add( x=>x.delay(.2).mul(.8) )
.select('delay').out()
`,
  ],
});
Node.prototype.select = function (type) {
  for (let input of this.ins) {
    if (input.type === type) {
      return input;
    }
    const upper = input.select(type);
    if (upper) {
      return upper;
    }
  }
};

nodeRegistry.set("debug", {
  tags: ["meta"],
  description: "Logs the node to the console",
});
Node.prototype.debug = function (fn = (x) => x) {
  console.log(fn(this));
  return this;
};

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

// GRAPH HELPERS

function flatten(node) {
  const flat = [];
  dfs(node, (node) => {
    flat.push(node);
    return node;
  });
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

export let exit = registerNode("exit", { internal: true });

export function evaluate(code, scope) {
  let nodes = [];
  Node.prototype.out = function (channels = [0, 1]) {
    nodes.push(this.output(channels));
  };
  if (scope) {
    scope.out = (node = n(0), ch) => node.out(ch);
    // pass all members of scope as function arguments to avoid using global scope
    Function(...Object.keys(scope), code)(...Object.values(scope));
  } else {
    globalThis.out = (node = n(0), ch) => node.out(ch);
    // expect scope to be assigned to globalThis
    Function(code)();
  }
  const node = exit(...nodes);
  return node;
}

// is this needed?
Node.prototype.over = function (fn) {
  return this.apply((x) => add(x, fn(x)));
};

// tbd doc?
Node.prototype.dfs = function (fn, visited) {
  return this.apply((node) => dfs(node, fn, visited));
};
// tbd doc?
Node.prototype.apply2 = function (fn) {
  // clock(10).seq(51,52,0,53).apply2(hold).midinote().sine().out()
  return fn(this, this);
};

// tbd doc?
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

// tbd doc?
Node.prototype.asModuleInput = function (name, id, index) {
  this.inputOf = this.inputOf || [];
  this.inputOf.push([name, id, index]);
  return this;
};
// tbd doc?
Node.prototype.asModuleOutput = function (name, id) {
  this.outputOf = [name, id];
  return this;
};
