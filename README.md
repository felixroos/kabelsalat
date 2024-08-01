# kabelsalat

very early experiment to live code audio graphs

[kabel.salat.dev](https://kabel.salat.dev)

compilation strategy / graph format based on <https://noisecraft.app/>

## examples

go to [kabel.salat.dev](https://kabel.salat.dev) and select "browse" to hear some examples.

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
