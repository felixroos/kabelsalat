# kabelsalat

very early experiment to live code audio graphs

compilation strategy / graph format very much inspired by and adapted from <https://noisecraft.app/>

## examples

- [acid machine + drum thing](https://felixroos.github.io/kabelsalat/#KCgpID0+IHsKLy8gbWF4aW1lY2IgLSB0aGUgbGl0dGxlIGFjaWQgbWFjaGluZSB0aGF0IGNvdWxkCi8vICsgbWF4aW1lY2IgZHJ1bSBtYWNoaW5lCi8vIGNvZGUgYnkgZnJvb3MKLy8gbm9pc2VjcmFmdCAtPiBrYWJlbHNhbGF0Ci8vIGh0dHBzOi8vbm9pc2VjcmFmdC5hcHAvNDcKCmxldCBraWNrID0gZ2F0ZSA9PiBnYXRlLmFkc3IoMCwuMTEsMCwuMTEpCiAgLmFwcGx5KGVudiA9PiBlbnYubXVsKGVudikKICAgIC5tdWwoMTU4KSAvLyBmcmVxdWVuY3kgcmFuZ2UKICAgIC5zaW5lKGVudikKICAgIC5kaXN0b3J0KC44NSkKICApCgpsZXQgc25hcmUgPSBnYXRlID0+IGdhdGUuYWRzcigwLC4xMSwuMSwuMSkKICAubXVsKG5vaXNlKCkpLmZpbHRlciguNzgsLjI5KQoKbGV0IGMgPSBjbG9jaygxNjApCmxldCBub3RlcyA9IGMuY2xvY2tkaXYoOCkKLnNlcSgyNywyNywzOSw1MSwwLDAsMjcsMjcsNDIsMjcsNDAsMCwzMSwzMSw1Niw1MSkKCmxldCBlbnYgPSBub3Rlcy5hZHNyKDAsLjMsLjM0LC41OSkKCnJldHVybiBub3RlcwouYXBwbHkyKGhvbGQpIC8vIGhvbGQgZnJlcSBhYm92ZSAwcwoubWlkaW5vdGUoKQouc2xpZGUoCiAgc2luZSguMjEpLnJhbmdlKDAsMSkKKQoucHVsc2UoLjQ4KQoubXVsKGVudikKLmZpbHRlcigKICBlbnYubXVsKHNpbmUoLjA5KS5yYW5nZSguNTUsMSkpLCAvLyBjdXRvZmYKICBzaW5lKC4yMikucmFuZ2UoMCwuMzUpIC8vIHJlcwopCi5kaXN0b3J0KAogIHNpbmUoLjE4KS5yYW5nZSgwLC44NSkKKQoubXVsKDAuNSkKLm11bChjLmNsb2NrZGl2KDE2KS5zZXEoLjI1LDEpKSAvLyBzaWRlY2hhaW4KLmFkZChjLmNsb2NrZGl2KDMyKS5zZXEoMSwxKS5hcHBseShraWNrKSkKLmFkZChjLmNsb2NrZGl2KDMyKS5zZXEoMCwxKS5hcHBseShzbmFyZSkpCi5vdXQoKQoKfSkoKQ==)
- [insect buzzing by luiiuuuiiiii](https://felixroos.github.io/kabelsalat/#c2luZSgxMjExMSkKLmZvbGQoc2luZSguNTEpLnJhbmdlKDAsIC4zKSkKLm11bCgKICBzaW5lKAogICAgbig3KS5tdWwoCiAgICAgIHNpbmUoMC41KS5yYW5nZSgxLDMpCiAgICApCiAgKS5yYW5nZSguMCwuMSkKKQoub3V0KCk=)
- [Da Wubs](https://felixroos.github.io/kabelsalat/#c2F3KC4zNSkKLm11bCg0LjcpCi5hZGQoLjM1KQouc2luZSgpCi5tdWwoMzkxLjk5NSkKLm11bCh0cmkoNTApKQouc2luZSgpCi5tdWwoMSkKLm91dCgpCgovLyBEYSBXdWJzCi8vIGh0dHBzOi8vbm9pc2VjcmFmdC5hcHAvNTEK)
- [weird noise thing](https://felixroos.github.io/kabelsalat/#bm9pc2UoMikucmFuZ2UoNTUsMjIwKS5tdWwoc2luZSguMikucmFuZ2UoMSwxLjEpKS5ub2lzZSgpCi5maWx0ZXIobm9pc2UoKS5yYW5nZSguNywuNCkuc2xpZGUoMSksIG5vaXNlKC42KS5yYW5nZSgyLDQpKQouZmlsdGVyKGNsb2NrKDEyKS5zZXEoLjEsLjIsLjUsLjIsLjcpKQoubXVsKDQpLmZvbGQoKQoub3V0KCk=)
- [am thing](https://felixroos.github.io/kabelsalat/#c2luZSgxMTApCi5tdWwoCiAgc2luZSgKICAgIG4oMzMyKS5tdWwoCiAgICAgIHNpbmUoLjAxKS5yYW5nZSguMjUsMikKICAgICkKICApCiAgLnJhbmdlKC4wNSwxKQopCi5tdWwoLjEpCi5vdXQoKQ==)
- [fm thing](https://felixroos.github.io/kabelsalat/#c2luZSgKbigxMTApLm11bCgKICBzaW5lKAogICAgbig2MzIpLm11bCgKICAgICAgc2F3KC4wMikucmFuZ2UoLjI1LDIpCiAgICApCiAgKQogIC5yYW5nZSguMDUsMSkKKSkKLm11bCguMSkKLm91dCgp)
- [fm thing 2](https://felixroos.github.io/kabelsalat/#c2luZSgKbigxMTApLm11bCgKICBzaW5lKAogICAgbigxMTUpLm11bCgKICAgICAgc2luZSgyNTApCiAgICAgIC5yYW5nZSguMTI1LCBzaW5lKC4wMikucmFuZ2UoMSwyMCkpCiAgICApCiAgKQogIC5yYW5nZSguMDUsMSkKKSkKLm11bCguMSkKLm91dCgp)
- [additive](https://felixroos.github.io/kabelsalat/#KCgpID0+IHsKbGV0IG9yZ2FuID0gKGZyZXEsIHBhcnRpYWxzKSA9PiB7CmxldCBzb3VuZCA9IG4oMCk7CmZvcihsZXQgaSA9IDE7aTw9cGFydGlhbHM7aSsrKSB7CmNvbnN0IHBhcnRpYWwgPSBzaW5lKGkqZnJlcSkubXVsKDEvaSkKc291bmQgPSBzb3VuZC5hZGQocGFydGlhbCkKfQpyZXR1cm4gc291bmQKfQoKcmV0dXJuIG9yZ2FuKDExMCwzKS5hZGQob3JnYW4oMTExLDUpKQoubXVsKC4xMjUpLm91dCgpCn0pKCk=)

## api

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

```js
feedback((x) => x.add(0.0025).mod(1)).out();
```

```js
feedback((x) => x.mul(300).add(440).sine()).out();
```

```js
sine(220)
  .mul(pulse(1, 0.1).range(1, 0))
  .feedback((x) => x.delay(0.2).mul(0.5))
  .out();
```

```js
noise()
  .range(220, 1100)
  .hold(noise().range(-1, 0.00002))
  .sine()
  .mul(0.4)
  .feedback((x) => x.delay(0.25).mul(0.75))
  .out();
```

## fm feedback

```js
(() => {
  let fm = (freqs, gate = freqs, c2m = 1, index = 3, fb = 0.05) =>
    feedback((out) => {
      const modulator = mul(freqs, c2m)
        .add(out.mul(fb))
        .sine()
        .mul(mul(freqs, index))
        .add(out)
        .mul(0.5);
      const carrier = modulator.add(freqs).sine();
      const env = gate.adsr(0.001, 0.5, 0, 0).apply2(mul).apply2(mul);
      return [modulator.mul(env), carrier.mul(env)];
    });
  const freqs = pulse(4).range(1, 0).seq(55, 110, 165, 220, 275, 330, 385, 440);
  return fm(freqs, freqs, 1, 3, 0.05).mul(2).out();
})();
```
