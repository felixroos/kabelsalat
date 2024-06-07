import { Node } from "./node.js";
import toDot from "jgf-dot";
import { Graphviz } from "@hpcc-js/wasm";

const graphvizLoaded = Graphviz.load();

Node.prototype.render = async function (container) {
  console.log("render", this);
  let visit = (node, visited = []) => {
    visited.push(node);
    const connections = [...node.inlets /* , ...node.outlets */];
    connections.forEach((n) => {
      if (!visited.find((_n) => _n.id === n.id)) {
        visit(n, visited);
      }
    });
    return visited;
  };
  let nodes = visit(this);
  let edges = [];
  const color = "white";
  const fontcolor = "white";

  nodes.forEach((a) => {
    /* a.outlets.forEach((b) => {
      edges.push({ source: a.id, target: b.id, color, directed: true });
    }); */
    a.inlets.forEach((b) => {
      edges.push({ source: b.id, target: a.id, color, directed: true });
    });
  });
  nodes = nodes.map((node) => ({
    id: node.id,
    color,
    fontcolor,
    label: node.label,
  }));
  console.log("render", nodes, edges);

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

/*
digraph G {
	fontname="Helvetica,Arial,sans-serif"
	node [fontname="Helvetica,Arial,sans-serif"]
	edge [fontname="Helvetica,Arial,sans-serif"]

	subgraph cluster_0 {
		style=filled;
		color=lightgrey;
		node [style=filled,color=white];
		a0 -> a1 -> a2 -> a3;
		label = "process #1";
	}

	subgraph cluster_1 {
		node [style=filled];
		b0 -> b1 -> b2 -> b3;
		label = "process #2";
		color=blue
	}
	start -> a0;
	start -> b0;
	a1 -> b3;
	b2 -> a3;
	a3 -> a0;
	a3 -> end;
	b3 -> end;

	start [shape=Mdiamond];
	end [shape=Msquare];
}
*/
