export let defSin = (input) => `Math.sin(${input})`;
export let defCos = (input) => `Math.cos(${input})`;
export let def = (name, value, comment) =>
  `const ${name} = ${value};${comment ? ` /* ${comment} */` : ""}`;

export let defUgen = (meta, ...args) => {
  return def(
    meta.name,
    `nodes[${meta.ugenIndex}].update(${args.join(",")})`,
    meta.node.type
  );
};
export let returnLine = (channels) =>
  `return [${channels.map((chan) => `(${chan}*lvl)`).join(",")}]`;

export let feedbackWrite = (to, value) => {
  return `nodes[${to}].write(${value})`;
};

export let midinote = (note) => `(2 ** ((${note} - 69) / 12) * 440)`;
export let pow = (a, b) => `${a} ** ${b}`;
export let exp = (input) => `Math.exp(${input})`;
export let log = (input) => `Math.log(${input})`;
export let mod = (a, b) => `${a}%${b}`;
export let abs = (input) => `Math.abs(${input})`;
export let min = (a, b) => `Math.min(${a}, ${b})`;
export let max = (a, b) => `Math.max(${a}, ${b})`;
