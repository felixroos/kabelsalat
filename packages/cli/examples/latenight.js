let kick = gate => gate.adsr(0,.11,0,.11)
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
.out()