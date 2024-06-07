class Kabel {
  constructor(graph = { nodes: [], connections: [] }) {
    this.graph = graph;
  }
  get value() {
    return this.graph;
  }
  get json() {
    // return JSON.stringify(this.withNodes((node) => node.flat).graph, null, 2);
    return JSON.stringify(this.graph, null, 2);
  }
  withGraph(fn) {
    return new Kabel(fn(this.graph));
  }
  withNodes(fn) {
    return this.withGraph((g) => ({ ...g, nodes: fn(g.nodes) }));
  }
  withConnections(fn) {
    return this.withGraph((g) => ({ ...g, connections: fn(g.connections) }));
  }
  mapNodes(fn) {
    return this.withNodes((nodes) => nodes.map(fn));
  }
  withNode(node) {
    return this.withNodes((nodes) => [...nodes, node]);
  }
  hasNode(node) {
    return this.graph.nodes.find((n) => n.id === node.id);
  }
  ensureNode(node) {
    console.log("ensure", node);
    if (!this.hasNode(node)) {
      return this.withNode(node);
    }
    return this;
  }
  ensureNodes(...nodes) {
    return nodes.reduce((k, node) => k.ensureNode(node), this);
  }
  addConnection(connection) {
    return this.withConnections((connections) => [...connections, connection]);
  }
  connect(a, b) {
    if (!b) {
      return this.connect(this.outlet, a);
    }
    return this.ensureNodes(a, b).addConnection([a.id, b.id]);
  }
  get nodes() {
    return this.graph.nodes;
  }
  get outlet() {
    return this.nodes[this.nodes.length - 1];
  }
  /* scale(x, y) {
    return this.mapNodes((node) => ({ ...node, x: node.x * x, y: node.y * y }));
  }
  translate(x, y) {
    return this.mapNodes((node) => ({ ...node, x: node.x + x, y: node.y + y }));
  } */
  toString() {
    return this.json;
  }
  toDotJson() {
    const color = "white";
    const fontcolor = "white";
    console.log("toDotJson", this.graph.connections);
    return {
      nodes: this.graph.nodes.map((node) => ({
        id: node.id,
        color,
        fontcolor,
        label:
          node.id +
          (node.prop("state") !== undefined ? " " + node.prop("state") : ""),
      })),
      edges: this.graph.connections.map(([source, target]) => ({
        source,
        target,
        color,
      })),
    };
  }
  get isKabel() {
    return true;
  }
}

export async function renderKabel(kabel, container) {
  const { nodes, edges } = kabel.toDotJson();
  const graphviz = await graphvizLoaded;
  console.log("nodes", nodes);
  console.log("edges", edges);
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
}
