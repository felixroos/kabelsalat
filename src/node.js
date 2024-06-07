export class Node {
  constructor(type, value) {
    this.type = type;
    value !== undefined && (this.value = value);
    this.inlets = [];
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
    node.inlets.push(this);
    return node;
  }
  isConnectedTo(node) {
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

// helper function to generate repl ids
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}
