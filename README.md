# kabelsalat

very early experiment to live code audio graphs

compilation strategy / graph format very much inspired by and adapted from <https://noisecraft.app/>

## examples

- [Da Wubs](https://felixroos.github.io/kabelsalat/#c2F3KC4zNSkKLm11bCg0LjcpCi5hZGQoLjM1KQouc2luZSgpCi5tdWwoMzkxLjk5NSkKLm11bCh0cmkoNTApKQouc2luZSgpCi5tdWwoMSkKLm91dCgpCgovLyBEYSBXdWJzCi8vIGh0dHBzOi8vbm9pc2VjcmFmdC5hcHAvNTEK)
- [acid machine + drum thing](https://felixroos.github.io/kabelsalat/#KCgpID0+IHsKLy8gbWF4aW1lY2IgLSB0aGUgbGl0dGxlIGFjaWQgbWFjaGluZSB0aGF0IGNvdWxkCi8vICsgbWF4aW1lY2IgZHJ1bSBtYWNoaW5lCi8vIGNvZGUgYnkgZnJvb3MKLy8gbm9pc2VjcmFmdCAtPiBrYWJlbHNhbGF0Ci8vIGh0dHBzOi8vbm9pc2VjcmFmdC5hcHAvNDcKCk5vZGUucHJvdG90eXBlLmtpY2sgPSBmdW5jdGlvbiAoKSB7CiAgbGV0IGVudiA9IHRoaXMuYWRzcigwLC4xMSwwLC4xMSk7CiAgcmV0dXJuIGVudi5tdWwoZW52KQogICAgLm11bCgxNTgpIC8vIGZyZXF1ZW5jeSByYW5nZQogICAgLnNpbmUoZW52KQogICAgLmRpc3RvcnQoLjg1KQp9Ck5vZGUucHJvdG90eXBlLnNuYXJlID0gZnVuY3Rpb24gKCkgewogIGxldCBlbnYgPSB0aGlzLmFkc3IoMCwuMTEsLjEsLjEpOwogIHJldHVybiBlbnYKICAgIC5tdWwobm9pc2UoKSkKICAgIC5maWx0ZXIoLjc4LC4yOSkKICAgIC5tdWwoMSkgLy8gbm9pc2Ugdm9sCn0KCmxldCBjID0gY2xvY2soMTYwKQpsZXQgbm90ZXMgPSBjLmNsb2NrZGl2KDgpCi5zZXEoMjcsMjcsMzksNTEsMCwwLDI3LDI3LDQyLDI3LDQwLDAsMzEsMzEsNTYsNTEpCgpsZXQgZW52ID0gbm90ZXMuYWRzcigwLC4zLC4zNCwuNTkpCgpyZXR1cm4gbm90ZXMKLmFwcGx5KHg9PnguaG9sZCh4KSkgLy8gaG9sZCBmcmVxIGFib3ZlIDBzCi5taWRpbm90ZSgpCi5zbGlkZSgKICBzaW5lKC4yMSkucmFuZ2UoMCwxKQopCi5wdWxzZSguNDgpCi5tdWwoZW52KQouZmlsdGVyKAogIGVudi5tdWwoc2luZSguMDkpLnJhbmdlKC41NSwxKSksIC8vIGN1dG9mZgogIHNpbmUoLjIyKS5yYW5nZSgwLC4zNSkgLy8gcmVzCikKLmRpc3RvcnQoCiAgc2luZSguMTgpLnJhbmdlKDAsLjg1KQopCi5tdWwoMC41KQoubXVsKGMuY2xvY2tkaXYoMTYpLnNlcSguMjUsMSkpIC8vIHNpZGVjaGFpbgouYWRkKGMuY2xvY2tkaXYoMzIpLnNlcSgxLDEpLmtpY2soKSkKLmFkZChjLmNsb2NrZGl2KDMyKS5zZXEoMCwxKS5zbmFyZSgpKQoub3V0KCkKCn0pKCk=)
- [the little acid machine that could](https://felixroos.github.io/kabelsalat/#KCgpID0+IHsKLy8gbWF4aW1lY2IgLSB0aGUgbGl0dGxlIGFjaWQgbWFjaGluZSB0aGF0IGNvdWxkCi8vIG5vaXNlY3JhZnQgLT4ga2FiZWxzYWxhdAovLyBodHRwczovL25vaXNlY3JhZnQuYXBwLzQ3CgpsZXQgbm90ZXMgPSBjbG9jaygxNjApLmNsb2NrZGl2KDgpCi5zZXEoMjcsMjcsMzksNTEsMCwwLDI3LDI3LDQyLDI3LDQwLDAsMzEsMzEsNTYsNTEpCgpsZXQgZW52ID0gbm90ZXMuYWRzcigwLC4zLC4zNCwuNTkpCgpyZXR1cm4gbm90ZXMKLmFwcGx5KHg9PnguaG9sZCh4KSkgLy8gaG9sZCBmcmVxIGFib3ZlIDBzCi5taWRpbm90ZSgpCi5zbGlkZSgKICBzaW5lKC4yMSkucmFuZ2UoMCwxKQopCi5wdWxzZSguNDgpCi5tdWwoZW52KQouZmlsdGVyKAogIGVudi5tdWwoc2luZSguMDkpLnJhbmdlKC41NSwxKSksIC8vIGN1dG9mZgogIHNpbmUoLjIyKS5yYW5nZSgwLC4zNSkgLy8gcmVzCikKLmRpc3RvcnQoCiAgc2luZSguMTgpLnJhbmdlKDAsLjg1KQopCi5tdWwoLjg1KQoub3V0KCkKCn0pKCk=)
- [drum thing](https://felixroos.github.io/kabelsalat/#KCgpID0+IHsKLy8gaHR0cHM6Ly9ub2lzZWNyYWZ0LmFwcC81MjkKTm9kZS5wcm90b3R5cGUua2ljayA9IGZ1bmN0aW9uICgpIHsKICBsZXQgZW52ID0gdGhpcy5hZHNyKDAsLjExLDAsLjExKS5hcHBseSh4PT54Lm11bCh4KSkKICByZXR1cm4gZW52CiAgICAubXVsKDE1OCkgLy8gZnJlcXVlbmN5IHJhbmdlCiAgICAuc2luZShlbnYpCiAgICAuZGlzdG9ydCguODUpCn0KTm9kZS5wcm90b3R5cGUuc25hcmUgPSBmdW5jdGlvbiAoKSB7CiAgbGV0IGVudiA9IHRoaXMuYWRzcigwLC4xMSwuMjQsLjI5KTsKICByZXR1cm4gZW52CiAgICAubXVsKG5vaXNlKCkpCiAgICAuZmlsdGVyKC43OCwuMjkpCiAgICAubXVsKDEpIC8vIG5vaXNlIHZvbAp9CiAKbGV0IGMgPSBjbG9jaygxMzApLmNsb2NrZGl2KDE2KTsKCnJldHVybiBjLnNlcSgxLDAsMSwwKS5raWNrKCkKLmFkZChjLnNlcSgwLDAsMSwwKS5zbmFyZSgpKQoub3V0KCkKCn0pKCk=)
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

## notable noisecraft changes

added `time` flag to `NODE_SCHEMA`, to denote that time should be passed as first arg to `update`.
