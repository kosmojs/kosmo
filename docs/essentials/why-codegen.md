---
title: Why Codegen
description: Two very different things share the word "codegen". KosmoJS only does the safe kind -
    derivation into a git-ignored lib/ folder, plus boilerplate seeded into blank files and never touched again.
head:
  - - meta
    - name: keywords
      content: code generation, codegen, scaffolding, derivation, derived artifacts,
        single source of truth, generated code, drift, build artifacts, kosmojs lib directory
---

For many of us, "codegen" is a good reason to close the tab. Most code generation earned that.
But two very different things share that one word.

## First, What Is What

**Consider a tool that writes a file, lets you edit it, then overwrites your edit.**

A perfect example of a "codegen" imperfection - the dark side.

Rails scaffolds, SOAP/WSDL stubs, Interface Builder, checked-in protoc output, Swagger client generators -
the story is always the same: you edited the output, something regenerated it, your work vanished.
So you stopped regenerating, and maintained a second source of truth by hand forever.

Call that **scaffolding** - written once, becomes yours, drifts.

**Now consider another tool. It reads your code and derives things you never edit.**

A perfect example of a compiler at work - the light side.

- `tsc` turns your TypeScript into JavaScript
- The JSX transform turns `<div/>` into function calls
- Vite turns your modules into a bundle
- Prisma turns a schema into a typed client

Nobody calls these a smell, and nobody edits their output.

Call that **derivation** - recomputed from a single input, never edited, disposable.

## What KosmoJS Does

### It derives

Your routes are the input.
Routing trees, typed fetch clients, validation schemas, the OpenAPI spec - all output, all landing in `lib/`, which is git-ignored.
Not a second copy of your code; a derivative of it.

Vite and friends do the same thing and hide the result in `node_modules`.
KosmoJS keeps it in `lib/` deliberately: when something looks wrong,
the derived code is right there in your editor, readable, with your own route names on it.

### It seeds

A newly created route file gets its boilerplate, so you are not bootstrapping every route by hand.

> Only blank files are seeded.
> The moment a file has content - boilerplate or your own edit - it is never touched again.
> Not by a re-seed, not by a template change, not by a version bump.

And if the boilerplate isn't what you want, adapt it or switch it off entirely - see
[backend](/backend/custom-templates) and [frontend](/frontend/custom-templates) templates.

### That's All

It doesn't scaffold in user space. It reads your routes, wires them into the native routers,
and derives assets you can import where you find them useful.

KosmoJS owns the `lib/` folder, you own `src/` and everything else.

---

The objection to codegen is really an objection to scaffolding.
Derivation is just compilation, and you already trust several layers of it.

Every project has derived artifacts. The only question is whether a machine derives them on every build,
or a person derives them by hand on a schedule they will eventually forget.
