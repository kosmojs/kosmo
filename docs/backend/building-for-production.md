---
title: Building for Production
description: Build and deploy KosmoJS applications to production with independent source folder builds,
    deployment strategies for containers, serverless, and edge runtimes.
head:
  - - meta
    - name: keywords
      content: vite build, production deployment, docker deployment,
        serverless api, edge runtime, nodejs deployment, api bundling, source maps, ssr deployment
---

Each source folder builds independently.

```sh
pnpm build          # all source folders
pnpm build front    # specific folder
```

## Build Output

```txt
dist/
└── front
    ├── api
    │   ├── app.js       # app instance
    │   └── server.js    # ready-to-use API server
    ├── client
    │   ├── assets/      # scripts, styles, images
    │   └── index.html
    └── ssr
        ├── app.js       # SSR app instance
        └── server.js    # SSR server bundle
```

The SSR output is only present when [SSR is enabled](/frontend/server-side-render).

## What to Deploy

What you deploy depends on how the folder renders:

- **SSR folders - deploy the SSR server only.** The build bundles the folder's backend *into* the SSR server:
one process serves the client assets, renders pages, and answers API requests.
During server-side rendering, the [isomorphic fetch client](/fetch/integration) calls your route handlers in-process -
no network hop, no localhost round-trip.
After hydration, the same server answers the browser's API calls over HTTP
through a built-in gateway that routes everything under the folder's `apiBase` to the bundled backend.

```sh
node dist/front/ssr/server.js -p 4556   # pages + API, one process
```

There is nothing else to run - `dist/front/api/server.js` exists in the build output,
but deploying it alongside the SSR server would just duplicate the API.

- **CSR folders - deploy the API server, serve the client statically.**
The browser is the only consumer of your API here, and it reaches it over the network:
run `dist/front/api/server.js` and put `dist/front/client/` behind any static host or CDN.

- **API-only folders** (no frontend) - deploy the API server, same as CSR minus the static assets.

## Running the API server

For CSR and API-only setups, the simplest deployment is running the bundled server directly:

:::tabs key:runtime variant:code
== Node
```sh
node dist/front/api/server.js -p 4556
```

== Bun
```sh
bun dist/front/api/server.js -p 4556
```

== Deno
```sh
deno run -A dist/front/api/server.js -p 4556
```
:::

For more control, use the app factory at `dist/*/api/app.js`.

**Hono / H3** - `app.fetch` is a Web Fetch API handler, so it plugs into each runtime's native server directly:

:::tabs variant:code
== Hono on Node
```js
import { createServer } from "node:http";
import { getRequestListener } from "@hono/node-server";

import app from "./dist/front/api/app.js";

createServer(getRequestListener(app.fetch)).listen(3000);
```

== H3 on Node
```js
import { createServer } from "node:http";
import { toNodeHandler } from "h3/node";

import app from "./dist/front/api/app.js";

createServer(toNodeHandler(app)).listen(3000);
```

== Deno
```ts
import app from "./dist/front/api/app.js";

Deno.serve({ port: 3000 }, app.fetch);
```

== Bun
```ts
import app from "./dist/front/api/app.js";

Bun.serve({ port: 3000, fetch: app.fetch });
```
:::

**Koa** - `app.callback()` is a Node.js `(IncomingMessage, ServerResponse)` handler.
Deno and Bun support it via their `node:http` compat layer, not via their native serve APIs:

```js [Node / Bun / Deno ~vscode-icons:file-type-js~]
import { createServer } from "node:http";

import app from "./dist/front/api/app.js";

createServer(app.callback()).listen(3000);
```

Or use `app.listen()` directly for Node only support:

```js [Node ~vscode-icons:file-type-js~]
import app from "./dist/front/api/app.js";

app.listen(3000);
```
