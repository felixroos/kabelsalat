// adapted from https://www.charlie-roberts.com/genish/tutorial/index.html#fmmFeedback
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
  .out();
