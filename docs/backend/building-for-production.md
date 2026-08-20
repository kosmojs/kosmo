---
title: Building for Production
description: Build and deploy KosmoJS applications to production with independent source folder builds,
    deployment strategies for containers, serverless, and edge runtimes.
head:
  - - meta
    - name: keywords
      content: vite build, production deployment, docker deployment,
        serverless api, edge runtime, nodejs deployment, api bundling, source maps
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

## Running in Production

The simplest deployment - just run the bundled server directly:

```sh
node dist/front/api/server.js
```

For more control, use the app factory at `dist/*/api/app.js`.

**Hono / H3** - `app.fetch` is a Web Fetch API handler, so it plugs into each runtime's native server directly:

::: code-group
```js [Hono on Node]
import { createServer } from "node:http";
import { getRequestListener } from "@hono/node-server";

import app from "./dist/front/api/app.js";

createServer(getRequestListener(app.fetch)).listen(3000);
```

```js [H3 on Node]
import { createServer } from "node:http";
import { toNodeHandler } from "h3/node";

import app from "./dist/front/api/app.js";

createServer(toNodeHandler(app)).listen(3000);
```

```ts [Deno]
import app from "./dist/front/api/app.js";

Deno.serve({ port: 3000 }, app.fetch);
```

```ts [Bun]
import app from "./dist/front/api/app.js";

Bun.serve({ port: 3000, fetch: app.fetch });
```
:::

**Koa** - `app.callback()` is a Node.js `(IncomingMessage, ServerResponse)` handler.
Deno and Bun support it via their `node:http` compat layer, not via their native serve APIs:

```js [Node / Deno / Bun]
import { createServer } from "node:http";

import app from "./dist/front/api/app.js";

createServer(app.callback()).listen(3000);
```

Or use `app.listen()` directly for Node only support:

```js [Node]
import app from "./dist/front/api/app.js";

app.listen(3000);
```
