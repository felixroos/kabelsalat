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

see [API reference](http://localhost:4321/kabelsalat/reference)
