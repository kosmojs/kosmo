---
title: Vue frontend
description: The complete Vue surface of KosmoJS on one page - configuration, routing,
    the loader in a plain script block, useLoaderData, layouts with RouterView, error
    handling, SSR and streaming, SSG, TanStack Query, the typed Link and templates.
head:
  - - meta
    - name: keywords
      content: vue, kosmojs vue, useLoaderData, vue-router, RouterView, script setup,
        plain script block, layout.vue, pages index.vue, loader, app.vue, entry/client,
        entry/server, renderToStream, defineStaticParams, tanstack vue query,
        onErrorCaptured
---

A folder with `frontend: { stack: "vue" }`. Pages are `.vue`, layouts are `layout.vue`.

This page is the **complete Vue surface** of KosmoJS, written to be read on its own:
every snippet on it is Vue, and no other framework's code appears anywhere on the page.
Links go only to framework-agnostic pages; everything Vue-specific is inlined here.

Routing conventions, validation and the typed fetch clients behave the same for every
frontend. What this page fixes is the idiom: the `loader` lives in a **plain
`<script>` block** beside `<script setup>`, data is read with `useLoaderData` from
`_/use` (its only export here), and child routes render through `<RouterView />`.

## What the folder contains

Creating a source folder with a Vue frontend seeds a small, fixed set of files.
Each is a real source file you own - written once into a blank file, never re-seeded:

```txt
src/<folder>/
├── kosmo.config.ts       -> the folder's config - the frontend block lives here
├── tsconfig.json         -> { "extends": "../../lib/<folder>/tsconfig.json" }
├── index.html            -> Vite's HTML entry, loads entry/client
├── app.vue               -> global wrapper around EVERY route, incl. 404
├── router.ts             -> routerFactory: routes -> Vue Router
│
├── components/
│   └── Link.vue          -> type-safe navigation component
│
├── entry/
│   ├── client.ts         -> mount vs hydrate, in the browser
│   └── server.ts         -> renderToString / renderToStream  (SSR only)
│
└── pages/
    ├── 404.vue           -> rendered for unmatched routes
    ├── index/
    │   └── index.vue     -> the route  ->  <frontend.base>/
    └── users/
        ├── layout.vue    -> wraps everything under /users
        └── [id]/
            └── index.vue -> the route  ->  <frontend.base>/users/:id
```

Only `index.vue` is a route and only `layout.vue` is a layout - everything else in a
route folder is a colocated helper, never scanned.
[Rationale&nbsp;›](/routing/rationale.md)

A Vue folder ignores other frameworks' files - a stray `.tsx` or `.svelte` page is
never picked up.

## Configuration

The folder's `kosmo.config.ts` declares what the folder is. A typical Vue folder:

```ts [kosmo.config.ts]
// Vue: kosmo.config.ts
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "vue",
    base: "/",
    ssr: true,
    ssg: false,
    tanstack: { query: false },
  },
  backend: {
    stack: "hono",
    base: "/api",
  },
  fetch: true,
  validation: true,
  typecheck: true,
});
```

`defineConfig` from `@kosmojs/dev` is the only import a folder config needs.
The config is read once at startup - **restart the dev server** after changing it.

### frontend.stack - required

`"vue"`. A bare name runs `@vitejs/plugin-vue` with defaults. To configure the plugin,
construct it yourself and pass it alongside the name:

```ts
// Vue: kosmo.config.ts
import vue from "@vitejs/plugin-vue";

frontend: {
  stack: {
    name: "vue",
    plugin: vue({ features: { propsDestructure: true } }),
  },
  base: "/",
}
```

**Never also list the Vue plugin in `viteConfig.plugins`** - the stack plugin reaches
Vite through `stack`, and listing it twice runs its transform twice. Every *other*
plugin - Tailwind, SVGR - belongs in `viteConfig.plugins` as usual.

### frontend.base - required

The URL prefix this folder's pages are served from - an absolute path, resolved
independently of `backend.base`:

```ts
base: "/"          // app at the root
base: "/admin"     // pages under /admin
```

### frontend.ssr / frontend.ssg / frontend.tanstack

- `ssr: true` (the scaffolder's default) enables server rendering in production builds;
an options object adds `renderMode` - see [Server-side rendering](#server-side-rendering).
- `ssg: true` pre-renders routes to static HTML at build time and **requires SSR on** -
see [Static site generation](#static-site-generation).
- `tanstack: { query: true }` wires TanStack Query in - see
[TanStack Query](#tanstack-query).

### frontend.templates

Overrides seeded page boilerplate by route pattern - see
[Custom page templates](#custom-page-templates).

### frontend.viteConfig

Vite's `UserConfig` for the client build - `plugins`, `resolve`, `css`, `define`,
`optimizeDeps`, and the rest:

```ts
// Vue: kosmo.config.ts
frontend: {
  stack: "vue",
  base: "/",
  viteConfig: {
    // the Vue plugin reaches Vite through `stack`; anything else goes here
    plugins: [tailwindcss() as never],
    resolve: {
      alias: { "#shared": "/src/shared" },
    },
  },
}
```

`as never` on a plugin entry is the fix when typecheck reports `TS2321: Excessive stack
depth` on the `defineConfig(...)` call - plugins that return arrays (Tailwind among
them) push Vite's recursive `PluginOption` past TypeScript's comparison limit. It is
not needed otherwise. A handful of Vite keys are not accepted, because KosmoJS derives
them from the folder layout: `root`, `base`, `cacheDir`, `mode`, `builder`, `future`,
`legacy`.

## Routing on Vue

Folder names become URL segments; only `index.vue` defines a route:

```txt
pages/users/index.vue        -> /users
pages/users/[id]/index.vue   -> /users/:id
```

Parameters: `[id]` required · `{id}` optional · `{...path}` splat - the same syntax as
the API side. Static routes always win over dynamic ones.
[Parameter&nbsp;details&nbsp;›](/routing/params.md)

Vue-specific support:

- **Mixed segments** (`files/[name].[ext]`, `v[major].[minor]`) - **full** support on
Vue pages.
- **Power syntax** (raw `path-to-regexp` patterns) - not supported on any frontend.

Route definitions are derived into `lib/` and handed to Vue Router as plain,
framework-native route objects - there is no route tree to register, and everything
Vue Router documents keeps working: nested layouts, lazy loading, navigation guards.
All page components are **lazy-loaded** by default, fetched on demand per navigation.
[How&nbsp;routing&nbsp;derives&nbsp;›](/routing/intro.md) ·
[Frontend&nbsp;routing&nbsp;›](/frontend/routing.md)

## Pages

A page is an ordinary SFC:

```vue [pages/users/index.vue]
<!-- Vue: pages/users/index.vue -->
<script setup lang="ts">
</script>

<template>
  <h1>Users</h1>
</template>
```

Create the file **empty** and let KosmoJS seed the boilerplate - seeding fills blank
files only and never overwrites content. In containers and CI, where the file watcher
can behave clunky, create the empty files and run the build command - it resolves
routes with the same code, deterministically.

## The loader goes in a plain `<script>`

**This is the Vue-specific trap.** `loader` is a **named module export**, and
`<script setup>` cannot declare one - it compiles to `setup()` and cannot hold ES
exports. The loader lives in an ordinary `<script>` block beside it; the two blocks
coexist in one SFC:

```vue [pages/users/[id]/index.vue]
<!-- Vue: pages/users/[id]/index.vue -->
<script lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export const loader = ({ params }) => GET([params.id]);
</script>

<script setup lang="ts">
import { useLoaderData } from "_/use";

const user = useLoaderData();
</script>

<template>
  <div v-if="user"><h1>{{ user.name }}</h1></div>
</template>
```

The router runs the loader **before the route renders**, through a navigation guard -
no `onMounted`, no manual guard - so the data is there when `<script setup>` executes,
with no route-level spinner and no `<Suspense>` needed (a Solid-only concern).
There is no built-in loader cache and no staleness model - real caching is TanStack
Query's job - and no proprietary `beforeLoad`-style hook: Vue Router's own primitives
are untouched.

## Hooks - `_/use` exports `useLoaderData` only

`_/use` exists in Vue folders, but exports **`useLoaderData` only**.
Everything else comes from `vue-router`:

| Need | Vue |
|---|---|
| loader data | `useLoaderData()` from `_/use` |
| route params | `useRoute()` from `vue-router` |
| navigate | `useRouter()` from `vue-router` |

`useLoaderData()` returns `T | undefined`, so guard before reading - which is what the
`v-if` in the templates on this page is doing. A **layout** passes its path-qualified
name - `useLoaderData("dashboard/layout")` - where a page passes nothing (see
[Layouts](#layouts)).

### Typing the result - `ResponseT`

`useLoaderData` takes the type argument - it returns `T | undefined`. Name the type
once via the `ResponseT` map from `_/fetch`, keyed by route name then method, and
reuse it across components and helpers:

```ts [pages/users/[id]/helpers.ts]
// Vue: pages/users/[id]/helpers.ts
import type { ResponseT } from "_/fetch";

// name the type once, reuse it across components
export type User = ResponseT["users/[id]"]["GET"];

export const formatUser = (user: User) => {
  return `${user.name} [${user.email}]`;
}
```

```vue [pages/users/[id]/index.vue]
<!-- Vue: pages/users/[id]/index.vue -->
<script lang="ts">
import f from "_/fetch";

const { GET } = f["users/[id]"];

export const loader = ({ params }) => GET([params.id]);
</script>

<script setup lang="ts">
import { useLoaderData } from "_/use";
import { formatUser, type User } from "./helpers";

// useLoaderData takes the type argument - it returns User | undefined
const user = useLoaderData<User>();
</script>

<template>
  <div v-if="user">{{ formatUser(user) }}</div>
</template>
```

An entry exists in `ResponseT` **only when the handler declares a `response`** -
without one, the client method returns `Promise<unknown>` and there is no entry.
Declaring `response: [200, "json", T]` on the API handler is the one line that fixes
it. Variants without a body (`| [409]`) drop out of the union.

## The app file and `AppProvider`

`app.vue` at the folder root is the **global wrapper**, rendered around every route
including the 404 page - the place for providers, auth gates, analytics, an app-wide
error boundary. It is not a layout: it has no folder scope, it simply wraps everything.

The default shell composes `AppProvider` from `_/app` around the routed tree.
`_/app` is a derived seam: a pass-through by default, swapped under the hood when a
feature needs to wrap the tree in a provider (TanStack Query does this) - so toggling
such a feature never changes your code:

```vue [app.vue]
<!-- Vue: app.vue -->
<script setup lang="ts">
import { AppProvider } from "_/app";
</script>

<template>
  <AppProvider>
    <RouterView />
  </AppProvider>
</template>
```

## `router.ts`

`routerFactory` hands your `app` plus the derived routes to Vue Router, returning
`clientRouter()` for browser navigation and `serverRouter(url)` for SSR. The Vue form
also registers `appProvider` as a plugin pair through `use` - part of the default
file, which is rarely touched:

```ts [router.ts]
// Vue: router.ts
import routerFactory, { createRouters } from "_/router";
import { appProvider } from "_/app";

import app from "./app.vue";

export default routerFactory((routes) => {
  const { clientRouter, serverRouter } = createRouters(routes, {
    app,
    use: [[appProvider, undefined]],
  });
  return {
    clientRouter() {
      return clientRouter()
    },
    serverRouter(url) {
      return serverRouter(url)
    },
  };
});
```

## `entry/client.ts`

The browser entry, referenced from `index.html`. `renderFactory` reads the
`__KOSMO_HYDRATION_BOOL__` flag the server injects and picks `hydrate()` when SSR
markup is present, `mount()` for a fresh client-only render - `createApp` /
`createSSRApp` underneath:

```ts [entry/client.ts]
// Vue: entry/client.ts
import renderFactory, {
  createRoutes,
  hydrate,
  mount,
} from "_/entry/client";

import routerFactory from "../router";

const routes = createRoutes();
const { clientRouter } = routerFactory(routes);

const root = document.getElementById("app");

if (root) {
  renderFactory(() => {
    return {
      hydrate() {
        return hydrate(() => clientRouter(), root);
      },
      mount() {
        return mount(() => clientRouter(), root);
      },
    };
  });
} else {
  console.error("Root element not found!");
}
```

The derived `hydrate` and `mount` are conveniences that wire the router to the DOM the
usual way. For custom mounting, ignore them and render the router's component into
`root` yourself.

## Layouts

A `layout.vue` in any folder under `pages/` wraps every route in that folder and its
subfolders; nest layouts by nesting folders. Child routes render through
`<RouterView />`, not through a prop:

```vue [pages/dashboard/layout.vue]
<!-- Vue: pages/dashboard/layout.vue -->
<script setup lang="ts">
// layout-specific logic
</script>

<template>
  <div class="dashboard">
    <nav>...</nav>
    <main>
      <RouterView />
    </main>
    <footer>...</footer>
  </div>
</template>
```

Rules that bite:

- **Lowercase only.** `Layout.vue` is a regular component, not a layout.
- **No opt-out.** Child routes always inherit parent layouts; routes that shouldn't
share one belong in a different directory branch.
- **A root-level `pages/layout.vue` is not picked up.** The wrap-everything role belongs
to `app.vue`.
- **State persists.** Navigating between siblings under one layout swaps only the child;
the layout stays mounted and its state is preserved. It remounts only when navigation
leaves its subtree.

For `/dashboard/settings/profile` the render order is
`app.vue -> dashboard/layout.vue -> dashboard/settings/layout.vue -> the page`.

### Data loading in a layout

A layout loads data the same way a page does - a `loader` in a plain `<script>` block.
Vue, Svelte and MDX share one per-route loader store keyed by route name, which is why
a layout passes its **path-qualified name** to the hook to read its own data, where a
page passes nothing:

```vue [pages/dashboard/layout.vue]
<!-- Vue: pages/dashboard/layout.vue -->
<script lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["dashboard/data"];

// loader export lives in a plain <script> block
export const loader = () => GET();
</script>

<script setup lang="ts">
import { useLoaderData } from "_/use";

// a layout passes its path-qualified name to read its own data
const data = useLoaderData("dashboard/layout");
</script>

<template>
  ...
</template>
```

The loader runs before the layout renders, so shared data is fetched once for
everything beneath it.

## The 404 page

`pages/404.vue` renders for unmatched routes:

```vue [pages/404.vue]
<!-- Vue: pages/404.vue -->
<template>
  <main>
    <h1>404 - Not Found</h1>
    <a href="/">Back home</a>
  </main>
</template>
```

It is appended to the route list as the router's catch-all, always last, so it matches
only after every real route has failed to. `app.vue` wraps it; **no `layout.vue`
does**. It never appears in the typed `Link` route map, is lazy-loaded on the client
and imported eagerly into the SSR bundle.

The HTTP status differs by mode: SSR answers a real `404`; under CSR the host has
already answered `200` with the SPA fallback before the router decides - if crawlers or
uptime checks need correct codes, enable SSR for the folder or return 404 for unknown
paths at the proxy. There is no `notFound()` helper and no per-route not-found file:
a route that exists but has nothing to show branches in the template, and API 404s are
a backend concern that never renders a page.

## Error handling

### Render errors - `onErrorCaptured` in a layout

Vue's boundary is not a component but the `onErrorCaptured` hook: place it in a
layout, flip a flag, and return `false` to stop the error from propagating - the
subtree swaps to fallback UI while siblings keep working. KosmoJS ships no boundary of
its own:

```vue [pages/dashboard/layout.vue]
<!-- Vue: pages/dashboard/layout.vue -->
<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";

const error = ref<Error | null>(null);

onErrorCaptured((err) => {
  error.value = err as Error;
  return false; // stop the error from propagating further
});

const reset = () => (error.value = null);
</script>

<template>
  <div v-if="error" role="alert">
    <p>Something went wrong: {{ error.message }}</p>
    <button @click="reset">Try again</button>
  </div>
  <RouterView v-else />
</template>
```

One SSR caveat: on the server, `onErrorCaptured` stops the error from propagating -
which keeps a stream alive - but the fallback branch is **not** rendered in that same
server pass; the failed subtree is simply absent until the boundary takes over on the
client. String-rendered routes recover by falling back to CSR (see below), and the
hook works normally once the app hydrates.

### Loader errors

Vue Router runs the loader in a navigation guard, and KosmoJS adds no dedicated
route-error channel on top (that is React Router's `errorElement` and Solid's
resource, not a Vue concept). The general rule still holds: don't `try`/`catch`
inside the loader to hide failures. Keep templates guarded - `useLoaderData` returns
`T | undefined`, so a `v-if` renders the empty state - and during SSR a failing loader
aborts a string render to the CSR fallback, where the fetch retries in the browser.

### Event handlers and mutations

A fetch call in a click or submit handler runs outside render, so no boundary can see
it. Handle these with a local `try`/`catch` where the call is made. The fetch client
always **throws on failure** - three kinds reach the `catch`:

```vue [pages/example/index.vue]
<!-- Vue: pages/example/index.vue -->
<script setup lang="ts">
import fetchClients, { ValidationError } from "_/fetch";

const { POST } = fetchClients["users"];

async function submit(payload: { name: string; email: string }) {
  try {
    await POST([], { json: payload });
  } catch (error) {
    if (error instanceof ValidationError) {
      // data failed client-side validation - no request was made;
      // carries the same structured target/errors detail as the server's
      console.error(error.errorMessage);
    } else {
      // an HTTP error status (with response + parsed body), or a transport failure
      console.error(error);
    }
  }
}
</script>
```

With TanStack Query, a query stores its failure in `query.error` and does not throw
during render by default; set `throwOnError: true` to escalate into the nearest
boundary, and read `mutation.error` for mutation state.

Client-side validation is fast feedback, not security - the server always re-validates
with the same schemas. [Client&nbsp;validation&nbsp;›](/fetch/validation.md)

## Fetch clients on a Vue page

The typed fetch clients are framework-agnostic - typed params, payload and response,
with client-side validation before the request:

```vue [pages/users/index.vue]
<!-- Vue: pages/users/index.vue -->
<script setup lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

const user = await GET([123]);
// user is typed from the route's declared response
</script>
```

The same call is isomorphic: a same-origin request in the browser, an in-process
dispatch into the bundled API during SSR - loaders run during the render, so they take
the in-process path and the result is reused on hydration rather than refetched.
A fetch in `onMounted` runs after hydration, in the browser, over the network.
[Clients&nbsp;›](/fetch/intro.md) · [Usage&nbsp;›](/fetch/start.md) ·
[URL&nbsp;utilities&nbsp;›](/fetch/utilities.md) ·
[Isomorphic&nbsp;transport&nbsp;›](/fetch/isomorphic-clients.md)

## Server-side rendering

`ssr: true` is the scaffolder's default. Two facts frame everything else:

- **Dev is always client-rendered.** `pnpm dev` is Vite + HMR + CSR whatever `ssr`
says; the server entry runs only in production builds. To see, test or debug anything
server-rendered, run `pnpm preview` - see [Production preview](#production-preview)
below.
- **The SSR bundle includes the API.** `dist/<folder>/ssr/server.js` serves pages and
API requests from one process, and render-time fetches dispatch in-process.

### `entry/server.ts`

`renderFactory` returns `renderToString(url, { assets })` and
`renderToStream(url, { assets })`, both resolving to `{ head, html }` - a string for
one, a web-standard `ReadableStream` for the other. Which one runs per route is decided
by `renderMode`, not by precedence:

```ts [entry/server.ts]
// Vue: entry/server.ts
import renderFactory, {
  createRoutes,
  renderToStream,
  renderToString,
} from "_/entry/server";

import routerFactory from "../router";

const routes = createRoutes();
const { serverRouter } = routerFactory(routes);

export default renderFactory(() => {
  return {
    renderToString(url, { assets }) {
      return renderToString(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    renderToStream(url, { assets }) {
      return renderToStream(
        () => serverRouter(url),
        { headerTags: assets.map(({ tag }) => tag) },
      );
    },
    onError(error) {
      // reports only - it cannot change the response; never throw from it
      reportToMonitoring(error, { url: error.url });
    },
  };
});
```

Each `assets` entry offers `kind`, `tag` (ready-to-inject), `content` (for inlining), `size` and an optional `path`.
Passing `tag` straight through is the right default. Or inline CSS instead with something like:

```ts
assets.map(({ kind, tag, content }) => {
  return kind === "css" ? `<style>${content}</style>` : tag;
})
```

### Streaming

Vue supports stream rendering. Every route defaults to `"string"`; opt routes in by
glob - first match wins, so order patterns specific to general:

```ts [kosmo.config.ts]
// Vue: kosmo.config.ts
frontend: {
  stack: "vue",
  base: "/",
  ssr: {
    renderMode: {
      "docs/**": "stream",
    },
  },
}
```

### Fetch failures and recovery

- **String-rendered routes recover automatically.** A failed render-time fetch - or a
component throw - aborts the render before any byte leaves the server, and the client
`index.html` is served verbatim instead. The browser mounts from scratch, fetching
retries there, and failures reach your normal client-side error handling. The server
logs `WARN: SSR failed, fallback to CSR` plus the error - a page that quietly arrives
as an empty shell in production means a failing call during render, so check the
server log before the client. The `onError` hook above turns that log line into a
monitoring event; it reports only.
- **Streamed routes do not recover.** The shell is on the wire before the fetch fails.
Vue has no streaming-side fallback: `onErrorCaptured` can stop an error from
propagating, which keeps the stream alive, but no fallback is rendered in that same
server pass - the failed subtree is simply absent until the boundary takes over on the
client. A streamed page must be able to render something for every state its data can
be in.

### Debugging SSR

The loop is `pnpm preview` - dev never server-renders, so there is nothing to debug
there (see [Production preview](#production-preview)).
View source (not the inspector) - a server-rendered page arrives with real markup in
`<div id="app">`; empty means the render was skipped or fell back to CSR. `window` /
`document` access during render is the most common SSR-only crash - move it into
`onMounted` or guard with `typeof window !== "undefined"`. If a route misbehaves only
when streamed, drop it back to `"string"` to isolate the bug.

## Static site generation

`ssg: true` renders routes to static HTML at build time - it requires `ssr: true`,
because pages are rendered by the folder's own SSR server. Static routes render
automatically; a dynamic route renders once per parameter set declared through
`staticParams` - a named export, so it lives in the plain `<script>` block too - and
one **without** `staticParams` is skipped entirely:

```vue [pages/docs/[slug]/index.vue]
<!-- Vue: pages/docs/[slug]/index.vue -->
<script lang="ts">
// a plain <script> block: <script setup> can not have named exports,
// and the two blocks coexist in one SFC
import { defineStaticParams } from "_/core";

export const staticParams = defineStaticParams<"docs/[slug]">([
  ["getting-started"],
  ["routing"],
]);
</script>

<script setup lang="ts">
/* ... */
</script>
```

Each entry is positional in the route's parameter order; a splat takes an array of
segments. The page's `loader` runs once per entry, in-process against the bundled
API - so the build machine needs the access production has (database, CMS), which is
why SSG belongs in CI. The output is **all-or-nothing**: one failed page and nothing is
written, with every broken route named in one summary - a shell page is never emitted.
Output lands in `dist/<folder>/ssg/`, rooted at the folder's `base`; no `404.html` is
emitted, so point the static host's own not-found setting where it expects.

## Production preview

The dev server never shows production behavior - `pnpm dev` is HMR + CSR, and
server-rendered markup, bundling problems, asset hashing and the production
validation policy do not exist until you build. `preview` builds the project and runs
`dist/run.js` - the same entry point production starts - then watches your sources
and rebuilds on change. Production output, development loop:

```sh
pnpm preview          # all source folders
pnpm preview front    # specific folder
```

Default port is `4558` (`previewPort` in `package.json`), deliberately separate from
`devPort`, so preview and the dev server run side by side and you compare the two in
adjacent tabs. Everything comes from `dist/`, nothing transformed on the fly: SSR
folders render on the server, so you see real server-rendered markup and can watch
hydration happen; CSR folders are served as built static assets - hashed filenames,
real chunk splitting, the `index.html` a static host would serve; API folders answer
from the bundled backend with the production validation policy, not the dev one.

A change triggers a **full rebuild** - seconds rather than HMR's milliseconds, no
module patching, no preserved state - because patching a running graph is exactly what
a production bundle does not have, and preview's contract is that the page in the
browser is the page production serves. A failed rebuild leaves the previous build
serving, with the error printed to the terminal.

Reach for it when checking server-rendered output or debugging a hydration mismatch,
confirming behavior after bundling (dynamic imports, tree-shaking), verifying assets
and `base` paths off the root, or reproducing a bug that only appears in a deployed
build. If a page works in preview, it works when deployed - the gap between "works
locally" and "works in production" is where SSR bugs live.
[Details&nbsp;›](/dev-build-run/production-preview.md)

## TanStack Query

```ts [kosmo.config.ts]
// Vue: kosmo.config.ts
frontend: {
  stack: "vue",
  base: "/",
  ssr: true,
  tanstack: { query: true },
}
```

Enabling it deploys the `_/query` runtime and swaps `_/app` for a provider that
supplies the client - per-request on the server, a singleton in the browser. Nothing
else to wire; what you write is ordinary TanStack Vue Query:

```vue [components/User.vue]
<!-- Vue: components/User.vue -->
<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import fetchClients from "_/fetch";

const { id } = defineProps<{ id: string }>();
const { GET } = fetchClients["users/[id]"];

const { data, isPending } = useQuery({
  queryKey: ["users", id],
  queryFn: () => GET([id]),
});
</script>

<template>
  <div v-if="isPending">Loading...</div>
  <div v-else>{{ data?.name }}</div>
</template>
```

This fetches on the client after mount - the seamless path, enough for most pages.

### Custom client

`_/query` exports `getQueryClient()` (resolves the active client, no arguments) and
`createQueryClient(options)` (builds one configured client and registers it as the
active one). On Vue there is no `client` prop to pass - call `createQueryClient` in
`app.vue`'s `<script setup>` and the provider resolves it:

```vue [app.vue]
<!-- Vue: app.vue - call createQueryClient in <script setup>; the provider resolves it -->
<script setup lang="ts">
import { AppProvider } from "_/app";
import { createQueryClient } from "_/query";

createQueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
</script>

<template>
  <AppProvider>
    <RouterView />
  </AppProvider>
</template>
```

### SSR warmup (advanced)

Prefetch and `dehydrate` in the loader, then `hydrate` in the page's `<script setup>`.
The one KosmoJS-specific detail: get the request-scoped client from
`getQueryClient()`, so you prefetch into the same client the render reads, and share
one query-options helper so the `queryKey` matches on both sides:

```vue [pages/users/[id]/index.vue]
<!-- Vue: pages/users/[id]/index.vue -->
<!-- Prefetch + dehydrate in the loader; hydrate the page's script setup. -->
<script lang="ts">
import { dehydrate } from "@tanstack/vue-query";
import { getQueryClient } from "_/query";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export const queryOptions = (id: string) => ({
  queryKey: ["users", id],
  queryFn: () => GET([id]),
});

export const loader = async ({ params }: { params: { id: string } }) => {
  const client = getQueryClient();
  await client.prefetchQuery(queryOptions(params.id));
  return dehydrate(client);
};
</script>

<script setup lang="ts">
import { hydrate, useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";
import { getQueryClient } from "_/query";
import { useLoaderData } from "_/use";

hydrate(getQueryClient(), useLoaderData());

// Vue folders read params through Vue Router's own hook;
// `_/use` on Vue exports useLoaderData only
const route = useRoute();
const { data } = useQuery(queryOptions(route.params.id as string));
</script>

<template>
  <div>{{ data?.name }}</div>
</template>
```

### Mutations

Exactly as TanStack documents - `mutationFn` calls the fetch client, and
`invalidateQueries` refetches affected queries in place:

```vue [components/RenameUser.vue]
<!-- Vue: components/RenameUser.vue -->
<script setup lang="ts">
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import fetchClients from "_/fetch";

const props = defineProps<{ id: string }>();

const { POST } = fetchClients["users/[id]"];

const qc = useQueryClient();
const rename = useMutation({
  mutationFn: (name: string) => POST([props.id], { name }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["users", props.id] }),
});
</script>

<template>
  <button @click="rename.mutate('New Name')">Rename</button>
</template>
```

## Typed navigation - `Link`

The default `components/Link.vue` wraps Vue Router's link with compile-time route
validation. `to` takes a tuple of route name then params in path order, plus an
optional `query` prop - bound with `:` since they are expressions:

```vue [components/Menu.vue]
<!-- Vue: components/Menu.vue -->
<script setup lang="ts">
import Link from "~/components/Link.vue";
</script>

<template>
  <nav>
    <!-- Navigate to a static route -->
    <Link :to="['index']">Home</Link>

    <!-- Navigate with a required parameter -->
    <Link :to="['users/[id]', 123]">User Profile</Link>

    <!-- Navigate with a parameter and query string -->
    <Link :to="['posts/[slug]', 'hello-world']" :query="{ ref: 'sidebar' }">
      Blog Post
    </Link>
  </nav>
</template>
```

`to` is typed as a discriminated union derived from the route structure, so renaming a
route directory produces a compile error at every stale `Link` - refactors become an
automated checklist. The 404 page has no route name and cannot be linked to.

## Custom page templates

`frontend.templates` seeds page `index.vue` files by route-name glob - `*` one level,
`**` any depth, first written match wins, parameters matched literally. Templates fill
**blank files only**; changing one never rewrites existing pages (empty a file to
re-seed it). A template is a string or a function of the route:

```ts [kosmo.config.ts]
// Vue: kosmo.config.ts
const landingTemplate = `
<template>
  <div>
    <h1>Landing</h1>
    <p>Route params: {{ JSON.stringify(route.params) }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
const route = useRoute();
</script>
`;

export default defineConfig({
  frontend: {
    stack: "vue",
    base: "/",
    templates: {
      "landing/*": landingTemplate,
      "marketing/**": landingTemplate,
    },
  },
});
```

Set `"**"` to replace the built-in default everywhere. Integer-like pattern keys
(`"2024/**"`) are hoisted by JavaScript object ordering - prefix with `./` to keep your
written order; the same applies to `renderMode`.

## TypeScript

The folder's `tsconfig.json` extends a derived base in `lib/`, which supplies
`jsxImportSource: "vue"` (relevant for JSX only - pages are SFCs), the reserved `@/`
`~/` `_/` path mappings and strict settings. Anything you set in `compilerOptions`
wins, per folder:

```json [src/front/tsconfig.json]
{
  "extends": "../../lib/front/tsconfig.json",
  "compilerOptions": {
    "exactOptionalPropertyTypes": false
  }
}
```

Do not add an `include` casually - it replaces rather than merges with the base, which
is what puts the folder, its `lib/` output and the ambient declarations in scope. If
you must, carry `["./", "../../lib/<folder>/", "../../lib/*.d.ts"]` over first. Run
checks with [kosmo typecheck](/cli/typecheck.md) - neither the dev server nor the build
typechecks for you. [Project&nbsp;layout&nbsp;›](/essentials/project-structure.md)

## Worth knowing

- **Create page and layout files empty and let KosmoJS seed them** - seeding writes
the current boilerplate with nothing left to recall wrong. In containers and CI, where
file watchers can behave clunky, create the empty files and run the build - it
resolves routes with the same code, deterministically.
- `loader` and `staticParams` are named module exports, so they live in a plain
`<script>` block - `<script setup>` compiles to `setup()` and cannot hold ES exports.
- `_/use` exports `useLoaderData` only; params and navigation come from `vue-router`.
`useLoaderData()` returns `T | undefined`, so guard before reading.
- Vue, Svelte and MDX share one per-route loader store keyed by route name, which is
why a layout passes its own name to the hook - `useLoaderData("dashboard/layout")` -
where a page passes nothing.
- No `client` prop for TanStack Query here - call `createQueryClient` in `app.vue`'s
`<script setup>` and the provider resolves it.
- Mixed segments are fully supported on Vue pages.
- Streaming SSR is available for Vue (React and SolidJS also stream; Svelte and MDX
render to string only) - but a mid-stream failure renders no fallback in that server
pass; the boundary takes over on the client.
- The default plugin is `@vitejs/plugin-vue`. Pass your own through
`stack: { name: "vue", plugin: vue({ ... }) }`, never through `viteConfig.plugins`.
- Backend idioms live on their own pages: [Hono&nbsp;›](/agents/hono.md) ·
[H3&nbsp;›](/agents/h3.md) · [Koa&nbsp;›](/agents/koa.md)
