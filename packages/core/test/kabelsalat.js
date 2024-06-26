saw(
  sine(.2).range([200,300,400],[600,700,800]).hold(impulse([2,6]))
  ).mix()
  .mul(impulse([2,3]).perc(.04).slide(10))
  .filter(sine(.1).range(.5,.7))
  .mul(.5)
  .out()