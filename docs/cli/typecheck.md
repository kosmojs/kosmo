---
title: kosmo typecheck
description: Typechecking each source folder against its own tsconfig,
    plus the project root run and what its include list decides.
head:
  - - meta
    - name: keywords
      content: kosmo typecheck, pnpm typecheck, tsc --noEmit, root tsconfig, include,
        path mappings, separate tsc runs
---

`typecheck` is the type safety the rest of KosmoJS leans on, run on demand.

```sh
pnpm typecheck          # every folder, plus the project root
pnpm typecheck admin    # just this folder
pnpm typecheck .        # project root only
pnpm typecheck . admin  # project root and admin
```

Typecheck is a manual run. The dev server and the build do not typecheck before transpiling.

So a stale `defineRoute<"users/[id]">`, left behind after renaming `api/users/`,
is a compile error neither of them will mention - the bundle is emitted and the route 404s.

This is the command that catches it, in CI or before you commit.

:::details If you need it running automatically before `pnpm build`

Add a `prebuild` script in `package.json`:

```json [package.json]
{
  "scripts": {
    "prebuild": "pnpm typecheck"
  }
}
```
:::

> By default the project root checks nothing of yours - [include](/essentials/config#typescript-config) code you want typechecked.

## Under the hood

It runs `tsc --project <tsconfig> --noEmit` in sequence,
using the `typescript` version installed in the project: one run per selected source folder,
plus one for the project root.

Every selected tsconfig is checked, even after one of them fails. A failing
folder does not hide the state of the others, so one run tells you everything
there is to fix rather than the first thing.

The command exits `1` if any run reported errors, and `0` only when all of them
passed - so `pnpm typecheck` works as a CI gate without any extra wiring.

### Why separate runs

Each source folder has its own [tsconfig.json](/essentials/config#typescript-config) with its own path mappings.
A single `tsc` over the whole project would resolve them against the wrong one, so the folders are checked one at a time instead.

## Opting a folder out

A folder whose config carries `typecheck: false` is left out of every run.
Useful for a [sidecar](/dev-build-run/sidecar) wrapping third-party JavaScript,
or a folder mid-migration where a red `tsc` is noise rather than signal.

```ts [src/mailer/kosmo.config.ts]
defineConfig({
  // ...
  typecheck: false, // [!code hl]
})
```

Naming it explicitly does not force the issue - `pnpm typecheck mailer` reports
that the folder opts out and checks nothing.

The folder still builds and still runs; only typechecking skips it.

## Selective typechecking

Provide no arguments and every source folder is checked, along with the project root.

```sh
# every folder, plus the root
pnpm typecheck
```

Provide one or more names and only those are checked, project root ignored.

```sh
# one folder, no root
pnpm typecheck admin
```

> The command fails loudly if a name is not a folder in `src/` with a valid `kosmo.config.ts`.

Provide `.` and only project root is checked, no source folders.

```sh
# the root, no folders
pnpm typecheck .
```

Provide `.` with folder name(s) and you get the root checked along with the provided names.

```sh
# the root and admin folder
pnpm typecheck . admin
```

> By default the project root checks nothing of yours - [include](/essentials/config#typescript-config) code you want typechecked.
