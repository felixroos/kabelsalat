# @kabelsalat/core

This package contains the core components of kabelsalat:

- `graph.js` a configurable DSL to create graphs
- `compiler.js` a language-agnostic compiler that turns a graph into a sequence of steps

Notable features:

- single sample feedback: graph cycles will feed back to the next sample
- multichannel-expansion: Passing an Array (or poly node) to an input will split the graph (similar to SuperCollider)
