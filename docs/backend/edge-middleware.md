---
title: Edge Middleware
description: The first middleware a matched route runs - any use() entry under an edge-prefixed slot,
    at any level, ahead of validation, so authentication answers 401 before a schema can answer 400.
head:
  - - meta
    - name: keywords
      content: edge middleware, api/app.ts, hono middleware, h3 middleware, koa middleware,
        auth before validation, 401 vs 400, edge slot, route edge, app middleware
---

Edge middleware is the first thing a matched route runs - ahead of validation,
ahead of your global, cascading and route middleware.

```
app middleware          <- api/app.ts, every request, matched or not
  edge middleware       <- slot: "edge:*", first in the route's chain
    validation          <- params, query, headers, cookies, body
      global middleware <- api/use.ts
        cascading use.ts
          route use()
            handler
```

::: tip The route's edge
Edge middleware sits at the *route* edge: it goes first once a route has matched, and nothing reaches it otherwise.
[App middleware](/backend/middleware#app-middleware) in `api/app.ts` is what sits at the request edge - it sees every request, matched or not.
:::

## Why It Exists

Validation runs before your middleware - global, cascading and route alike.
Usually that is what you want: your middleware gets a request already known to be well-formed.

For authentication it is exactly wrong.
An expired token on a request that also has a malformed body produces a `400 ValidationError`,
and the caller goes hunting through their payload for a problem that isn't there.
They should have got a `401`.

**Solution: make your auth middleware run before validation by using an `edge:` prefixed slot:**

```ts [api/use.ts]
import { HTTPError } from "@kosmojs/core/errors";

import { use } from "_/api";

export default [
  use(async (ctx, next) => {
    const token = ctx.req.header("authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new HTTPError([401, "Authentication required"]);
    }
    return next();
  }, {
    slot: "edge:auth", // [!code hl]
  }),
];
```

Now an unauthenticated request is rejected before a single schema is consulted.

It is still your middleware, written with `use()` like any other - only its position changes.
It isn't only for auth. Use it for anything that must run before validation - a logger, a rate limiter, a tenant lookup.

Declare it globally in `api/use.ts` and it covers every route.
Declare it in a [cascading&nbsp;use.ts](/backend/cascading-middleware) and it covers a subtree.
Declare it in a route and it runs for that route only.

## Specifics

**Empty `ctx.validated.*`** Validation hasn't run, so nothing has been checked yet.
Use [metaparser](/backend/context#unified-metaparser) / [bodyparser](/backend/context#unified-bodyparser) instead.
They contain normalized data, exactly as the validation routines see it.
Or rely on raw data directly from the framework.

**It is still per route.** Running first doesn't make it [app&nbsp;middleware](/backend/middleware#app-middleware):
a request matching no route never reaches it, and neither do preflights or `405`s.

**It composes.** Because it is a slot, a declaration further down replaces one from above under the
[usual&nbsp;rules](/backend/middleware#slot-composition), keeping the same position -
and a route can declare an `edge:` slot of its own with nothing above it to replace:

```ts [api/webhooks/stripe/index.ts]
export default defineRoute<"webhooks/stripe">(({ POST, use }) => [
  use(async (ctx, next) => {
    // this endpoint authenticates by signature, not by bearer token
    await verifyStripeSignature(ctx);
    return next();
  }, {
    slot: "edge:auth", // [!code hl]
  }),

  POST(async (ctx) => { /* ... */ }),
]);
```

The same works a level up: one `edge:auth` entry in `api/public/use.ts` replaces the global
check for everything in that subtree.

## Name Your Slots

Every `edge:` prefixed name is reserved, so none of them needs a `UseSlots` declaration in `api/env.d.ts`.
Typos are still caught: `edge-auth` is not a slot - and neither is bare `edge` yours to take, per the warning below.

Pick a name per concern and you get as many edge middlewares as you like -
declared here in `api/use.ts`, but any level works:

```ts [api/use.ts]
export default [
  use(rateLimit, { slot: "edge:ratelimit" }), // [!code hl]
  use(authenticate, { slot: "edge:auth" }), // [!code hl]
];
```

They run at the edge in the order declared, and each is its own slot -
so a route can substitute one and leave the others in place.
The Stripe webhook above replaces `edge:auth` with signature verification while `edge:ratelimit` keeps applying to it.

::: warning `edge` itself is reserved - always prefix
The bare `edge` slot is not a spare name. It holds the built-in middleware that extends the context,
and claiming it replaces that: no `ctx.metaparser`, no `ctx.bodyparser`, no `ctx.validated`,
and every validator, middleware and handler downstream that expects them breaks at once.

Name yours `edge:auth`, `edge:ratelimit`, anything prefixed.
Override `edge` only if replacing context extension is exactly what you mean to do,
and you know what has to go back in its place.
:::

## So, Where Do I Add My Auth?

Depends on whether any route needs to opt out.

**Every route authenticates the same way** - put it in `api/app.ts` as [app&nbsp;middleware](/backend/middleware#app-middleware).
It is the simpler setup: one middleware, no slots, nothing downstream can replace it by accident.
It also covers what a route chain never sees - unmatched URLs, preflights, `405`s.

**Some routes authenticate differently** - a webhook verifying a signature, a public health check,
an endpoint behind its own token - use an `edge:` slot, in `api/use.ts` or wherever the check belongs.
You keep the 401-before-400 ordering, and any route or subtree can substitute its own check.

::: warning They don't stack
A route claiming `edge:auth` replaces the `edge:auth` entry from `api/use.ts` -
it does **not** replace anything in `api/app.ts`.
If you put the base check in `api/app.ts` and add a route-level `edge:auth` override, they both run
and the route authenticates twice, by two different rules.
Pick either one.
:::

If you're unsure, start in `api/app.ts`. Moving it to the slot later is mostly mechanical - the same handler, wrapped in `use()`.
Moving the other way is not: every route-level `edge:*` override stops overriding anything and starts running in addition.
