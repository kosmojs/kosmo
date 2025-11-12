---
title: SolidJS - Server-Side Rendering (SSR)
description: Enable SSR for SolidJS applications with KosmoJS SSR generator.
    earn string and stream rendering, production builds, deployment strategies,
    and best practices for server-side rendered applications.
head:
  - - meta
    - name: keywords
      content: server-side rendering, ssr, solidjs ssr, renderToString,
        renderToStream, ssr deployment, hydration, production ssr
---

By default, source folders use client-side rendering with Vite's stellar dev server and HMR.
When you need SSR for production deployments, the SSR generator adds the necessary infrastructure
while keeping your development workflow unchanged.

## 🎯 Default Client-Side Rendering

When you create a source folder, KosmoJS generates an `entry/client.tsx` file that handles client-side rendering:

```tsx [entry/client.tsx]
import { hydrate, render } from "solid-js/web";

import { shouldHydrate } from "@front/{solid}";
import Router from "../router";

const root = document.getElementById("app");

if (root) {
  shouldHydrate ? hydrate(Router, root) : render(Router, root);
} else {
  console.error("Root element not found!");
}
```

The `shouldHydrate` flag ensures hydration only happens when the page was server-rendered.
During development with client-side rendering, this flag is `false` and the app uses standard `render`.

In production SSR builds, it's `true` and the app uses `hydrate` to attach event listeners to the server-rendered HTML.

This is the default rendering mode and works perfectly with Vite's dev server,
providing instant HMR and all the developer experience benefits you expect from modern tooling.

## 🛠️ Enabling SSR

To enable SSR, install the SSR generator:

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

Add the generator to your source folder's `vite.config.ts` and enable SSR in the Solid plugin:

```ts [vite.config.ts]
import solidPlugin from "vite-plugin-solid";
import devPlugin from "@kosmojs/dev";
import solidGenerator from "@kosmojs/solid-generator";
import ssrGenerator from "@kosmojs/ssr-generator";
import defineConfig from "../vite.base";

export default defineConfig(import.meta.dirname, {
  plugins: [
    solidPlugin({ ssr: true }), // Enable SSR in Solid plugin
    devPlugin(apiurl, {
      generators: [
        solidGenerator(),
        ssrGenerator(), // Add SSR generator
        // other generators...
      ],
    }),
  ],
});
```

## 📄 Server Entry Point

Once the SSR generator is added, it creates an `entry/server.ts` file with the default implementation:

```ts [entry/server.ts]
import { renderToString, generateHydrationScript } from "solid-js/web";
import Router from "../router";

const renderFactory: import("@kosmojs/dev").SSRFactory = (url) => {
  const head = generateHydrationScript();
  return {
    renderToString() {
      const html = renderToString(() => Router({ url }));
      return { head, html };
    },
  };
};

export default renderFactory;
```

This file must default export a factory function that:

1. Accepts a URL string (the request path)
2. Returns an object with either `renderToString` or `renderToStream` methods (or both)

If both methods are provided, `renderToString` takes priority.

## 🔤 String Rendering

The `renderToString` method is the simpler approach, suitable for most SSR use cases:

```ts
renderToString(): SSRStringReturn
```

It takes no arguments and returns an object containing:

```ts
type SSRStringReturn = {
  head?: string;  // Content for <head> section (scripts, meta tags, etc.)
  html: string;   // The rendered application HTML
};
```

The default implementation uses SolidJS's `renderToString` to generate the complete HTML in one pass,
along with the hydration script for the `<head>` section.

## 🌊 Stream Rendering

For more advanced scenarios where you want to stream HTML to the client as it's generated,
implement the `renderToStream` method:

```ts
type SSRStream = (
  req: IncomingMessage,
  res: ServerResponse,
  opt: {
    template: string;
    manifest: Record<string, {
      file: string;
      css?: Array<string>;
      assets?: Array<string>;
    }>;
  },
) => void | Promise<void>;
```

This method receives:

- **req** - The incoming HTTP request
- **res** - The server response object
- **opt** - An object containing:
  - `template` - Copy of your `index.html` with `<!--app-head-->` and `<!--app-html-->` directives
  - `manifest` - Vite's build manifest mapping module IDs to built assets

### Stream Rendering Pattern

The template contains two directives that you need to replace:

- `<!--app-head-->` - Where head content (scripts, styles) should go
- `<!--app-html-->` - Where the application HTML should be inserted

A common pattern is to split the template and stream in chunks:

```ts [entry/server.ts]
import { renderToStream, generateHydrationScript } from "solid-js/web";
import Router from "../router";

const renderFactory: import("@kosmojs/dev").SSRFactory = (url) => {
  // Generate head content
  const head = generateHydrationScript();

  return {
    renderToStream(req, res, { template, manifest }) {
      // Split template at the app HTML insertion point
      const [htmlStart, htmlEnd] = template.split("<!--app-html-->");

      // Send the start of HTML with head content
      res.write(htmlStart.replace("<!--app-head-->", head));

      // Stream the application HTML and write chunks ro res

      // Critical: Always call res.end() after all chunks added
      res.end();
    },
  };
};

export default renderFactory;
```

**Critical:** You must call `res.end()` when streaming is complete.
Without it, the client will wait indefinitely for more data.

Modern frameworks like SolidJS provide pipeable streams that make streaming straightforward,
but the implementation details are yours to choose based on your application's needs.

## 🏗️ Building for Production

Build your SSR application with the standard build command:

```sh
pnpm build @front
```

This creates an SSR bundle in `dist/@front/ssr/` containing an `index.js` file ready to run in production.

## 🧪 Testing the SSR Build Locally

Before deploying to production, test your SSR build locally. The SSR server accepts either a port or socket argument:

**Using a port:**

```sh
node dist/@front/ssr -p 4000
# or
node dist/@front/ssr --port 4000
```

**Using a Unix socket:**

```sh
node dist/@front/ssr -s /tmp/app.sock
# or
node dist/@front/ssr --sock /tmp/app.sock
```

Visit `http://localhost:4000` to verify your application renders correctly on the server.

## 🚀 Production Deployment

The SSR bundle is designed to work behind a reverse proxy like nginx or Caddy. A typical nginx configuration:

```nginx
upstream ssr_backend {
  server http://127.0.0.1:4000;
  # or use a socket:
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

This configuration forwards requests to your SSR server while properly handling headers and connection upgrades.

## 🔄 Development Workflow

The SSR generator doesn't change your development workflow. During development:

- Run `pnpm dev @front` as usual
- Vite dev server handles requests with HMR
- Client-side rendering provides instant feedback
- Full developer experience remains unchanged

SSR only activates in production builds, giving you the best of both worlds:
fast development iteration and production-ready server rendering.

## 💡 Best Practices

**Test SSR locally before deployment.** Always run your built SSR bundle locally
and verify it renders correctly before deploying to production servers.

**Use streaming for large pages.** If your application generates significant HTML
or has long data-fetching chains, implement `renderToStream` for better perceived performance.
Users see content faster as it streams in.

**Monitor memory usage.** SSR keeps Node.js processes running continuously.
Monitor memory consumption and implement proper error handling to prevent memory leaks.

**Leverage caching.** Place a CDN or caching layer in front of your SSR server
for routes that don't change frequently. This reduces server load and improves response times.

**Handle errors gracefully.** Implement error boundaries in your application
and proper error handling in your server entry point. Server errors shouldn't crash the entire process.

**Consider source folder separation over hybrid rendering.** Rather than
implementing complex route-level SSR/CSR switching within a single source
folder, leverage KosmoJS's separation of concerns principle. Create one
source folder for marketing content with SSR enabled, and another for your
customer application using CSR. This architectural approach is cleaner, more
maintainable, and aligns with KosmoJS's organizational philosophy - each
concern gets its own space with appropriate rendering strategy.

## ⚠️ Limitations and Considerations

**Browser APIs aren't available.** Code that runs during SSR can't access `window`, `document`,
or other browser-specific APIs. Use `isServer` checks or lifecycle methods that only run on the client.

**Async data fetching needs coordination.** SolidJS's resources and suspense work in SSR,
but ensure your data fetching completes before rendering.
The framework handles this, but complex async patterns require attention.

**Bundle size matters differently.** In SSR, initial bundle size affects server memory
and startup time rather than user download time.
However, the hydration bundle still downloads to clients, so optimization remains important.

**State serialization requires planning.** If your application has complex state,
ensure it serializes correctly for hydration. SolidJS handles most cases automatically,
but custom stores or non-serializable data need special attention.

