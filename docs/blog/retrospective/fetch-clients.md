---
title: "Fetch clients: typed, validated, isomorphic"
sidebarTitle: Fetch clients
date: 2026-10-23
description: A generated client that started as just types,
    and grew one bug at a time into one that validates like the server,
    runs anywhere, and fails loudly.
tags: retrospective, fetch-clients, isomorphic
---

The generated fetch client is the piece of KosmoJS most people notice first.
It is the one they use on every page.

It is also the piece that kept changing shape.
Not because I planned it that way, but because every version fixed the previous one,
and then showed what the fix had missed.

So here is the story, in the order it happened.

## At the start: just types

The client begins at the route. Given this:

~~~ts
// api/users/[id]/index.ts
export default defineRoute<"users/[id]", [number]>(({ GET }) => [
  GET<{
    query: { include?: string };
    response: [200, "json", User];
  }>(async (ctx) => { /* ... */ }),
]);
~~~

the generator derives a typed method: `GET([123], { query: { include: "posts" } })`.
Param types come from the params tuple, the query type from the query block,
and the return type from the response tuple.

Types flow from the route to the client, not the other way around.
No second definition, no schema to keep in sync.

That was there from the very beginning, and it felt like the whole job.
Autocompletion, a compile error when the route changes. Done, right?

Not quite.

## Then: validated

The first version was typed and nothing else.
It built the URL, made the request, and told you what to expect back.
Every schema stayed on the server.

So a call could be perfectly typed and still fail, because the server validated and the client did not.
You found out after the round trip. A round trip that was wasted from the start.

Then TypeBox turned out to run in the browser too,
as the [validation&nbsp;story](/blog/retrospective/validation) tells it.

The same compiled schemas that run on the server could ship with the client:

~~~ts
const useFetch = fetchClients["users/[id]"];

// throws ValidationError before the network is touched,
// "abc" fails the number refinement on `id`
await useFetch.GET(["abc"]);
~~~

Same `ValidationError` class as on the server, with the same shape.
Error handling on both sides can be the same code, because both catch the same thing.

Every client also exposes its schemas, so a form can validate with exactly what the server will use.
Not a close approximation. The same validators.

One adjustment came later.
Headers and cookies are filled in by the browser, not by the caller,
so the client validates only params, query and body.

Good. It worked beautifully in the browser.

And then I started rendering on the server.

## Then: the server

Server-side rendering has a specific shape:
a loader runs before the page renders, fetches data, and the data flows into the render.

With the client as it was, that fetch went over HTTP.
A real round trip, through a socket, to an API somewhere.
Every SSR page paying for data the server was already holding.

The obvious answer is two clients: one for the browser, one that calls the handler directly.
Which produces drift immediately, since two clients means two places to fix,
and one of them always lags.

The better answer was a small shift in thinking.
The client is a function that takes a `Request` and returns a `Response`.
*Where* that pair crosses the wire is not a property of the client. It is a transport.

~~~ts
// the same call in the browser and during SSR
const user = await GET([123]);
~~~

In the browser, the transport is the network.
During a render, it is a direct dispatch into the API app bundled with the SSR build.
A real `Request` goes in, the full chain runs, routing, middleware, validation, handler,
and a real `Response` comes back. No socket, no hop.

The boundary is real. The cost of crossing it is not.

A few things followed naturally:

* Cookies and `authorization` from the page request ride along, so an authenticated page
renders authenticated data.

* Client-side validation is skipped during SSR, since it only exists to save a round trip
and there is no round trip to save.

* And the request is not repeated in the browser: hydration starts from the finished result.

So a loader that fetches and a component that renders costs exactly one call,
made inside the server's process.

One client, two transports. The transport is the only thing that changes.

## Then: failures

The original client returned `T | undefined`.
If a request failed, whether on validation, status or network, the client resolved to `undefined`,
and the caller was expected to check.

It sounded forgiving.
A loader does not crash on failure, a component does not need a `try/catch` around every call,
a flaky network does not take a page down.

It was wrong, and it took me a while to see why.

Every consumer had to handle `undefined`, because the type said so.
But the failure itself had no shape. Was it a `404`? A `500`? A dropped connection?
The client knew, and did not say.

And it was silent. A loader resolving to `undefined` renders a page with nothing in it,
which looks like "no data", or "not found", or "loading", and never like "an error happened".

In practice, nobody handled `undefined` carefully, because the failure behind it was invisible.
People wrote `!`, or added a fallback that hid the problem.
The types were honest and the runtime was quietly failing anyway.

So in 0.3.0 the client started to throw, and broke compatibility on purpose.

~~~ts
try {
  // user is User, not User | undefined
  const user = await GET([123]);
} catch (error) {
  if (error instanceof ValidationError) {
    // invalid data, no request was made
  } else {
    // HTTP error status, or network failure
  }
}
~~~

The return type is `T`. Every failure reaches the caller as a thrown error, with its own shape:
a `ValidationError` before the request, the response and its body for a non-2xx status,
the original error for a network failure.

The cost is that call sites must catch, or reach an error boundary.
But that is where errors belong anyway.
Every framework already has its own place for them, so the client throws and the framework catches.

It also made the server side safe.
If a fetch fails during SSR, the output is discarded and the client shell takes over,
retrying in the browser, where the usual boundaries are waiting.
The fallback only works because failing is loud. There has to be something to fall back from.
