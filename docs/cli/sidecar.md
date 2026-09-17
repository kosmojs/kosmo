---
title: kosmo sidecar
description: Adding a sidecar folder to an existing project -
    a source folder that builds entry points instead of serving HTTP.
head:
  - - meta
    - name: keywords
      content: kosmo sidecar, pnpm sidecar, add sidecar, background worker, non-http folder,
        sidecar entry, scaffolding
---

Adds a [sidecar](/sidecar/intro) folder - a source folder that builds a process you handle yourself.

```sh
pnpm sidecar mailer
```

It is `kosmo folder`'s counterpart: same scaffolding, none of the web questions.

## What you get

```txt
src/mailer/
├── kosmo.config.ts       -> the sidecar block
├── tsconfig.json         -> extends ../../lib/mailer/tsconfig.json
├── entry.ts              -> defineService({ start, teardown })
└── run.ts                -> imports the entry, starts it, stops it on a signal
```

The [entry](/sidecar/entry#the-entry) is the service;
the [runner](/sidecar/entry#the-runner) is how it is supervised in production -
the dev server imports the entry itself and never uses the runner.

Like any other folder it ships with a `kosmo.config.ts` file where you adjust the things:

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

## One sidecar per folder

That is what keeps the build output, the dev watcher and `pnpm build <name>` addressable per process.
Mixing a sidecar into a HTTP folder is not recommended.
[Details&nbsp;›](/sidecar/intro#keep-it-in-its-own-folder)
