let fast = (speed) => impulse(n(speed).mul(0.4)); // master clock

// chords:
fast(1)
  .seq([0, 3, 7, 12], [0, 3, 7, 11], [0, 3, 7, 10], [0, 3, 7, 11])
  // octave shifts:
  .add(fast(2).seq(0, fast(4).seq(12, 24)))
  .add(40) // root note
  .midinote() // convert to freq
  .map((x) => x.mul([1, 1.007]).saw().mix()) // detuned saws
  .mix() // mix together
  .mul(fast(8).perc(0.4).slide(0.5)) // env
  .filter(fast(8).perc(sine(0.05).range(0.1, 0.5))) // filter mod
  .add((x) => x.delay(0.15).mul(0.5)) // feedback delay
  .mul(0.125) // turn down
  .out();
