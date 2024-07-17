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
