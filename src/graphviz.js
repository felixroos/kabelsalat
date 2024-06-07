import { Node } from "./node.js";
import toDot from "jgf-dot";
import { Graphviz } from "@hpcc-js/wasm";

const graphvizLoaded = Graphviz.load();

Node.prototype.render = async function (container) {
  let nodes = this.visitKeyed();
  let edges = [];
  const color = "teal";
  const fontcolor = "teal";
  for (let id in nodes) {
    nodes[id].ins.forEach((b) => {
      edges.push({ source: b.id, target: nodes[id].id, color, directed: true });
    });
  }

  nodes = Object.values(nodes).map((node) => ({
    id: node.id,
    color,
    fontcolor,
    label: node.label,
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
