import { Node } from "./node.js";

export const node = (type, value) => new Node(type, value);

let bp2up = (bp) => (bp + 1) / 2; // bipolar -> unipolar
let range = (up, min, max) => up * (b - a) + a;
let range2 = (bp, a, b) => range(bp2up(bp), a, b);

Node.prototype.out = function () {
  return this.connect(node("out"));
};

Node.prototype.mul = function (value) {
  return this.connect(n(value).connect(node("mul")));
};
Node.prototype.range = function (min, max) {
  return node("range").withIns(this, n(min), n(max));
};
Node.prototype.add = function (value) {
  return this.connect(n(value).connect(node("add")));
};

export function n(value) {
  if (value.isNode) {
    return value;
  }
  return node("n", value);
}

export function saw(freq) {
  return n(freq).connect(node("saw"));
}
export function sine(freq) {
  return n(freq).connect(node("sine"));
}
