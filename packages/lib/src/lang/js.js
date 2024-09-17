export let defSin = (input) => `Math.sin(${input})`;
export let defCos = (input) => `Math.cos(${input})`;
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
