export let defSin = (input) => `Math.sin(${input})`;
export let defCos = (input) => `Math.cos(${input})`;
export let defTan = (input) => `Math.tan(${input})`;
export let defAsin = (input) => `Math.asin(${input})`;
export let defAcos = (input) => `Math.acos(${input})`;
export let defAtan = (input) => `Math.atan(${input})`;
export let def = (name, value, comment) =>
  `${name} = ${value};${comment ? ` /* ${comment} */` : ""}`;

export let defUgen = (meta, ...args) => {
  return def(
    meta.name,
    `nodes[${meta.ugenIndex}].update(${args.join(",")})`,
    meta.node.type
  );
};

export let midinote = (note) => `(2 ** ((${note} - 69) / 12) * 440)`;
export let pow = (a, b) => `${a} ** ${b}`;
export let exp = (input) => `Math.exp(${input})`;
export let log = (input) => `Math.log(${input})`;
export let mod = (a, b) => `${a}%${b}`;
export let abs = (input) => `Math.abs(${input})`;
export let round = (input) => `Math.round(${input})`;
export let floor = (input) => `Math.floor(${input})`;
export let sign = (input) => `Math.sign(${input})`;
export let ceil = (input) => `Math.ceil(${input})`;
export let min = (a, b) => `Math.min(${a}, ${b})`;
export let max = (a, b) => `Math.max(${a}, ${b})`;
export let pair_make = (a, b) => `[${a}, ${b}]`;
export let pair_a = (p) => `${p}[0]`;
export let pair_b = (p) => `${p}[1]`;
export let pair_a_min = (p, q) => `(${pair_a(p)} < ${pair_a(q)} ? ${p} : ${q})`;
export let pair_a_max = (p, q) => `(${pair_a(p)} > ${pair_a(q)} ? ${p} : ${q})`;
