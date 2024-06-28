import { Node, getInletName } from "@kabelsalat/core";
import toDot from "jgf-dot";
import { Graphviz } from "@hpcc-js/wasm";

const graphvizLoaded = Graphviz.load();

Node.prototype.render = async function (container, options = {}) {
  const {
    dagify = false,
    resolveModules = false,
    rankdir = "TB",
    size = 0,
  } = options;
  let node = this;
  resolveModules && node.resolveModules();
  if (dagify) {
    this.dagify();
  } else if (node.type === "exit") {
    node = node.ins[0]; // don't render exit helper node
  }

  let getNumericLabel = (value) =>
    Math.trunc(value) === value ? value : value.toFixed(2);

  let nodes = node.flatten(false);
  let edges = [];
  const color = "teal";
  const fontcolor = "teal";
  const fontsize = 10;
  const fontname = "monospace";

  for (let id in nodes) {
    nodes[id].ins.forEach((parent, i) => {
      edges.push({
        source: parent,
        target: id,
        fontsize,
        fontname,
        color,
        fontcolor,
        directed: true,
        label: `${getInletName(nodes[id].type, i)}`,
        id: i, // we need to set an id to make sure things like .apply(x=>x.mul(x)) are displayed correctly
      });
    });
  }

  nodes = nodes.map((node, id) => ({
    id,
    color,
    fontcolor,
    fontsize,
    fontname,
    label: node.value !== undefined ? getNumericLabel(node.value) : node.type,
    ordering: "in",
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
