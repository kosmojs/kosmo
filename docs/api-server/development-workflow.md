---
title: Development Workflow
description: Run multiple KosmoJS source folders independently with separate dev servers,
    automatic API hot-reload, custom middleware routing, and resource cleanup with teardown handlers.
head:
  - - meta
    - name: keywords
      content: vite dev server, hot reload, esbuild, rolldown, api development,
        multiple ports, teardown handler, development middleware, file watching
---

Each source folder runs as a standalone dev server on its own port.

Different concerns (marketing site, customer app, admin panel) stay isolated -
separate configs, separate builds, separate deploys.

## 🚀 Starting the Dev Server

```sh
pnpm dev          # all source folders
pnpm dev front    # specific folder (front, admin, app, etc.)
```

Default port is `4000`, configured in the source folder's `vite.config.ts`.

## 🔀 What Happens on Start

1. `esbuild` compiles `api/app.ts`
2. Vite's dev server starts, serving client pages with HMR
3. Requests are routed between Vite and your API based on `apiurl`
4. File watcher monitors API files for changes

On API file change: waits for write stability (default 1s) → rebuilds in a background worker thread →
swaps in the new handler. Vite stays responsive throughout.

**Rolldown note:** `KosmoJS` is watching [Rolldown](https://rolldown.rs/) as a potential
esbuild replacement - it aims to bring HMR to server-side code.
Until it stabilizes, full rebuilds via esbuild are the baseline.

## ⚙️ api/dev.ts

`api/dev.ts` exposes three hooks for customizing the dev experience.

### requestHandler

Returns the API request handler. Generated default:

::: code-group
```ts [Koa]
import { devSetup } from "_/front/api-factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return app.callback();
  },
});
```

```ts [Hono]
import { getRequestListener } from "@hono/node-server";
import { devSetup } from "_/front/api-factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return getRequestListener(app.fetch);
  },
});
```
:::

Override this for custom routing logic - WebSocket handling, multi-handler dispatch, etc.

### requestMatcher

Controls which requests go to your API vs Vite. Defaults to matching `apiurl` prefix:

```ts
export default devSetup({
  requestHandler() { return app.callback(); },

  requestMatcher(req) {
    return req.url?.startsWith("/api") ||
           req.headers["x-api-request"] === "true";
  },
});
```

### teardownHandler

Runs before each API reload. Use it to close connections and release resources
that would otherwise leak across rebuilds:

```ts
let dbConnection;

export default devSetup({
  requestHandler() { return app.callback(); },

  async teardownHandler() {
    if (dbConnection) {
      await dbConnection.close();
      dbConnection = undefined;
    }
  },
});
```

Without cleanup, frequent rebuilds during active development can exhaust database connections.

## 👀 Inspecting Routes

Each route returned by `createRoutes` has a `debug` property. Enable it via `DEBUG=api`:

```ts [api/router.ts]
import { routerFactory, routes } from "_/front/api";

const DEBUG = /\bapi\b/.test(process.env.DEBUG ?? ""); // [!code ++]

export default routerFactory(({ createRouter }) => {
  const router = createRouter();

  for (const { name, path, methods, middleware, debug } of routes) {
    if (DEBUG) console.log(debug.full); // [!code ++]
    router.register(path, methods, middleware, { name });
  }

  return router;
});
```

```sh
DEBUG=api pnpm dev
```

Example output:

```txt
 /api/users  [ users/index.ts ]
   methods: POST
middleware: slot: params; exec: useParams
            slot: validateParams; exec: useValidateParams
            slot: bodyparser; exec: async (ctx, next) => {
            slot: payload; exec: (ctx, next) => {
   handler: postHandler
```

Named middleware functions show by name; anonymous ones show their first line.
Name your middleware functions - it makes this output significantly easier to read.

Individual `debug` properties are also available for targeted output:
`debug.headline`, `debug.methods`, `debug.middleware`, `debug.handler`.

## ⚠️ Troubleshooting

**Port in use** - change it in `vite.config.ts`:
```ts
export default { server: { port: 4005 } }
```

**Unnecessary rebuilds from editor save behavior** - increase the stability threshold:
```ts
export default {
  server: { watch: { awaitWriteFinish: { stabilityThreshold: 1500 } } }
}
```

**API not rebuilding** - check the Vite terminal for build errors.
The watcher may be detecting changes but the build is failing silently.

**Slow rebuilds** - consider splitting across multiple source folders.
Each builds independently, so splitting reduces per-rebuild scope.
