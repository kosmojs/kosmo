---
title: Sidecar testing
description: Testing a sidecar with Vitest - enabling sidecar.test, where test files go,
    and starting and stopping the service the way the runner does.
head:
  - - meta
    - name: keywords
      content: sidecar testing, vitest, sidecar.test, *.test.ts, defineService,
        test project, kosmo.config.ts
---

A sidecar's tests are loaded into Vitest like those of any other source folder,
once you turn them on in `kosmo.config.ts`:

```ts [src/mailer/kosmo.config.ts]
export default defineConfig({
  sidecar: {
    entry: "./entry.ts",
    run: "./run.ts",
    test: true, // [!code hl]
  },
});
```

It is off by default, as on `frontend` and `backend`.

## Where tests go

Every `*.test.ts` file in the folder is loaded, at any depth:

```txt
src/mailer/
├── entry.ts
├── run.ts
├── service.test.ts       -> tests the service
└── smtp/
    ├── parser.ts
    └── parser.test.ts    -> tests the parser
```

That differs from frontend and backend,
where tests are named `index.test.ts` and sit beside each route.
A sidecar has no routes to follow, so any name works.

Nothing is seeded.
A sidecar has no routes to put a starter test beside, so the files are yours to write.

## Testing the service

Tests run in Node, with the sidecar's [env files](/essentials/env-files) loaded.
There is no harness: the entry is an ordinary module, so a test starts it the way the runner does,
and stops it the same way:

```ts [src/mailer/service.test.ts]
import { afterAll, beforeAll, expect, test } from "vitest";

import service from "./entry";

let close: () => Promise<void>;

beforeAll(async () => {
  close = await service.start();
});

afterAll(async () => {
  await service.teardown?.();
  await close();
});

test("accepts a message", async () => {
  // talk to the running service here
});
```

Calling `teardown()` and the close function in `afterAll` matters as much as it does in the runner:
a port or a connection left open keeps the next run waiting on it.

## Running them

Each sidecar is a Vitest project of its own, named `<folder>:sidecar`,
next to the `<folder>:api` and `<folder>:pages` projects of the folders that serve HTTP.
Run one with Vitest's `--project`:

```sh
pnpm test --project mailer:sidecar
```

Path filters work too: `pnpm test mailer` runs everything under `src/mailer/`.

## The test option

`test` takes `true`, or an object to give the tests Vite settings of their own:

```ts
test: {
  // Custom Vite settings to use specifically for testing
  viteConfig: {
    // ...
  },
},
```

They are merged over the sidecar's own `viteConfig`.
