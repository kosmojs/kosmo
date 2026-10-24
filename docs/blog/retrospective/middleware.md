---
title: "Middleware: step by step"
sidebarTitle: Middleware
date: 2026-10-21
description: Middleware in KosmoJS did not start with slots, cascading or edge.
    It started as all or nothing, and every step after it was a fix for one specific annoyance.
head:
  - - meta
    - name: keywords
      content: kosmojs middleware, cascading middleware, middleware slots,
        middleware ordering, edge middleware, hono middleware, h3 middleware, koa middleware,
        onion model middleware, route middleware
tags: retrospective, middleware, slots
---

Middleware is hard for a reason that rarely gets named.
A route is one specific thing. Middleware is about a group of routes.

That mismatch is structural. Being careful does not fix it.

So this is not a design document. It is how middleware in KosmoJS actually came together,
one annoyance at a time.

## Step 0: all or nothing

In the beginning there was only global middleware.
Add one and it runs for every route, no questions asked.
Add auth and it runs for all routes, with no way to opt out.

And no way to group routes either.
A route that wanted something specific had to wire it by hand.

By that time the body parser was still a middleware concern,
so every route was importing and wiring a JSON parser, or a form one, depending on the route:

~~~ts
// api/posts/index.ts
import bodyparser from "@kosmojs/api/bodyparser";

export default defineRoute(({ POST, use }) => [
  use(bodyparser.json()),
  POST(async (ctx) => { /* ... */ }),
]);
~~~

Nothing new here. It is the principle inherited from previous stacks,
and since everyone did it, it felt normal.

Until one day you say enough.
And start thinking how to add a global middleware in a way a route can replace it.

## Step 1: slots

That is where slots appeared. A slot is just a name.
Global middleware declares one, and a route using the same name takes its place.

Body parsers were still a thing at the time,
so the global JSON parser went into a `bodyparser` slot:

~~~ts
// api/use.ts
import bodyparser from "@kosmojs/api/bodyparser";

export default [
  use(bodyparser.json(), {
    slot: "bodyparser",
    on: ["POST", "PUT", "PATCH"],
  }),
];
~~~

A route that wanted a form body simply added a form parser with the same slot,
and it replaced the global one:

~~~ts
// api/upload/index.ts
export default defineRoute(({ POST, use }) => [
  use(bodyparser.form(), { slot: "bodyparser", on: ["POST"] }),
  POST(async (ctx) => { /* ... */ }),
]);
~~~

Everything around it kept running. Only the piece in that position changed.

All good, but replacing was still per route.
Forget to wire a slotted middleware in a route, and the global one quietly runs instead.

Which raises the next question.

## Step 2: cascading

How do I add middleware for a whole subtree? For `/crud/**/*`, not just `/crud`.

The answer was in sight the whole time.
Routes are already organized by folders, and the filesystem is already the perfect structure.
Why not let middleware cascade through it naturally?

Want a middleware running only for `/crud`? Add a `use.ts` file in `api/crud/`,
and it covers the whole subtree:

~~~ts
// api/crud/use.ts
import { use } from "_/api";

export default [
  use(async function requireAdmin(ctx, next) {
    ctx.assert(isAdmin(ctx), 403, "Admin access required");
    return next();
  }),
];
~~~

Every route under `api/crud/` gets it. Every subfolder too.
No imports, no wiring, no path matching. The folder is the group.

And a nested folder is a nested group, so the ordering falls out on its own:

~~~
api/use.ts                    -> global middleware, every route
  crud/
    use.ts                    -> auth for /crud and everything under it
      users/
        use.ts                -> whatever /crud/users needs additionally
          index.ts            -> the route
~~~

Parent middleware runs before child middleware, and a child cannot skip its parent.
That is the containment you expect from a file system, applied to middleware.

There is a bonus I did not think of at first: the default flipped.
A route under `api/crud/` is protected because of where it lives,
not because someone remembered to wire it.

That is the difference between a convenience and a guarantee.

Read more in the [cascading middleware](/backend/cascading-middleware) docs.

The first version shipped without type information, though.
The middleware added `user` to the context, and every route had to know that.
So every route imported the type, or redeclared it, or lied about it.

The fix came later. A `use.ts` can export a `UseT` type, even an empty one,
describing what its middleware adds to the context.
Inner files extend outer ones, and every route underneath picks up the merged type, no imports:

~~~ts
// api/crud/use.ts
export type UseT = {
  admin: { id: number };
};

// somewhere under /crud
export default defineRoute<"crud/dashboard">(({ GET }) => [
  GET(async (ctx) => {
    // typed, no import, no generic
    const { admin } = ctx.state;
  }),
]);
~~~

Without typed context, `use.ts` was a convenience. With it, `use.ts` is a contract.

### Cascading meets slots

The real elegance showed up when I started composing cascading middleware with slots.

That was a gorgeous moment.
I added a global auth for all routes. Then, without any config or path matching,
I disabled it for the `/download` subtree and used a different auth for `/webhooks`:

~~~ts
// api/use.ts
export default [
  use(requireSession, { slot: "auth" }),
];
~~~

~~~ts
// api/download/use.ts
export default [
  use((ctx, next) => next(), { slot: "auth" }),
];
~~~

~~~ts
// api/webhooks/use.ts
export default [
  use(verifySignature, { slot: "auth" }),
];
~~~

Again, this can be done in many ways, and it is not meant as an enlightenment these days.
I just like how two patterns started composing into an elegant solution at no effort.

## Step 3: edge

And all good, until one morning an agent started running e2e tests.

It expected certain routes to answer `401`, but they occasionally answered `400`.
What? How? Why only occasionally?

Quickly it became clear: not a bug, a feature.
Validation runs before middleware.

The request had an expired token and a bad body.
Validation looked at the body first and answered `400`.
Auth, the one that would have answered `401`, never got a turn.

So why did it take so long to notice?
Because for a long time, almost always, auth lived in app middleware,
which runs before anything is matched, regardless.

Only after I moved auth to the global middleware, to be able to replace it per route or subtree,
did it start running after validation.

The fix had to answer a new question:
how do I run something before everything else, and still keep it manageable?
Meaning: replaceable by a slot where needed.

That is where [edge middleware](/backend/edge-middleware) appeared.
A slot whose name starts with `edge:` moves to the front of the route's chain, before validation.
Same `use()`, same handler, nothing else to learn:

~~~ts
// api/use.ts
export default [
  use(requireSession, {
    slot: "edge:auth", // [!code hl]
  }),
];
~~~

Now an expired token gets `401`, whatever the body looks like.

It is still a slot, so everything from the previous steps keeps working.
The `/webhooks` subtree can replace `edge:auth` the same way it replaced `auth` before.

The full picture, from the outside in:

~~~
app middleware            api/app.ts, every request, matched or not
  edge middleware         slot "edge:*", first in the route's chain
    validation            params, query, headers, cookies, body
      global middleware   api/use.ts
        cascading use.ts
          route use()
            handler
~~~
