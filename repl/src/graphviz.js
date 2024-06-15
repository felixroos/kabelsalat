import { Node, getInletName } from "@kabelsalat/core";
import toDot from "jgf-dot";
import { Graphviz } from "@hpcc-js/wasm";

const graphvizLoaded = Graphviz.load();

Node.prototype.render = async function (container, dagify = false) {
  let node = this;
  if (dagify) {
    this.dagify();
  } else if (node.type === "exit") {
    node = node.ins[0]; // don't render exit helper node
  }

  let nodes = node.flatten(false);
  let edges = [];
  const color = "teal";
  const fontcolor = "teal";

  for (let id in nodes) {
    nodes[id].ins.forEach((parent, i) => {
      edges.push({
        source: parent,
        target: id,
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
    label: node.value ?? node.type,
    ordering: "in",
  }));

  const graphviz = await graphvizLoaded;

  let dot = toDot({
    graph: {
      nodes,
      edges,
    },
  });
  dot = dot.split("\n");
  dot.splice(1, 0, 'bgcolor="transparent"');
  dot.splice(1, 0, 'color="white"');
  dot = dot.join("\n");
  // console.log("dot", dot);
  const svg = await graphviz.layout(dot, "svg", "dot", {});
  // console.log("container", container);
  container.innerHTML = svg;
};
