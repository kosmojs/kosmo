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

## 🛠️ Adding SSR Support

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

## 📄 Server Entry Point

The SSR generator creates `entry/server.tsx` (or `.vue`) with a default implementation.
`renderFactory` accepts a callback returning an object with rendering methods:

- `renderToString(url, SSROptions)` - renders the complete page before transmission. Provided by default.
- `renderToStream(url, SSROptions)` - optional progressive streaming implementation. When provided, takes precedence over `renderToString`.

::: code-group

```ts [React]
import { renderToString } from "react-dom/server";

import renderFactory, { createRoutes } from "_/entry/server";
import routerFactory from "../router";

const routes = createRoutes({ withPreload: false });
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    async renderToString(url, { assets }) {
      const page = await serverRouter(url);
      const head = assets.map(({ tag }) => tag).join("\n");
      const html = renderToString(page);
      return { head, html };
    },
  };
});

```

```ts [SolidJS]
import { renderToString, generateHydrationScript } from "solid-js/web";

import renderFactory, { createRoutes } from "_/entry/server";
import routerFactory from "../router";

const routes = createRoutes({ withPreload: false });
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  const hydrationScript = generateHydrationScript();
  return {
    async renderToString(url, { assets }) {
      const page = await serverRouter(url);
      const head = assets.reduce(
        (head, { tag }) => `${head}\n${tag}`,
        hydrationScript,
      );
      const html = renderToString(() => page);
      return { head, html };
    },
  };
});
```

```ts [Vue]
import { renderToString } from "vue/server-renderer";

import renderFactory, { createRoutes } from "_/entry/server";
import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    async renderToString(url, { assets }) {
      const page = await serverRouter(url);
      const head = assets.map(({ tag }) => tag).join("\n");
      const html = await renderToString(page);
      return { head, html };
    },
  };
});
```

```tsx [MDX]
import { renderToString } from "preact-render-to-string";

import renderFactory, { createRoutes } from "_/entry/server";
import { renderHead } from "_/mdx";
import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    async renderToString(url, { assets }) {
      const page = await serverRouter(url);

      const head = assets.reduce(
        (head, { tag }) => `${head}\n${tag}`,
        renderHead(page?.frontmatter),
      );

      const html = page ? renderToString(page.component) : "";

      return { html, head };
    },
  };
});
```
:::

`renderToString` receives the URL being requested and must return:
- `html` - the rendered application markup
- `head` - HTML to inject into `<head>` (optional)

SolidJS injects a hydration script in `<head>` via `generateHydrationScript()`,
which bootstraps client-side reactivity during hydration.

## 🎛️ Render Factory Arguments

`renderToString` receives two arguments - the URL and SSROptions:

```ts
export type SSROptions = {
  // The original client index.html output from Vite build.
  // Contains <!--app-head--> and <!--app-html--> placeholders
  // where SSR content should be injected.
  template: string;

  // Vite's final manifest.json - the full dependency graph for
  // client modules, dynamic imports, and related CSS.
  manifest: Manifest;

  // SSR-related assets, must be injected manually (unlike CSR assets that are injected by Vite).
  // Each entry provides three ways to consume the asset:
  //   - `tag`: ready-to-use HTML tag (<script> or <link>) for direct injection
  //   - `path`: asset URL for building custom tags with additional attributes
  //   - `content`: raw file contents for inlining as <style> or inline <script>
  // `size` is included for Content-Length or preload hints.
  assets: Array<{
    tag: string;
    kind: "js" | "css";
    path: string;
    content: string | undefined;
    size: number | undefined;
  }>;
};
```

| Property | Description |
|----------|-------------|
| `template` | Client `index.html` from the Vite build, with <code style="white-space: nowrap">\<!--app-head--></code> and <code style="white-space: nowrap">\<!--app-html--></code> placeholders for SSR injection |
| `manifest` | Vite's `manifest.json` - the full dependency graph for client modules |
| `assets` | SSR-related assets, must be injected manually

## 🌊 Stream Rendering

When both provided, `renderToStream` takes precedence over `renderToString`,
enabling earlier flushing and improved Time-to-First-Byte (TTFB).

`renderToStream` receives the request URL, SSR options, and a Hono `StreamingApi`
instance. The SSR server creates the stream and passes it to your renderer:

```ts
import { stream } from "hono/streaming";

// renderToStream receives full control over the response stream.
// The renderer decides when to flush the shell, inject assets,
// and finalize the response.
return stream(ctx, async (stream) => {
  await renderToStream(url, ssrOptions, stream);
});
```

The pattern is the same across frameworks: split the HTML template at
`<!--app-html-->`, write the opening HTML with head content, pipe the
framework's rendered stream, then write the closing HTML.

Frameworks provide a web-standard `ReadableStream` renderer,
which pipes directly into Hono's `stream.pipe()` - no Node.js stream
adapters needed, works identically on Node, Bun, and Deno.

::: code-group
```tsx [React · entry/server.tsx]
import { renderToReadableStream } from "react-dom/server";

export default renderFactory(() => {
  return {
    // ...
    async renderToStream(url, { template, assets }, stream) {
      const { router } = await serverRouter(url);

      const head = assets
        .map(({ tag }) => tag)
        .join("\n");

      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");

      await stream.write(htmlStart.replace("<!--app-head-->", head));

      const reactStream = await renderToReadableStream(router);
      await stream.pipe(reactStream);

      await stream.write(htmlEnd);
    },
  };
});
```

```tsx [SolidJS · entry/server.tsx]
import { renderToStream } from "solid-js/web";

export default renderFactory(() => {
  const hydrationScript = generateHydrationScript();
  return {
    // ...
    async renderToStream(url, { template, assets }, stream) {
      const { router } = await serverRouter(url);

      const head = assets.reduce(
        (head, { tag }) => `${head}\n${tag}`,
        hydrationScript,
      );

      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");

      await stream.write(htmlStart.replace("<!--app-head-->", head));

      const { readable } = renderToStream(() => router);
      await stream.pipe(readable);

      await stream.write(htmlEnd);
    },
  };
});
```

```ts [Vue · entry/server.ts]
import { createSSRApp } from "vue";
import { renderToWebStream } from "vue/server-renderer";

export default renderFactory(() => {
  return {
    // ...
    async renderToStream(url, { template, assets }, stream) {
      const { app } = await serverRouter(url);

      const head = assets
        .map(({ tag }) => tag)
        .join("\n");

      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");

      await stream.write(htmlStart.replace("<!--app-head-->", head));

      const vueStream = renderToWebStream(app);
      await stream.pipe(vueStream);

      await stream.write(htmlEnd);
    },
  };
});
```
:::

Same web-standard `ReadableStream` used across all frameworks:

- **React** - `renderToReadableStream` returns a `ReadableStream` directly. Cross-runtime, replaces the Node-only `renderToPipeableStream`.
- **SolidJS** - `renderToStream` returns `{ readable }`, a web `ReadableStream`.
- **Vue** - `renderToWebStream` returns a `ReadableStream`, replacing the Node-only `renderToNodeStream`.

Hono's `stream.pipe(readableStream)` consumes each framework's output
identically - no runtime-specific adapters or Node.js stream conversions.

## 📦 Static Asset Handling

By default the SSR server loads client assets into memory at startup and serves
them on request. Disable this when running behind a reverse proxy or CDN:

```ts [kosmo.config.ts]
export default defineConfig({
  // ...
  generators: [
    // ...
    ssrGenerator({
      serveStaticAssets: false, // [!code ++]
    }),
  ],
});
```

## 🏗️ Production Build

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

Produces an SSR bundle at `dist/SOURCE_FOLDER/ssr/server.js`, ready for
production execution.

## 🧪 Local Testing

Test your SSR bundle before deploying:

```sh
node dist/front/ssr/server.js -p 4556
```

Navigate to `http://localhost:4556` to verify server-side rendering.

## 🖥️ Runtime

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

## 🚀 Production Deployment

Deploy behind a reverse proxy such as Nginx or Caddy:

```nginx
upstream ssr_backend {
  server 127.0.0.1:4556;
  # server unix:/tmp/app.sock;
}

server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass http://ssr_backend;
  }
}
```

## 🔄 Development Experience

SSR activates exclusively in production builds. During development:

- Run `pnpm dev` as usual
- Vite handles all requests with HMR
- Client-side rendering provides immediate feedback

## 💡 Production Guidelines

- **Test locally before deploying.** Always verify your production bundle renders correctly before pushing to live servers.
- **Use streaming for large pages.** Applications with substantial HTML or complex data-fetching chains benefit from `renderToStream` - users see content faster as it arrives progressively.
- **Monitor process resources.** SSR keeps Node.js processes running continuously. Track memory consumption and implement error handling to prevent leaks.
- **Cache aggressively.** Place a CDN or cache layer in front of your SSR server for infrequently changing routes to reduce server load.
- **Implement error boundaries.** Add error boundaries throughout your application and handle errors in server entry points. Server errors shouldn't terminate the entire process.
- **Separate SSR and CSR concerns via source folders.** Rather than complex route-level SSR/CSR switching within a single folder, use `KosmoJS`'s architectural strength: deploy an SSR source folder for marketing content and a CSR source folder for your application. Cleaner codebases, straightforward maintenance.

## ⚠️ Technical Considerations

- **Browser APIs unavailable during SSR.** Code executing server-side cannot access `window`, `document`, or browser-exclusive APIs.
- **Coordinate async data loading.** Suspense and resources work in SSR contexts, but complex async patterns require careful attention to ensure data is ready before rendering.
- **Bundle size still matters.** In SSR, initial bundle size affects server memory and startup time. The hydration bundle still downloads to clients, so optimization remains important.
- **Plan state serialization.** Applications with complex state require proper serialization for hydration. Each framework handles standard cases automatically, but custom stores or non-serializable data need special attention.
