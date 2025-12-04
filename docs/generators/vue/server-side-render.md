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

## 🎯 Default Rendering Mode

Every source folder contains a `entry/client.ts` file responsible for starting your application in the browser.
It runs in **both** client-side and server-rendered modes.

- In pure client-side rendering (CSR), it creates a standard `Vue` app instance
  and mounts it directly to the DOM.
- In server-side rendering (SSR), it hydrates HTML that was produced on the
  server, preserving the existing markup and attaching interactivity.

Here is the default implementation:

```ts [entry/client.ts]
import { createApp, createSSRApp } from "vue";

import { routes, shouldHydrate } from "@src/{vue}/client";
import App from "../App.vue";
import createRouter from "../router";

const root = document.getElementById("app");

if (root) {
  if (shouldHydrate) {
    const app = createSSRApp(App);
    await createRouter(app, routes);
    app.mount(root, true);
  } else {
    const app = createApp(App);
    await createRouter(app, routes);
    app.mount(root);
  }
} else {
  console.error("Root element not found!");
}
```

When SSR is active, `shouldHydrate` is set by the generated runtime.
The client entry hydrates the server-rendered markup **without re-rendering it**,
preserving the content the server already delivered.

During development, hydration is typically disabled so the workflow remains fast
and relies entirely on Vite's dev server and hot-module replacement.

## 🛠️ Enabling SSR

First, install the SSR generator:

::: code-group

```sh [pnpm]
pnpm install -D @kosmojs/ssr-generator
```

```sh [npm]
npm install -D @kosmojs/ssr-generator
```

```sh [yarn]
yarn add -D @kosmojs/ssr-generator
```

:::

Then update your source folder's `vite.config.ts`:

```ts [vite.config.ts]
import vue from "@vitejs/plugin-vue";
import devPlugin from "@kosmojs/dev";
import vueGenerator from "@kosmojs/vue-generator";
import ssrGenerator from "@kosmojs/ssr-generator";
import defineConfig from "../vite.base";

export default defineConfig(import.meta.dirname, {
  plugins: [
    vue({ ssr: true }),
    devPlugin(apiurl, {
      generators: [
        vueGenerator(),
        ssrGenerator(),
      ],
    }),
  ],
});
```

## 📄 Server Entry Point

When SSR is activated, `KosmoJS` generates `entry/server.ts` with the default
implementation:

```ts [entry/server.ts]
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";

import { routes } from "@src/{vue}/server";
import App from "../App.vue";
import createRouter from "../router";

export default {
  async factory(url) {
    const app = createSSRApp(App);
    await createRouter(app, routes, { url });
    return {
      async renderToString({ criticalCss }) {
        const head = criticalCss
          .map(({ text }) => `<style>${text}</style>`)
          .join("\n");

        const html = await renderToString(app);

        return { head, html };
      },
    };
  },
} satisfies import("@kosmojs/dev").SSRSetup;
```

This factory:

- receives the request URL
- creates a fresh SSR app instance
- prepares the router at the correct navigation state
- returns an object with `renderToString`, `renderToStream`, or both.

When both `renderToString` and `renderToStream` returned, stream rendering preffered.

### Static Asset Handling

When the SSR server initializes, it loads client assets into memory
and delivers them in response to incoming requests.

This behavior can be controlled via the `serveStaticAssets` export:

```ts [entry/server.ts]
export default {
  serveStaticAssets: false,
  async factory(url) {
    // ...
  },
} satisfies import("@kosmojs/dev").SSRSetup;
```

Setting this to `false` prevents asset loading at startup -
any static file requests will receive a `404 Not Found` response.

This setup works well when a reverse proxy like `Nginx` sits in front of your application
and handles static file delivery.

## 🎛️ Render Factory Arguments

The same argument object is provided to both `renderToString` and `renderToStream`:

```ts
type SSROptions = {
  template: string;
  manifest: Record<string, SSRManifestEntry>;
  criticalCss: Array<{ text: string; url: string }>;
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

- `url` — a browser-ready path to the stylesheet
- `text` — the stylesheet content, as plain text

You can tailor style delivery to your performance needs:

| Strategy | Benefit |
|----------|---------|
| `<style>${text}</style>` | Inlines styles for the quickest first paint |
| `<link rel="stylesheet" href="${url}">` | Leverages browser cache across page navigations |
| `<link rel="preload" as="style" href="${url}">` | Warms up styles for later application |

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

import { routes } from "@src/{vue}/server";
import App from "../App.vue";
import createRouter from "../router";

export default {
  async factory(url) {
    const app = createSSRApp(App);
    await createRouter(app, routes, { url });
    return {
      async renderToStream({ response, template, criticalCss }) {
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
  },
} satisfies import("@kosmojs/dev").SSRSetup;
```

> 💡 The streaming pattern and where you inject styles, preload links, or other
> head content depends on your HTML template structure. `KosmoJS` gives you the
> controls - you choose the right strategy for your environment.

Streaming is particularly useful when:

- pages load large amounts of async content
- first paint time matters for user experience
- reducing server memory pressure on large HTML payloads


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
dist/SOURCE_FOLDER/client/  🢂 static browser assets
dist/SOURCE_FOLDER/ssr/     🢂 server entry bundle
```

The server bundle can be executed on any Node.js environment.

## 🧪 Local Testing

Start the SSR server locally:

```sh
node dist/@front/ssr --port 4000
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

