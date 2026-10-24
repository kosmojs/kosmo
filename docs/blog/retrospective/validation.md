---
title: "Validation: TS at runtime"
sidebarTitle: Validation
date: 2026-10-22
description: You write a type. Then you write the same shape again in Zod.
    Then the client needs its own copy. Making the type the source took a
    search for a library that did not exist, and shaped more than validation.
head:
  - - meta
    - name: keywords
      content: kosmojs validation, typescript runtime validation, zod alternative,
        typescript schema duplication, typebox, tfusion, json schema from typescript,
        end-to-end validation, typed fetch clients
tags: retrospective, validation, type-safety, typescript
---

If you've shipped a TypeScript API, you've written the same shape three times.

A type for the request body. A Zod schema for runtime validation.
Another schema for the client, or the same one exported. Maybe a type generated
from that schema for the fetch client. OpenAPI somewhere.

Each is technically necessary. Each describes the same data.
Each has its own answer to "what's a valid email".

TypeScript types vanish at runtime. So the runtime needs the shape re-described
elsewhere. Which is where everything diverges.

Add a field. Update the schema. Update the client type. Update the docs.
Forget one, and nothing breaks until production.

## The question

There are a few ways people answer this. Write the check by hand.
Use Zod and derive the type from the schema. Generate from OpenAPI. tRPC.

Each works. None of them makes the *type* the source.
Zod inverts the direction: the schema becomes primary and the type falls out of it.
tRPC keeps the type primary but replaces standard REST with its procedure model.

The question I kept coming back to: why is the runtime schema in the middle at all?

There were many answers along the way. Corn cutters, each of them.
They solved a piece and left the rest. Generate the schema from the type.
Generate the type from the schema. Generate both from a spec.
Each one moved the duplication somewhere else, and left it there.

In the end, the answer was in plain sight the whole time:
**the TypeScript type is the schema**.

Why can't the type itself act as a **single source of truth** for everything else.

Turns out it can.

## Making it real

The goal was simple:
* read the type at build time
* produce a JSON Schema
* validate against it at runtime

The hunt took longer than expected.

I was a Zod user then. The obvious first move was ts-to-zod.
Generate Zod schemas from TypeScript types.
It worked for plain types. It did not work for types that referenced other types.
No resolution, no flattening, no dependency graph.
And Zod at the time was not compiled, so performance was already a separate concern.

The lesson: no library would resolve types for me.
Whatever came next, type resolution was my problem.

So the search changed shape. Find something that takes a type,
walks its full dependency graph, and returns one flat type with everything
resolved, at any depth.

Guess what. No such library existed.

And as any normal lunatic would, I built one. It took some months.
But in the end, [TFusion](https://github.com/sleewoo/tfusion/) takes a type
and returns the flat version, dependencies and all.

Then the next hunt: something that takes a type, turns it into a JSON Schema,
and validates against that schema at runtime.

Found TypeBox. Types to JSON Schema, cleanly.
But the part that made it the perfect fit was AOT schema compilation:
the validators are genuinely fast, and the error reporting is excellent.

What remained was boring. Generate the schemas at dev time and use them at runtime.

And then it worked. The type was real.

## What followed

Having types resolved, flattened, and accessible in the derived lib was a
delight to connect to fetch clients. Fully typed requests and responses.
Every route got a client whose types came from the same declaration.

A bit later, TypeBox turned out to run in the browser too.
So the same AOT compiled schemas went into the fetch clients.
Invalid payloads started failing before the network was touched -
saving traffic and giving users instant feedback.

Even later, the derived types turned out to be enough to generate accurate
[OpenAPI specs](/openapi/intro) for every route. For free.
JSON Schema is half of OpenAPI. The routes were the other half, and KosmoJS already had them.
