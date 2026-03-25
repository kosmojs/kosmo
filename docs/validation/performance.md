---
title: Validation Performance
description: Understand KosmoJS validation performance with TypeScript compiler analysis,
    intelligent caching, and background processing that doesn't impact development workflow.
head:
  - - meta
    - name: keywords
      content: validation performance, type analysis, caching, generation time,
        typescript compiler, background processing, ts-morph, tfusion
---

Schema generation uses TypeScript's compiler API to trace your types - including all referenced files -
and build a complete dependency graph. This is what makes pure-TypeScript validation possible,
with a brief generation step as the tradeoff.

Generation time scales with type complexity. Simple routes are near-instant;
routes with deep hierarchies and many dependencies may take a few seconds.
In practice this rarely affects you - generation runs in parallel with the Vite dev server,
and results are cached per file. Schemas only regenerate when the route file or one of its type dependencies changes.

By the time you've saved a file and switched to the browser, the schema is ready.

## 🔄 When It Becomes Noticeable

Full rebuilds happen in a few specific situations:

- Deleting the `lib` folder manually
- `KosmoJS` releasing an update that bumps the cache version

For large projects with many routes, a full rebuild can take several minutes.
This is the same category of thing as clearing `node_modules` or regenerating a Prisma client -
infrequent and expected, not part of the normal edit-test cycle.

## ⚖️ Machine Time vs Human Time

Zod, Yup etc. have zero generation overhead - because you write the schemas yourself.
That eliminates generation time but adds an ongoing maintenance cost.

`KosmoJS` trades a few seconds of machine time for eliminating that manual work entirely.
For most workflows, that's a good deal.

As the `TypeScript` ecosystem evolves - particularly native implementations that
[ts-morph](https://ts-morph.com/) and [TFusion](https://github.com/sleewoo/tfusion) may leverage -
generation performance will likely improve further.
