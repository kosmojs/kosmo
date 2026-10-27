---
title: "Error handling: let handlers fail"
sidebarTitle: Error handling
date: 2026-10-25
description: >-
    A framework's job isn't to prevent failures, it's to give them one place to land.
    How KosmoJS's error model moved, one step at a time, away from the handler and toward the framework.
tags: retrospective, error-handling
---

Most error-handling advice is a list of ways to be scared.
Wrap this in try/catch. Check that for null. Catch it, log it, never let it escape.

KosmoJS takes the opposite position: **let handlers fail.**

A handler's job is to do the thing.
If the thing can't be done, the handler throws.
What the response looks like is not its problem.

That sounds simple. It took four versions to believe it.

And the surprise is that the story isn't about errors.
It's about where failures are allowed to happen, and who owns the response.
Errors were just where that question hurt first.

## Step 0: whatever Koa did

The first version inherited Koa's error model wholesale.

Errors bubbled through `await next()`.
The outermost middleware with a `try`/`catch` caught them.
If nobody wrote that middleware, the error went unhandled.

Koa's design was fine, for a Koa project.
But now Koa's error model was *the developer's* error model,
and the only way to change it was to write that outermost middleware yourself.

So everyone did. Every project grew its own `try`/`catch`, in a slightly different shape.
Different status codes. Different bodies. Different logging.

The one file that should have existed, a single place that sees every failure, didn't exist.

## Step 1: one file, one handler

`api/errors.ts` was meant to close that gap.

It's seeded when a source folder is created, and whatever it exports becomes the handler
for every failed request.
Customize it and every route in the folder follows.

The default is small. It knows a handful of failure shapes, turns each into a status and a message,
and negotiates the format: a `curl` gets text, a `fetch` gets JSON.

The file is *just a file*. A regular module, wired in at `api/app.ts`.
Edit it, extend it, replace it. The framework doesn't care what's inside.

That was the first small insight, and everything else sits on it:
**failure handling is the framework's concern, not the handler's.**
The handler's job is to succeed. If it can't, the failure goes to the file.

It also turned out to be the right level of customization.
Every folder has its own handler, because every folder has its own consumers.
A public API and an internal admin panel shouldn't answer a failure the same way.

## Step 2: failing without a passport

One central handler solved where failures *land*.
It didn't solve how a handler *throws* one.

Every backend had its own way:
Koa had `ctx.throw` and `ctx.assert`. Hono had `HTTPException`. H3 had its own `HTTPError`.

So a handler written for one backend didn't port to another,
and the central handler had to speak all three dialects.

The fix was a framework-neutral error, `HTTPError`, and its shorthand, a plain tuple:

~~~ts
if (!user) { throw [404, "User not found"] };
~~~

One line. No import. Works on every backend.

The tuple matters more than it looks. `throw new HTTPError([404, "..."])` works too,
but it need an import and it's way too long for the most common line in an API.

## Step 3: the handler that catches

Even with `api/errors.ts` as a central error handler,
remains the temptation to <span class="text-nowrap">catch inside handlers</span>.

Wrap the database call. Handle the empty result right there.
Return `ctx.json({ error: "Not found" }, 404)` on the spot, because it's faster than throwing.

~~~ts
// don't: invents a response, never reaches api/errors.ts
try {
  const user = await db.users.find(id);
  return ctx.json(user);
} catch (error) {
  return ctx.json({ error: "Not found" }, 404);
}

// do: throw, let api/errors.ts decide
const user = await db.users.find(id);
if (!user) { throw [404, "User not found"] };
return ctx.json(user);
~~~

The second version is shorter. It's also more honest:
the user wasn't found, which is not the same thing as the database failing.

The first one collapsed both into the same `404`, and invented a response shape no other endpoint has.

So the rule is: **catch only when you intend to recover.**
Retry a flaky upstream. Fall back to a cached value. Turn a third-party error into a meaningful one.
Everything else, throw.

The same goes for middleware, only harder.
A transaction wrapper that catches, rolls back and re-throws is doing it right.
A logger that catches, logs and returns has quietly swallowed the error for everything below it.

## Step 4: the client throws too

By August the server side was settled.
The client wasn't.

The fetch client used to return `T | undefined`. A failed call just resolved to nothing.
Failures were silent, and every caller had to remember to check.

So in August the client started to throw. The return type became `T`.
(The [fetch clients post](/blog/retrospective/fetch-clients) has that story.)

And that finished the symmetry.
The server throws into a central handler.
The client throws into a boundary, and the boundary is each framework's own:
`errorElement` in React Router, `<ErrorBoundary>` in Solid, `onErrorCaptured` in Vue,
`<svelte:boundary>` in Svelte, a Preact boundary in MDX.

KosmoJS ships no boundary component. The frameworks already have good ones.
What it ships is errors those boundaries can use.
`ValidationError` on the client is the same class as on the server,
with the same target and the same shape.
A boundary that checks `error instanceof ValidationError` works in both places.

## One more thing: failing quietly, out loud

A failed server render, say a fetch that throws or a component touching `window`,
falls back to a client-rendered shell.
That's recoverable, and silent on purpose.

But silence is only right if someone can still *hear* it somewhere else.
So the renderers have an `onError` hook that reports and does nothing else.
It can't change the response or stop the fallback.
It just ships the failure, with its URL, to Sentry or a log or a dashboard.

During static generation the same hook fires once per failed route,
then the build reports them together and exits non-zero.

The framework's job is to make failure observable.
Whether to fall back or abort is the context's call.
