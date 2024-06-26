// minimoog v1
let tune = 0,
glide = 0, 
o1oct = 1,
o2oct = 2,
o3oct = 3,
o1wav = 0,
o2wav = 0,
o3wav = 0;

// tri, shark, saw, square, rec1, rec2
let shark = module('shark', (freq) => add(tri(freq).mul(.75),saw(freq).mul(.25)))
let square = module('square', (freq) => pulse(freq,.5))
let narrow = module('narrow', (freq) => pulse(freq,.1))
let wide = module('wide', (freq) => pulse(freq,.3))
let waves = [tri,shark,saw,square,wide,narrow]


let osc = module('osc', (type, freq, detune=1) => {
freq = n(freq).mul(n(detune))
return waves[type.value](freq)
})


osc([2,3,4,1], [55.1,110,220.2,440.9])
.mix()
.filter(impulse(4).perc(.25).slide(1).mul(sine(.2).range(.6,1)))
.mul(.2)
.out()