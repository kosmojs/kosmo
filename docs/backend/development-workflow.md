---
title: Development Workflow
description: Run multiple KosmoJS source folders independently with separate dev servers,
    automatic API hot-reload, custom middleware routing, and resource cleanup with teardown handlers.
head:
  - - meta
    - name: keywords
      content: vite dev server, hot reload, rolldown, api development,
        multiple ports, teardown handler, development middleware, file watching
---

Each source folder serves a specific concern - marketing site, customer app, admin, etc.

Yet, development workflow is identical.

## Starting the Dev Server

```sh
pnpm dev          # all source folders
pnpm dev front    # specific folder (front, admin, app, etc.)
```

Default port is `4556`, configured as `devPort` in `package.json`.

## What Happens on Start

1. `Vite` compiles `api/app.ts`
2. Dev server starts, serving both client pages and your API routes
3. Requests are routed between Vite and your API
4. File watcher monitors API files for changes

## Hot Reload vs HMR

The two sides of a source folder reload differently:

- **Client**: HMR - changed modules are patched in place, component state survives the edit.
- **API**: hot reload - on change, the API *program* restarts as a whole.
There is no HMR for the backend, and reloads fire on more than route edits
(config changes, shared types etc.)

A full restart means module-level state resets on every reload.
This is by design, not a limitation to work around:
a backend should be stateless, in development for fast reliable reloads
and in production so it can restart, scale, and run as multiple instances.

Keep anything that must survive a restart in a real store from day one -
the dev reload cycle is simply an early rehearsal of what production restarts do anyway.

What *does* need care across reloads is resources: open connections leak when
the program restarts around them. Close them in the [`teardownHandler`](#teardownhandler) hook.

## api/dev.ts

`api/dev.ts` exposes three hooks for customizing the dev experience.

### requestHandler

Returns the API request handler. Generated default:

:::tabs key:backend variant:code
== Hono
```ts
import { getRequestListener } from "@hono/node-server";

import { devSetup } from "_/api:factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return getRequestListener(app.fetch);
  },
});
```

== H3
```ts
import { toNodeHandler } from "h3/node";

import { devSetup } from "_/api:factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return toNodeHandler(app);
  },
});
```

== Koa
```ts
import { devSetup } from "_/api:factory";
import app from "./app";

export default devSetup({
  requestHandler() {
    return app.callback();
  },
});
```
:::

Override this for custom routing logic - WebSocket handling, multi-handler dispatch, etc.

### requestMatcher

Controls which requests go to your API vs Vite.

```ts
export default devSetup({
  requestHandler() {
    // ...
  },

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
  requestHandler() {
    // ...
  },

  async teardownHandler() {
    if (dbConnection) {
      await dbConnection.close();
      dbConnection = undefined;
    }
  },
});
```

Without cleanup, frequent rebuilds during active development can exhaust database connections.

## Inspecting Routes

Routes can be inspected by providing `debug` option to `appFactory` in `api/app.ts`
(omitted by default, feel free to add it as needed):

```ts [api/app.ts]
import appFactory, { routes } from "_/api:factory";
import defaultErrorHandler from "./errors";

export default appFactory(
  routes,
  { debug: true }, // [!code ++]
  ({ app }) => {
  // ...
})
```

Example output:

```txt
      /api  [ index/index.ts ]
   methods: GET|HEAD
middleware: slot: @extendContext useExtendContext
            slot: validate:params useValidateParams
   handler: indexHandler
```

> Named middleware functions show by name; anonymous ones show their first line.
Name your middleware functions - it makes this output significantly easier to read.

Individual `debug` properties are also available for targeted output:
`headline`, `methods`, `middleware`, `handler`.

Use this to display only headline:

```ts
export default appFactory(routes, { debug: "headline" }, ({ app }) => {
  // ...
})
```

If you rather need a custom logger, provide a function instead;
it will be provided with full debug object and the route itself.

```ts [api/app.ts]
export default appFactory(
  routes,
  {
    debug(log, route) {
      console.log(log.full);
    },
  },
  ({ app }) => {
    // ...
  },
);
```

The `log` signature:

```ts
{
  headline: string;
  methods: string;
  middleware: string;
  handler: string;
  full: string;
}
```
