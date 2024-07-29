import { Node, getInletName } from "@kabelsalat/core";
import toDot from "jgf-dot";
import { Graphviz } from "@hpcc-js/wasm/graphviz";

const graphvizLoaded = Graphviz.load();

Node.prototype.render = async function (container, options = {}) {
  if (!container) {
    return;
  }
  const {
    dagify = false, // if true, cycles will be transformed to feedback nodes
    resolveModules = false, // if false, module innards are ignored
    inlineNumerics = true,
    renderExit = true,
    rankdir = "TB",
    size = 0,
  } = options;
  let node = this;

  if (dagify) {
    this.dagify();
  } else if (!renderExit && node.type === "exit") {
    node = node.ins[0]; // don't render exit helper node
  }

  let getNumericLabel = (value) =>
    Math.trunc(value) === value ? value : value.toFixed(2);

  let getLabel = (node) => {
    if (typeof node.value === "number") {
      return getNumericLabel(node.value);
    }
    return node.type;
  };

  let nodes = node.flatten(false);
  nodes.forEach((node, i) => (node.id = i)); // set id so filtering won't mess us up

  // create compound nodes for modules, hiding their internal complexity
  if (!resolveModules) {
    nodes.forEach((node) => {
      if (!node.outputOf) {
        // we only care for nodes that are an output of a module
        return;
      }
      const [moduleType, moduleId] = node.outputOf;
      let dfs = (node, inputs = []) => {
        const inlet = node.inputOf?.find(
          ([name, id]) => name === moduleType && id === moduleId
        );
        if (inlet) {
          !inputs.includes(node) && (inputs[inlet[2]] = node);
          return;
        }
        if (node.outputOf?.[0] !== moduleType) {
          node.ignore = true;
        }
        for (let index of node.ins) {
          dfs(nodes[index], inputs);
        }
        return inputs;
      };
      const moduleInputs = dfs(node);
      node.type = moduleType;
      node.ins = moduleInputs?.map((input) => nodes.indexOf(input)) || [];
    });
    nodes = nodes.filter((node) => !node.ignore);
  }

  let edges = [];
  const color = "teal";
  const fontcolor = "teal";
  const fontsize = 10;
  const fontname = "monospace";

  // inlines nodes for inputs if only numbers are used
  if (inlineNumerics) {
    nodes.forEach((node) => {
      if (!node.ins.length) {
        return;
      }
      const inletNodes = node.ins.map((input) =>
        nodes.find((node) => node.id === Number(input))
      );
      const firstIsNumeric = inletNodes[0].type === "n";
      if (!firstIsNumeric && inletNodes.length === 1) {
        return; // skip if only one non-numeric input
      }
      const restIsNumeric = inletNodes
        .slice(1) // first one is allowed to be non-numeric
        .reduce((acc, node) => acc && node.type === "n", true);
      if (!restIsNumeric) {
        // a node with at least one non-numeric input should not be compounded
        return;
      }
      // skip first, if non-numeric
      const numericNodes = firstIsNumeric ? inletNodes : inletNodes.slice(1);
      // get string of numeric inputs
      const values = numericNodes
        .map((inputNode) => {
          inputNode.ignore = true;
          return getNumericLabel(inputNode.value);
        })
        .join(" ");
      node.label = `${node.type} ${values}`;
      node.ins = firstIsNumeric ? [] : [node.ins[0]];
    });
    nodes = nodes.filter((node) => !node.ignore);
  }

  nodes.forEach((node) =>
    node.ins.forEach((parent, i) => {
      edges.push({
        source: parent,
        target: node.id,
        fontsize,
        fontname,
        color,
        fontcolor,
        directed: true,
        label: `${getInletName(node.type, i)}`,
        id: i, // we need to set an id to make sure things like .apply(x=>x.mul(x)) are displayed correctly
      });
    })
  );

  let commutativeNodes = ["mul", "add"];
  nodes = nodes.map((node) => ({
    id: node.id,
    color: node.color || color,
    fontcolor,
    fontsize,
    fontname,
    // shape: node.shape || "oval",
    label: node.label ?? getLabel(node),
    ordering: commutativeNodes.includes(node.type) ? "" : "in",
    width: 0.5,
    height: 0.4,
  }));

  const graphviz = await graphvizLoaded;

  let dot = toDot({
    graph: {
      nodes,
      edges,
    },
  });
  dot = dot.split("\n");
  dot.splice(1, 0, `rankdir="${rankdir}"`);
  size && dot.splice(1, 0, `size="${size}"`);
  dot.splice(1, 0, 'bgcolor="transparent"');
  dot.splice(1, 0, 'color="white"');
  dot = dot.join("\n");
  // console.log("dot", dot);
  const svg = await graphviz.layout(dot, "svg", "dot", {});
  // console.log("container", container);
  container.innerHTML = svg;
};
