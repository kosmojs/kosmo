---
title: Isomorphic Clients
description: One generated fetch client, two transports - a same-origin request in the browser
    and an in-process dispatch into your API during SSR. What decides which one runs,
    what the in-process path actually does, how hydration reuses the result, and what happens when an SSR fetch fails.
head:
  - - meta
    - name: keywords
      content: isomorphic fetch, ssr fetch, in-process dispatch, no network hop, fetch transport,
        hydration reuse, ssr fallback to csr, ssg build time fetch, same-origin request,
        kosmojs fetch client
---

A generated [fetch client](/fetch/intro) is one function you call the same way everywhere:

```ts
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

const user = await GET([123]); // a component, a loader, a preload - same call
```

What changes underneath is the **transport**:

| Where&nbsp;the&nbsp;call&nbsp;runs | Transport | What it costs |
|---|---|---|
| Browser | Global `fetch`, same-origin request | A normal HTTP request |
| Server, during SSR | Direct dispatch into the API app | A function call and an object - no socket, no localhost hop |

There is nothing to configure and no second client to import.

## Nothing is patched

Worth saying plainly, because "isomorphic fetch" elsewhere often means monkey-patching:
`globalThis.fetch` is never touched - not in the browser, not in Node.

The transport is a parameter of the generated client, not a global that gets swapped:
- In the browser no transport is passed, so the client calls the platform's own fetch, pristine -
with every redirect, credentials, caching, `AbortSignal` semantics, etc.
- On the server the client is constructed with a transport that speaks the same `Request -> Response` contract
and handed to the API app instead of to the network.

## What decides which transport you get

Not a setting - **where and when the call happens**:

| Situation | Transport |
|---|---|
| `pnpm dev`, any folder | Network. The dev server is always [client-rendered](/dev-build-run/development-workflow#dev-renders-client-side), so there is no SSR pass to dispatch in |
| Production CSR folder | Network |
| SSR folder, call made **during render** - `loader`, `preload`, `createAsync` | In-process |
| SSR folder, call made **after hydration** - `useEffect`, `onMounted`, an event handler | Network |
| SSG build | In-process (see [below](#ssg-runs-the-same-path-at-build-time)) |

The rule underneath is simple: a fetch that fires while the server is rendering the page runs in the server's process;
a fetch that fires in the browser runs in the browser.

::: tip The dev server never shows you the in-process path
Dev is CSR, so the fetch you are watching in the network tab is the network one - even in a folder with SSR enabled.
Run [`pnpm preview`](/dev-build-run/production-preview) to exercise the real SSR path.
:::

## What the in-process path actually does

It is not a shortcut around your API. The SSR build bundles the backend in, and the client hands it a real `Request`:

- **Dispatched into the app instance** - `app.fetch(request)` for backends that expose it,
an in-memory injection for the Node-style one. Either way the request goes through the whole chain:
routing, [global](/backend/middleware#global-middleware-api-use-ts) and [cascading](/backend/cascading-middleware) middleware,
validation, your handler, [error handling](/backend/error-handling), response shaping.
- **With the page request's headers as defaults.** Cookies, `authorization`, tracing headers from the incoming request are forwarded,
so an authenticated page renders authenticated data. Anything you set on the call itself wins over a forwarded value.
- **Following redirects in-process** - up to the five hops the fetch spec allows,
including the `303` (and `301`/`302` from `POST`) rewrite to `GET`.
- **Without patching anything global.** Only the generated clients switch transports.
Every other `fetch` in your app - a call to a third-party API, say - behaves exactly as it always did.

## Client-side validation is skipped under SSR

The client's pre-flight check exists to save a round trip. During SSR there is no round trip,
so it is disabled automatically and validation runs on the API endpoint only.
[Details&nbsp;›](/fetch/validation)

## Hydration does not refetch

A request made during SSR is not repeated in the browser:

- **React and Solid** reuse the result through their built-in hydration.
- **Vue, Svelte and MDX** reuse it through the loader:
the result is serialized into the page during SSR and read on the client before the loader would run.

So the common pattern - a loader that fetches, a component that renders it - costs exactly one call,
made in the server's process, and the browser starts from the finished result.

## When an SSR fetch fails

A failing call during SSR is not the same event as a failing call in the browser,
and it is worth knowing what the server does with it.

The in-process transport throws on a non-2xx response, and the error is also stashed on the request-scoped store -
because some frameworks swallow a rejected loader and render a partial tree anyway,
which would otherwise produce a half-rendered page with no visible error.

When the render finishes and that error is present, **the SSR output is discarded and the client shell is served instead**.
The browser then renders the page itself, where the failure reaches your own [error boundaries](/frontend/error-boundaries)
and surfaces the same way it would in a CSR app.

The server logs it:

```txt
WARN: SSR failed, fallback to CSR
SSRFetchError: /api/users/123: 500 [ Internal Server Error ]
```

That is a deliberate trade - one consistent place to handle errors instead of server-side boundaries
that behave differently in every framework - but it has a practical consequence worth internalising:

::: warning A page that renders fine can still have lost its SSR
If a page silently arrives as an empty shell in production, check the server log before checking the client.
A single failing API call during render is enough to drop the whole page back to CSR,
and the page still works - it just stopped being server-rendered.
:::

Everything else about errors is unchanged: fetch clients always throw and transport failures are distinguished the same way on both sides.
[Details&nbsp;›](/fetch/error-handling)

## SSG runs the same path at build time

[Static generation](/frontend/static-site-generation) is not a third mode.
The build starts a disposable SSR server, requests each route from it, and writes the returned HTML to disk -
so every fetch made during those renders takes the in-process path, inside the build.

Two consequences:

- **Your API runs during the build**, which means whatever it talks to -
a database, a CMS, an upstream service - has to be reachable from wherever you build.
- **A failed fetch degrades quietly.** The SSR fallback above applies, so the file written to disk
is the client shell rather than a pre-rendered page. Watch the build output for `WARN: SSR failed, fallback to CSR`.

## What does not change

- **`path` and `href`** always produce URL strings - they are for links,
redirects and external references, not requests, so there is nothing to swap.
[Details&nbsp;›](/fetch/utilities)
- **Types.** The same `ResponseT` and parameter types apply on both sides;
nothing about the call signature depends on where it runs.
- **Your framework's data model.** Loaders, `createAsync`, `useLoaderData` -
the client is a plain promise-returning function and the framework owns everything above it.
[Details&nbsp;›](/fetch/integration)

---

[Read&nbsp;more](/essentials/why-http) on why the boundary is there and why keeping it does not have to cost a round trip.
