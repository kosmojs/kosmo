---
title: Sidecar config
description: The sidecar block - entry, run, serve and viteConfig - and opting a sidecar out of
    typechecking.
head:
  - - meta
    - name: keywords
      content: sidecar config, sidecar entry, sidecar run, sidecar serve, viteConfig,
        typecheck opt-out, kosmo.config.ts
---

The stock config comes with sane defauls you can adapt at your wish:

```ts [src/mailer/kosmo.config.ts]
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  sidecar: {
    entry: "./entry.ts",
    run: "./run.ts",
    serve: false,
  },
  typecheck: true,
});
```

### Options

| Option | |
|---|---|
| `entry` | **required** - the service, relative to the source folder |
| `run` | the runner that starts it, relative to the source folder |
| `serve` | run it under the dev server - see [In development](/sidecar/development) |
| `viteConfig` | Vite's `UserConfig` for this build |

Both `entry` and `run` files are built into `dist/<folder>/sidecar/`,
so the folder above starts with `node dist/mailer/sidecar/run.js`.

The extra directory is there for the folders that serve HTTP as well.
A web build already owns `api/`, `client/` and `ssr/` in its output tree,
so the sidecar takes a subdirectory of its own rather than dropping a loose file among them.
The path is the same either way, so the command you run never depends on what else the folder does.

Two files rather than one because they answer different questions.
- The entry says what the service *is* - start it, stop it, close what it opened.
- The runner says how it is *supervised* - which signals to catch, what to do when `start()` throws, whether to drain before exit.

> The dev server needs only the `entry`, and replaces the `run` with itself.
