# @kabelsalat/core

experimental live coding language for audio graphs

[github](https://github.com/felixroos/kabelsalat) | [repl](https://felixroos.github.io/kabelsalat/) | [examples](https://github.com/felixroos/kabelsalat?tab=readme-ov-file#examples)

compilation strategy / graph format based on <https://noisecraft.app/> by Maxime Chevalier-Boisvert

## Install via npm

```sh
npm i @kabelsalat/core
```

```js
import { SalatRepl } from "@kabelsalat/core";

const repl = new SalatRepl();

function run(code) {
  const node = repl.evaluate(code);
  repl.play(node);
}
function stop() {
  const node = repl.stop();
}

document.addEventListener("click", () => {
  run(`sine(220).out()`);
});
```

## API

### sine(freq, sync)

```js
sine(110).out();
```

### tri(freq)

```js
tri(110).out();
```

### saw(freq)

```js
saw(55).filter(0.8).mul(0.2).out();
```

### pulse(freq, pw)

```js
pulse(55, sine(0.4).range(0.1, 0.8)).filter(0.8).mul(0.2).out();
```

### noise()

```js
noise().mul(0.2).out();
```

### adsr(gate, att, dec, sus, rel)

```js
sine(220)
  .mul(adsr(pulse(2), 0.02, 0.2, 0, 0.01))
  .out();
```

### slide(rate)

```js
pulse(2).range(110, 220).slide(1).sine().out();
```

### distort(in, amt)

```js
saw(55).filter(0.5).distort(saw(1).range(1, 0)).out();
```

### filter(in, cutoff, reso)

```js
saw(55).filter(sine(2).range(0.1, 0.5), saw(0.5).range(0.2, 0.5)).out();
```

### fold(in, rate)

```js
sine(110).fold(sine(0.5).range(0, 4)).out();
```

### clock(bpm) + clockdiv(clock, divisor)

```js
sine(220).mul(clock(120).clockdiv(24).adsr(0.02, 0.2, 0, 0.01)).out();
```

### seq(...steps)

```js
clock().clockdiv(16).seq(110, 220, 330, 440).sine().out();
```

### apply(fn)

```js
clock()
  .clockdiv(8)
  .apply((x) => x.seq(55, 0, 110, 66).saw().mul(x.adsr(0.02, 0.2)))
  .out();
```

### delay(in, time)

```js
sine(220)
  .mul(pulse(1, 0.1).adsr(0.01, 0.1, 0))
  .apply((x) => x.add(x.delay(0.25).mul(0.25)))
  .out();
```

### hold(in, trig)

```js
noise().range(55, 880).hold(pulse(2)).sine().out();
```

## feedback

to get feedback, simply pass a function instead of a node. The input of the function is the return value of its previous iteration! The snake bites its tail:

```js
add((x) => x.add(0.0025).mod(1)).out();
```

```js
sine((x) => x.mul(300).add(440)).out();
```

```js
sine(220)
  .mul(pulse(1, 0.1).range(1, 0))
  .add((x) => x.delay(0.2).mul(0.5))
  .out();
```

```js
noise()
  .range(220, 1100)
  .hold(noise().range(-1, 0.00002))
  .sine()
  .mul(0.4)
  .add((x) => x.delay(0.25).mul(0.75))
  .out();
```
