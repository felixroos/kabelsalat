# @kabelsalat/web

This package allows you to use kabelsalat anywhere on the web. Example:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://unpkg.com/@kabelsalat/web@0.4.0/dist/index.js"></script>
  </head>
  <body>
    <button id="play">play</button>
    <button id="stop">stop</button>
    <script>
      let code = `zaw([55,110,220,330]).lpf( sine(.25).range(.3,.7) )
.mix(2)
.mul(impulse(4).perc(.1).lag(.05))
.add(x=>x.delay(zaw(.01).range(.005,.02)).mul(.9))
.add(x=>x.delay(.3).mul(.7))
.fold().mul(.6)
.out()`;
      const { SalatRepl } = kabelsalat;
      const repl = new SalatRepl();
      document.getElementById("play").onclick = () => repl.run(code);
      document.getElementById("stop").onclick = () => repl.stop();
    </script>
  </body>
</html>
```
