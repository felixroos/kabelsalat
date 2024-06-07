export class Node {
  constructor(type, value) {
    this.type = type;
    value !== undefined && (this.value = value);
    this.ins = [];
    this._id = s4();
  }
  get id() {
    return `${this._id}`; //:${this.type}`;
  }
  prop(name) {
    return this.value[name];
  }
  get isNode() {
    return true;
  }
  addConnection(node) {
    node.ins.push(this);
    return node;
  }
  isConnectedTo(node) {
    return this.ins.find((n) => n.id === node.id);
  }
  withIns(...ins) {
    this.ins = ins;
    return this;
  }
  connect(node) {
    if (this.isConnectedTo(node)) {
      return node;
    }
    this.addConnection(node);
    return node;
  }
  get label() {
    let str = this.type;
    if (this.value !== undefined) {
      str += ` =${this.value}`;
    }
    return str;
  }
  show(parent) {
    //const connections = this.connections.filter(
    const connections = this.ins.filter((to) => !parent || parent.id !== to.id);
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
  visit() {
    return visit(this);
  }
  visitKeyed() {
    return visitKeyed(this);
  }
}

// helper function to generate repl ids
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function visit(node, visited = []) {
  visited.push(node);
  node.ins.forEach((n) => {
    if (!visited.find((_n) => _n.id === n.id)) {
      visit(n, visited);
    }
  });
  return visited;
}

function visitKeyed(node, visited = {}) {
  visited[node.id] = node;
  node.ins.forEach((n) => {
    if (!visited[n.id]) {
      visitKeyed(n, visited);
    }
  });
  return visited;
}
