import { Node } from "./node.js";

export function saw(freq) {
  return n(freq).connect(node("saw"));
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

export function n(value) {
  if (value.isNode) {
    return value;
  }
  return node("n", value);
}

export const node = (type, value) => new Node(type, value);
