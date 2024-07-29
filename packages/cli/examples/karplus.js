// some karplus-strong thing

let imp = impulse(6);

let damp = sine(0.2).range(0.4, 0.7);
let burst = noise().hold(impulse(1)).range(0.005, 0.009);

noise()
  .mul(imp.perc(burst))
  .add((x) => x.delay(burst).filter(damp))
  .mul(imp.adsr(0.02, 0.5, 0))
  .filter(0.8)
  .mul(noise().hold(imp))
  .add((x) => x.delay(0.25).mul(sine(0.1).range(0.5, 0.8)))
  .mul(1.4)
  .out();
