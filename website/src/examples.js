export let examples = [
  {
    label: "eddyflux - tapeloop",
    code: `/* eddyflux - tapeloop
use headphones to avoid feedback..
    _________
   |   ___   |
   |  o___o  |
   |__/___\__| 
*/
let tape = register(
  "tape",
  (
    input,
    id,
    rec = 0,
    monitor = 0,
    dt = 1,
    df = 1,
    lvl = 1,
    latency = 0.4,
    dl = 0
  ) =>
    input
      .mul(rec.lag(0.1))
      .add((x) => x.delay(dt.lag(dl), id).mul(df))
      .delay(latency)
      .add(input.mul(monitor).mul(n(1).sub(rec)).mul(lvl))
)

audioin()
  .tape(
    "1",
    B(0), // rec
    B(0), // monitor
    _(1.0, 1, 8), // loop length
    _(1.00), // feedback
    _(1.0) // lvl
  )
  .add(x=>x.delay(.15).mul(.7))
  .out()`,
  },
  {
    label: "pulu - shall we trance",
    code: `// shall we trance, buttons & sliders version
// by pulu : https://pulusound.fi

// use the controls below to toggle and tweak the sounds!
let track_ctrls = [
  [B(1), B(0)], // kick: on, fill
  [B(1), B(0)], // hat: on, fill
  [B(1)], // snare: on
  [B(1)], // bass: on
  [B(0), _(0.0)], // mel1: on, cutoff
  [B(0), B(0), _(0.0)], // mel2: on, octave, delay
  [B(0)], // mel3: on
];
let global_ctrls = [
  _(0.0), // master delay
];

let czressaw = module("czressaw", (freq, m) => {
  let phase = saw(freq).unipolar();
  let sawtooth = phase.sub(1);
  let cosine = sine(0, 0, phase.mul(m).add(1).mod(1).sub(0.25)).range(0, 1);
  return sawtooth.mul(cosine);
});

let bzsm = module("bzsm", (trig, freq = 55, fac = 4, vsweep = 0.5) => {
  let p0 = 0.006699687;
  let p1 = 0.00001884606;
  let p = sub(1, vsweep).mul(p0).add(mul(vsweep, p1));
  let freq1 = freq;
  let freq0 = mul(freq1, fac);
  let freq_x = trig.ad(0, 1).range(1, 0);
  let freq_y = add(freq1, sub(freq0, freq1).div(add(1, freq_x.div(p))));
  return freq_y.sine(trig);
});

let impseq = module("impseq", (trig, ...step) =>
  trig.seq(...step).mul(trig.perc(0))
);
let feed = register("feed", (x, f) =>
  x.apply((dry) => {
    let wet;
    return dry
      .add((x) => {
        wet = f(x);
        return wet;
      })
      .apply(x => wet)
  })
);

let lace = register("lace", (x, ...vals) => {
  let laceProduct = (lists) => {
    let counters = Array(lists.length).fill(0);
    let first = true;
    let result = [];
    while (first || counters.some((c) => c > 0)) {
      result.push(counters.map((c, i) => lists[i][c]));
      counters.forEach((counter, i) => {
        counters[i] = (counter + 1) % lists[i].length;
      });
      first = false;
    }
    return result;
  };

  let laceExpandOnce = (list) => {
    let sublists = list.filter((x) => x.length > 0);
    let sublistIndices = list
      .map((x, i) => i)
      .filter((i) => list[i].length > 0);
    if (sublists.length === 0) {
      return list;
    } else {
      let product = laceProduct(sublists);
      return product
        .map((productVals, i) => {
          let sublist;
          sublist = [...list];
          sublistIndices.forEach((productIndex, j) => {
            sublist[productIndex] = productVals[j];
          });
          return sublist;
        })
        .flat();
    }
  };

  let laceExpand = (list) =>
    laceExpandOnce(list.map((x) => (Array.isArray(x) ? laceExpand(x) : x)));
  return x.seq(...laceExpand(vals));
});
let implace = register("implace", (trig, ...step) =>
  trig.lace(...step).mul(trig.perc(0))
);

let ctrlmix = register("midimix", (tracks) => {
  return add(...tracks.map((make_track, i) => make_track(track_ctrls[i], i)));
});

let bps = 138 / 60;
let root = 5;

let i2x = impulse(bps / 8);
let i4 = impulse(bps);
let i8 = impulse(bps * 2);
let i16 = impulse(bps * 4);

ctrlmix([
  // kick
  (c, i) =>
    i4
      .apply((g0) => {
        let g1 = i8.impseq(0, 1).mul(c[1]);
        let g = add(g0, g1);
        return g
          .bzsm(midinote(24 + root), 512, 0.98)
          .mul(g.mul(c[0]).ad(0.001, 0.3));
      })
      .mul(1),
  // hat
  (c, i) =>
    i16
      .apply((g) =>
        g.seq(-1, -1, 1, -1).apply((m) =>
          noise()
            .hpf(m.range(0.97, 0.99), 0.1)
            .mul(
              c[1]
                .apply((z) =>
                  g.implace(z, [z, [z, 1]], 1, [z, [z, 1]]).mul(c[0])
                )
                .ad(0.001, m.range(0.03, 0.04))
                .mul(m.range(0.2, 1))
            )
        )
      )
      .mul(1.4),
  // snare
  (c, i) =>
    i8
      .apply((g) =>
        noise()
          .lpf(g.seq(0.9, 0.87), 0.1)
          .mul(
            g
              .implace(0, 0, [1, 0], [0, [1, 0]])
              .mul(c[0])
              .perc(g.seq(0.17, 0.13))
              .adsr(0.001, 0.04, 0.2, 0.01)
          )
      )
      .mul(1.2),
  // bass
  (c, i) =>
    i16
      .impseq(0, 1, 1, 1)
      .apply((g) =>
        g
          .seq(0, 0, 12, 12)
          .add(i8.lace(0, 0, 0, 0, 0, 0, 0, [1, 4]))
          .add(24 + root)
          .midinote()
          .saw()
          .lpf(g.ad(0, 0.05).pow(2).range(0.1, 1))
          .mul(g.mul(c[0]).ad(0.001, 0.1))
      )
      .mul(0.9),
  // mel1
  (c, i) =>
    i16.apply((g) =>
      g
        .lace(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, [-1, [4, 5]])
        .add(48 + root)
        .add([0.12, -0.12])
        .midinote()
        .saw()
        .mix()
        .lpf(c[1].bipolar().range(0.5, 1))
        .hpf(0.35)
        .mul(
          0.4,
          g
            .impseq(0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1)
            .mul(c[0])
            .perc(noise().hold(g).rangex(0.03, 0.07))
            .adsr(0.001, 0.08, 1, 0.01)
        )
        .add((x) => x.delay(4.01 / (4 * bps)).mul(0.5))
    ),
  // mel2
  (c, i) =>
    i16
      .impseq(1, 1, 1, 1, 0, 1, 0, 1, 0)
      .apply((g) =>
        g
          .seq(0, 1, 4, 5, 7, 8, 11, 12, 11, 8, 7, 5, 4, 1)
          .add(g.seq(0, 0, 12, 0, 0, 0, 12, 0))
          .add(48 + root, c[1].bipolar().hold(g).range(0, 12))
          .midinote()
          .czressaw(
            g
              .ad(0, 0.2)
              .rangex(1, sine(sine(0.2).rangex(0.5, 4.3)).rangex(2, 20))
              .lag(0.01)
          )
          .mul(g.mul(c[0]).ad(0.001, sine(0.5).rangex(0.05, 0.5)))
          .pan(lfnoise(bps * 4).lag(0.1))
      )
      .apply((dry) =>
        dry
          .feed((x) =>
            x
              .lpf(0.8, 0.1)
              .hpf(0.4)
              .delay(3 / (4 * bps))
              .mul(c[2].bipolar().range(0.2, 0.65))
          )
          .mul(1.7)
          .add(dry)
      )
      .mul(0.89),
  // mel3
  (c, i) =>
    i16
      .implace(1, 0, [0, 0, 1])
      .apply((g) =>
        g
          .lace(7, 4, i2x.seq(12, 13).hold(g))
          .add(
            60 + root,
            g.ad(0, noise().hold(g).rangex(0.02, 0.05)).bipolar().range(12, -12)
          )
          .midinote()
          .sine()
          .mul(g.mul(c[0]).ad(0.001, 0.13))
      )
      .mul(0.6)
      .pan(sine(0.33).mul(0.7))
      .add((x) => x.delay(7.99 / (4 * bps)).mul(0.6)),
])
  .apply((dry) =>
    dry
      .mul(global_ctrls[0])
      .feed((x) =>
        x
          .hpf(0.4, 0.07)
          .delay(6 / (4 * bps))
          .mul(0.45)
      )
      .mul(2)
      .add(dry)
  )
  .mul(0.9)
  .out();
`,
  },
  {
    label: "pulu - stardust",
    code: `// stardust
// by pulu : https://pulusound.fi
let mel = n(sine(0.1).rangex(1, 5)).dust().apply(g => 
  g.ad(0.001,sine(11.23).rangex(0.07, 0.2)).mul(
    g.seq(52,57,60,59,45,52,59,45,57).add(g.seq(12,12,24,12,12,12)).midinote()
      .mul(g.ad(0.001,0.03).bipolar().rangex(1,noise().hold(g).rangex(0.5,2)))
      .sine()
      .mul(noise().hold(g).lag(0.001).range(0.2,1))
      .pan(noise().hold(g).lag(0.003).mul(0.8))
  )
)
  .add(x => x.delay(sine(0.121).rangex(0.333, 0.347)).mul(sine(0.54).rangex(0.3, 0.7)))
  .add(x => x.delay(sine(0.131).rangex(0.543, 0.557)).mul(sine(0.64).rangex(0.3, 0.7)))
  .mul(1.05);
let wind = noise()
  .mul(dust(18).ad(0.003,0.05).bipolar().rangex(0.6,1))
  .add(noise().hold(dust(500)))
  .mul(n(0.7).apply(r => noise().hold(impulse(r)).slew(r).rangex(0.4,1)))
  .distort(0.5)
  .lpf(n(0.2).apply(r => noise().hold(impulse(r)).slew(r).rangex(0.5,0.9)),0.2)
  .hpf(n(0.33).apply(r => noise().hold(impulse(r)).slew(r).rangex(0.3,0.4)))
  .pan(sine(0.12).mul(0.7))
  .add(x => x.delay(0.65).mul(0.72))
  .mul(0.2);
let drone = add(...[0,7,10,12].map((x,i) =>
  n(x+45).midinote().sine()
    .mul(n(x/25).sine(0, i/2*Math.PI).unipolar())
    .pan(sine(1, 0, i/2*Math.PI).mul(0.6))
))
  .mul(0.8);
add(mel, wind, drone).out()`,
  },
  {
    label: "pulu - contemplatron froos edit",
    code: `// contemplatron edit
// original by pulu : https://pulusound.fi
// edit by froos
let lace = register("lace", (x, ...vals) => {
  let laceProduct = lists => {
    let counters = Array(lists.length).fill(0);
    let first = true;
    let result = [];
    while(first || counters.some(c => c > 0)) {
      result.push(counters.map((c, i) => lists[i][c]));
      counters.forEach((counter, i) => {
        counters[i] = (counter + 1) % lists[i].length;
      });
      first = false;
    }
    return result;
  };

  let laceExpandOnce = list => {
    let sublists = list.filter(x => x.length > 0);
    let sublistIndices = list.map((x, i) => i).filter(i => list[i].length > 0);
    if(sublists.length === 0) {
      return list;
    } else {
      let product = laceProduct(sublists);
      return product.map((productVals, i) => {
        let sublist;
        sublist = [...list];
        sublistIndices.forEach((productIndex, j) => {
          sublist[productIndex] = productVals[j];
        });
        return sublist;
      }).flat();
    }
  };

  let laceExpand = list =>
    laceExpandOnce(list.map(x =>
      Array.isArray(x) ? laceExpand(x) : x
    ));
  return x.seq(...laceExpand(vals));
});

let imp = impulse(6);
let notes = imp.lace([-7,0],3,[[12,10],5,8],3,[5]).add(60+4);

let freq = notes.midinote()
  .mul(imp.ad(0,0.03)
  .bipolar().range(imp.lace(1,1,[2,1],[1,1,2]),0.5))
  .add(sine(
    notes.midinote()
      .mul(imp.lace(2,4,0.5,3,[6,0.25,1,2],1.5)))
      .mul(sine(0.13).rangex(50,800))
  );

let mel = imp.clockdiv(4).ad(0.01,0.03).mul(sine(freq))
  .add(x => x.delay(5.02/6).mul(0.6));

let bass = imp.lace(1,0,0,1,0,0,[0,0,0,1],0)
   .ad(0.002,0.3)
   .mul(
      imp.clockdiv(8)
      .lace(-3,-3,-3,[-5,2]).add(36).midinote()
      .saw().lpf(0.3,0.3)
  )

let pad = imp.clockdiv(32).apply(g =>
  g.ad(2.5,2.5).pow(1.5).apply(e =>
    e.mul(
      g.lace([3,-4],[[0,5],[-5,0]]).add(72+4)
        .add([0,3,7,10])
        .add(e.mul(sine(5)).mul(0.25))
        .midinote().pulse(0.1).mix(2)
        
    )
      .lpf(e.range(0.1,0.8),0.2)
      .mul(sine(4).range(.5,1))
      .add(x => x.delay(3.01/6).mul(0.6))
  )
)
.mul(0.3)


let kick = imp.clockdiv(4).adsr(0,.11,0,.11)
  .apply(env => env.mul(env)
    .mul(158) // frequency range
    .sine(env)
    .distort(.9)
  )

let snare = imp.clockdiv(4).seq(0,1,0,1)
.adsr(0,.11,.1,.1)
 .mul(noise()).lpf(.78,.29)


add(
kick,
snare,
mel,
bass,
pad
).mul(0.8)
  .out();`,
  },
  {
    label: "pulu - contemplatron",
    code: `// contemplatron
// by pulu : https://pulusound.fi
let lace = register("lace", (x, ...vals) => {
  let laceProduct = lists => {
    let counters = Array(lists.length).fill(0);
    let first = true;
    let result = [];
    while(first || counters.some(c => c > 0)) {
      result.push(counters.map((c, i) => lists[i][c]));
      counters.forEach((counter, i) => {
        counters[i] = (counter + 1) % lists[i].length;
      });
      first = false;
    }
    return result;
  };

  let laceExpandOnce = list => {
    let sublists = list.filter(x => x.length > 0);
    let sublistIndices = list.map((x, i) => i).filter(i => list[i].length > 0);
    if(sublists.length === 0) {
      return list;
    } else {
      let product = laceProduct(sublists);
      return product.map((productVals, i) => {
        let sublist;
        sublist = [...list];
        sublistIndices.forEach((productIndex, j) => {
          sublist[productIndex] = productVals[j];
        });
        return sublist;
      }).flat();
    }
  };

  let laceExpand = list =>
    laceExpandOnce(list.map(x =>
      Array.isArray(x) ? laceExpand(x) : x
    ));
  return x.seq(...laceExpand(vals));
});

let imp = impulse(6);
let notes = imp.lace([-7,0],3,[[12,10],5,8],3,[5]).add(60+4);
let freq = notes.midinote()
  .mul(imp.ad(0,0.03)
  .bipolar().range(imp.lace(1,1,[2,1],[1,1,2]),0.5))
  .add(sine(
    notes.midinote()
      .mul(imp.lace(2,4,0.5,3,[6,0.25,1,2],1.5)))
      .mul(sine(0.13).rangex(50,800))
  );
let mel = imp.ad(0.01,0.1).mul(sine(freq))
  .add(x => x.delay(5.02/6).mul(0.6));
let bass = imp.lace(1,0,0,1,0,0,[0,0,0,1],0)
  .ad(0.002,0.2).mul(saw(midinote(add(imp.clockdiv(8).lace(-3,-3,-3,[-5,2]).add(36))))
  .lpf(0.3,0.3)).mul(0.7);
let pad = imp.clockdiv(32).apply(g =>
  g.ad(2.5,2.5).pow(1.5).apply(e =>
    e.mul(
      g.lace([3,-4],[[0,5],[-5,0]]).add(72+4)
        .add(e.mul(sine(5)).mul(0.25))
        .midinote().pulse(0.1)
    )
      .lpf(e.range(0.1,0.8),0.2)
      .add(x => x.delay(3.01/6).mul(0.6))
  )
)
  .mul(0.2);
mel.add(bass).add(pad).mul(0.8)
  .out();`,
  },
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

zaw([55,110,220,330]).lpf( sine(.25).range(.3,.7) )
.mix(2)
.mul(impulse(4).perc(.1).lag(.05))
.add(x=>x.delay(zaw(.01).range(.005,.02)).mul(.9))
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


impulse(2).perc(sine(.3).range(.1,.2))
.mul(saw([55,110,221]))
.mix().mul(.6)
.add(x=>x.delay(.2).mul(.8))
.filter(sine(.2).range(.4,.9))
.mul(impulse(4).seq(.25,1))
.out()

kick(impulse(4).seq(1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1))
.out()

snare(impulse(2).seq(0,1))
.out()

hat(impulse(4).seq(0,1))
.out()

poly(220,330,520)
.mul(sine(8).range(1,1.02))
.sine().mix().mul(sine(3).range(.3,.6))
.mul(impulse(4).seq(.25,1))
.mul(sine(.1).range(.2,1))
.out()

impulse(.5).seq(660,590).pulse()
.mul(impulse(2).perc(.1))
.mul(.2)
.add(x=>x.delay(.1).mul(.8))
//.out()`,
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
