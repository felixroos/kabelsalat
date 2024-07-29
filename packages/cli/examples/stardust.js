// stardust
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
add(mel, wind, drone).out()