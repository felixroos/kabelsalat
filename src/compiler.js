import { Node } from "./node.js";
import { topoSort } from "./graph";

Node.prototype.compile = function () {
  const nodes = this.visitKeyed();
  const graph = { nodes };
  // const sorted = Object.keys(nodes).reverse();
  const sorted = topoSort(graph); // do we need this?
  let lines = [];
  let v = (id) => `_${id}`;
  let pushVar = (id, value, comment) =>
    lines.push(`const ${v(id)} = ${value};${comment ? ` // ${comment}` : ""}`);
  let u = (id, ...ins) => `nodes['${id}'].update(${ins.join(", ")})`;
  let infix = (a, op, b) => `(${a} ${op} ${b})`;
  let inlet = (id, index) => nodes[id].ins[index];
  let inlets = (id) => nodes[id].ins;
  let op2 = (id, op, comment) => {
    const ins = inlets(id);
    const a = v(ins[0].id);
    const b = v(ins[1].id);
    pushVar(id, infix(a, op, b), infix(ins[0].type, op, ins[1].type));
  };
  let thru = (id) => pushVar(id, v(nodes[id].ins[0].id));
  for (let id of sorted) {
    const node = nodes[id];
    switch (node.type) {
      case "n": {
        pushVar(id, node.value, "n");
        break;
      }
      case "mul": {
        op2(id, "*");
        break;
      }
      case "range": {
        const bipolar = v(nodes[id].ins[0].id);
        const min = v(nodes[id].ins[1].id);
        const max = v(nodes[id].ins[2].id);
        // bipolar [-1,1] to unipolar [0,1] => (v+1)/2
        const unipolar = infix(infix(bipolar, "+", 1), "*", 0.5);
        // (bip+1)/2
        // var = val*(max-min)+min
        const range = infix(max, "-", min);
        const calc = infix(infix(unipolar, "*", range), "+", min);
        console.log("range", calc);
        // thru(id);

        pushVar(id, calc, "val*(max-min)+min");

        break;
      }
      case "add": {
        op2(id, "+");
        break;
      }
      case "saw": {
        const freq = v(node.ins[0].id);
        pushVar(id, u(id, freq), "saw"); // TODO: actually calculate saw
        break;
      }
      case "sine": {
        const freq = v(node.ins[0].id);
        pushVar(id, u(id, freq), "sine"); // TODO: actually calculate saw
        break;
      }
      case "out": {
        const sum = v(node.ins[0].id);
        lines.push(`return [${sum},${sum}]`);
        break;
      }
      default: {
        console.warn(`unhandled node type ${nodes[id].type}`);
      }
    }
  }
  const src = lines.join("\n");
  const run = () => new Function("nodes", src)(nodes);
  return { src, nodes, run };
};
