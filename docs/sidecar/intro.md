---
title: Sidecars
description: A source folder that builds a standalone process instead of serving routes -
    background workers, queue consumers, listeners.
head:
  - - meta
    - name: keywords
      content: sidecar, background worker, queue consumer, cron job, smtp listener, non-http
        process, kosmo sidecar, worker process, sidecar folder
---

Every backend eventually grows something that is not a request handler - a queue consumer,
a mail sender, a cron runner, a listener speaking a protocol that is not HTTP.

A **sidecar** is a source folder for exactly that: it declares an entry point to build,
and nothing else. No `base`, no routes, no `pages/` or `api/` tree.

```txt
src/
├── front/                React + Hono, base "/"
├── mailer/               sidecar - no pages/ no api/
│   └── entry.ts
└── smtp/                 another one - one process per folder
    └── entry.ts
```

It is still a source folder, so everything that follows from that still holds: `~/` points at it,
`@/` reaches shared code, its `tsconfig.json` covers it, and `pnpm build` builds it on its own.

---

### Adding a Sidecar Folder

There is a [sidecar](/cli/sidecar) command that seeds necessary files and wires everything together:

```sh
pnpm sidecar mailer
```

What you get:

```txt
src/mailer/
├── kosmo.config.ts       -> the sidecar block
├── tsconfig.json         -> extends ../../lib/mailer/tsconfig.json
├── entry.ts              -> defineService({ start, teardown })
└── run.ts                -> imports the entry, starts it, stops it on a signal
```

---

### Keep it in its own folder

Nothing stops you defining `sidecar` next to `frontend`/`backend` in the same folder.
It works. But you cannot serve, typecheck, build or deploy them separately:

- `pnpm build front` rebuilds the web app to ship a one-line worker change, and a broken worker fails the build that your site was waiting on
- `typecheck` is a folder-level switch, so you cannot exempt a third-party worker entry without exempting your routes with it
- the web app and the worker scale and restart on different schedules, yet ship as one artifact

A separate folder costs a `kosmo.config.ts` and gives you back `pnpm build mailer`,
`pnpm typecheck mailer`, and a `dist/mailer/` you can deploy on its own.
