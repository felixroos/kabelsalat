sine(12111)
  .fold(sine(0.51).range(0, 0.3))
  .mul(sine(n(7).mul(sine(0.5).range(1, 3))).range(0.0, 0.1))
  .out();
