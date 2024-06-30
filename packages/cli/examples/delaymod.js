// let's create some notes
let note = clock(150) // clock at 150bpm
  .clockdiv(32) // divide clock by 32
  .seq(64, 0, 0, 67, 0, 0, 62, 0); // use clock for sequence

// use the notes to trigger an envelope
let env = note
  .adsr(
    0.01, // attack
    sine(0.1).range(0.1, 0.3), // modulated decay
    0.5 // sustain
  )
  .mul(0.75); // evelope amount

note
  .hold(note) // hold notes above zeroes
  .midinote() // convert midi numbers to freq
  .pulse(0.2) // pulse wave with .2 width
  .lpf(
    sine(0.1).range(0.7, 0.8).mul(env) // modulated cutoff
    // env.mul(.5) // resonance with envelope
  )
  .mul(env) // amplitude envelope
  .add(
    // feedback delay
    (x) =>
      x
        .delay(sine(0.03).range(0.1, 0.5)) // modulated delay time
        .mul(0.9) // feedback amount
  )
  .mul(0.5) // master level
  .out(); // send to output
