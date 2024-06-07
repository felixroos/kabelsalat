/* @refresh reload */
import { render } from "solid-js/web";
import { createSignal, createEffect } from "solid-js";
import "./index.css";
import { Graphviz } from "@hpcc-js/wasm";
import toDot from "jgf-dot";

const graphvizLoaded = Graphviz.load();

class Node {
  constructor(type, value) {
    this.type = type;
    value !== undefined && (this.value = value);
    //this.connections = connections;
    this.inlets = [];
    //this.outlets = [];
    this._id = s4();
  }
  get id() {
    return `${this._id}:${this.type}`;
  }
  prop(name) {
    return this.value[name];
  }
  get label() {
    return this.id;
  }
  get isNode() {
    return true;
  }
  addConnection(node) {
    //this.connections.push(node);
    //this.outlets.push(node);
    node.inlets.push(this);
    return node;
  }
  isConnectedTo(node) {
    //return this.connections.find((n) => n.id === node.id);
    return this.inlets.find((n) => n.id === node.id);
  }
  connect(node) {
    if (this.isConnectedTo(node)) {
      return node;
    }
    return this.addConnection(node);
  }
  get label() {
    let str = this.type;
    if (this.value) {
      str += ` =${this.value}`;
    }
    return str;
  }
  show(parent) {
    //const connections = this.connections.filter(
    const connections = this.inlets.filter(
      (to) => !parent || parent.id !== to.id
    );
    // let str = this.id;
    let str = this.label;
    if (!connections.length) {
      return str;
    }
    str += " <->";
    if (connections.length === 1) {
      return `${str} ${connections[0].show(this)}`;
    }
    return `${str} [${connections.map((node) => node.show(this)).join(", ")}]`;
  }
}

Node.prototype.out = function () {
  return this.connect(node("out"));
};

Node.prototype.lpf = function (value) {
  return this.connect(n(value).connect(node("lpf")));
};

Node.prototype.mul = function (value) {
  return this.connect(n(value).connect(node("mul")));
};

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

const node = (type, value, connections) => new Node(type, value, connections);

// helper function to generate repl ids
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

// library

function n(value) {
  if (value.isNode) {
    return value;
  }
  return node("n", value);
}

function saw(freq) {
  return n(freq).connect(node("saw"));
}

function App() {
  let [code, setCode] = createSignal("saw(n(220).mul(saw(2))).out()");
  let container;
  createEffect(() => {
    try {
      const node = eval(code());
      console.log("code", code());
      console.log("node", node.show());
      node.render(container);
    } catch (err) {
      console.log("er", err);
    }
  });
  return (
    <div className="grid h-full">
      <textarea
        className="bg-stone-800 text-white"
        value={code()}
        onInput={(e) => setCode(e.target.value)}
      ></textarea>
      <div class="bg-stone-900" ref={container}></div>
    </div>
  );
}

render(() => <App />, document.getElementById("root"));

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
