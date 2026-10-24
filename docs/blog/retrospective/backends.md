---
title: Three backends, one route spec
sidebarTitle: Backends
date: 2026-10-24
description: >-
    Hono, H3 and Koa all work in KosmoJS.
    They share no context, no response shape and no error model, and that's on purpose.
    How "support" slowly came to mean something narrower and more useful.
head:
  - - meta
    - name: keywords
      content: kosmojs backends, backend routes, hono, h3, koa
tags: retrospective, backend, api
---

KosmoJS supports three backends: Hono, H3 and Koa.

Read that twice and it sounds like a boast.
Read it carefully and the interesting question is: what does "support" mean?

It doesn't mean a common abstraction over all three.
It doesn't mean handlers look alike.
It doesn't mean one shared context object.

It means something narrower. **The route spec is identical.**
Same URL, same methods, same middleware contract, same validation, same fetch client.
Everything about the *route* is the same. Everything about the *handler* belongs to the framework.

That sentence took a year and four steps to become true.

## Step 0: Koa was the framework

The first version didn't support Koa. It *was* Koa.

The generator was called `api-generator`, and what it generated was a Koa app.
`ctx.body = ...` to answer. `ctx.state` for state. Errors bubbled through `await next()`.

Nothing wrong with that, if you like Koa.
Everyone else was out of luck, and I didn't notice, because I liked Koa.

The route spec had quietly outgrown its host.
`defineRoute` only worked because Koa was the only backend it had ever met.
Early 2026, people started asking for Hono.
Fair question. Awkward answer.

## Step 1: the move nobody saw

January 21. I split the API package.

`api-generator` became `koa-generator`.
One renamed folder, one big admission:
Koa was no longer *the* generator. It was *a* generator.

Everything that depended on Koa moved out.
The middleware chain, the context, the error model: all backend business.
What stayed was the part that had nothing to do with any backend: the route spec,
the validation, the fetch clients.

No new feature landed. Nobody noticed. The changelog looked bored.

But that split was the precondition for everything after it.
The same week, the CLI moved into `create-kosmo`.

Three changes that only look like one decision in hindsight:
stop assuming one stack, anywhere.

## Step 2: Hono, and the thing I got wrong

March 5. Hono shipped.

The route spec didn't change. The new generator just plugged in.
It was the proof the January split had worked.

Then I tried to make Hono feel like Koa.

It went badly, in the way things go badly when you try to translate poetry.
Hono returns `ctx.json(...)`. Koa assigns `ctx.body`.
Hono has `app.onError()`, and `await next()` never throws.
Koa throws through `await next()`, and the error handler is a `try`/`catch`.

Those aren't implementation details.
They are each framework's opinion about what a handler *is*.
Smoothing them over would have meant inventing a fourth model:
some KosmoJS-flavored Hono that no Hono developer would recognize.

So I stopped. Hono kept its idioms.
KosmoJS kept only what was true for every backend.

## Step 3: where "works" turned into "is the same"

Hono "worked" in March. That's the dangerous kind of working.

In August I went hunting for the cases where it didn't match Koa.
There were not many. They were all small.

* A route with `GET` but no `DELETE` should answer `DELETE` with a `405`. Some backends answered `404`.
* `HEAD` should fall back to `GET`, validated by the same schemas.
* A `404` with an error body shouldn't fail response validation because it doesn't look like the `200` schema.

Tiny. Each one had to be built three times, once per backend.
That's the unglamorous truth about parity.
It isn't one big idea. It's a pile of edge cases, each one implemented in three places.

The app factory got an overhaul too.
`api/app.ts` now hands you the *native* instance, Hono's `app`, H3's `app`, Koa's `app`,
wired with each framework's own error handling.
Same handler shape, different wiring, because the frameworks wire differently.

## Step 4: H3, the easy one

August 20. H3 joined.

It was the easiest of the three to add. Not because H3 is simple.
Because by then the contract was real, and H3's differences just slotted in.

~~~ts
// Hono: return a Response
GET(async (ctx) => {
  const user = await db.users.find(ctx.validated.params.id);
  return ctx.json(user);
}),

// H3: return the value
GET(async (event) => {
  const user = await db.users.find(event.validated.params.id);
  return user;
}),

// Koa: mutate the context
GET(async (ctx) => {
  const user = await db.users.find(ctx.validated.params.id);
  ctx.body = user;
}),
~~~

Three ways to say "here's the user".
One route spec, one validation contract, one middleware model, one fetch client.

H3 didn't teach the framework anything about H3.
It taught it that returning a value and mutating a context are both legitimate,
and neither one needs fixing.

## What it costs

There's a bill, and I'd rather show it.

Move from a Hono folder to an H3 folder and every handler body changes.
`ctx.json(user)` becomes `return user`. `ctx.get("user")` becomes `event.context.user`.
That's real friction, and there's no way around it that doesn't undo the design.

The alternative is a unified context, the one every backend-agnostic framework ends up with.
It's no framework's context, so every handler looks like a hybrid of all three
and gets the full power of none.

I'd rather pay the friction.
In a Hono folder you write Hono, with Hono's whole ecosystem.
In an H3 folder you write H3.

It's the same rule that governs layouts:
**the folder owns the boundary, the framework owns the idiom.**
