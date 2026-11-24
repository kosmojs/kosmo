---
title: Sidecars
description: >-
    A standalone process built from a source folder - background workers, queue consumers, listeners -
    beside a web app in the same folder, or in a folder of its own.
head:
  - - meta
    - name: keywords
      content: sidecar, background worker, queue consumer, cron job, smtp listener, non-http
        process, worker process, sidecar block, sidecar directory, kosmo folder
---

Every backend eventually grows something that is not a request handler - a queue consumer,
a mail sender, a cron runner, a listener speaking a protocol that is not HTTP.

A **sidecar** is that process.

It is a block of a source folder, just like `frontend` and `backend`.
And its files live in the folder's `sidecar/` directory,
the way pages live in `pages/` and API routes in `api/`:

```txt
src/
├── app/                  pages, API and a sidecar
│   ├── api/
│   ├── pages/
│   └── sidecar/
│       ├── entry.ts
│       └── run.ts
└── mailer/               a sidecar and nothing else
    └── sidecar/
        ├── entry.ts
        └── run.ts
```

A folder with a `sidecar` block and no `frontend` or `backend` is a sidecar alone:
no `base`, no routes, just the process.

Either way it is still a source folder, so everything that follows from that holds:
`~/` points at it, `@/` reaches shared code, its `tsconfig.json` covers it,
and `pnpm build` builds it.

---

### Adding a sidecar

Add the block to the folder's `kosmo.config.ts`:

```ts [src/app/kosmo.config.ts]
export default defineConfig({
  frontend: {
    // ...
  },
  backend: {
    // ...
  },
  sidecar: { // [!code ++:3]
    serve: false,
  },
});
```

On the next start, `sidecar/entry.ts` and `sidecar/run.ts` are seeded when missing,
just like `api/app.ts` for a backend or `entry/client.ts` for a frontend.
They are yours to edit from there:

```txt
src/mailer/
├── kosmo.config.ts       -> the sidecar block
├── tsconfig.json         -> extends ../../var/lib/mailer/tsconfig.json
└── sidecar/
    ├── entry.ts          -> defineService({ start, teardown })
    └── run.ts            -> imports the entry, starts it, stops it on a signal
```

For a new folder, [kosmo folder](/cli/folder) adds the block when given `--sidecar`,
or when you say yes in its dialog.

That is also the way to a sidecar on its own, in a folder with neither side:

```sh
pnpm folder --name mailer --sidecar
```

A folder has one sidecar. For a second process, give it a folder of its own.

---

### Beside a web app, or on its own

Both work, and the build keeps them apart either way.
A sidecar builds into `dist/<folder>/sidecar/`,
and runs as a [process of its own](/sidecar/production).

What a shared folder does share is everything set per folder:

- `pnpm build app` builds the web app and the sidecar together,
so a one-line worker change rebuilds the site,
and a broken worker fails the build the site was waiting on
- `typecheck` is a folder-level switch, so the sidecar is checked exactly when the routes are
- `pnpm typecheck app` and `pnpm test app` cover both, with no way to address just one

A folder of its own costs a `kosmo.config.ts`, and gives back `pnpm build mailer`,
`pnpm typecheck mailer`, and a `dist/mailer/` you can deploy on its own.

So a worker that belongs to the app, and ships and changes with it, fits in the app's folder.
A worker with a life of its own fits in a folder of its own.
