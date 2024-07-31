saw(
  sine(0.2)
    .range([200, 300, 400], [600, 700, 800])
    .hold(impulse([2, 6]))
)
  .mix()
  .mul(impulse([2, 3]).perc(0.04).slide(10))
  .filter(sine(0.1).range(0.5, 0.7))
  .out();
