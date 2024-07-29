// Sync and Unsync My Harmonics (osc only)
// https://noisecraft.app/1615

let freq = pulse(0.02).seq(80).slide(100);

sine([0.01, 0.01, 0.02])
  .range(1, 12)
  .mul(freq)
  .sine(pulse(freq))
  .mix()
  .slide(0.01)
  .add((x) => x.delay(0.25).mul(0.6))
  .mul(0.6)
  .out();
