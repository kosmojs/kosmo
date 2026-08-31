---
title: Production Preview
description: Run the real KosmoJS production build locally with kosmo preview -
    server-rendered pages, bundled assets and production validation policy, still reloading on change.
head:
  - - meta
    - name: keywords
      content: kosmo preview, production preview, vite preview, ssr preview,
        previewPort, production build locally, hot reload, dist/run.js
---

The dev server is fast: `HMR`, client-side rendering. Most of the time that is what you want.

Sometimes it is not. Server-rendered markup, a bundling or tree-shaking problem,
asset hashing, the production validation policy - none of these exist until you build,
and none of them are visible from the dev server.

`preview` builds the project and runs
[`dist/run.js`](/dev-build-run/building-for-production#one-entry-point-for-the-whole-project) -
the same entry point production starts.

```sh
pnpm preview          # all source folders
pnpm preview front    # specific folder
```

Then it watches your sources, and on change it rebuilds. Production output, development loop.

Default port is `4558`, configured as `previewPort` in `package.json`.
It is deliberately separate from `devPort`, so preview and the dev server can run side
by side and you can compare the two in adjacent tabs.

## What You Are Actually Looking At

Everything comes from `dist/`. Nothing is transformed on the fly:

- **`SSR` folders** render on the server, so you see real server-rendered markup
and can watch hydration happen.
- **`CSR` folders** are served as built static assets - hashed filenames, real
chunk splitting, the `index.html` a static host would serve.
- **`API` folders** answer from the bundled backend,
with [response validation off](/validation/response#development-vs-production) unless you
asked for it per handler - the production policy, not the dev one.

If a page works in preview, it works when deployed. That is the whole point of the command:
the gap between "works locally" and "works in production" is where `SSR` bugs live.

## Hot Reload, Not HMR

A change triggers a full rebuild. There is no module patching and no preserved state.

This is not a missing feature. `HMR` works by replacing modules in a running graph,
which is exactly what a production bundle does not have.
Preview's contract is that the page in the browser is the page production serves;
patching it in place would break that contract, and a preview you cannot trust is worse than no preview.

A rebuild is a full production build, so expect seconds rather than the milliseconds of `HMR`.

Use the dev server for iteration and preview to verify.

::: tip
A failed rebuild leaves the previous build serving. The error is printed to the
terminal and the page keeps working, so a typo mid-edit does not take the
preview down.
:::

## When to Reach for It

- Checking server-rendered output, or debugging a hydration mismatch
- Confirming something works after bundling - dynamic imports, tree-shaking, anything that behaves differently unbundled
- Verifying assets, `base` paths and deep links resolve when the app is not at the root
- Sanity-checking a multi-folder layout end to end, since preview dispatches across folders exactly as `dist/run.js` will in production
- Reproducing a bug that only appears in a deployed build

For everyday work, keep using [`pnpm dev`](/dev-build-run/development-workflow).
Preview is the check before you ship.
