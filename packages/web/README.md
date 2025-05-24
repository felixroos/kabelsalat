# @kabelsalat/web

This package allows you to use kabelsalat anywhere on the web. 

## Using an inline script
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

## Using ES6 import:
```js
import { SalatRepl } from '@kabelsalat/web'
```

## Connecting the Repl to other outputs
Connecting the Repl to other audio nodes:

By default, SalatRepl creates an AudioContext and connects to its destination. To connect the Repl to a different audio node (e.g., GainNode, BiquadFilterNode), pass the desired AudioNode as the 'outputNode' parameter during instantiation.

```js
// Create a new AudioContext with standard settings
const audioCtx = new AudioContext({
  latencyHint: "interactive",
  sampleRate: 44100,
});

// Create a GainNode to adjust volume levels
const gain = new GainNode(audioCtx);

// Connect the GainNode to the AudioContext's destination (e.g., speakers)
gain.connect(audioCtx.destination);

// Instantiate the Repl, passing the GainNode as the output node
const repl = new SalatRepl({ outputNode: gain });
```