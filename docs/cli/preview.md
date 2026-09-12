---
title: kosmo preview
description: Building and serving the production output on previewPort, rebuilt on change -
    the only way to see SSR, bundling and the production validation policy locally.
head:
  - - meta
    - name: keywords
      content: kosmo preview, pnpm preview, previewPort, production preview, SSR locally,
        dist/run.js, hot reload, hydration mismatch
---

`preview` is the dev loop run against production output.

The dev server never builds: it serves modules through Vite, client-rendered, with HMR.

That makes it fast, and it also means a whole class of things simply does not exist there -
server-rendered markup, hashed assets, chunk splitting, tree-shaking, the production validation policy.

None of them are visible until you build, which is the gap `preview` closes.

It builds the selected folders, runs [dist/run.js](/dev-build-run/building-for-production#one-entry-point-for-the-whole-project) -
the same entry point production starts - then watches your sources and rebuilds on change, restarting the runner.

```sh
pnpm preview         # every folder
pnpm preview front   # just this one
```

Listens on **`previewPort`** (default `4558`, configured in `package.json`).
That is deliberately not `devPort`: preview and the dev server run side by side,
so you can compare client-rendered and server-rendered output in adjacent tabs.

## Selecting folders

With no arguments, every source folder is built and served.
Name one or more to narrow the scope - the names are directory names under `src/`.

A name with no `src/<name>/kosmo.config.ts` stops the command before anything runs,
and a project with no folders at all reports `No source folders detected`.

Folders you leave out keep whatever is already in `distDir`, so the runner still serves them -
built earlier, and not rebuilt when their sources change.

## Rebuild, not HMR

A change triggers a full production rebuild, so expect seconds rather than the milliseconds of HMR.
There is no module patching and no preserved state, because a production bundle has no running module graph to patch -
and a preview you cannot trust is worse than none.

A failed rebuild leaves the previous build serving,
so a typo mid-edit prints an error to the terminal without taking the page down.

Iterate on the dev server; reach for `preview` to verify.

[Production&nbsp;preview&nbsp;›](/dev-build-run/production-preview)
