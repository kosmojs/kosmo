---
title: React - Server-Side Rendering
description: Add SSR capabilities to React applications using KosmoJS SSR
  generator. Master string and stream rendering patterns, production builds,
  and deployment configurations for server-rendered React apps.
head:
  - - meta
    - name: keywords
      content: react ssr, server rendering react, react hydration,
        renderToString react, react router ssr, production rendering,
        stream rendering react
---

`React` source folders default to client-side rendering with Vite's dev server and HMR.

Enabling the SSR generator introduces production-ready server rendering
while preserving your familiar development experience.

## 🛠️ Adding SSR Support

SSR is automatically enabled if you selected it during source folder creation.

If you didn't enable SSR initially (or want to add it to an existing folder),
you can enable it manually by registering the generator in your source folder's `vite.config.ts`:


```ts [vite.config.ts]
import reactPlugin from "@vitejs/plugin-react";
import devPlugin from "@kosmojs/dev";
import {
  reactGenerator,
  ssrGenerator, // [!code ++]
} from "@kosmojs/generators";

import defineConfig from "../vite.base";

export default defineConfig(import.meta.dirname, {
  plugins: [
    reactPlugin(),
    devPlugin(apiurl, {
      generators: [
        // ...
        reactGenerator(),
        ssrGenerator(), // [!code ++]
      ],
    }),
  ],
});
```

## 📄 Server Entry Implementation

The SSR generator creates `entry/server.ts` with a default server rendering implementation.

The `renderFactory` function on the server side takes a callback that returns an object with rendering methods:
- `renderToString(url, { criticalCss })` - Default implementation that renders the entire page before sending it
- `renderToStream(url, { criticalCss })` - Optional advanced implementation for streaming SSR with progressive rendering

**Important:** Only `renderToString` is provided by default. If you need streaming SSR, you must implement `renderToStream` yourself. When both are provided, `renderToStream` takes precedence.

```ts [entry/server.ts]
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

**How it works:**

`renderToString` function receives:
- `url` - The URL being requested for server rendering
- `criticalCss` - Array of critical CSS extracted from your components

It must return:
- `head` - HTML to inject into `<head>` (typically critical CSS)
- `html` - The rendered application markup

The default `renderToString` implementation renders the entire page synchronously
and returns it as a complete HTML string.

For more advanced scenarios like faster time-to-first-byte or handling large pages,
you can implement `renderToStream` to send content progressively (more on that later).

## 🎛️ Render Factory Arguments

Both `renderToString` and `renderToStream` receive the same arguments:
  - the current request URL
  - the `SSROptions` object

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
| `template` | The original client `index.html` from `Vite` build, containing `<!--app-head-->` and `<!--app-html-->` placeholders for SSR content injection |
| `manifest` | Vite's `manifest.json` - the full dependency graph for client modules, dynamic imports, and related CSS |
| `criticalCss` | Route-specific CSS chunks resolved from the manifest graph |
| `request` | Node.js `IncomingMessage` for inspecting headers, cookies, locale, etc. |
| `response` | Node.js `ServerResponse` for setting headers, caching, redirects, or flushing streamed HTML |

### Critical CSS Usage

Each `criticalCss` entry provides both the asset URL and the decoded content:

- `text` - decoded CSS content
- `path` - browser-loadable asset path

This gives you flexibility in how styles are delivered:

| Strategy | Benefit |
|----------|---------|
| `<style>${text}</style>` | Fastest first paint - no extra requests |
| `<link rel="stylesheet" href="${path}">` | Better cache reuse across pages |
| `<link rel="preload" as="style" href="${path}">` | Warm loading for deferred styles |

### Request/Response Access

The raw `request` and `response` objects enable advanced SSR control:

- Inspect headers (User-Agent, cookies, locale)
- Set custom response headers (caching, redirects)
- Flush HTML progressively in streaming mode

This allows renderers to choose between high-level HTML return (`renderToString`) or low-level streaming control (`renderToStream`).

## 🔤 String-Based Rendering

The `renderToString` approach offers simplicity and works well for most SSR scenarios:

```ts
renderToString(url, SSROptions): SSRStringReturn
```

It takes URL and `SSROptions` as arguments and returns a `SSRStringReturn` object:

```ts
type SSRStringReturn = {
  head?: string;  // Optional <head> content (scripts, meta, styles)
  html: string;   // Complete rendered application markup
};
```

The `head` property is optional, but including the provided `criticalCss` is recommended
to avoid render-blocking stylesheets and improve first paint performance.

The default implementation leverages React Router's static handler to prepare routing context,
then uses React's `renderToString` to generate the complete HTML in a single pass.

## 🌊 Stream Rendering

For advanced use cases requiring progressive HTML delivery, implement the `renderToStream` method.

It also takes the URL and `SSROptions` as arguments and supposed to implement app-specific streaming strategy.

A typical streaming pattern divides the template and progressively writes chunks:

```ts [entry/server.ts]
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

      // Divide template at application insertion point
      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");

      // Send initial HTML with head content
      response.write(htmlStart.replace("<!--app-head-->", head));

      // Create pipeable stream
      const { pipe } = renderToPipeableStream(
        router,
        {
          onShellReady() {
            // Stream application HTML
            pipe(response);
          },
          onShellError(error) {
            console.error("Shell error:", error);
            response.statusCode = 500;
            response.end();
          },
          onAllReady() {
            // Append closing HTML
            response.write(htmlEnd);
            response.end(); // Essential: Close the response
          },
        }
      );
    },
  };
});
```

**Essential:** Always invoke `response.end()` after streaming completes.
Omitting this call leaves clients waiting indefinitely for additional data.

React's `renderToPipeableStream` provides sophisticated streaming with
suspense boundary support, but implementation details remain your choice
based on application requirements.

## 📦 Static Asset Handling

By default, the SSR server loads client assets into memory at startup and serves them on request.

You can control this behavior via `serveStaticAssets` option:

```ts [entry/server.ts]
export default renderFactory(() => {
  return {
    serveStaticAssets: false, // [!code ++]
    // ...
  };
});
```

When set to `false`, static assets won't be loaded and requests for them will return `404 Not Found`.
This is recommended when running behind a reverse proxy (like Nginx) that handles static file serving.

## 🏗️ Production Build Process

Generate your SSR bundle using the standard build command:

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

This produces an SSR-ready bundle at `dist/SOURCE_FOLDER/ssr/` containing `server.js` for production execution.

## 🧪 Local Testing Before Deployment

Test your SSR bundle locally before production deployment.
The server accepts port or socket configuration:

**Port-based execution:**

```sh
node dist/front/ssr -p 4000
# or
node dist/front/ssr --port 4000
```

**Socket-based execution:**

```sh
node dist/front/ssr -s /tmp/app.sock
# or
node dist/front/ssr --sock /tmp/app.sock
```

Navigate to `http://localhost:4000` to verify proper server-side rendering.

## 🚀 Production Infrastructure

Deploy the SSR bundle behind a reverse proxy like nginx or Caddy.
Example nginx configuration:

```nginx
upstream react_ssr {
  server 127.0.0.1:4000;
  # or socket-based:
  # server unix:/tmp/app.sock;
}

server {
  listen 80;
  server_name myapp.com;

  location / {
    proxy_pass http://react_ssr;
  }
}
```

This configuration properly forwards requests while maintaining appropriate
headers and connection upgrades.

## 🔄 Unchanged Development Experience

The SSR generator preserves your development workflow. During development:

- Execute `pnpm dev` normally
- `Vite` handles all requests with hot module replacement (HMR)
- Client-side rendering provides immediate feedback
- Complete development experience remains intact

Server-side rendering activates exclusively in production builds, delivering
optimal development velocity alongside production-ready server rendering.

## 💡 Production Guidelines

**Validate locally before deploying.** Always test your production bundle
locally, verifying correct rendering before deploying to live servers.

**Implement streaming for content-heavy pages.** Applications generating
substantial HTML or executing complex data operations benefit from
`renderToStream`. Progressive rendering improves perceived performance as
content arrives incrementally.

**Monitor process resources.** SSR maintains persistent Node.js processes.
Track memory consumption and implement robust error handling to prevent
resource leaks.

**Deploy caching strategically.** Position a CDN or cache layer before your
SSR server for infrequently changing routes. This reduces server load and
accelerates response delivery.

**Implement comprehensive error handling.** Add error boundaries throughout
your application and proper error handling in server entry points. Server
errors shouldn't terminate entire processes.

**Leverage multiple source folders instead of hybrid rendering.** Avoid
complex route-level SSR/CSR switching logic within a single source folder.
Instead, utilize `KosmoJS`'s architectural strength: create separate source
folders for different purposes. Deploy SSR for your marketing folder to
maximize SEO performance, while maintaining CSR in your customer application
folder for optimal interactivity. This separation delivers cleaner codebases,
straightforward maintenance, and embodies `KosmoJS`'s core principle - each
application concern occupies its own domain with the most suitable rendering
approach.

## ⚠️ Technical Considerations

**Browser-specific APIs unavailable.** Code executing during SSR cannot
access `window`, `document`, or browser-exclusive APIs. Use conditional
checks or lifecycle methods that execute client-side only.

**Coordinate asynchronous data loading.** React's Suspense works in SSR
contexts, but ensure data fetching completes before rendering. The framework
handles most cases, though complex async patterns require careful attention.

**Bundle optimization remains important.** In SSR, initial bundle size
affects server memory and process startup time rather than user download
duration. However, the hydration bundle downloads to clients, making
optimization crucial.

**Plan state serialization carefully.** Applications with complex state
require proper serialization for hydration. `React` handles standard cases
automatically, but custom state management or non-serializable data needs
special handling.
