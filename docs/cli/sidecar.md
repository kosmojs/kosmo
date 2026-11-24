---
title: kosmo sidecar has moved
description: Sidecars are a block of any source folder now,
    added in its kosmo.config.ts or with kosmo folder --sidecar.
outline: false
prev: false
next: false
---

This page has moved. `kosmo sidecar` is gone:
a sidecar is a block of any source folder now, next to `frontend` and `backend`,
added to the folder's `kosmo.config.ts`:

```ts [kosmo.config.ts]
export default defineConfig({
  // ...
  sidecar: {
    serve: false,
  },
});
```

Or have [kosmo folder](/cli/folder) add it when creating the folder,
with `--sidecar` or a yes in its dialog.
For a sidecar on its own, give it neither side:

```sh
pnpm folder --name mailer --sidecar
```

[**Sidecars**](/sidecar/intro) - what a sidecar is, and where its files live.
