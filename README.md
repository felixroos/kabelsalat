# kabelsalat

very early experiment to live code audio graphs

[felixroos.github.io/kabelsalat](https://felixroos.github.io/kabelsalat/)

compilation strategy / graph format based on <https://noisecraft.app/>

## examples

- [acid machine + drum thing](https://felixroos.github.io/kabelsalat/#Ly8gbWF4aW1lY2IgLSB0aGUgbGl0dGxlIGFjaWQgbWFjaGluZSB0aGF0IGNvdWxkCi8vICsgbWF4aW1lY2IgZHJ1bSBtYWNoaW5lCi8vIGNvZGUgYnkgZnJvb3MKLy8gbm9pc2VjcmFmdCAtPiBrYWJlbHNhbGF0Ci8vIGh0dHBzOi8vbm9pc2VjcmFmdC5hcHAvNDcKCmxldCBraWNrID0gZ2F0ZSA9PiBnYXRlLmFkc3IoMCwuMTEsMCwuMTEpCiAgLmFwcGx5KGVudiA9PiBlbnYubXVsKGVudikKICAgIC5tdWwoMTU4KSAvLyBmcmVxdWVuY3kgcmFuZ2UKICAgIC5zaW5lKGVudikKICAgIC5kaXN0b3J0KC44NSkKICApCgpsZXQgc25hcmUgPSBnYXRlID0+IGdhdGUuYWRzcigwLC4xMSwuMSwuMSkKICAubXVsKG5vaXNlKCkpLmZpbHRlciguNzgsLjI5KQoKbGV0IGMgPSBjbG9jaygxNjApCmxldCBub3RlcyA9IGMuY2xvY2tkaXYoOCkKLnNlcSgyNywyNywzOSw1MSwwLDAsMjcsMjcsNDIsMjcsNDAsMCwzMSwzMSw1Niw1MSkKCmxldCBlbnYgPSBub3Rlcy5hZHNyKDAsLjMsLjM0LC41OSkKCm5vdGVzCi5hcHBseTIoaG9sZCkgLy8gaG9sZCBmcmVxIGFib3ZlIDBzCi5taWRpbm90ZSgpCi5zbGlkZSgKICBzaW5lKC4yMSkucmFuZ2UoMCwxKQopCi5wdWxzZSguNDgpCi5tdWwoZW52KQouZmlsdGVyKAogIGVudi5tdWwoc2luZSguMDkpLnJhbmdlKC41NSwxKSksIC8vIGN1dG9mZgogIHNpbmUoLjIyKS5yYW5nZSgwLC4zNSkgLy8gcmVzCikKLmRpc3RvcnQoCiAgc2luZSguMTgpLnJhbmdlKDAsLjg1KQopCi5tdWwoMC41KQoubXVsKGMuY2xvY2tkaXYoMTYpLnNlcSguMjUsMSkpIC8vIHNpZGVjaGFpbgouYWRkKGMuY2xvY2tkaXYoMzIpLnNlcSgxLDEpLmFwcGx5KGtpY2spKQouYWRkKGMuY2xvY2tkaXYoMzIpLnNlcSgwLDEpLmFwcGx5KHNuYXJlKSkKLm91dCgpCg==)
- [feedback delay warbling](https://felixroos.github.io/kabelsalat/#bGV0IGZyZXEgPSBjbG9jaygxNTApLmNsb2NrZGl2KDMyKQouc2VxKDY0LDAsMCw2NywwLDAsNjIsMCkKCmxldCBlbnYgPSBmcmVxLmFkc3IoLjAxLHNpbmUoLjEpLnJhbmdlKC4xLC4zKSwuNSkubXVsKC43NSkKCmZyZXEuYXBwbHkyKGhvbGQpCgoubWlkaW5vdGUoKQouc2F3KC40KQouZmlsdGVyKAogIHNpbmUoLjEpLnJhbmdlKC43LC44KS5tdWwoZW52KSwgCiAgLy9lbnYuZGl2KDIpCikKLy8uZGlzdG9ydChzaW5lKC4wMikucmFuZ2UoMCwuMSkpLm11bCguNSkKLm11bChlbnYpCi5hZGQoeD0+eC5kZWxheShzaW5lKC4wMykucmFuZ2UoLjEsLjUpKS5tdWwoLjkpKQoubXVsKC41KQoub3V0KCk=)
- [midi bass](https://felixroos.github.io/kabelsalat/#CmxldCBlbnYgPSBtaWRpZ2F0ZSgpLmFkc3IoLjAxLC4yLC43NSkubXVsKC43NSkKCm1pZGlmcmVxKCkuZGl2KDQpCi8vZnJlcS5hcHBseTIoaG9sZCkubWlkaW5vdGUoKQouc2F3KC40KQouZmlsdGVyKAogIHNpbmUoLjEpLnJhbmdlKC43LC44KS5tdWwoZW52KSwgCiAgZW52LmRpdigyKQopCi8vLmRpc3RvcnQoc2luZSguMDIpLnJhbmdlKDAsLjEpKS5tdWwoLjUpCi5tdWwoZW52KQovLy5hZGQoeD0+eC5kZWxheShzaW5lKC4wMykucmFuZ2UoLjEsLjUpKS5tdWwoLjkpKQoubXVsKC41KQoub3V0KCk=)
- [fm with feedback](https://felixroos.github.io/kabelsalat/#Ly8gYWRhcHRlZCBmcm9tIGh0dHBzOi8vd3d3LmNoYXJsaWUtcm9iZXJ0cy5jb20vZ2VuaXNoL3R1dG9yaWFsL2luZGV4Lmh0bWwjZm1tRmVlZGJhY2sKTm9kZS5wcm90b3R5cGUuZm0gPSBmdW5jdGlvbiAoYzJtID0gMSwgaW5kZXggPSAzLCBmYiA9IDAuMDUpIHsKICBsZXQgY2FycmllciwKICAgIGZyZXEgPSB0aGlzOwogIG11bCgoZmVlZGJhY2spID0+IHsKICAgIGNvbnN0IG1vZHVsYXRvciA9IGZlZWRiYWNrCiAgICAgIC5tdWwoZmIpCiAgICAgIC5hZGQobXVsKGZyZXEsIGMybSkpCiAgICAgIC5zaW5lKCkKICAgICAgLm11bChmcmVxLCBpbmRleCkKICAgICAgLmFkZChmZWVkYmFjaykKICAgICAgLm11bCgwLjUpOwogICAgY29uc3QgZW52ID0gZnJlcS5hZHNyKDAuMDAxLCAwLjUsIDAsIDApLmFwcGx5MihtdWwpLmFwcGx5MihtdWwpOwogICAgY2FycmllciA9IG1vZHVsYXRvci5hZGQoZnJlcSkuc2luZSgpLm11bChlbnYpOwogICAgcmV0dXJuIG1vZHVsYXRvci5tdWwoZW52KTsKICB9KTsKICByZXR1cm4gY2FycmllcjsKfTsKCnB1bHNlKDQpCiAgLnJhbmdlKDEsIDApCiAgLnNlcSg1NSwgMTEwLCAxNjUsIDIyMCwgMjc1LCAzMzAsIDM4NSwgNDQwKQogIC5mbSgxLCAzLCAwLjA1KQogIC5vdXQoKTsK)
- [equalizer](https://felixroos.github.io/kabelsalat/#Tm9kZS5wcm90b3R5cGUuYmFuZCA9IGZ1bmN0aW9uIChtaW4sbWF4KSB7CiAgcmV0dXJuIHRoaXMuZmlsdGVyKG1heCkuc3ViKHRoaXMuZmlsdGVyKG1pbikpCn0KCk5vZGUucHJvdG90eXBlLmVxID0gZnVuY3Rpb24gKGxvdz0xLG1pZD0xLGhpPTEpIHsKICByZXR1cm4gYWRkKAogICAgdGhpcy5iYW5kKC43NCwxKS5tdWwoaGkpLAogICAgdGhpcy5iYW5kKC4zMSwuODcpLm11bChtaWQpLAogICAgdGhpcy5iYW5kKDAsLjMyKS5tdWwobG93KQogICkKfQoKc2F3KDU1KS5lcSgKIHNpbmUoLjUpLnJhbmdlKDAsMSksCiBzaW5lKDEuMzEpLnJhbmdlKDAsMSksCiBzaW5lKDIuMTcpLnJhbmdlKDAsMSkKKS5vdXQoKQ==)
- [insect buzzing by luiiuuuiiiii](https://felixroos.github.io/kabelsalat/#c2luZSgxMjExMSkKLmZvbGQoc2luZSguNTEpLnJhbmdlKDAsIC4zKSkKLm11bCgKICBzaW5lKAogICAgbig3KS5tdWwoCiAgICAgIHNpbmUoMC41KS5yYW5nZSgxLDMpCiAgICApCiAgKS5yYW5nZSguMCwuMSkKKQoub3V0KCk=)
- [Da Wubs](https://felixroos.github.io/kabelsalat/#c2F3KC4zNSkKLm11bCg0LjcpCi5hZGQoLjM1KQouc2luZSgpCi5tdWwoMzkxLjk5NSkKLm11bCh0cmkoNTApKQouc2luZSgpCi5tdWwoMSkKLm91dCgpCgovLyBEYSBXdWJzCi8vIGh0dHBzOi8vbm9pc2VjcmFmdC5hcHAvNTEK)
- [weird noise thing](https://felixroos.github.io/kabelsalat/#bm9pc2UoMikucmFuZ2UoNTUsMjIwKS5tdWwoc2luZSguMikucmFuZ2UoMSwxLjEpKS5ub2lzZSgpCi5maWx0ZXIobm9pc2UoKS5yYW5nZSguNywuNCkuc2xpZGUoMSksIG5vaXNlKC42KS5yYW5nZSgyLDQpKQouZmlsdGVyKGNsb2NrKDEyKS5zZXEoLjEsLjIsLjUsLjIsLjcpKQoubXVsKDQpLmZvbGQoKQoub3V0KCk=)

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
