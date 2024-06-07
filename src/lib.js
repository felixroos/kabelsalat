import { Node } from "./node.js";

export const node = (type, value) => new Node(type, value);

class AudioNode extends Node {
  isr = 1 / 44100;
  sample = 0;
  phi = 0;
  get s() {
    return ++this.sample * this.isr;
  }
}

let bp2up = (bp) => (bp + 1) / 2; // bipolar -> unipolar
let range = (up, min, max) => up * (b - a) + a;
let range2 = (bp, a, b) => range(bp2up(bp), a, b);

class SawNode extends AudioNode {
  constructor() {
    super("saw");
  }
  next(freq) {
    this.phi += freq * this.isr;
    return ((this.phi % 1) - 0.5) * 2;
  }
}
class SineNode extends AudioNode {
  constructor() {
    super("sine");
  }
  next(freq) {
    this.phi += 2 * Math.PI * freq * this.isr;
    return Math.sin(this.phi);
  }
}

export function saw(freq) {
  return n(freq).connect(new SawNode());
}
export function sine(freq) {
  return n(freq).connect(new SineNode());
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
