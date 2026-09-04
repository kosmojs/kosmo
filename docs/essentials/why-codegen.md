---
title: Why Codegen
description: Code generation has a bad reputation earned by a different kind of code generation.
    The distinction between scaffolding and derivation, why KosmoJS only does the safe kind,
    and what it honestly costs.
head:
  - - meta
    - name: keywords
      content: code generation, codegen, scaffolding, derived artifacts, single source of truth,
        generated code, drift, typebox, type safety, build artifacts, kosmojs lib directory
---

"It generates code" is, for a lot of experienced developers, a reason to close the tab.
That reaction is earned. It is also aimed at something KosmoJS doesn't do.

This page is the long answer, because the short one - "it's fine, trust us" - deserves the scepticism it gets.

## Two Different Things Share One Word

Almost every bad codegen experience is the same experience:

> A tool generated files. You edited them.
Later, something regenerated those files and your edits vanished - so you stopped regenerating.
From then on the generated code and its input drifted apart, and you maintained the output by hand forever.

Rails scaffolds, SOAP/WSDL stubs, Interface Builder, checked-in protoc output, Swagger client generators.
The specific damage is always the same: **the generator handed you a second source of truth and then walked away.**

Call that **scaffolding** - generated *once*, becomes yours, drifts.

Now consider the other kind:

- `tsc` turns your TypeScript into JavaScript.
- The JSX transform turns `<div/>` into function calls.
- Vite turns your modules into a bundle.
- Prisma turns a schema into a typed client.

Nobody calls these a smell, and nobody edits their output.

Call that **derivation** - recomputed from a single input, never edited, disposable.

The objection to codegen is really an objection to **scaffolding**.

**Derivation** is just compilation, and you already trust several layers of it.

Every project has derived artifacts. The only question is whether a machine derives them automatically,
or a person derives them by hand on a schedule they will eventually forget.

Manual maintenance is code generation performed by a human, unreliably.

## What KosmoJS Actually Generates

Two categories, and the difference matters more than anything else on this page.

### Derivation - `lib/`, never yours

| Artifact | Derived from |
|---|---|
| Runtime validators (TypeBox) | your `TypeScript` types |
| Typed fetch clients + `ResponseT` | the same route definitions |
| OpenAPI 3.1 spec | the same route definitions |
| Route tables for the native router | your `pages/` directory |
| `RouteMap` (param + cascading-context types) | your `api/` directory and `use.ts` files |

`lib/` is git-ignored - it holds build artifacts, not source.
The only tracked files are `cache.json` and small shared `types.ts` files
(so a fresh clone or CI run doesn't pay for a full rebuild).

### Seeding - `src/`, yours the moment you touch it

The route and page boilerplate written when you create a file is seeding, not scaffolding.
A **strict** rule keeps it from becoming the bad kind:

::: tip Seeded boilerplate is written only into blank files
Boilerplate is written into a file **only when that file is empty**.
The moment you type into it, it is yours - permanently.
No re-seeding, no template change, no version bump can ever rewrite it.
:::

The whole point of this seeding is to save you from bootstrapping every route by hand.

## The Five Things That Made Codegen Toxic

Checked against what KosmoJS does:

| The old failure | Why it doesn't happen here |
|---|---|
| **Generated files are source you must edit** | You never edit `lib/`. `src/` boilerplate is written only into blank files, so you do not have to manually bootstrap every route. |
| **The input is a second artifact** (a `.proto`, a WSDL, an OpenAPI YAML) | The input is `TypeScript` types you were writing anyway. No schema language, nothing extra to maintain. |
| **Output is an unreadable black box** | Plain, framework-native code: ordinary React Router / Solid Router route objects, a plain `RouteMap` type, standard TypeBox validators. |
| **It's a manual step someone forgets** | **There is no generation step to remember**. The dev server regenerates as you work, and the production build regenerates deterministically - so there is nothing to run by hand, and nothing to forget. |
| **It's lock-in** | Nothing proprietary is emitted. What you'd carry away is normal Hono/H3/Koa and React/Vue/Solid/Svelte code. |

## The Short Version

KosmoJS generates code the way a compiler does: from one source, into a directory you never edit.

And it seeds only empty files - so nothing it writes can ever overwrite something you wrote.
