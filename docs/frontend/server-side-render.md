---
title: Server-Side Rendering
description: Add SSR capabilities to React, SolidJS, Vue and MDX applications using
  the KosmoJS SSR generator. String and stream rendering patterns, production
  builds, and deployment configurations for server-rendered applications.
head:
  - - meta
    - name: keywords
      content: react ssr, solidjs ssr, vue ssr, mdx ssr, server rendering, hydration,
        renderToString, renderToStream, react router ssr, solidjs ssr, vue router ssr,
        production rendering, stream rendering, kosmojs ssr
---

Source folders default to client-side rendering with Vite's dev server and HMR.
The SSR generator adds production-ready server rendering while keeping your
development workflow unchanged.

## Adding SSR Support

SSR is automatically enabled if selected during source folder creation.
To add it to an existing folder, register `ssrGenerator` in your source
folder's `kosmo.config.ts`:

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

Which method runs for a given route is controlled by `renderMode` (see
[Selecting the render mode](#selecting-the-render-mode)) - both are implemented,
and the mode decides which one the server calls per route.

::: code-group

```ts [React]
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

```ts [SolidJS]
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

```ts [Vue]
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

```tsx [MDX]
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

MDX is the one exception to implementing both methods: it renders static content,
provides only `renderToString`, and its folder does not expose the streaming
render mode.

## Render Factory Arguments

Both methods receive the same first two arguments - the URL and `SSROptions`.
`renderToStream` receives a third, the stream, for custom flushing control:

```ts
export type SSROptions = {
  // The original client index.html output from Vite build.
  // Contains <!--app-head--> and <!--app-html--> placeholders
  // where SSR content is injected by the server.
  template: string;

  // Vite's final manifest.json - the full dependency graph for
  // client modules, dynamic imports, and related CSS.
  manifest: Manifest;

  // SSR-related assets, must be injected manually (unlike CSR assets that are injected by Vite).
  // Each entry provides ways to consume the asset:
  //   - `tag`: ready-to-use HTML tag (<script> or <link>) for direct injection
  //   - `content`: raw file contents for inlining as <style> or inline <script>
  //   - `path`: asset URL for building custom tags with additional attributes.
  //     Optional - some assets are content-only (eg. an inlined script or style)
  //     and have no standalone URL.
  // `size` is included for Content-Length or preload hints.
  assets: Array<{
    kind: "js" | "css";
    tag: string;
    content: string;
    size: number;
    path?: string;
  }>;
};
```

| Property | Description |
|----------|-------------|
| `template` | Client `index.html` from the Vite build, with <code style="white-space: nowrap">\<!--app-head--></code> and <code style="white-space: nowrap">\<!--app-html--></code> placeholders for SSR injection |
| `manifest` | Vite's `manifest.json` - the full dependency graph for client modules |
| `assets` | SSR-related assets, must be injected manually |

Most renderers only need `assets` to build `head`. `template` and `manifest` are
available for advanced cases. The stream passed to `renderToStream` is a Hono
`StreamingApi` instance - an escape hatch for custom flushing; default renderers
resolve `html` to a `ReadableStream` and leave the writing to the server.

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
MDX is the exception: it renders static content, provides no `renderToStream`, and
its folder does not expose the streaming mode.

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
implement `renderToStream`; MDX folders do not accept the streaming mode.

## Production Build

::: code-group

```sh [npm]
npm run build
```

```sh [pnpm]
pnpm build
```

```sh [yarn]
yarn build
```
:::

Produces an SSR bundle at `dist/<folder>/ssr/server.js`
and the `dist/<folder>/ssr/assets/` folder for hydration.

Static files in `assets/` folder are served by the SSR server out of the box.
If you need them served otherwise, use a reverse proxy or CDN to serve `assets/` folder.

The SSR bundle also includes the API app. During server rendering the generated
fetch client dispatches to API routes in-process rather than over the network,
so data loading on the server has no HTTP round-trip - and the same bundle serves
API requests on its own port, no separate API process required.
[Isomorphic Fetch ›](/fetch/integration#isomorphic-fetch)

## Local Testing

Test your SSR bundle before deploying:

```sh
node dist/front/ssr/server.js -p 4556
```

Navigate to `http://localhost:4556` to verify server-side rendering.

## Runtime

The SSR server uses `node:http` which is natively supported by Node, Bun, and Deno.
Same bundle, same behavior, just pick your runtime:

::: code-group
```sh [Node]
node dist/front/ssr/server.js -p 4556
```
```sh [Bun]
bun dist/front/ssr/server.js -p 4556
```
```sh [Deno]
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

## Production Guidelines

- **Test locally before deploying.** Always verify your production bundle renders correctly before pushing to live servers.
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
