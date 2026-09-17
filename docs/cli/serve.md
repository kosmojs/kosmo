---
title: kosmo serve
description: The development server - one process for the whole project, client modules
    through Vite with HMR, API routes hot-reloaded in the same process, on devPort.
head:
  - - meta
    - name: keywords
      content: kosmo serve, pnpm dev, dev server, devPort, HMR, hot reload,
        client-side rendering, port range
---

`serve` is the command you leave running while you work.

One process covers every selected folder, and both halves of each:

- client modules go through Vite, with HMR
- API routes run in the same process, hot-reloaded on change
- requests are dispatched between the two by the folder's `backend.base`
- [sidecar](/sidecar/intro) entries marked `serve` are watched, rebuilt and restarted

No second command to start, no proxy to configure.

```sh
pnpm dev               # every folder
pnpm dev admin front   # just these two
```

Listens on **`devPort`** (default `4556`, configured in `package.json`).

## Dev is always client-rendered

`serve` is Vite + HMR + client-side rendering, whether or not the folder has [SSR enabled](/frontend/server-side-render).

Server rendering happens in the production build, so there is no server-rendered markup to look at here.

This catches people out coming from Next, Nuxt or TanStack Start, where dev
mirrors production rendering. To see anything server-rendered, use [kosmo preview](/cli/preview).

## Selecting folders

With no arguments, every source folder is served.
Name one or more to narrow the scope - the names are directory names under `src/`.

A name with no `src/<name>/kosmo.config.ts` stops the command before anything runs,
and a project with no folders at all reports `No source folders detected`.

Narrowing changes what the one process serves: folders you left out are not mounted,
so their paths 404 on `devPort` rather than falling through.

## Ports

`devPort` is the only port you address.

Each folder's Vite server and HMR socket get their own, picked from a free range derived from `devPort` -
which is why the command insists on a `devPort` below `64000`, so that range still fits.

`devPort` is not negotiated.

If something else holds it, the dev server reports `Failed to start dev server on port 4556` and exits rather than moving,
so the URL you have open never silently changes under you.

[Development&nbsp;workflow&nbsp;›](/dev-build-run/development-workflow)
