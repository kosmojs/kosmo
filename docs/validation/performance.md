---
title: About Performance
description: Understand KosmoJS validation performance - syntactic type discovery with oxc,
    build-time evaluation with TypeBox, per-route caching keyed by every file a route's types reach.
head:
  - - meta
    - name: keywords
      content: validation performance, type analysis, caching, derivation time,
        oxc, typebox, dependency graph, background processing
---

Schema derivation reads your types from the source: [oxc](https://oxc.rs) parses the route,
follows its imports - through re-exports and aliases, to every file the validation types reach -
and [TypeBox](https://github.com/sinclairzx81/typebox) evaluates the collected types to JSON Schema.
Nothing is type checked, which keeps derivation fast and runs it in the background,
alongside the Vite dev server.

Only the declarations the validation types need are read; the rest of a file is never looked at.
The files they reach form the route's dependency graph, cached with the route:
a schema is recomputed when the route file, or any file in that graph, changes -
an edit two imports away rebuilds the route as reliably as an edit to the route itself.

By the time you've saved a file and switched to the browser, the schema is ready.

## When It Becomes Noticeable

Full rebuilds happen in a few specific situations:

- Deleting the `var/lib/` folder manually
- KosmoJS releasing an update that bumps the cache version

A full rebuild re-derives every route, so it takes noticeably longer than an incremental one
on a large project. It is the same category of thing as clearing `node_modules`
or regenerating a Prisma client - infrequent and expected, not part of the normal edit-test cycle.

## Machine Time vs Human Time

Zod, Yup etc. have zero derivation overhead - because you write the schemas yourself.
That eliminates derivation time but adds an ongoing maintenance cost.

KosmoJS trades a little machine time for eliminating that manual work entirely.
For most workflows, that's a good deal.
