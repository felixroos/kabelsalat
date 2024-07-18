// crescent call
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
