export let examples = [
  {
    label: "pulu - crescent call",
    code: `// crescent call
// by pulu : https://pulusound.fi
let bps = 138/60;
let i16 = impulse(bps*4);
let i2bar = impulse(bps/8);
let sq = register('sq', x=>x.mul(x));
let mpan = sine(0.13);
let bd = i16.perc(0.05).sq().sq().mul(660).add(i2bar.seq(36,31).add(1).midinote())
  .sine()
  .mul(i16.seq(1,0,0,1,0,0,1,0).perc(0.99/(bps*4)).adsr(0.001,0.15,0.0,0.0))
  .distort(i16.clockdiv(2).seq(0.95,0.8,0.85,0.5,0.75))
  .hpf(0.2)
  .mul(1.3);
let bass = i16.seq(1,0,0,1,0,0,1,0);
bass = i2bar.seq(36,31).add(1).midinote().sine()
  .mul(bass.perc(0.11).adsr(0.001,0,1.0,0.01))
  .distort(0.4)
  .mul(1.2);
let hat = noise().hpf(0.98).mul(i16.perc(i16.seq(0.02,0.015,0.09,0.015)))
  .mul(i16.seq(1,0,1,0, 1,1,1,0, 1,0,1,1))
  .mul(1.3);
let sn = noise().lpf(0.8)
  .mul(i16.seq(
    0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0, 0,1,0,0,
  ).perc(0.1).adsr(0.0,0.05,0.0,0.0))
  .add(x=>x.delay(sine(0.4).range(0.007,0.015)).mul(0.65))
  .distort(0.55)
  .add(x=>x.delay(3/(4*bps)).mul(0.5))
  .mul(1.5);
let acid = i16.seq(0,0,12,0,0,12,0,12,0,0,12,0,0,14,0,15)
  .add(i2bar.seq(0,-5,0,7)).add(36+1)
  .midinote().pulse(sine(0.12).range(0.2,0.4))
  .lpf(i16.perc(0.1).adsr(0,0.05,0,0).range(sine(0.15).range(0.2,0.8),1),0.4)
  .mul(i16.perc(0.1))
  .pan(mpan.mul(-0.6)).mul(1.3)
  .mul(0.5);
let mel = i16.seq(-5,3,0).add(72+1).add(i16.seq(0,0,12,0,-12)).midinote()
  .mul(i16.perc(0.02).adsr(0,0.01,0.0,0.0).range(1,i2bar.seq(1,2)))
  .sine()
  .mul(i16.seq(1,0,1,0,0,1,0).perc(0.1).adsr(0.001,0.1,0,0))
  .add(x=>x.delay(3.01/(4*bps)).mul(0.55))
  .pan(mpan.mul(0.75)).mul(1.3)
  .mul(0.8)
bd.add(bass).add(hat).add(sn).add(acid).add(mel).mul(0.63)
.out();
`,
  },
  {
    label: "distorted guitar",
    code: `audio.fadeTime=2.5;

saw([55,110,220,330]).lpf( sine(.25).range(.3,.7) )
.mix(2)
.mul(impulse(4).perc(.1).lag(.05))
.add(x=>x.delay(saw(.01).range(.005,.02)).mul(.9))
.add(x=>x.delay(.3).mul(.7))
.fold().mul(.6)
.out()`,
  },
  {
    label: "acid machine + drum thing",
    code: `// maximecb - the little acid machine that could
// + maximecb drum machine
// code by froos
// noisecraft -> kabelsalat
// https://noisecraft.app/47

let kick = gate => gate.adsr(0,.11,0,.11)
  .apply(env => env.mul(env)
    .mul(158) // frequency range
    .sine(env)
    .distort(.85)
  )

let snare = gate => gate.adsr(0,.11,.1,.1)
  .mul(noise()).filter(.78,.29)

let c = clock(160)
let notes = c.clockdiv(8)
.seq(27,27,39,51,0,0,27,27,42,27,40,0,31,31,56,51)

let env = notes.adsr(0,.3,.34,.59)

notes
.apply2(hold) // hold freq above 0s
.midinote()
.slide(
  sine(.21).range(0,1)
)
.pulse(.48)
.mul(env)
.filter(
  env.mul(sine(.09).range(.55,1)), // cutoff
  sine(.22).range(0,.35) // res
)
.distort(
  sine(.18).range(0,.85)
)
.mul(0.5)
.mul(c.clockdiv(16).seq(.25,1)) // sidechain
.add(c.clockdiv(32).seq(1,1).apply(kick))
.add(c.clockdiv(32).seq(0,1).apply(snare))
.out()`,
  },
  {
    label: "plucky feedback delay",
    code: `// let's create some notes
let note = clock(150) // clock at 150bpm
.clockdiv(32) // divide clock by 32
.seq(64,0,0,67,0,0,62,0) // use clock for sequence

// use the notes to trigger an envelope
let env = note
.adsr(
  .01, // attack
  sine(.1).range(.1, .3), // modulated decay
  .5 // sustain
)
.mul(.75) // evelope amount

note
.hold(note) // hold notes above zeroes
.midinote() // convert midi numbers to freq
.pulse(.2) // pulse wave with .2 width
.filter(
  sine(.1).range(.7,.8).mul(env), // modulated cutoff
  env.mul(.5) // resonance with envelope
)
.mul(env) // amplitude envelope
.add(
  // feedback delay
  x=>x.delay(sine(.03).range(.1,.5)) // modulated delay time
      .mul(.9) // feedback amount
)
.mul(.5) // master level
.out() // send to output`,
  },
  {
    label: "late night",
    code: `let kick = gate => gate.adsr(0,.11,0,.11)
  .apply(env => env.mul(env)
    .mul(158) // frequency range
    .sine(env)
    .distort(.9)
  )

let snare = gate => gate.adsr(0,.11,.1,.1)
  .mul(noise()).filter(.78,.29)


Node.prototype.band = function (min,max) {
  return this.filter(max).sub(this.filter(min))
}

let hat = gate => gate.adsr(0,.11,.1,.1)
.mul(noise()).band(.7,1)


add(
impulse(2).perc(sine(.3).range(.1,.2))
.mul(saw([55,110,221]))
.mix().mul(.6)
.add(x=>x.delay(.2).mul(.8))
.filter(sine(.2).range(.4,.9))
.mul(impulse(4).seq(.25,1))
//.mul(0)
,
kick(impulse(4).seq(1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1))
//.mul(0)
,
snare(impulse(2).seq(0,1))
//.mul(0)
,
hat(impulse(4).seq(0,1))
//.mul(0)
,
poly(220,330,520)
.mul(sine(8).range(1,1.02))
.sine().mix().mul(sine(3).range(.3,.6))
.mul(impulse(4).seq(.25,1))
.mul(sine(.1).range(.2,1))
//.mul(0)
,
impulse(.5).seq(660,590).pulse()
.mul(impulse(2).perc(.1))
.mul(.2)
.add(x=>x.delay(.1).mul(.8))
.mul(0)

)
.out()`,
  },
  {
    label: "karplus-strong thing",
    code: `// some karplus-strong thing

let imp = impulse(6)

let damp = sine(.2).range(.4,.7)
let burst = noise().hold(impulse(1)).range(.005,.009)

noise().mul(imp.perc(burst))
.add(x=>x.delay(burst).filter(damp))
.mul(imp.adsr(.02,.5,0))
.filter(.8).mul(noise().hold(imp))
.add(x=>x.delay(.25).mul(sine(.1).range(.5,.8)))
.out()`,
  },
  {
    label: "detuned saw chord progression",
    code: `let fast = speed => impulse(n(speed).mul(.4)) // master clock

// chords:
fast(1).seq([0,3,7,12],[0,3,7,11],[0,3,7,10],[0,3,7,11])
// octave shifts:
.add(fast(2).seq(0, fast(4).seq(12, 24)))
.add(40) // root note
.midinote() // convert to freq
.map(x=>x.mul([1,1.007]).saw().mix()) // detuned saws
.mix() // mix together
.mul(fast(8).perc(.4).slide(.5)) // env
.filter(fast(8).perc(sine(.05).range(.1,.5))) // filter mod
.add(x=>x.delay(.15).mul(.5)) // feedback delay
.mul(.125) // turn down
.out()`,
  },
  {
    label: "drone",
    code: `// Sync and Unsync My Harmonics (osc only)
// https://noisecraft.app/1615

let freq = pulse(.02).seq(80).slide(100)

sine([0.01, 0.01, 0.02])
.range(1,12).mul(freq)
.sine(pulse(freq)).mix()
.slide(.01)
.add(x=>x.delay(.25).mul(.6))
.mul(.6)
.out()`,
  },
  {
    label: "melting gameboy",
    code: `saw(
sine(.2).range([200,300,400],[600,700,800]).hold(impulse([2,6]))
).mix()
.mul(impulse([2,3]).perc(.04).slide(10))
.filter(sine(.1).range(.5,.7))
.out()`,
  },
  {
    label: "fm with feedback",
    code: `// adapted from https://www.charlie-roberts.com/genish/tutorial/index.html#fmmFeedback
Node.prototype.fm = function (c2m = 1, index = 3, fb = 0.05) {
  let carrier,
    freq = this;
  mul((feedback) => {
    const modulator = feedback
      .mul(fb)
      .add(mul(freq, c2m))
      .sine()
      .mul(freq, index)
      .add(feedback)
      .mul(0.5);
    const env = freq.adsr(0.001, 0.5, 0, 0).apply2(mul).apply2(mul);
    carrier = modulator.add(freq).sine().mul(env);
    return modulator.mul(env);
  });
  return carrier;
};

pulse(4)
  .range(1, 0)
  .seq(55, 110, 165, 220, 275, 330, 385, 440)
  .fm(1, 3, 0.05)
  .out();`,
  },
  {
    label: "luiiuuuiiiii - insect buzzing",
    code: `sine(12111)
.fold(sine(.51).range(0, .3))
.mul(
  sine(
    n(7).mul(
      sine(0.5).range(1,3)
    )
  ).range(.0,.1)
)
.out()`,
  },
];
