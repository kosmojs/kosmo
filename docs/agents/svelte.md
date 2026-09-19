---
title: Svelte frontend
description: The complete Svelte surface of KosmoJS on one page - configuration, routing,
    loader and staticParams in script module, the full _/use hook set, layouts with the
    children snippet, error handling, string-only SSR, SSG, TanStack Query and templates.
head:
  - - meta
    - name: keywords
      content: svelte, kosmojs svelte, script module, useLoaderData, useParams, $props,
        render children, layout.svelte, staticParams, string-only SSR, app.svelte,
        svelte boundary, createQuery, tanstack svelte query, defineStaticParams
---

A folder with `frontend: { stack: "svelte" }`. Pages are `.svelte`, layouts are
`layout.svelte`.

This page is the **complete Svelte surface** of KosmoJS, written to be read on its
own: every snippet on it is Svelte, and no other framework's code appears anywhere on
the page. Links go only to framework-agnostic pages; everything Svelte-specific is
inlined here.

Routing conventions, validation and the typed fetch clients behave the same for every
frontend. What this page fixes is the idiom: `loader` and `staticParams` live in
**`<script module>`**, hooks come from `_/use` (the full set - there is no third-party
router here) and are called at the top level of a `<script>` block, children arrive as
a snippet rendered with `{@render children()}`, and SSR is **string-only**.

## What the folder contains

Creating a source folder with a Svelte frontend seeds a small, fixed set of files.
Each is a real source file you own - written once into a blank file, never re-seeded:

```txt
src/<folder>/
├── kosmo.config.ts       -> the folder's config - the frontend block lives here
├── tsconfig.json         -> { "extends": "../../lib/<folder>/tsconfig.json" }
├── index.html            -> Vite's HTML entry, loads entry/client
├── app.svelte            -> global wrapper around EVERY route, incl. 404
├── router.ts             -> routerFactory: routes -> the built-in matcher
│
├── components/
│   └── Link.svelte       -> type-safe navigation component
│
├── entry/
│   ├── client.ts         -> mount vs hydrate, in the browser
│   └── server.ts         -> renderToString  (SSR only; string-only here)
│
└── pages/
    ├── 404.svelte        -> rendered for unmatched routes
    ├── index/
    │   └── index.svelte  -> the route  ->  <frontend.base>/
    └── users/
        ├── layout.svelte -> wraps everything under /users
        └── [id]/
            └── index.svelte -> the route  ->  <frontend.base>/users/:id
```

<!--@include: @/parts/agents/lib-derived.md-->

Only `index.svelte` is a route and only `layout.svelte` is a layout - everything else
in a route folder is a colocated helper, never scanned.
[Rationale&nbsp;›](/routing/rationale.md)

A Svelte folder ignores other frameworks' files - a stray `.tsx` or `.vue` page is
never picked up.

## Configuration

The folder's `kosmo.config.ts` declares what the folder is. A typical Svelte folder:

```ts [kosmo.config.ts]
// Svelte: kosmo.config.ts
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "svelte",
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

`"svelte"`. A bare name runs `@sveltejs/vite-plugin-svelte` with defaults. To
configure the plugin, construct it yourself and pass it alongside the name:

```ts
// Svelte: kosmo.config.ts
import { svelte } from "@sveltejs/vite-plugin-svelte";

frontend: {
  stack: {
    name: "svelte",
    plugin: svelte({ compilerOptions: { runes: true } }),
  },
  base: "/",
}
```

**Never also list the Svelte plugin in `viteConfig.plugins`** - the stack plugin
reaches Vite through `stack`, and listing it twice runs its transform twice. Every
*other* plugin - Tailwind, SVGR - belongs in `viteConfig.plugins` as usual.

### frontend.base - required

The URL prefix this folder's pages are served from - an absolute path, resolved
independently of `backend.base`:

```ts
base: "/"          // app at the root
base: "/admin"     // pages under /admin
```

### frontend.ssr / frontend.ssg / frontend.tanstack

- `ssr: true` (the scaffolder's default) enables server rendering in production
builds. **SSR is string-only on Svelte** - there is no `renderMode: "stream"` here -
see [Server-side rendering](#server-side-rendering).
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
// Svelte: kosmo.config.ts
frontend: {
  stack: "svelte",
  base: "/",
  viteConfig: {
    // the Svelte plugin reaches Vite through `stack`; anything else goes here
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

## Routing on Svelte

Folder names become URL segments; only `index.svelte` defines a route:

```txt
pages/users/index.svelte        -> /users
pages/users/[id]/index.svelte   -> /users/:id
```

Parameters: `[id]` required · `{id}` optional · `{...path}` splat - the same syntax as
the API side. Static routes always win over dynamic ones.
[Parameter&nbsp;details&nbsp;›](/routing/params.md)

Svelte-specific support:

- **Mixed segments** (`files/[name].[ext]`, `v[major].[minor]`) - **full** support on
Svelte pages.
- **Power syntax** (raw `path-to-regexp` patterns) - not supported on any frontend.

Svelte has no third-party router, so KosmoJS supplies the matcher and emits its own
`RawRoute` shape rather than a framework route tree - which is also why the hooks come
from `_/use` rather than a router package. All page components are **lazy-loaded** by
default, fetched on demand per navigation.
[How&nbsp;routing&nbsp;derives&nbsp;›](/routing/intro.md) ·
[Frontend&nbsp;routing&nbsp;›](/frontend/routing.md)

## Pages

A page is an ordinary Svelte component:

```svelte [pages/users/index.svelte]
<!-- Svelte: pages/users/index.svelte -->
<script lang="ts">
</script>

<h1>Users</h1>
```

Create the file **empty** and let KosmoJS seed the boilerplate - seeding fills blank
files only and never overwrites content. In containers and CI, where the file watcher
can behave clunky, create the empty files and run the build command - it resolves
routes with the same code, deterministically.

## Module exports need `<script module>`

**This is the Svelte-specific trap.** `loader` and `staticParams` are **module
exports**, so they belong in `<script module>` - the instance `<script>` runs per
component and cannot declare them:

```svelte [pages/users/[id]/index.svelte]
<!-- Svelte: pages/users/[id]/index.svelte -->
<script module lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

export const loader = ({ params }) => GET([params.id]);
</script>

<script lang="ts">
import { useLoaderData } from "_/use";

const user = useLoaderData();
</script>

{#if user}
  <h1>{user.name}</h1>
{/if}
```

The router runs the loader **before render**, so the data is there on first paint -
no route-level spinner and no suspense construct needed (a Solid-only concern).
There is no built-in loader cache and no staleness model - real caching is TanStack
Query's job - and no proprietary `beforeLoad`-style hook.

## Hooks - `_/use` is the full set

`_/use` exists in Svelte folders and is the **full set** - there is no third-party
router to import from:

| Need | Svelte |
|---|---|
| loader data | `useLoaderData()` from `_/use` |
| current route | `useRoute()` from `_/use` |
| route params | `useParams()` from `_/use` |
| params as entries | `useParamsEntries()` from `_/use` |
| search params | `useSearchParams()` from `_/use` |

Hooks must be called **at the top level of a `<script>` block**, never inside a
function or at module scope:

```svelte [pages/users/[id]/index.svelte]
<!-- Svelte: pages/users/[id]/index.svelte -->
<script lang="ts">
import { useParams } from "_/use";

const { id } = useParams<"users/[id]">();   // top level
</script>
```

`useLoaderData()` returns `T | undefined`, so guard before reading - which is what
the `{#if}` blocks on this page are doing. A **layout** passes its path-qualified
name - `useLoaderData("dashboard/layout")` - where a page passes nothing (see
[Layouts](#layouts)). A `loader` cannot use hooks; it receives the resolved route
object instead - `({ params }) => ...` above.

### Typing the result - `ResponseT`

`useLoaderData` takes the type argument - it returns `T | undefined`. Name the type
once via the `ResponseT` map from `_/fetch`, keyed by route name then method, and
reuse it across components and helpers:

```ts [pages/users/[id]/helpers.ts]
// Svelte: pages/users/[id]/helpers.ts
import type { ResponseT } from "_/fetch";

// name the type once, reuse it across components
export type User = ResponseT["users/[id]"]["GET"];

export const formatUser = (user: User) => {
  return `${user.name} [${user.email}]`;
}
```

```svelte [pages/users/[id]/index.svelte]
<!-- Svelte: pages/users/[id]/index.svelte -->
<script module lang="ts">
import f from "_/fetch";

const { GET } = f["users/[id]"];

export const loader = ({ params }) => GET([params.id]);
</script>

<script lang="ts">
import { useLoaderData } from "_/use";
import { formatUser, type User } from "./helpers";

// useLoaderData takes the type argument - it returns User | undefined
const user = useLoaderData<User>();
</script>

{#if user}
  <div>{formatUser(user)}</div>
{/if}
```

An entry exists in `ResponseT` **only when the handler declares a `response`** -
without one, the client method returns `Promise<unknown>` and there is no entry.
Declaring `response: [200, "json", T]` on the API handler is the one line that fixes
it. Variants without a body (`| [409]`) drop out of the union.

## The app file and `AppProvider`

`app.svelte` at the folder root is the **global wrapper**, rendered around every route
including the 404 page - the place for providers, auth gates, analytics, an app-wide
error boundary. It is not a layout: it has no folder scope, it simply wraps everything.

The default shell composes `AppProvider` from `_/app` around the routed tree, which
arrives as the `children` snippet. `_/app` is a derived seam: a pass-through by
default, swapped under the hood when a feature needs to wrap the tree in a provider
(TanStack Query does this) - so toggling such a feature never changes your code:

```svelte [app.svelte]
<!--@include: @/parts/frontend/application/root-component.md#svelte-->
```

## `router.ts`

`routerFactory` hands your `app` plus the derived routes to the built-in matcher,
returning `clientRouter()` for browser navigation and `serverRouter(url)` for SSR.
The default file is rarely touched:

```ts [router.ts]
<!--@include: @/parts/frontend/application/router.md#svelte-->
```

## `entry/client.ts`

The browser entry, referenced from `index.html`. `renderFactory` reads the
`__KOSMO_HYDRATION_BOOL__` flag the server injects and picks `hydrate()` when SSR
markup is present, `mount()` for a fresh client-only render - Svelte's `mount` /
`hydrate` underneath:

```ts [entry/client.ts]
<!--@include: @/parts/frontend/application/entry-client.md#svelte-->
```

The derived `hydrate` and `mount` are conveniences that wire the router to the DOM the
usual way. For custom mounting, ignore them and render the router's component into
`root` yourself.

## Layouts

A `layout.svelte` in any folder under `pages/` wraps every route in that folder and
its subfolders; nest layouts by nesting folders. Child routes arrive as the `children`
snippet and render with `{@render children()}`:

```svelte [pages/dashboard/layout.svelte]
<!--@include: @/parts/frontend/layouts/implementation.md#svelte-->
```

Rules that bite:

- **Lowercase only.** `Layout.svelte` is a regular component, not a layout.
- **No opt-out.** Child routes always inherit parent layouts; routes that shouldn't
share one belong in a different directory branch.
- **A root-level `pages/layout.svelte` is not picked up.** The wrap-everything role
belongs to `app.svelte`.
- **State persists.** Navigating between siblings under one layout swaps only the
child; the layout stays mounted and its state is preserved. It remounts only when
navigation leaves its subtree.

For `/dashboard/settings/profile` the render order is
`app.svelte -> dashboard/layout.svelte -> dashboard/settings/layout.svelte -> the page`.

### Data loading in a layout

A layout loads data the same way a page does - a `loader` in `<script module>`.
Vue, Svelte and MDX share one per-route loader store keyed by route name, which is why
a layout passes its **path-qualified name** to the hook to read its own data, where a
page passes nothing:

```svelte [pages/dashboard/layout.svelte]
<!--@include: @/parts/frontend/layouts/data-loading.md#svelte-->
```

The loader runs before the layout renders, so shared data is fetched once for
everything beneath it.

## The 404 page

`pages/404.svelte` renders for unmatched routes:

```svelte [pages/404.svelte]
<!--@include: @/parts/frontend/error-pages/not-found.md#svelte-->
```

It is appended to the route list as the router's catch-all, always last, so it matches
only after every real route has failed to. `app.svelte` wraps it; **no `layout.svelte`
does**. It never appears in the typed `Link` route map, is lazy-loaded on the client
and imported eagerly into the SSR bundle.

The HTTP status differs by mode: SSR answers a real `404`; under CSR the host has
already answered `200` with the SPA fallback before the router decides - if crawlers or
uptime checks need correct codes, enable SSR for the folder or return 404 for unknown
paths at the proxy. There is no `notFound()` helper and no per-route not-found file:
a route that exists but has nothing to show branches in the markup, and API 404s are a
backend concern that never renders a page.

## Error handling

### Render errors - `<svelte:boundary>` in a layout

When a component throws while rendering, `<svelte:boundary>` catches it and renders
the `failed` snippet - the subtree swaps to fallback UI while siblings keep working.
KosmoJS ships no boundary of its own; place Svelte's in a layout:

```svelte [pages/dashboard/layout.svelte]
<!-- Svelte: pages/dashboard/layout.svelte -->
<script lang="ts">
  let { children } = $props();
</script>

<svelte:boundary>
  {@render children()}

  {#snippet failed(error, reset)}
    <div role="alert">
      <p>Something went wrong: {error instanceof Error ? error.message : String(error)}</p>
      <button onclick={reset}>Try again</button>
    </div>
  {/snippet}
</svelte:boundary>
```

One SSR caveat: for a synchronous throw at the top of a component's render, the throw
escapes the server render call rather than producing the boundary's fallback markup -
string-rendered routes recover by falling back to CSR (see below), and the boundary
works normally once the app hydrates.

### Loader errors

The loader runs before render, and KosmoJS adds no dedicated route-error channel on
top (that is React Router's `errorElement` and Solid's resource, not a Svelte
concept). The general rule still holds: don't `try`/`catch` inside the loader to hide
failures. Keep markup guarded - `useLoaderData` returns `T | undefined`, so an `{#if}`
renders the empty state - and during SSR a failing loader aborts the render to the CSR
fallback, where the fetch retries in the browser.

### Event handlers and mutations

A fetch call in a click or submit handler runs outside render, so no boundary can see
it. Handle these with a local `try`/`catch` where the call is made. The fetch client
always **throws on failure** - three kinds reach the `catch`:

```svelte [pages/example/index.svelte]
<!-- Svelte: pages/example/index.svelte -->
<script lang="ts">
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

## Fetch clients on a Svelte page

The typed fetch clients are framework-agnostic - typed params, payload and response,
with client-side validation before the request:

```svelte [pages/users/index.svelte]
<!-- Svelte: pages/users/index.svelte -->
<script lang="ts">
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

const user = await GET([123]);
// user is typed from the route's declared response
</script>
```

The same call is isomorphic: a same-origin request in the browser, an in-process
dispatch into the bundled API during SSR - loaders run during the render, so they take
the in-process path and the result is reused on hydration rather than refetched.
A fetch in `onMount` or an `$effect` runs after hydration, in the browser, over the
network.
[Clients&nbsp;›](/fetch/intro.md) · [Usage&nbsp;›](/fetch/start.md) ·
[URL&nbsp;utilities&nbsp;›](/fetch/utilities.md) ·
[Isomorphic&nbsp;transport&nbsp;›](/fetch/isomorphic-clients.md)

## Server-side rendering

`ssr: true` is the scaffolder's default, and **SSR is string-only on Svelte** - there
is no `renderToStream` and no `renderMode: "stream"` for these folders (React, SolidJS
and Vue can stream). Two facts frame everything else:

- **Dev is always client-rendered.** `pnpm dev` is Vite + HMR + CSR whatever `ssr`
says; the server entry runs only in production builds. To see, test or debug anything
server-rendered, run `pnpm preview` - see [Production preview](#production-preview)
below.
- **The SSR bundle includes the API.** `dist/<folder>/ssr/server.js` serves pages and
API requests from one process, and render-time fetches dispatch in-process.

### `entry/server.ts`

`renderFactory` returns `renderToString(url, { assets })`, resolving to
`{ head, html }`:

```ts [entry/server.ts]
<!--@include: @/parts/frontend/server-render/entry-server.md#svelte-->
```

<!--@include: @/parts/frontend/server-render/assets.md-->


### Fetch failures and recovery

String-rendered routes recover automatically. A failed render-time fetch - or a
component throw - aborts the render before any byte leaves the server, and the client
`index.html` is served verbatim instead. The browser mounts from scratch, fetching
retries there, and failures reach your normal client-side error handling. The server
logs `WARN: SSR failed, fallback to CSR` plus the error - a page that quietly arrives
as an empty shell in production means a failing call during render, so check the
server log before the client. The `onError` hook above turns that log line into a
monitoring event; it reports only.

### Debugging SSR

The loop is `pnpm preview` - dev never server-renders, so there is nothing to debug
there (see [Production preview](#production-preview)).
View source (not the inspector) - a server-rendered page arrives with real markup in
`<div id="app">`; empty means the render was skipped or fell back to CSR. `window` /
`document` access during render is the most common SSR-only crash - move it into
`onMount` or guard with `typeof window !== "undefined"`.

## Static site generation

`ssg: true` renders routes to static HTML at build time - it requires `ssr: true`,
because pages are rendered by the folder's own SSR server. Static routes render
automatically; a dynamic route renders once per parameter set declared through
`staticParams` - a module export, so it lives in `<script module>` too - and one
**without** `staticParams` is skipped entirely:

```svelte [pages/docs/[slug]/index.svelte]
<!--@include: @/parts/frontend/static-site-generation/static-params.md#svelte-->
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
// Svelte: kosmo.config.ts
frontend: {
  stack: "svelte",
  base: "/",
  ssr: true,
  tanstack: { query: true },
}
```

Enabling it deploys the `_/query` runtime and swaps `_/app` for a provider that
supplies the client - per-request on the server, a singleton in the browser. Nothing
else to wire; what you write is ordinary TanStack Svelte Query. **The hooks are named
`createQuery` / `createMutation`**, not `use*`, and they take a thunk:

```svelte [components/User.svelte]
<!--@include: @/parts/frontend/tanstack-query/basic-usage.md#svelte-->
```

This fetches on the client after mount - the seamless path, enough for most pages.

### Custom client

`_/query` exports `getQueryClient()` (resolves the active client, no arguments) and
`createQueryClient(options)` (builds one configured client and registers it as the
active one). For custom defaults, create the client in `app.svelte` and hand it to
the provider:

```svelte [app.svelte]
<!--@include: @/parts/frontend/tanstack-query/custom-client.md#svelte-->
```

### SSR warmup (advanced)

Prefetch and `dehydrate` in the loader, then wrap the page in `HydrationBoundary`.
The one KosmoJS-specific detail: get the request-scoped client from
`getQueryClient()`, so you prefetch into the same client the render reads, and share
one query-options helper so the `queryKey` matches on both sides:

```svelte [pages/users/[id]/index.svelte]
<!--@include: @/parts/frontend/tanstack-query/ssr-warmup.md#svelte-->
```

### Mutations

Exactly as TanStack documents, with the same thunk form - `mutationFn` calls the fetch
client, and `invalidateQueries` refetches affected queries in place:

```svelte [components/RenameUser.svelte]
<!--@include: @/parts/frontend/tanstack-query/mutations.md#svelte-->
```

## Typed navigation - `Link`

The default `components/Link.svelte` wraps navigation with compile-time route
validation. `to` takes a tuple of route name then params in path order, plus an
optional `query` prop:

```svelte [components/Menu.svelte]
<!-- Svelte: components/Menu.svelte -->
<script lang="ts">
import Link from "~/components/Link.svelte";
</script>

<nav>
  <!-- Navigate to a static route -->
  <Link to={["index"]}>Home</Link>

  <!-- Navigate with a required parameter -->
  <Link to={["users/[id]", 123]}>User Profile</Link>

  <!-- Navigate with a parameter and query string -->
  <Link to={["posts/[slug]", "hello-world"]} query={{ ref: "sidebar" }}>
    Blog Post
  </Link>
</nav>
```

`to` is typed as a discriminated union derived from the route structure, so renaming a
route directory produces a compile error at every stale `Link` - refactors become an
automated checklist. The 404 page has no route name and cannot be linked to.

## Custom page templates

`frontend.templates` seeds page `index.svelte` files by route-name glob - `*` one
level, `**` any depth, first written match wins, parameters matched literally.
Templates fill **blank files only**; changing one never rewrites existing pages
(empty a file to re-seed it). A template is a string or a function of the route:

```ts [kosmo.config.ts]
// Svelte: kosmo.config.ts
const landingTemplate = `
<script lang="ts">
import { useParams } from "_/use";
const params = useParams();
</script>

<div>
  <h1>Landing</h1>
  <p>Route params: {JSON.stringify(params)}</p>
</div>
`;

export default defineConfig({
  frontend: {
    stack: "svelte",
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
written order.

## TypeScript

The folder's `tsconfig.json` extends a derived base in `lib/`, which supplies the
reserved `@/` `~/` `_/` path mappings and strict settings. Anything you set in
`compilerOptions` wins, per folder:

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
- `loader` and `staticParams` are module exports, so they live in `<script module>` -
the instance `<script>` cannot declare them.
- `_/use` is the full hook set here - there is no third-party router; KosmoJS supplies
the matcher and emits its own `RawRoute` shape. Hooks are called at the top level of a
`<script>` block, never inside a function or at module scope, and a `loader` cannot
use hooks - it receives the resolved route object.
- Vue, Svelte and MDX share one per-route loader store keyed by route name, which is
why a layout passes its own name to the hook - `useLoaderData("dashboard/layout")` -
where a page passes nothing.
- **SSR is string-only.** `renderMode: "stream"` is not available for Svelte folders;
React, SolidJS and Vue can stream.
- TanStack Query names its hooks `createQuery` / `createMutation`, not `use*`, and
they take a thunk.
- Mixed segments are fully supported on Svelte pages.
- The default plugin is `@sveltejs/vite-plugin-svelte`. Pass your own through
`stack: { name: "svelte", plugin: svelte({ ... }) }`, never through
`viteConfig.plugins`.
- Backend idioms live on their own pages: [Hono&nbsp;›](/agents/hono.md) ·
[H3&nbsp;›](/agents/h3.md) · [Koa&nbsp;›](/agents/koa.md)
