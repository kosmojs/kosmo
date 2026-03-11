---
title: Building for Production
description: Build and deploy KosmoJS applications to production with independent source folder builds,
    esbuild configuration, deployment strategies for containers, serverless, and edge runtimes.
head:
  - - meta
    - name: keywords
      content: vite build, production deployment, esbuild configuration, docker deployment,
        serverless api, edge runtime, nodejs deployment, api bundling, source maps
---

Each source folder builds independently.

```sh
pnpm build          # all source folders (parallel)
pnpm build front    # specific folder
```

## 📦 Build Output

```txt
dist/
└── front
    ├── api
    │   ├── app.js       # app factory (Koa) / app instance (Hono)
    │   └── server.js    # bundled API server
    ├── client
    │   ├── assets/      # scripts, styles, images
    │   └── index.html
    └── ssr
        ├── app.js       # SSR app factory (Vite)
        └── server.js    # SSR server bundle
```

The SSR output is only present when [SSR is enabled](/frontend/server-side-render).

## 🚀 Running in Production

The simplest deployment - just run the bundled server directly:

```sh
node dist/front/api/server.js
```

For more control, use the app factory at `dist/*/api/app.js`.

**Koa** - `app.callback()` is a Node.js `(IncomingMessage, ServerResponse)` handler.
Deno and Bun support it via their `node:http` compat layer, not via their native serve APIs:

```js [Node / Deno / Bun]
import { createServer } from "node:http";

import app from "./dist/front/api/app.js";

createServer(app.callback()).listen(3000);
```

**Hono** - `app.fetch` is a Web Fetch API handler, so it plugs into each runtime's native server directly:

::: code-group
```js [Node]
import { createServer } from "node:http";
import { getRequestListener } from "@hono/node-server";

import app from "./dist/front/api/app.js";

createServer(getRequestListener(app.fetch)).listen(3000);
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

## ⚙️ Build Configuration

API builds use `esbuild.json` at the project root:

```json
{
  "bundle": true,
  "platform": "node",
  "target": "node22",
  "format": "esm",
  "packages": "external",
  "sourcemap": "linked",
  "logLevel": "info"
}
```

`bundle: true` is enforced for production - it can't be disabled.
Common things to tune: `target` (Node version), `sourcemap` (`linked`/`inline`/`false`),
`logLevel` verbosity.

## ⚠️ Troubleshooting

**Build fails** - check `esbuild.json` syntax, verify all imports are resolvable,
review terminal output.

**API crashes on startup** - verify environment variables are set,
confirm Node.js version matches `target` in `esbuild.json`, check DB/service connections.

**Bundle growing large** - review dependencies and mark stable ones as `external`
in `esbuild.json`.
