---
title: Building for Production
description: Build and deploy KosmoJS applications to production - a single dist/run.js entry point
    across all source folders, plus per-folder servers for containers, serverless, and edge runtimes.
head:
  - - meta
    - name: keywords
      content: vite build, production deployment, dist/run.js, docker deployment,
        serverless api, edge runtime, nodejs deployment, api bundling, source maps, ssr deployment
---

Each source folder builds independently.

```sh
pnpm build          # all source folders
pnpm build front    # specific folder
```

## One Entry Point for the Whole Project

The build writes `dist/run.js` - a dispatcher over every source folder in the project.
Start it and the whole application is up:

```sh
node dist/run.js -p 4556
```

It routes incoming requests by path the same way the dev server does:
each folder's `base` and `apiBase` decide what it owns, longest prefix first.
A project with a marketing site at `/`, an admin app at `/admin` and an API-only folder at `/svc` is one process,
one port, no reverse proxy needed to glue the folders together.

Each folder is served as what it is. `SSR` folders render on the server;
`CSR` folders are served as static assets with a fallback to their `index.html`;
`API`-only folders answer on their `apiBase`.

You do not configure any of this - it follows from the generators the folder is built with.

`dist/run.js` is also what [`kosmo preview`](/dev-build-run/production-preview) runs,
so what you check locally is the same entry point production serve.

### Other Runtimes

`dist/run.js` is built on `node:http`, which `Bun` and `Deno` both implement,
so the same file runs unchanged on all three:

:::tabs key:runtime variant:code
== Node
```sh
node dist/run.js -p 4556
```

== Bun
```sh
bun dist/run.js -p 4556
```

== Deno
```sh
deno run -A dist/run.js -p 4556
```
:::

This is worth stressing because it is easy to assume otherwise:
nothing in the dispatcher is tied to a runtime-specific server API.

It is `node:http` all the way down, and the compatibility layers in `Bun` and `Deno` cover it.

## Running Folders Separately

`dist/run.js` is the simple path, not the only one.

Deploy folders separately when they have separate lifecycles -
a marketing site on a CDN and an API in a container, an admin app scaled independently of the public one,
or a folder that belongs in a different region entirely.

The per-folder servers below are what `dist/run.js` dispatches to internally,
so nothing changes about how a folder behaves when you run it on its own.

## Build Output

```txt
dist/
├── run.js               # dispatcher over every folder
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

When running folders separately, what you deploy depends on how the folder renders.
(With `dist/run.js` this is all handled for you - the section below matters when you split folders across hosts.)

### SSR folders - deploy the SSR server only.

The build bundles the folder's backend *into* the SSR server:
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

### CSR folders - deploy the API server, serve the client statically.
The browser is the only consumer of your API here, and it reaches it over the network:
run `dist/front/api/server.js` and put `dist/front/client/` behind any static host or CDN.

### API-only folders (no frontend)

Deploy the API server, same as CSR minus the static assets.

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
