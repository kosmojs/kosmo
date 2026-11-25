---
title: Development Workflow
description: The KosmoJS dev server - HMR for client code, hot reload for the API,
    custom request routing, and resource cleanup with teardown handlers.
head:
  - - meta
    - name: keywords
      content: vite dev server, hmr, hot reload, rolldown, client development, api development,
        multiple ports, teardown handler, development middleware, file watching
---

Each source folder serves a specific concern - marketing site, customer app, admin, etc.

Yet, development workflow is identical.

One dev server covers both sides of a folder. Client modules go through `Vite` with `HMR`;
API routes run in the same process and hot-reload on change.

There is no second command to start and no proxy to configure - requests are dispatched between the two by path.

## Starting the Dev Server

```sh
pnpm dev          # all source folders
pnpm dev front    # specific folder (front, admin, app, etc.)
```

Listens on [kosmo.devHost](/essentials/config#project-settings-package-json).

## What Happens on Start

1. Blank route and page files are seeded.
2. `Vite` compiles `api/dev.ts` and what it imports - each route comes later,
with its [first request](#routes-load-on-first-request)
3. Dev server starts, serving both client pages and your API routes
4. Requests are routed between Vite and your API by the folder's `backend.base`
5. File watchers monitor client modules and API files for changes

## Dev Renders Client-Side

`pnpm dev` is always `Vite` + `HMR` + client-side rendering,
even when folder has [SSR enabled](/frontend/server-side-render).

Server rendering happens in the production build,
so there is no server-rendered markup to look at while the dev server is running.
This catches people out coming from Next/Nuxt/TanStack Start,
where dev mirrors production rendering.

To see, test or debug anything server-rendered, run [kosmo preview](/dev-build-run/production-preview).
It serves the real production build and still reloads when you edit a file.

## Hot Reload vs HMR

The two sides of a source folder reload differently:

- **Client**: HMR - changed modules are patched in place, component state survives the edit.
A component, a style, a page - the browser updates without a navigation.
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
the program restarts around them. Close them in the [teardownHandler](#teardownhandler) hook.

## Config and Env Changes

Config and [env files](/essentials/env-files) are read once, at startup.
So saving `kosmo.config.ts`, the root `package.json` or an env file
restarts the dev server as a whole, in a fresh process.
[Details&nbsp;›](/cli/serve#restarts-on-config-change)

## api/dev.ts

`api/dev.ts` is where the API side of the dev server is wired up.
It default-exports `devSetup(factory)`, and the factory builds the app the dev server runs.
Seeded default:

:::tabs key:backend variant:code
== Hono
```ts
// Hono: api/dev.ts
import { getRequestListener } from "@hono/node-server";

import { devSetup } from "_/api:dev";

export default devSetup(async () => {
  // imported here, so the app loads with the first API request rather than at start
  const { default: app } = await import("./app");
  return {
    requestHandler: getRequestListener(app.fetch),
    teardownHandler() {
      // close db connections, server sockets etc.
    },
  };
});
```

== H3
```ts
// H3: api/dev.ts
import { toNodeHandler } from "h3/node";

import { devSetup } from "_/api:dev";

export default devSetup(async () => {
  // imported here, so the app loads with the first API request rather than at start
  const { default: app } = await import("./app");
  return {
    requestHandler: toNodeHandler(app),
    teardownHandler() {
      // close db connections, server sockets etc.
    },
  };
});
```

== Koa
```ts
// Koa: api/dev.ts
import { devSetup } from "_/api:dev";

export default devSetup(async () => {
  // imported here, so the app loads with the first API request rather than at start
  const { default: app } = await import("./app");
  return {
    requestHandler: app.callback(),
    teardownHandler() {
      // close db connections, server sockets etc.
    },
  };
});
```
:::

## The Factory Runs on First Request

The dev server evaluates `api/dev.ts` when it starts,
and runs the factory on the first API request after that, once per program.
Every request after it is answered by the handler the factory returned.

The seeded factory imports `api/app.ts` itself, rather than `api/dev.ts` importing it on top.
So `api/app.ts` and the modules it imports are loaded by the first API request.

A module failing at its top level, a database that is not up yet,
fails that run rather than the dev server's start.

`devSetup` comes from `_/api:dev`, which loads nothing of the app:
the router and the routes table load with the app, on the first API request.

Requests arriving while the factory runs wait for it.
A factory that throws is reported once, and the API answers `503` until the next save.

## Routes Load on First Request

`appFactory` registers every route and imports none of them,
in development and in production alike.
A route file - with the `use.ts` files above it and its validation schemas -
is imported by the first request to that route, which builds its middleware chain once.
Every request after it runs the same chain.

So the server starts in the same time however many routes there are,
and each route pays for its import once, on its first request.

What to keep in mind:

- **Top-level code in a route file runs on its first request**, not when the server starts.
Whatever has to happen at start belongs in `api/app.ts` or `api/dev.ts`.
- **A route is registered for the methods of the array `defineRoute` returns**,
read from the file when routes are generated:
`defineRoute(({ GET, POST }) => [GET(...), POST(...)])`.
A route written any other way has no methods to register: it is reported, and answers `404`.
- **A route that fails to load fails its own requests** - a file that does not compile,
an import that does not resolve, a top-level throw. The rest of the API keeps working,
and the route's next request tries again.

## Reloads

`api/dev.ts` is re-evaluated on every relevant change.
Reloads run one at a time, and always in the same order:

1. The saved program is checked: every module transformed, none evaluated -
including `api/app.ts` and what it imports, as imported by the factory.
A save that cannot compile, or that imports a file that does not exist,
is reported and the running API is left as it is.
2. The running program is torn down - its `teardownHandler` awaited, if its factory ran.
3. Only then is `api/dev.ts` evaluated anew, and its factory runs with the next API request.

So there is never more than one program alive.
A port or a connection pool held by the old one is released before the new one asks for it.

Saves landing while a reload runs are folded into a single reload after it.
A request arriving during a reload waits for it, and is answered by the new program.

Routes are imported by their first request, not by loading `api/dev.ts`,
so step 1 does not check them: a route that cannot compile fails its own requests instead.

### requestHandler

The handler the dev server dispatches API requests to.

Replace it for custom routing logic - WebSocket handling, multi-handler dispatch, etc.

### requestMatcher

Controls which requests go to your API vs Vite.

By default, requests are routed to the API handler if their URL starts with `backend.base`
or match any `backend.alias`.

The dev server asks it before the factory runs, so it is an option of `devSetup`
rather than part of what the factory returns:

```ts
export default devSetup(
  async () => {
    // ...
  },
  {
    requestMatcher(req) {
      return req.url?.startsWith("/api") ||
             req.headers["x-api-request"] === "true";
    },
  },
);
```

### teardownHandler

Runs once for every factory run that returned: before each API reload,
and when the dev server stops.

Whatever the program keeps open - db pools, Redis clients, server sockets -
is closed here, or it leaks across rebuilds.

Without cleanup, frequent rebuilds during active development can exhaust database connections.

The factory is the one place for it. Import what holds the connections there,
close it all in one function, and use that function on both ends -
as the `teardownHandler` of an app that was built,
and right away when the app fails to build, as a factory that throws returns no hook:

```ts
// api/dev.ts
import { devSetup } from "_/api:dev";

export default devSetup(async () => {
  const [{ disconnect }, { sharedConnection }] = await Promise.all([
    import("#/db"),
    import("#/redis"),
  ]);

  // settles every close, whichever of them fails
  const close = async () => {
    await Promise.allSettled([disconnect(), sharedConnection.quit()]);
  };

  try {
    const { default: app } = await import("./app");
    return {
      // requestHandler is framework-specific; this is Koa example
      requestHandler: app.callback(),
      teardownHandler: close,
    };
  } catch (error) {
    await close();
    throw error;
  }
});
```

The next program is evaluated only after the hook settles, so await whatever you close.
A hook still pending after 3 seconds is reported and no longer waited for.

::: warning
Connections opened at the top level of `api/dev.ts`, outside the factory,
belong to no factory run: nothing closes them if no request ran the factory.
Import them inside the factory, as above.
:::

::: tip
This hook is dev-only. In production the process exits and the OS reclaims everything;
it exists because a dev reload restarts the API *inside* a long-running process.
:::

## Inspecting API Routes

Routes can be inspected by providing `debug` option to `appFactory` in `api/app.ts`
(omitted by default, feel free to add it as needed):

```ts [api/app.ts]
import appFactory from "_/api:factory";
import defaultErrorHandler from "./errors";

export default appFactory(
  ({ app }) => {
    // ...
  },
  { debug: true }, // [!code ++]
);
```

The routes are printed as the app is built, before any of them is imported,
so `middleware` and `handler` read `loaded on first request`.
See [Routes Load on First Request](#routes-load-on-first-request).

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
export default appFactory(
  ({ app }) => {
    // ...
  },
  { debug: "headline" },
);
```

If you rather need a custom logger, provide a function instead;
it will be provided with full debug object and the route itself.

```ts [api/app.ts]
export default appFactory(
  ({ app }) => {
    // ...
  },
  {
    debug(log, route) {
      console.log(log.full);
    },
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
