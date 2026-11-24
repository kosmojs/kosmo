---
title: Sidecar config
description: >-
    The sidecar block - serve, test and viteConfig - and the two files it builds by convention.
head:
  - - meta
    - name: keywords
      content: sidecar config, sidecar block, sidecar serve, sidecar test, viteConfig,
        sidecar/entry.ts, sidecar/run.ts, kosmo.config.ts
---

The `sidecar` block sits in `kosmo.config.ts` next to `frontend` and `backend`, or on its own:

```ts [src/mailer/kosmo.config.ts]
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  sidecar: {
    serve: true,
  },
});
```

### Options

| Option | |
|---|---|
| `serve` | whether the dev server runs it - see [In development](/sidecar/development) |
| `test` | load its tests into Vitest, off by default - see [Testing](/sidecar/testing) |
| `viteConfig` | Vite's `UserConfig` for this build |

`serve` is the one required option, so every sidecar says whether the dev server runs it.
`test` and `viteConfig` are optional.

### The files

The block names no files.
A sidecar is two files by convention, in the folder's `sidecar/` directory:

| File | |
|---|---|
| `sidecar/entry.ts` | the [service](/sidecar/entry#the-entry) - start it, stop it, close what it opened |
| `sidecar/run.ts` | the [runner](/sidecar/entry#the-runner) - which signals to catch, whether to drain before exit |

Both are seeded when missing, and yours to edit from there,
just like `api/app.ts` for a backend or `entry/client.ts` for a frontend.

Two files rather than one because they answer different questions.
- The entry says what the service *is* - start it, stop it, close what it opened.
- The runner says how it is *supervised* - which signals to catch, what to do when `start()` throws, whether to drain before exit.

> The dev server needs only the entry, and replaces the runner with itself.

### The build

Both files are built into `dist/<folder>/sidecar/`,
so the folder above starts with `node dist/mailer/sidecar/run.js`.

The source has its `sidecar/` directory and so does the output,
the same way `api/` sits beside `client/` and `ssr/` in a web build.
The path is the same whatever else the folder holds,
so the command you run never depends on it.
