---
title: Vue Generator - Server-Side Rendering (SSR)
description: Enable production-ready SSR for Vue 3 applications using KosmoJS structure and tooling.
    Includes server entry point and best practices for hydration and deployment.
head:
  - - meta
    - name: keywords
      content: vue ssr, server-side rendering, hydration, vue router ssr, production ssr, kosmojs ssr
---

By default, `KosmoJS` source folders render on the client using `Vite`'s fast dev
server and instant HMR.

When your application requires improved SEO, faster-perceived loading,
or better performance on low-end devices, SSR becomes beneficial -
especially for public-facing pages and marketing content.

The SSR generator provides the required server runtime,
while keeping your development workflow unchanged.

## 🛠️ Enabling SSR

Selecting SSR during source folder creation activates it automatically.

For folders created without SSR (or when adding SSR capabilities to existing setups),
manual activation is available through generator registration in your source folder's `vite.config.ts`:

```ts [vite.config.ts]
import vuePlugin from "@vitejs/plugin-vue";
import devPlugin from "@kosmojs/dev";
import {
  // ...
  vueGenerator,
  ssrGenerator, // [!code ++]
} from "@kosmojs/generators";

import defineConfig from "../vite.base";

export default defineConfig(import.meta.dirname, {
  plugins: [
    vuePlugin(),
    devPlugin(apiurl, {
      generators: [
        // ...
        vueGenerator(),
        ssrGenerator(), // add SSR support // [!code ++]
      ],
    }),
  ],
});
```

## 📄 Server Entry Point

When SSR is activated, `KosmoJS` generates `entry/server.ts` with the default implementation.

The `renderFactory` function on the server side orchestrates SSR rendering.

It accepts a callback that returns an object with rendering methods:
- `renderToString(url, { criticalCss })` - Default implementation that renders the complete page before transmission
- `renderToStream(url, { criticalCss })` - Optional advanced implementation for progressive streaming SSR

**Important:** Only `renderToString` is provided by default.
Streaming SSR requires manual `renderToStream` implementation.
When both methods exist, `renderToStream` takes precedence.

```ts [entry/server.ts]
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

    // Optional: implement renderToStream for streaming SSR
    // async renderToStream(url, { criticalCss }) {
    //   // Your streaming implementation here
    //   // If provided, this takes precedence over renderToString
    // },
  };
});
```

**Default implementation** - `renderToString` - is taking two arguments -
`URL` and `SSROptions` - and should return:

- `head` - HTML to inject into `<head>` (typically critical CSS)
- `html` - The rendered application markup

This approach renders pages completely and synchronously, returning the full HTML string.
For advanced scenarios requiring faster time-to-first-byte or handling large pages,
implement `renderToStream` for progressive content delivery (more on that later).

## 🎛️ Render Factory Arguments

The same two arguments provided to both `renderToString` and `renderToStream`:

- `URL` - The requested URL for server rendering
- `SSROptions` object

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
| `template` | The client-side `index.html` produced by `Vite`, with `<!--app-head-->` and `<!--app-html-->` markers for SSR content |
| `manifest` | Vite's `manifest.json` containing the full module graph - client entries, dynamic imports, and associated CSS |
| `criticalCss` | Route-matched CSS chunks extracted by walking the manifest graph |
| `request` | Node.js `IncomingMessage` for reading headers, cookies, locale, and other request data |
| `response` | Node.js `ServerResponse` for writing headers, controlling caching, issuing redirects, or streaming HTML |

### Critical CSS Usage

Each item in `criticalCss` exposes two properties:

- `text` - the stylesheet content, as plain text
- `path` - a browser-ready path to the stylesheet

You can tailor style delivery to your performance needs:

| Strategy | Benefit |
|----------|---------|
| `<style>${text}</style>` | Inlines styles for the quickest first paint |
| `<link rel="stylesheet" href="${path}">` | Leverages browser cache across page navigations |
| `<link rel="preload" as="style" href="${path}">` | Warms up styles for later application |

### Request/Response Access

Exposing `request` and `response` directly supports advanced SSR patterns:

- Examine request headers (User-Agent, cookies, locale)
- Configure response headers (caching rules, redirects)
- Write HTML incrementally for streaming responses

This flexibility lets you return complete HTML via `renderToString`
or manage the response stream directly with `renderToStream`.

## 🌊 Stream Rendering

For advanced use cases - such as sending HTML to the client while rendering is
still in progress - the SSR factory may export a `renderToStream` method.
Vue's server renderer supports streaming via Node and Web streams.

Below is an example implementation:

```ts [entry/server.ts]
import { createSSRApp } from "vue";
import { renderToNodeStream } from "vue/server-renderer";

import { renderFactory, createRoutes } from "_/front/entry/server";
import App from "@/front/App.vue";
import createRouter from "@/front/router";

const routes = createRoutes();

export default renderFactory(() => {
  return {
    async renderToStream(url, { criticalCss }) {
      const app = createSSRApp(App);
      await createRouter(app, routes, { url });

      const head = criticalCss
        .map(({ text }) => `<style>${text}</style>`)
        .join("\n");

      // Divide template at application insertion point
      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");

      // Send initial HTML with head content
      response.write(htmlStart.replace("<!--app-head-->", head));

      // Create the stream
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

> 💡 The streaming pattern and where you inject styles, preload links, or other
> head content depends on your HTML template structure. `KosmoJS` gives you the
> controls - you choose the right strategy for your environment.

Streaming is particularly useful when:

- pages load large amounts of async content
- first paint time matters for user experience
- reducing server memory pressure on large HTML payloads

## 📦 Static Asset Handling

Client assets are loaded into memory when the SSR server starts
and served automatically for incoming requests.

To disable this behavior, set `serveStaticAssets` to `false`:

```ts [entry/server.ts]
export default renderFactory(() => {
  return {
    serveStaticAssets: false, // [!code ++]
    // ...
  };
});
```

With this option disabled, the server skips asset loading entirely
and responds with `404 Not Found` for static file requests.

This configuration is ideal for deployments where a reverse proxy
such as `Nginx` handles static file delivery.

## 🏗️ Production Builds

Trigger a production SSR build with:

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

This produces two outputs:

```text
dist/SOURCE_FOLDER/client/  ➜ static browser assets
dist/SOURCE_FOLDER/ssr/     ➜ server entry bundle
```

The server bundle can be executed on any Node.js environment.

## 🧪 Local Testing

Start the SSR server locally:

```sh
node dist/front/ssr/server.js --port 4000
```

Then open:

```text
http://localhost:4000
```

Verify that:

- HTML is rendered server-side
- Interactivity appears after hydration

## 🚀 Deployment

Deploy behind a reverse proxy such as Nginx, Caddy, Traefik, or a managed load
balancer. Serve static assets from a CDN or your hosting provider for optimal
latency and throughput.

## 🔄 Development Experience

Your workflow remains fully client-side during development:

- `pnpm dev`
- `Vite` dev server handles requests + HMR
- No SSR server running locally

SSR is a **production-only** concern.

---

**Server runtime constraints**<br />
Avoid accessing browser-only globals (`window`, `document`) in SSR mode.
Use guards or client-entry hooks instead.

---

SSR unlocks real performance and SEO gains for `Vue` apps - and `KosmoJS` makes the
setup lightweight, predictable, and aligned with modern `Vue` best practices.
