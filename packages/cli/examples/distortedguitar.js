saw([55, 110, 220, 330])
  .lpf(sine(0.25).range(0.3, 0.7))
  .mix(2)
  .mul(impulse(4).perc(0.1).lag(0.05))
  .add((x) => x.delay(saw(0.01).range(0.005, 0.02)).mul(0.9))
  .add((x) => x.delay(0.3).mul(0.7))
  .fold()
  .mul(0.6)
  .out();
