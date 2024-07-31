// shall we trance, buttons & sliders version
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
    let wets = [];
    return dry
      .add((x) => {
        let wet = f(x);
        wets.push(wet);
        return wet;
      })
      .apply((x) => poly(...wets));
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
