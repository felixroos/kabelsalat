# kabelsalat

very early experiment to live code audio graphs

compilation strategy / graph format very much inspired by and adapted from <https://noisecraft.app/>

## examples

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

<!-- clock(120).clockdiv(24).clockout()
.add(sine(220)).out() -->

## notable noisecraft changes

added `time` flag to `NODE_SCHEMA`, to denote that time should be passed as first arg to `update`.
