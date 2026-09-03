---
title: Why HTTP
description: The industry spent two decades pulling server logic out of the page, and is now putting it back?
    A look at what actually moved, and why KosmoJS keeps an explicit HTTP boundary while making it cost nothing during SSR -
    one isomorphic fetch client, two transports, validation on both ends.
head:
  - - meta
    - name: keywords
      content: why http api, isomorphic fetch, server actions vs api routes, rsc alternative,
        use server, in-process dispatch, api boundary, client server separation, ajax history,
        end-to-end validation, kosmojs architecture
---

A fair question, asked more than often:

> The whole industry is moving server logic back **into the page** - server components, `"use server"`, server functions.
Why does KosmoJS still make me define an API route and call it over HTTP?

It is a good question, and it deserves more than "because REST". The honest answer starts with a bit of déjà-vu.

## We have been here before

Anyone who was writing web software in the early 2000s remembers what a page looked like:

```php
<?php
  $rows = mysql_query("SELECT * FROM users WHERE id = " . $_GET['id']);
  $user = mysql_fetch_assoc($rows);
?>
<h1><?= $user['name'] ?></h1>
<style>h1 { color: rebeccapurple }</style>
```

One file. Server logic, database access, markup and styles, colocated by default because there was nowhere else to put them.
It was **fast to write** - that part was never in dispute - and every interaction cost a full page reload.

Then the page learned to talk back without reloading. `XMLHttpRequest` arrived quietly -
shipped by a browser vendor for its own webmail product, which wanted to update part of a page instead of all of it -
and stayed a curiosity for years, worked around with hidden iframes by the few who cared.

What ended the obscurity was the free webmail service that opened, invite-only, in 2004.
A mailbox in a browser that behaved like a desktop application:
threads expanding, messages sending, labels applied, none of it costing a full-page reload.

It was the first time a mainstream audience used the technique daily without knowing it existed.
A mapping app that dragged instead of paginating followed a year later,
and in 2005 the whole approach finally got the name everybody used for the rest of the decade: `AJAX`.

What followed was twenty years of the same move, repeated:

| Step | What moved out of the page |
|---|---|
| XHR, then JSON over XML | The *rendering* of updates - server started answering with data |
| REST, then SPAs | The *routing and state* - the page became an application |
| A second client (mobile, then partners) | The *contract* - the API outlived the UI that prompted it |
| OpenAPI, GraphQL, typed clients | The *types* - the boundary became something you could check |

By the mid-2010s the shape had settled into something almost nobody had to argue for:
a rich client, a slim API, and a well-understood protocol between them.

Not because it was elegant, but because it survived contact with second clients,
third-party integrations, mobile teams, rate limits, caching layers, incident postmortems and audits.

And now the pendulum swings back: a component reads the database,
a function marked `"use server"` is called as if it were local,
and the file looks - squint a little - like that PHP page again.

## So what actually changed?

Here is where innocent questions are more useful than opinions.

The obvious reading is "we undid twenty years of work".
That reading is wrong, and worth dismissing carefully: **the boundary did not go away**.

A `"use server"` function still becomes an endpoint.
The compiler writes it, gives it a generated id, serializes arguments and results across the same network the PHP page did not have.
The client/server split is fully intact - it moved from something you *write* to something the framework *emits*.

That is a real **ergonomic win**, and it solves a real annoyance:
hand-writing an endpoint, a client, and the types on both sides, three times, for one button.

So the question isn't "server or page". It is narrower and more interesting:

> When the boundary becomes invisible, what else becomes invisible with it?

A few things that used to be obvious:

- **What is the URL?** Generated ids are not addresses you can share, curl, or put in a runbook.
- **Who else can call it?** A mobile app, a partner integration, a cron job, a support script -
none of them import your React components.
- **What runs at the boundary?** Auth, rate limiting, request logging, tracing, validation -
the things that live in middleware because they must apply to *everything* crossing the line.
- **What does the wire look like?** Payload shapes you can inspect in a proxy, in a log, in a HAR file from a user's browser.
- **What can be deployed separately?** A public API in a DMZ and an admin UI behind a VPN are one process,
or two, depending on whether there is a boundary to cut along.

None of that is an argument that colocation is wrong.
It is an argument that the *explicitness* of the boundary was doing work that people mostly noticed when it was gone.

Which leads to the question this framework is an answer to:

> Colocation is nice because the boundary is cheap to cross.
Explicitness is nice because the boundary is real. Do you actually have to pick one?

## KosmoJS's answer: keep the boundary, delete the latency

Server code lives in `api/`, client code in `pages/`, and an HTTP API sits between them.
Every endpoint has a URL. You can curl it, log it, proxy it, hand it to a mobile team,
put it in an [OpenAPI spec](/openapi), and deploy it on its own.

The part that makes this cheap is the [isomorphic fetch client](/fetch/intro) generated from each route -
meaning the same call site works in the browser and on the server, and only the transport underneath differs:

```ts
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

const user = await GET([123]); // identical code in a component and in a loader
```

| Where it runs | Transport | Cost of the boundary |
|---|---|---|
| Browser, after hydration | Global `fetch`, same-origin request | A normal HTTP request - as it should be |
| Server, during SSR | Direct dispatch into the API app | A function call and an object. **No socket, no localhost hop, no round trip.** |

During SSR the API is bundled *into* the SSR server, and the generated client hands a real `Request`
straight to the backend app instance. What runs is not a shortcut around your API:
it is your API, complete with routing, [middleware](/backend/middleware), validation, error handling and response shaping.

Details worth knowing about that in-process path:

- **Headers from the incoming page request are forwarded as defaults**, so cookies and auth headers
reach the route exactly as they would over the network. Anything you set on the call itself wins.
- **Redirects are followed in-process**, including the `303`/`301`/`302` rewrite to `GET`,
up to the same five hops the fetch spec allows.
- **Native `fetch` is not patched.** Only the generated clients switch transports;
every other fetch in your app behaves exactly as it always did.
- **Nothing about the call site changes.** A loader is a loader; the framework's own data model -
Solid's `createAsync`, React Router's `loader`, `useLoaderData` in Vue, Svelte and MDX - is what you write.
[Details&nbsp;›](/fetch/isomorphic-clients)

So the trade the industry seems to be posing - *keep the architecture and pay a round trip, or drop the architecture and get the speed* -
turns out not to be the only option on the table.
The round trip was never the point of the boundary; it was just the usual way of crossing it.

::: tip Where the fetch fires still matters
In-process dispatch applies to requests made **during rendering** - loaders, preloads, `createAsync`.
A fetch in `useEffect` / `onMounted` runs after hydration, in the browser, over the network -
because that is where and when it naturaly happens.
:::

## Declared once, enforced on both ends

The other thing an explicit boundary buys is a place to state what may cross it.

Validation is declared in the route, as ordinary TypeScript types, next to the handler that relies on it.
From that single declaration KosmoJS compiles schemas that run in **both** directions:

```ts
export default defineRoute<"users/[id]", [
  number, // validate id param as number [!code hl]
]>(({ PUT }) => [
  PUT<{
    json: { // [!code hl:4]
      name: string;
      email: VRefine<string, { format: "email" }>
    },
  }>(
    async (ctx) => { /* ... */ },
  ),
]);
```

- **In the browser**, the generated client validates params and payload *before* the request leaves.
Invalid data throws immediately - no round trip, and the same schemas are exposed
as [`validationSchemas`](/fetch/validation#validation-schemas) for live form feedback.
- **On the server**, the request is validated again on arrival -
because a server that trusts its clients is not a server, it is a suggestion box.

The two are the same compiled schema, so they cannot disagree, and neither can drift from the types the handler is written against.
[Details&nbsp;›](/validation/intro#end-to-end-validation)

And under SSR, the client-side check is disabled automatically - validation runs on the API endpoint only.

## What this costs you

An honest list, because the trade is real:

- **You write a route file.** Not a function in a component - a file under `api/`, with a URL.
- **No closure capture across the boundary.** A page cannot reach into a server-side variable simply
because it is in scope; it calls a route, and the route reads the database.
This is the constraint that makes the boundary real.
- **No progressive-enhancement form posts**, no `useActionState` equivalent -
form state is your framework's job, with the client's validation schemas for field errors.

And what it buys: an API a second client can use, a boundary your middleware actually controls,
URLs in your logs, a spec you can publish, folders you can deploy separately -
and, during SSR, none of the latency that usually comes with any of it.

## The déjà-vu, resolved

The 2000s page was fast to write and impossible to keep. The 2010s API was durable and chatty to build against.

They were solving different problems, and neither one was actually wrong about its own:
- colocation is about the cost of crossing a boundary
- separation is about whether the boundary exists

Those are independent questions, and answering them independently is the whole of the design here.
Keep the API. Make crossing it free where it can be free. Ask again in ten years.

---

- [Migration Tips](/essentials/migration-tips)
- [Isomorphic fetch](/fetch/isomorphic-clients)
- [Validation](/validation/intro)
