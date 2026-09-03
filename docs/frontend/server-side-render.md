---
title: Server-Side Rendering
description: Add SSR capabilities to React, SolidJS, Vue, Svelte and MDX applications using
  the KosmoJS SSR generator. String and stream rendering patterns, production
  builds, and deployment configurations for server-rendered applications.
head:
  - - meta
    - name: keywords
      content: react ssr, solidjs ssr, vue ssr, svelte ssr, mdx ssr, server rendering, hydration,
        renderToString, renderToStream, ssr error handling, csr fallback, react router ssr, vue router ssr,
        production rendering, stream rendering, kosmojs ssr
---

Source folders default to client-side rendering with Vite's dev server and HMR.
The SSR generator adds production-ready server rendering while keeping your
development workflow unchanged.

## Adding SSR Support

SSR is automatically enabled if selected during source folder creation (or via `--ssr` flag in CLI mode).
To add it to an existing folder, register `ssrGenerator` in your source folder's `kosmo.config.ts`:

```ts [kosmo.config.ts]
import {
  defineConfig,
  // ...other generators
  ssrGenerator, // [!code ++]
} from "@kosmojs/dev";

export default defineConfig({
  generators: [
    // ...other generators
    ssrGenerator(), // [!code ++]
  ],
});
```

:::details SSR runs in production builds only

`pnpm dev` is **always** Vite + HMR + client-side rendering, whether or not SSR enabled.

To see, test or debug anything server-rendered, use [`kosmo preview`](/dev-build-run/production-preview) -
it serves the production build and rebuilds on change:

```sh
pnpm preview front
```

This trips up people arriving from Next/Nuxt/TanStack Start, where dev mirrors prod rendering.
See [Debugging SSR](#testing-debugging-ssr) for the working loop.
:::

## Server Entry Point

The SSR generator creates `entry/server.ts` file with a default implementation.
`renderFactory` accepts a callback returning an object with two required methods:

- `renderToString(url, SSROptions)` - renders the complete page, then returns it
  as a string.
- `renderToStream(url, SSROptions)` - renders the page as a `ReadableStream` for
  progressive flushing.

Both methods return the same `{ head, html }` shape - the only difference is that
`renderToString` resolves `html` to a string, while `renderToStream` resolves it
to a `ReadableStream`. Both renderers are imported from `_/entry/server`, and each
method returns rendered content the server assembles into the full response.

Which method runs for a given route is controlled by [renderMode](#selecting-the-render-mode) -
both are implemented, and the mode decides which one the server calls per route.

:::tabs key:frontend variant:code
== React
```ts
import renderFactory, {
  createRoutes,
  renderToStream,
  renderToString,
} from "_/entry/server";

import routerFactory from "../router";

const routes = createRoutes({ withPreload: true });
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    renderToStream(url, { assets }) {
      return renderToStream(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
  };
});
```

== Solid
```ts
import renderFactory, {
  createRoutes,
  renderToStream,
  renderToString,
} from "_/entry/server";

import routerFactory from "../router";

const routes = createRoutes({ withPreload: true });
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    renderToStream(url, { assets }) {
      return renderToStream(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
  };
});
```

== Vue
```ts
import renderFactory, {
  createRoutes,
  renderToStream,
  renderToString,
} from "_/entry/server";

import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    renderToStream(url, { assets }) {
      return renderToStream(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
  };
});
```

== Svelte
```ts
import renderFactory, {
  createRoutes,
  renderToString,
  // no renderToStream on Svelte folders
} from "_/entry/server";

import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
  };
});
```

== MDX
```ts
import renderFactory, {
  createRoutes,
  renderToString,
  // no renderToStream on MDX folders
} from "_/entry/server";

import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
  };
});
```
:::

The two methods are near-identical - `renderToString` and `renderToStream` share
imports, `head` construction, and the `{ head, html }` return. The only
difference is which renderer produces `html`:

- `renderToString` resolves `html` to a string.
- `renderToStream` resolves `html` to a `ReadableStream`.

Both are awaited. The server writes the opening HTML with `head` injected,
emits `html`, then writes the closing HTML - you return content,
and template assembly and the response are handled for you.

MDX and Svelte are the exceptions to implementing both methods: they provide only
`renderToString` and their folders do not expose the streaming render mode -
MDX because it renders static content, Svelte because its folder ships string rendering only.

## Render Factory Arguments

Both methods receive the same first two arguments - the URL and options.
Options is an object with following properties:

| Property | Description |
|----------|-------------|
| `template` | Client `index.html` from the Vite build, with <code style="white-space: nowrap">\<!--app-html--></code> placeholder for SSR injection |
| `manifest` | Vite's `manifest.json` - the full dependency graph for client modules |
| `assets` | SSR-related assets, must be injected manually |

Most renderers only need `assets` to build `head`. `template` and `manifest` are
available for advanced cases. The stream passed to `renderToStream` is a Hono
`StreamingApi` instance - an escape hatch for custom flushing; default renderers
resolve `html` to a `ReadableStream` and leave the writing to the server.

`renderToStream` receives a third argument, the stream, for custom flushing control.

Those are the arguments the server passes *in*. The renderers you call from inside each method take their own options -
`headerTags`, and the [onError hook](#onerror-hook) for reporting a render that failed.

## Stream Rendering

Streaming renders the page as a `ReadableStream` instead of a single string,
letting the server flush the shell early and improving Time-to-First-Byte (TTFB)
for large pages or long data-fetching chains.

No extra code is needed beyond the `renderToStream` method already shown in the
[Server Entry Point](#server-entry-point) examples - it mirrors `renderToString`,
differing only in the renderer it calls and the `ReadableStream` it resolves to.

`renderToStream` from `_/entry/server` returns a web-standard `ReadableStream` for every framework,
so streaming works the same on Node, Bun, and Deno.

Streaming a route is opt-in per route via [`renderMode`](#selecting-the-render-mode).
MDX and Svelte are the exceptions: they provide no `renderToStream`, and their folders do not expose the streaming mode.

## Selecting the Render Mode

Every route defaults to string rendering. To stream instead, set `renderMode` in
the SSR generator options and match routes by glob pattern:

```ts [kosmo.config.ts]
ssrGenerator({
  renderMode: {
    "docs/**": "stream",
  },
})
```

- `renderMode: "string"` (default) - render every route to a string.
- `renderMode: "stream"` - stream every route.
- `renderMode: { ... }` - per-route selection by glob pattern.

`docs/*` matches only routes directly under `docs`; `docs/**` matches routes at
any depth. Unmatched routes fall back to `"string"`. To invert the default -
stream everything, then opt specific routes back into strings - order patterns
from specific to general:

```ts [kosmo.config.ts]
ssrGenerator({
  renderMode: {
    "users/**": "string",
    "*": "stream",
  },
})
```

When a route matches multiple patterns, the first match wins - so more specific
patterns come first. Streaming a route requires the folder's renderer to
implement `renderToStream`; MDX and Svelte folders do not accept the streaming mode.

## Fetch Errors and Recovery

Pages fetch data during server rendering through the same fetch client the browser uses,
dispatched in-process into the API app.
When a fetch fails mid-render, what happens next depends on the render mode.

### The CSR fallback - string-rendered routes recover automatically.

A string-rendered page is produced in full before a single byte leaves the server,
so a failed fetch aborts the render while the response is still untouched -
the server falls back to serving the client `index.html` verbatim.

The browser receives a clean CSR page: the client entry mounts from scratch,
fetching is retried in the browser, and any remaining failure surfaces through the error handling
the page already implements for client-side navigation.
No configuration is needed - string routes degrade to CSR on their own.

The same catch covers a **hard render failure**, not just a failed fetch: if the component tree throws while rendering,
the partial output is discarded and the client shell is served in its place.

Server-side error boundaries behave differently in every framework,
so the fallback deliberately hands the failure to the client,
where one set of boundaries handles it the way it always does.

#### What it looks like in production

The server logs the failure and the fallback that followed:

```txt
WARN: SSR failed, fallback to CSR
SSRFetchError: /api/users/123: 500 [ Internal Server Error ]
```

Nothing else announces it. The visitor still gets a working page, the status code is unchanged,
and nothing in the browser says the page was meant to be server-rendered.

So a route can quietly stop being server-rendered and stay that way until someone reads that line
or notices the missing markup in view-source.

Which is exactly why the renderers take an [`onError`](#onerror-hook) hook:
it turns that line into an event your monitoring can see.

Two practical habits follow:

- **When a page loses its SSR, look at the server side first.**
An empty shell in production is usually a failing API call during render, not a frontend bug.
- **Do not treat the fallback as an error strategy.**
It keeps a bad deploy serving, it does not make the failure acceptable - the underlying call is still broken for every visitor of that route.

At build time there is no visitor waiting, so [SSG](/frontend/static-site-generation#error-handling) does the opposite:
a route that cannot be rendered is never written as a shell,
and one failure is enough to make the build write nothing and fail.

### Streaming routes do not recover.

Streaming exists to flush the shell before rendering completes,
so by the time a fetch fails, the status line, headers, and opening HTML are already on the wire -
there is no response left to replace, and no server-side fallback is possible.

Routes that enable streaming must handle fetch errors manually, inside the page itself:

- catch errors in loaders or components and render an explicit error state.
- treat failure as a regular data state: a streamed page should be able to render something for every state its data can be in.
- lean on the framework's containment primitives
    - React contains the failure through the enclosing Suspense boundary:
    the stream survives, the server emits the suspense fallback, and the client retries the subtree,
    where an error boundary takes over (React never renders error boundary fallback HTML on the server);
    - Solid serializes resource errors into the stream and rethrows them during client hydration,
    where an `ErrorBoundary` catches them;
    - Vue has no streaming-side equivalent: `onErrorCaptured` can stop an error from propagating,
    which keeps the stream alive, but no fallback is rendered in that same server pass -
    the failed subtree is simply absent until the boundary takes over on the client.

What an unhandled mid-stream error produces is framework-specific -
a truncated document, a built-in fallback with client-side retry,
or an error deferred to hydration - none of which substitutes for explicit handling.

See [Error Boundaries](/frontend/error-boundaries) for how each framework's boundary behaves during server rendering.

MDX and Svelte folders are unaffected: they render strings only,
so every route recovers through the CSR fallback.

## onError hook

Both `renderToString` and `renderToStream` accept an **`onError`** hook, called with the error that ended the render:

```ts [entry/server.ts]
export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        {
          headerTags: assets.map(({ tag }) => tag),
          onError(error) {
            reportToSentry(error, { url, mode: "string" }); // [!code hl]
          },
        },
      );
    },
    renderToStream(url, { assets }) {
      return renderToStream(
        () => serverRouter(url),
        {
          headerTags: assets.map(({ tag }) => tag),
          onError(error) {
            reportToSentry(error, { url, mode: "stream" }); // [!code hl]
          },
        },
      );
    },
  };
});
```

::: warning It reports, it does not repair
`onError` cannot change the response, patch the markup, or prevent what the render mode already does.
A string-rendered route still falls back to CSR; a streamed route's shell is still on the wire.
Returning a value from it changes nothing.
:::

The hook is the way to ship the error to your logger, to Sentry, to OpenTelemetry,
tagged with the URL and whatever request context you already carry.

What to do inside it:

- **Report, don't render.** Log, count, trace, page someone. Keep it cheap -
it runs on the request path, in front of a visitor who is already waiting.
- **Never throw from it.** An `onError` that throws turns one failure into two,
in the one place that was supposed to make failures observable.
- **Tag the render mode.** A string-rendered failure means one visitor got a CSR page;
a streamed failure means one visitor got a broken document. They deserve different alert thresholds.

It fires in every environment that renders on the server - including [SSG](/frontend/static-site-generation#error-handling) pre-rendering,
where it runs inside the build, once per route that fails,
before the build reports them together and exits non-zero without writing any output.

## Production Build

:::tabs key:pm variant:code
== npm
```sh
npm run build
```

== pnpm
```sh
pnpm build
```

== yarn
```sh
yarn build
```
:::

Produces an SSR bundle at `dist/<folder>/ssr/server.js`
and the `dist/<folder>/ssr/assets/` folder for hydration.

The SSR bundle also includes the API app. During server rendering the generated
fetch client dispatches to API routes in-process rather than over the network,
so data loading on the server has no HTTP round-trip - and the same bundle serves
API requests on its own port, no separate API process required.
[Isomorphic Fetch ›](/fetch/isomorphic-clients)

## Static Asset Handling

The SSR server serves static files itself, out of the box, from memory - two directories,
each one an allowlist of its own, nothing else in the bundle root is ever exposed:

- `dist/<folder>/ssr/assets/` - content-hashed by Vite, served at `<base>/assets/` with `Cache-Control: public, max-age=31536000, immutable`
- `dist/<folder>/ssr/public/` - a verbatim copy of the folder's `public/` directory (or whatever `publicDir` is set to in `kosmo.config.ts`),
served at `<base>/` with `Cache-Control: no-cache`, since these names are stable and clients must revalidate

Static files take precedence over page routes, exactly as in the dev server.

There is no option to turn that off - and no need to: to keep static requests away from the SSR process entirely,
put a reverse proxy or CDN in front and let it serve both directories directly.

```nginx
location /assets/ {
  alias /srv/app/dist/front/ssr/assets/;
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location / {
  root /srv/app/dist/front/ssr/public;
  try_files $uri @ssr;
}

location @ssr {
  proxy_pass http://ssr_backend;
}
```

## Testing / Debugging SSR

Because SSR never runs under `pnpm dev`, anything server-rendered is checked against the production build.
[`kosmo preview`](/dev-build-run/production-preview) does the build for you and rebuilds whenever you save:

```sh
pnpm preview front
```

Preview listens on `previewPort` (`4558` by default), so it runs alongside
`pnpm dev` rather than replacing it - keep both open and compare.

A few things that make debugging less painful:

- **Preview one folder.** `pnpm preview front` skips every other source folder.
- **Confirm you are actually seeing SSR.** View source (not the inspector):
a server-rendered page arrives with real markup in `<div id="app">`.
If it arrives empty, the render was skipped or it fell back to CSR.
- **Watch the server's stderr.** A failed fetch during a string render aborts that render
and silently serves the CSR shell - the page still "works",
so the terminal is where the failure shows up.
- **Isolate browser-only code.** `window`/`document` access during render is the most
common SSR-only crash. Move it into an effect (`useEffect`/`onMounted`) or guard it
with `typeof window !== "undefined"`.
- **Reach for a string render first.** If a route misbehaves only when streamed,
drop it back to `"string"` in [`renderMode`](#selecting-the-render-mode)
to find out whether the bug is in your render or in the streaming path.

## Runtime

The SSR server uses `node:http` which is natively supported by Node, Bun, and Deno.
Same bundle, same behavior, just pick your runtime:

:::tabs key:runtime variant:code
== Node
```sh
node dist/front/ssr/server.js -p 4556
```

== Bun
```sh
bun dist/front/ssr/server.js -p 4556
```

== Deno
```sh
deno run -A dist/front/ssr/server.js -p 4556
```
:::

Unix sockets are also supported across all three runtimes:

```sh
node dist/front/ssr/server.js -s /tmp/app.sock
```

## Production Deployment

Deploy behind a reverse proxy such as Nginx or Caddy:

```nginx
upstream ssr_backend {
  server 127.0.0.1:4556;
}

server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass http://ssr_backend;
  }
}
```

## Development Experience

SSR activates exclusively in production builds. During development:

- Run `pnpm dev` as usual
- Vite handles all requests with HMR
- Client-side rendering provides immediate feedback

When you need the server-rendered page, run [`pnpm preview`](/dev-build-run/production-preview) -
the production build, rebuilt on every save, on its own port so it sits alongside `pnpm dev`.

## Production Guidelines

- **Test locally before deploying.** Always verify your production bundle renders correctly before pushing to live servers -
`pnpm preview` exists for exactly this.
- **Use streaming for large pages.** Applications with substantial HTML or complex data-fetching chains benefit from `renderToStream` -
users see content faster as it arrives progressively.
- **Monitor process resources.** SSR keeps Node.js processes running continuously. Track memory consumption and implement error handling to prevent leaks.
- **Cache aggressively.** Place a CDN or cache layer in front of your SSR server for infrequently changing routes to reduce server load.
- **Implement error boundaries.** Add error boundaries throughout your application and handle errors in server entry points.
Server errors shouldn't terminate the entire process.
- **Separate SSR and CSR concerns via source folders.** Rather than complex route-level SSR/CSR switching within a single folder,
use `KosmoJS`'s architectural strength: deploy an SSR source folder for marketing content and a CSR source folder for your application.
Cleaner codebases, straightforward maintenance.

## Technical Considerations

- **Browser APIs unavailable during SSR.** Code executing server-side cannot access `window`, `document`, or browser-exclusive APIs.
- **Coordinate async data loading.** Suspense and resources work in SSR contexts,
but complex async patterns require careful attention to ensure data is ready before rendering.
- **Bundle size still matters.** In SSR, initial bundle size affects server memory and startup time.
The hydration bundle still downloads to clients, so optimization remains important.
- **Plan state serialization.** Applications with complex state require proper serialization for hydration.
Each framework handles standard cases automatically, but custom stores or non-serializable data need special attention.
