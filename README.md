# kabelsalat

an experimental live-codable modular synthesizer.

- main site at [kabel.salat.dev](https://kabel.salat.dev)
- docs at [kabel.salat.dev/learn](https://kabel.salat.dev/learn/)

## Project Setup

You need [nodejs v22](https://nodejs.org/en) and [pnpm](https://pnpm.io/). Then run `pnpm i` to install dependencies.

## Running Offline

1. `pnpm build` to build the site
2. `pnpm preview` to serve the build

## Develop

- `pnpm dev` run the dev server
- `pnpm test` run tests

## Publishing

```sh
npm login

# this will increment all the versions in package.json files of non private packages to selected versions
npx lerna version --no-private

# publish all packages inside /packages using pnpm! don't use lerna to publish!!
pnpm --filter "./packages/**" publish --dry-run

# the last command was only a dry-run. if everything looks ok, run this:
pnpm --filter "./packages/**" publish --access public
```

## Packages

This project is a monorepo with the following packages:

- [core](./packages/core/) core graph language + compiler
- [lib](./packages/lib/) the standard library
- [transpiler](./packages/transpiler/) optional transpiler
- [web](./packages/web/) web related functionality
- [cli](./packages/cli/) experimental node version
- [codemirror](./packages/codemirror/) codemirror integration
- [graphviz](./packages/graphviz/) graphviz integration

## Related Projects

Most audio nodes and the compilation strategy is based on [noisecraft](https://noisecraft.app/). Also, the following projects have been an inspiration in one way or another:

- [supercollider](https://supercollider.github.io/)
- [strudel](https://strudel.cc/)
- [hydra](https://hydra.ojack.xyz/)
- [genish](https://www.charlie-roberts.com/genish/)
- [wax](https://nnirror.xyz/wax/)
- [doughbeat](https://github.com/felixroos/doughbeat)
- [doughbat](https://github.com/felixroos/doughbat)
