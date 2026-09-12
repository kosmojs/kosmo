---
title: kosmo typecheck
description: Typechecking each source folder against its own tsconfig, plus the opt-in
    project root run driven by an empty include.
head:
  - - meta
    - name: keywords
      content: kosmo typecheck, pnpm typecheck, tsc --noEmit, root tsconfig, include,
        path mappings, separate tsc runs
---

`typecheck` is the type safety the rest of KosmoJS leans on, run on demand.

```sh
pnpm typecheck         # every folder, plus the project root
pnpm typecheck admin   # just this folder
```

Nothing else typechecks for you. The dev server and the build both transpile, stripping types without checking them.

So a stale `defineRoute<"users/[id]">`, left behind after renaming `api/users/`,
is a compile error neither of them will mention - the bundle is emitted and the route 404s.

This is the command that catches it, in CI or before you commit.

:::details If you need it running before build

Add a `prebuild` script in `package.json`

```json [package.json]
{
  "scripts": {
    "prebuild": "pnpm typecheck"
  }
}
```
:::

## Under the hood

It runs `tsc --project <tsconfig> --noEmit` in sequence,
using the `typescript` version installed in the project: one run per selected source folder,
plus one for the project root.

Every selected tsconfig is checked, even after one of them fails. A failing
folder does not hide the state of the others, so one run tells you everything
there is to fix rather than the first thing.

The command exits `1` if any run reported errors, and `0` only when all of them
passed - so `pnpm typecheck` works as a CI gate without any extra wiring.

## Why separate runs

Each source folder has [its own tsconfig.json](/essentials/config#typescript-config) with its own path mappings,
because `_/` and `@/` mean different things in different folders.

A single `tsc` over the whole project would resolve them against the wrong one, so the folders are checked one at a time instead.

## The root run is opt-in

Plenty of projects keep code outside `src/` - scripts, shared packages, config.
That code is yours to describe, so the root `tsconfig.json` is seeded with an
empty `include` and the root run stays off until you fill it in:

```json [tsconfig.json]
{
  "extends": "./lib/tsconfig.json",
  "include": []
}
```

While `include` is empty, `typecheck` leaves the root alone.
That is not just a convenience - TypeScript refuses an empty `include` outright:

```txt
error TS18003: No inputs were found in config file 'tsconfig.json'.
```

So the `include` is checked first, and the root tsconfig is never handed to `tsc` while there is nothing in it to check.

A full run skips it quietly. A project with nothing outside `src/` is a normal
project, not a misconfigured one, and you did not ask for a root check.

List your own entries and the root is checked like any other run:

```json [tsconfig.json]
{
  "extends": "./lib/tsconfig.json",
  "include": ["scripts", "packages/shared"]
}
```

## Selective typechecking

Provide no arguments and every source folder is checked, and so is the project root.

```sh
# every folder, plus the root
pnpm typecheck
```

Provide one or more names and only those are checked, project root ignored. The names are folder names under `src/`.

```sh
# one folder, no root
pnpm typecheck admin
```

> If some name is not a folder in `src/` with a valid `kosmo.config.ts` the command stops before anything runs.

Provide **`.`** and only project root is checked, no source folders.

```sh
# the root, no folders
pnpm typecheck .
```

Provide **`.`** together with folder name(s) and you get the root checked along with provided names.

```sh
# the root and admin folder
pnpm typecheck . admin
```

> `pnpm typecheck .` on a project whose `include` is still empty warns that nothing was checked,
rather than passing silently as if it had been.
