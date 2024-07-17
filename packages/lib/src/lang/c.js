export let defSin = (input) => `sin(${input})`;
export let defCos = (input) => `cos(${input})`;
export let def = (name, value, comment) =>
  `float ${name} = ${value};${comment ? ` /* ${comment} */` : ""}`;

export let defUgen = (meta, ...args) => {
  args.unshift(`nodes[${meta.ugenIndex}]`);
  return def(meta.name, `${meta.ugen}_update(${args.join(",")})`, meta.ugen);
};
export let returnLine = (channels) =>
  `float left = ${channels[0]}; float right = ${channels[1]};`;

export let feedbackWrite = (to, value) => {
  return `Feedback_write(nodes[${to}], ${value})`;
};
