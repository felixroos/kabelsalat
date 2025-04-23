export let defSin = (input) => `sin(${input})`;
export let defCos = (input) => `cos(${input})`;
export let defTan = (input) => `tan(${input})`;
export let defAsin = (input) => `asin(${input})`;
export let defAcos = (input) => `acos(${input})`;
export let defAtan = (input) => `atan(${input})`;
export let def = (name, value, comment) =>
  `${name} = ${value};${comment ? ` /* ${comment} */` : ""}`;

export let defUgen = (meta, ...args) => {
  args.unshift(`nodes[${meta.ugenIndex}]`);
  if (meta.ugen === "Sequence" || meta.ugen === "Pick") {
    const len = args.length - 2;
    const seq = `(float[${len}]){${args.slice(2).join(",")}}`;
    return def(
      meta.name,
      `${meta.ugen}_update(${args[0]}, ${args[1]}, ${len}, ${seq})`,
      meta.ugen
    );
  }
  return def(meta.name, `${meta.ugen}_update(${args.join(",")})`, meta.ugen);
};

export let midinote = (note) => `pow(2.0, ((${note} - 69.0) / 12.0)) * 440.0`;
export let pow = (a, b) => `pow(${a}, ${b})`;
export let exp = (a) => `exp(${a})`;
export let log = (input) => `log(${input})`;
export let mod = (a, b) => `${a}>=${b}?${a}-${b}:${a}`;
export let abs = (input) => `fabs(${input})`;
export let min = (a, b) => `fmin(${a}, ${b})`;
export let max = (a, b) => `fmax(${a}, ${b})`;
export let round = (a) => `fround(${a})`;
export let floor = (a) => `floor(${a})`;
export let ceil = (a) => `ceil(${a})`;
export let pair_make = (value, i) => `((pair) {${value}, ${i}})`;
export let pair_a = (p) => `${p}.a`;
export let pair_b = (p) => `${p}.b`;
export let pair_a_min = (p, q) => `(${pair_a(p)} < ${pair_a(q)} ? ${p} : ${q})`;
export let pair_a_max = (p, q) => `(${pair_a(p)} > ${pair_a(q)} ? ${p} : ${q})`;
