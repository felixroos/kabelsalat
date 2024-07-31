# @kabelsalat/cli

This is the **c**ommand **l**ine **i**nterface for kabelsalat.

## experimental c compiler

Try the experimental c compiler via

```sh
cd packages/cli/src # from the kabelsalat repo root
pnpm ks2c
```

This will compile `kabelsalat.js` to `kabelsalat.js.c`, then compile it to a binary and play it with sox.
Depending on your OS, you might need to adjust the sox command in the `package.json` for `ks2c:run`.
