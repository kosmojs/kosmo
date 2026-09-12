---
title: kosmo build
description: The production build - what it emits per folder, how partial builds stay safe, and the manifest dist/run.js reads at startup.
head:
  - - meta
    - name: keywords
      content: kosmo build, pnpm build, production build, dist/run.js, kosmo.json manifest,
        partial rebuild, emptyOutDir, build cache, distDir
---

```sh
pnpm build         # every folder
pnpm build front   # just this one
```

The same build `preview` runs, minus the server and the watcher.
Output goes to the `distDir` set in `package.json` - `dist/` by default.

With no arguments, every source folder is built. Name one or more to narrow the scope -
the names are directory names under `src/`.

A name with no `src/<name>/kosmo.config.ts` stops the command before anything is written,
and a project with no folders at all reports `No source folders detected`.

## What one folder's build does

Each selected folder is built in full, in order:

1. **Resolve routes.** Every route file is read and its types resolved -
this is what produces the validation schemas and the fetch client signatures.
2. **Run each generator's build step**, in the [fixed order](/essentials/config#bringing-your-own-generator).
3. **Bundle the client**, if the folder has a `frontend` - into `dist/<folder>/client`,
with `base` set to the folder's `frontend.base` and a Vite manifest alongside it.
4. **Bundle the backend**, if the folder has a `backend` - into `dist/<folder>/api`, as ESM with sourcemaps.
Two entry points: `api/app.ts` and `api/server.ts`.
5. **Run each generator's post-build step.** This is where the SSR/SSG bundles produced, if either enabled.

Then the folder's manifest is written, and once every folder is done, `dist/run.js` is deployed.

[Details&nbsp;›](/dev-build-run/building-for-production#build-output)

## Partial builds

Building a subset leaves the other folders' output untouched, so `pnpm build app` never invalidates `admin`.

Within a folder, though, the build is not incremental:
the client and backend output directories are emptied before they are rewritten.
A folder is always rebuilt whole, never patched.

## The folder manifest

Each build writes `dist/<folder>/kosmo.json`, describing the folder in the terms `dist/run.js` needs to route to it:

```json [dist/front/kosmo.json]
{
  "name": "app",
  "frontend": { "base": "/" },
  "backend": { "base": "/api", "aliasPatterns": [] },
  "ssr": false
}
```

`frontend` and `backend` are present only when the folder has that half.

`dist/run.js` reads these at startup to discover which folders exist and what each one claims.
That indirection is what makes partial builds safe:
the runner holds no folder-specific data, so it is rewritten identically on every build,
and a folder built an hour ago is still served by a runner started after a one-folder rebuild.

[Details&nbsp;›](/dev-build-run/building-for-production#one-entry-point-for-the-whole-project)

## Notes

The Vite cache is keyed by command - `var/.vite/<folder>/build/` -
so building never invalidates the dev server's cache,
and `preview` shares the build's cache rather than warming a third one.

The build does not typecheck. `tsc` is a separate step - [kosmo typecheck](/cli/typecheck) -
so a type error does not stop a bundle from being emitted.

What you deploy depends on how each folder renders.
[Details&nbsp;›](/dev-build-run/building-for-production#what-to-deploy)
