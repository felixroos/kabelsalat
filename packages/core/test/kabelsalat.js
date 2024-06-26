// maximecb - the little acid machine that could
// + maximecb drum machine
// code by froos
// noisecraft -> kabelsalat
// https://noisecraft.app/47

let kick = (gate) =>
  gate.adsr(0, 0.11, 0, 0.11).apply((env) =>
    env
      .mul(env)
      .mul(158) // frequency range
      .sine(env)
      .distort(0.85)
  );

let snare = (gate) =>
  gate.adsr(0, 0.11, 0.1, 0.1).mul(noise()).filter(0.78, 0.29);

let c = clock(160);
let notes = c
  .clockdiv(8)
  .seq(27, 27, 39, 51, 0, 0, 27, 27, 42, 27, 40, 0, 31, 31, 56, 51);

let env = notes.adsr(0, 0.3, 0.34, 0.59);

notes
  .apply2(hold) // hold freq above 0s
  .midinote()
  .slide(sine(0.21).range(0, 1))
  .pulse(0.48)
  .mul(env)
  .filter(
    env.mul(sine(0.09).range(0.55, 1)), // cutoff
    sine(0.22).range(0, 0.35) // res
  )
  .distort(sine(0.18).range(0, 0.85))
  .mul(0.5)
  .mul(c.clockdiv(16).seq(0.25, 1)) // sidechain
  .add(c.clockdiv(32).seq(1, 1).apply(kick))
  .add(c.clockdiv(32).seq(0, 1).apply(snare))
  .out();

