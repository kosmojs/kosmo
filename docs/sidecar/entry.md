---
title: Entry and runner
description: The two files a sidecar is made of - defineService for the service itself, and the
    runner that supervises it in production.
head:
  - - meta
    - name: keywords
      content: defineService, sidecar entry, sidecar runner, start, teardown, close function,
        SIGINT, SIGTERM, graceful shutdown
---

A sidecar is two files, both seeded via [sidecar](/cli/sidecar) command and both yours to edit.

The **entry** is the service itself - what to start, and how to stop it.
The **runner** is the process around it - which signals to catch, whether to drain before exit.
Only the entry is used in development; `kosmo serve` supervises it in place of the runner.

## The entry

The entry default-exports a service built with `defineService`:

```ts [src/mailer/entry.ts]
import { defineService } from "_/sidecar";

export default defineService({
  async start() {
    const server = await listen();
    // return a close function - the dev server calls it before reloading
    return async () => {
      await server.close();
    };
  },
  async teardown() {
    // close outbound connections, if any - called before the close function
    await db.end();
  },
});
```

`start` is called once and returns the function that stops whatever it started.
`teardown` is optional, for outbound connections a restart should not leak.

## The runner

The runner imports the entry and decides what happens around it.
The seeded one does the least that is still correct - start, and stop on a signal:

```ts [src/mailer/run.ts]
import service from "./entry";

const close = await service.start();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await service.teardown?.();
    await close();
    process.exit(0);
  });
}
```

Replace it with whatever your deployment wants - restart on failure, a health port,
draining in-flight work before exit. It is an ordinary module in your source folder,
so it typechecks with the rest and reaches `~/` and `@/` as usual.

> The runner is not used in development.
`kosmo serve` imports the entry itself, so anything you put here runs only from `dist/`.
