---
title: Server-Side Rendering
description: Add SSR capabilities to React, SolidJS, and Vue applications using
  the KosmoJS SSR generator. String and stream rendering patterns, production
  builds, and deployment configurations for server-rendered applications.
head:
  - - meta
    - name: keywords
      content: react ssr, solidjs ssr, vue ssr, server rendering, hydration,
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

The SSR generator creates `entry/server.ts` with a default implementation.
`renderFactory` accepts a callback returning an object with rendering methods:

- `renderToString(url, SSROptions)` - renders the complete page before transmission. Provided by default.
- `renderToStream(url, SSROptions)` - optional progressive streaming implementation. When provided, takes precedence over `renderToString`.

::: code-group

```ts [React · entry/server.ts]
import { renderToString } from "react-dom/server";

import { renderFactory, createRoutes } from "_/front/entry/server";
import App from "@/front/App";
import createRouter from "@/front/router";

const routes = createRoutes({ withPreload: false });

export default renderFactory(() => {
  return {
    async renderToString(url, { criticalCss }) {
      const router = await createRouter(App, routes, { url });
      const head = criticalCss
        .map(({ text }) => `<style>${text}</style>`)
        .join("\n");
      const html = renderToString(router);
      return { head, html };
    },
  };
});
```

```ts [SolidJS · entry/server.ts]
import { renderToString, generateHydrationScript } from "solid-js/web";

import { renderFactory, createRoutes } from "_/front/entry/server";
import App from "@/front/App";
import createRouter from "@/front/router";

const routes = createRoutes({ withPreload: false });

export default renderFactory(() => {
  const hydrationScript = generateHydrationScript();
  return {
    async renderToString(url, { criticalCss }) {
      const router = await createRouter(App, routes, { url });
      const head = criticalCss.reduce(
        (head, { text }) => `${head}\n<style>${text}</style>`,
        hydrationScript,
      );
      const html = renderToString(() => router);
      return { head, html };
    },
  };
});
```

```ts [Vue · entry/server.ts]
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";

import { renderFactory, createRoutes } from "_/front/entry/server";
import App from "@/front/App.vue";
import createRouter from "@/front/router";

const routes = createRoutes();

export default renderFactory(() => {
  return {
    async renderToString(url, { criticalCss }) {
      const app = createSSRApp(App);
      await createRouter(app, routes, { url });
      const head = criticalCss
        .map(({ text }) => `<style>${text}</style>`)
        .join("\n");
      const html = await renderToString(app);
      return { head, html };
    },
  };
});
```

:::

`renderToString` receives:
- `url` - the URL being requested
- `criticalCss` - route-specific CSS extracted from the manifest graph

It must return:
- `head` - HTML to inject into `<head>` (typically critical CSS)
- `html` - the rendered application markup

SolidJS additionally requires a hydration script in `<head>` via
`generateHydrationScript()`, which bootstraps client-side reactivity during
hydration.

## 🎛️ Render Factory Arguments

Both `renderToString` and `renderToStream` receive the same arguments:

```ts
type SSROptions = {
  template: string;
  manifest: Record<string, SSRManifestEntry>;
  criticalCss: Array<{ text: string; path: string }>;
  request: IncomingMessage;
  response: ServerResponse;
};
```

| Property | Description |
|----------|-------------|
| `template` | Client `index.html` from the Vite build, containing `<!--app-head-->` and `<!--app-html-->` placeholders for SSR injection |
| `manifest` | Vite's `manifest.json` - the full dependency graph for client modules, dynamic imports, and associated CSS |
| `criticalCss` | Route-specific CSS chunks resolved by traversing the manifest graph |
| `request` | Node.js `IncomingMessage` for reading headers, cookies, locale, etc. |
| `response` | Node.js `ServerResponse` for setting headers, caching, redirects, or flushing streamed HTML |

### Critical CSS

Each `criticalCss` entry exposes:
- `text` - decoded CSS content
- `path` - browser-loadable asset path

Choose a delivery strategy based on your performance goals:

| Strategy | Benefit |
|----------|---------|
| `<style>${text}</style>` | Fastest first paint - no extra requests |
| `<link rel="stylesheet" href="${path}">` | Better cache reuse across pages |
| `<link rel="preload" as="style" href="${path}">` | Warm loading for deferred styles |

### Request / Response Access

Direct access to `request` and `response` enables advanced SSR control:

- Inspect headers (User-Agent, cookies, locale)
- Set custom response headers (caching, redirects)
- Flush HTML progressively in streaming mode

## 🌊 Stream Rendering

For progressive HTML delivery, implement `renderToStream`. The streaming API
differs per framework but follows the same pattern: split the template,
write the opening HTML, pipe the app stream, then finalize the response.

::: code-group

```ts [React · entry/server.ts]
import { renderToPipeableStream } from "react-dom/server";

import { renderFactory, createRoutes } from "_/front/entry/server";
import App from "@/front/App";
import createRouter from "@/front/router";

const routes = createRoutes({ withPreload: false });

export default renderFactory(() => {
  return {
    async renderToStream(url, { response, template, criticalCss }) {
      const router = await createRouter(App, routes, { url });

      const head = criticalCss
        .map(({ text }) => `<style>${text}</style>`)
        .join("\n");

      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");
      response.write(htmlStart.replace("<!--app-head-->", head));

      const { pipe } = renderToPipeableStream(router, {
        onShellReady() {
          pipe(response);
        },
        onShellError(error) {
          console.error("Shell error:", error);
          response.statusCode = 500;
          response.end();
        },
        onAllReady() {
          response.write(htmlEnd);
          response.end();
        },
      });
    },
  };
});
```

```ts [SolidJS · entry/server.ts]
import { renderToStream, generateHydrationScript } from "solid-js/web";

import { renderFactory, createRoutes } from "_/front/entry/server";
import App from "@/front/App";
import createRouter from "@/front/router";

const routes = createRoutes({ withPreload: false });

export default renderFactory(() => {
  const hydrationScript = generateHydrationScript();
  return {
    async renderToStream(url, { response, template, criticalCss }) {
      const router = await createRouter(App, routes, { url });

      const head = criticalCss.reduce(
        (head, { text }) => `${head}\n<style>${text}</style>`,
        hydrationScript,
      );

      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");
      response.write(htmlStart.replace("<!--app-head-->", head));

      const { pipe } = renderToStream(() => router);

      pipe(response, {
        onCompleteShell() {
          // shell ready - streaming begins
        },
        onCompleteAll() {
          response.write(htmlEnd);
          response.end();
        },
      });
    },
  };
});
```

```ts [Vue · entry/server.ts]
import { createSSRApp } from "vue";
import { renderToNodeStream } from "vue/server-renderer";

import { renderFactory, createRoutes } from "_/front/entry/server";
import App from "@/front/App.vue";
import createRouter from "@/front/router";

const routes = createRoutes();

export default renderFactory(() => {
  return {
    async renderToStream(url, { response, template, criticalCss }) {
      const app = createSSRApp(App);
      await createRouter(app, routes, { url });

      const head = criticalCss
        .map(({ text }) => `<style>${text}</style>`)
        .join("\n");

      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");
      response.write(htmlStart.replace("<!--app-head-->", head));

      const stream = renderToNodeStream(app);

      stream.on("data", (chunk) => response.write(chunk));
      stream.on("end", () => {
        response.write(htmlEnd);
        response.end();
      });
      stream.on("error", (err) => {
        console.error("SSR stream error:", err);
        response.statusCode = 500;
        response.end();
      });
    },
  };
});
```

:::

React uses `renderToPipeableStream` with `onShellReady`/`onAllReady` callbacks.
SolidJS uses `renderToStream` with `onCompleteShell`/`onCompleteAll`.
Vue uses `renderToNodeStream` with Node.js stream events.

**Always call `response.end()`** after streaming completes. Omitting it leaves
clients waiting indefinitely.

## 📦 Static Asset Handling

By default the SSR server loads client assets into memory at startup and serves
them on request. Disable this when running behind a reverse proxy that handles
static file delivery:

```ts [entry/server.ts]
export default renderFactory(() => {
  return {
    serveStaticAssets: false, // [!code ++]
    // ...
  };
});
```

## 🏗️ Production Build

::: code-group

```sh [pnpm]
pnpm build
```

```sh [npm]
npm run build
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
node dist/front/ssr/server.js -p 4553
```

Navigate to `http://localhost:4553` to verify server-side rendering.

## 🚀 Production Deployment

Deploy behind a reverse proxy such as Nginx or Caddy:

```nginx
upstream ssr_backend {
  server 127.0.0.1:4554;
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

- **Browser APIs unavailable during SSR.** Code executing server-side cannot access `window`, `document`, or browser-exclusive APIs. Use `isServer` checks or client-only lifecycle hooks.
- **Coordinate async data loading.** Suspense and resources work in SSR contexts, but complex async patterns require careful attention to ensure data is ready before rendering.
- **Bundle size still matters.** In SSR, initial bundle size affects server memory and startup time. The hydration bundle still downloads to clients, so optimization remains important.
- **Plan state serialization.** Applications with complex state require proper serialization for hydration. Each framework handles standard cases automatically, but custom stores or non-serializable data need special attention.
