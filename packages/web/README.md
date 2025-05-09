# @kabelsalat/web

This package allows you to use kabelsalat anywhere on the web. 

## Using an inline script
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://unpkg.com/@kabelsalat/web@0.0.7/dist/index.js"></script>
  </head>
  <body>
    <button id="play">play</button>
    <button id="stop">stop</button>
    <script>
      let code = `saw([55,110,220,330]).lpf( sine(.25).range(.3,.7) )
.mix(2)
.mul(impulse(4).perc(.1).lag(.05))
.add(x=>x.delay(saw(.01).range(.005,.02)).mul(.9))
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

## Using ES6 import:
```js
import { SalatRepl } from '@kabelsalat/web'
```

## Connecting the Repl to other outputs
By default, the Repl will create an audio context and connect to its destination. If you want to connect the Repl to another component, simply pass an AudioNode on instantiation:
```js
import { SalatRepl } from '@kabelsalat/web'

// create an audio context
const audioCtx = new AudioContext({
  latencyHint: "interactive",
  sampleRate: 44100,
})

// create an abritrary audio node
const gain = new GainNode(audioCtx)
// connect to the destination
gain.connect(audioCtx.destination);

const repl = new SalatRepl({outputNode: gain})
```


