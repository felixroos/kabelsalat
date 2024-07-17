export let defSin = (input) => `sin(${input})`;
export let defCos = (input) => `cos(${input})`;
export let def = (name, value, comment) =>
  `float ${name} = ${value};${comment ? ` /* ${comment} */` : ""}`;

export let defUgen = (meta, ...args) => {
  args.unshift(`nodes[${meta.ugenIndex}]`);
  if (meta.ugen === "Sequence") {
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
export let returnLine = (channels) =>
  `float left = ${channels[0]}; float right = ${channels[1]};`;

export let feedbackWrite = (to, value) => {
  return `Feedback_write(nodes[${to}], ${value})`;
};

export let midinote = (note) => `(pow(2, ((${note} - 69) / 12) * 440))`;
