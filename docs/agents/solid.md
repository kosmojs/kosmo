---
title: SolidJS frontend
description: The complete SolidJS surface of KosmoJS on one page - configuration, routing,
    preload with query(), createAsync and the Suspense boundary you must supply, layouts,
    error handling, SSR and streaming, SSG, TanStack Query, the typed Link and templates.
head:
  - - meta
    - name: keywords
      content: solid, solidjs, kosmojs solid, createAsync, query, preload, Suspense,
        solidjs router, layout.tsx, ParentComponent, app.tsx, entry/client, entry/server,
        renderToStream, defineStaticParams, tanstack solid query, ErrorBoundary,
        no _/use in solid
---

A folder with `frontend: { stack: "solid" }`. Pages are `.tsx`, layouts are `layout.tsx`.

This page is the **complete SolidJS surface** of KosmoJS, written to be read on its own:
every snippet on it is Solid, and no other framework's code appears anywhere on the page.
Links go only to framework-agnostic pages; everything Solid-specific is inlined here.

Routing conventions, validation and the typed fetch clients behave the same for every
frontend. What this page fixes is the idiom: data loads through `preload` +
`createAsync` sharing one `query()` cache key, reads **suspend** - so the `<Suspense>`
boundary is yours to supply - children arrive as `props.children`, and it is `class`,
not `className`.

## What the folder contains

Creating a source folder with a Solid frontend seeds a small, fixed set of files.
Each is a real source file you own - written once into a blank file, never re-seeded:

```txt
src/<folder>/
├── kosmo.config.ts       -> the folder's config - the frontend block lives here
├── tsconfig.json         -> { "extends": "../../lib/<folder>/tsconfig.json" }
├── index.html            -> Vite's HTML entry, loads entry/client
├── app.tsx               -> global wrapper around EVERY route, incl. 404
├── router.ts             -> routerFactory: routes -> Solid Router
│
├── components/
│   └── Link.tsx          -> type-safe navigation component
│
├── entry/
│   ├── client.ts         -> mount vs hydrate, in the browser
│   └── server.ts         -> renderToString / renderToStream  (SSR only)
│
└── pages/
    ├── 404.tsx           -> rendered for unmatched routes
    ├── index/
    │   └── index.tsx     -> the route  ->  <frontend.base>/
    └── users/
        ├── layout.tsx    -> wraps everything under /users
        └── [id]/
            └── index.tsx -> the route  ->  <frontend.base>/users/:id
```

Only `index.tsx` is a route and only `layout.tsx` is a layout - everything else in a
route folder is a colocated helper, never scanned.
[Rationale&nbsp;›](/routing/rationale.md)

A Solid folder ignores other frameworks' files - a stray `.vue` or `.svelte` page is
never picked up.

## Configuration

The folder's `kosmo.config.ts` declares what the folder is. A typical Solid folder:

```ts [kosmo.config.ts]
// Solid: kosmo.config.ts
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "solid",
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

`"solid"`. A bare name runs `vite-plugin-solid` with defaults. To configure the
plugin, construct it yourself and pass it alongside the name:

```ts
// Solid: kosmo.config.ts
import solid from "vite-plugin-solid";

frontend: {
  stack: {
    name: "solid",
    plugin: solid({ hot: true }),
  },
  base: "/",
}
```

**Never also list the Solid plugin in `viteConfig.plugins`** - the stack plugin reaches
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
// Solid: kosmo.config.ts
frontend: {
  stack: "solid",
  base: "/",
  viteConfig: {
    // the Solid plugin reaches Vite through `stack`; anything else goes here
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

## Routing on Solid

Folder names become URL segments; only `index.tsx` defines a route:

```txt
pages/users/index.tsx        -> /users
pages/users/[id]/index.tsx   -> /users/:id
```

Parameters: `[id]` required · `{id}` optional · `{...path}` splat - the same syntax as
the API side. Static routes always win over dynamic ones.
[Parameter&nbsp;details&nbsp;›](/routing/params.md)

Solid-specific support limits:

- **Mixed segments** (`files/[name].[ext]`) - **not supported** on Solid; use plain
segments on the page side.
- **Power syntax** (raw `path-to-regexp` patterns) - not supported on any frontend.

Route definitions are derived into `lib/` and handed to Solid Router as plain,
framework-native route objects - there is no route tree to register, and everything
Solid Router documents keeps working: nested layouts, lazy loading, `preload`. All page
components are **lazy-loaded** by default, fetched on demand per navigation.
[How&nbsp;routing&nbsp;derives&nbsp;›](/routing/intro.md) ·
[Frontend&nbsp;routing&nbsp;›](/frontend/routing.md)

## Pages

A page default-exports a component:

```tsx [pages/users/index.tsx]
// Solid: pages/users/index.tsx
export default function UsersPage() {
  return <h1>Users</h1>;
}
```

Create the file **empty** and let KosmoJS seed the boilerplate - seeding fills blank
files only and never overwrites content. In containers and CI, where the file watcher
can behave clunky, create the empty files and run the build command - it resolves
routes with the same code, deterministically.

## `_/use` does not exist here

Like React, a Solid folder has no `_/use` - the import does not resolve. `_/use` is
derived **only for Vue, Svelte and MDX** folders; Solid Router already covers this
ground:

| Need | Solid |
|---|---|
| loader data | `createAsync()` from `@solidjs/router` |
| route params | `useParams()` from `@solidjs/router` |
| search params | `useSearchParams()` from `@solidjs/router` |
| navigate | `useNavigate()` from `@solidjs/router` |

## The app file and `AppProvider`

`app.tsx` at the folder root is the **global wrapper**, rendered around every route
including the 404 page - the place for providers, auth gates, analytics, an app-wide
error boundary. It is not a layout: it has no folder scope, it simply wraps everything.

The default shell composes `AppProvider` from `_/app` around the routed tree, which
arrives as `props.children`. `_/app` is a derived seam: a pass-through by default,
swapped under the hood when a feature needs to wrap the tree in a provider (TanStack
Query does this) - so toggling such a feature never changes your code:

<!--@include: @/parts/frontend/application/root-component.md#solid-->

## `router.ts`

`routerFactory` hands your `app` plus the derived routes to Solid Router, returning
`clientRouter()` for browser navigation and `serverRouter(url)` for SSR. The default
file is rarely touched:

<!--@include: @/parts/frontend/application/router.md#solid-->

## `entry/client.ts`

The browser entry, referenced from `index.html`. `renderFactory` reads the
`__KOSMO_HYDRATION_BOOL__` flag the server injects and picks `hydrate()` when SSR
markup is present, `mount()` for a fresh client-only render - Solid's `render`/
`hydrate` from `solid-js/web` underneath:

<!--@include: @/parts/frontend/application/entry-client.md#solid-->

The derived `hydrate` and `mount` are conveniences that wire the router to the DOM the
usual way. For custom mounting, ignore them and render the router's component into
`root` yourself.

## Loading data

A page exports `preload` - Solid Router calls it on link hover and navigation intent -
and the component reads with `createAsync`. **This is the Solid-specific trap**: wrap
the fetch in `query()` so both hit **one** cache key. The raw client method is not
cached, so if `preload` and `createAsync` call it separately, the request runs twice:

```tsx [pages/users/[id]/index.tsx]
// Solid: pages/users/[id]/index.tsx
import { Suspense } from "solid-js";
import { createAsync, query, useParams } from "@solidjs/router";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

// wrap in query() so preload and createAsync share one cache key
const getUser = query((id: string) => GET([id]), "user");

export const preload = ({ params }) => getUser(params.id);

export default function UserProfile() {
  const params = useParams();
  // createAsync reads the same query cache the preload warmed - no duplicate request
  const user = createAsync(() => getUser(params.id));
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>{user()?.name}</div>
    </Suspense>
  );
}
```

There is no proprietary `beforeLoad`-style hook - Solid Router's own primitives are
untouched - and real caching beyond `query()`'s dedup is TanStack Query's job.

### Suspense is your responsibility

`createAsync` **suspends**: reading `user()` in JSX while the value is pending throws
to the nearest `<Suspense>` boundary, and KosmoJS ships no boundary for you - an async
read without one above it is an error. This is the exception among the frontends - the
other frameworks' loaders resolve before render and need none. One boundary over
everything collapses the whole page to a single fallback, so scope boundaries to the
subtrees that actually suspend.

### Typing the result - `ResponseT`

`createAsync` infers its type from the fetcher, so there is no boundary to annotate -
the declared response type flows from the client method through `query()` into
`user()`. Name the type explicitly where a signature wants it - the query wrapper,
props, stores, shared helpers - via the `ResponseT` map from `_/fetch`, keyed by route
name then method:

```ts [pages/users/[id]/helpers.ts]
// Solid: pages/users/[id]/helpers.ts
import type { ResponseT } from "_/fetch";

// name the type once, reuse it across components
export type User = ResponseT["users/[id]"]["GET"];

export const formatUser = (user: User) => {
  return `${user.name} [${user.email}]`;
}
```

An entry exists in `ResponseT` **only when the handler declares a `response`** -
without one, the client method returns `Promise<unknown>` and there is no entry.
Declaring `response: [200, "json", T]` on the API handler is the one line that fixes
it. Variants without a body (`| [409]`) drop out of the union.

## Layouts

A `layout.tsx` in any folder under `pages/` wraps every route in that folder and its
subfolders; nest layouts by nesting folders. Child routes arrive as `props.children`:

<!--@include: @/parts/frontend/layouts/implementation.md#solid-->

Rules that bite:

- **Lowercase only.** `Layout.tsx` is a regular component, not a layout.
- **No opt-out.** Child routes always inherit parent layouts; routes that shouldn't
share one belong in a different directory branch.
- **A root-level `pages/layout.tsx` is not picked up.** The wrap-everything role belongs
to `app.tsx`.
- **State persists.** Navigating between siblings under one layout swaps only the child;
the layout stays mounted and its state is preserved. It remounts only when navigation
leaves its subtree.

For `/dashboard/settings/profile` the render order is
`app.tsx -> dashboard/layout.tsx -> dashboard/settings/layout.tsx -> the page`.

### Data loading in a layout

A layout is route-level, so it loads data the same way a page does - `preload` plus
`createAsync` over one `query()` wrapper. A layout's data is kept distinct from its
page's by the `query()` cache string you supply, not by the hook read - give each its
own key:

<!--@include: @/parts/frontend/layouts/data-loading.md#solid-->

## The 404 page

`pages/404.tsx` renders for unmatched routes:

<!--@include: @/parts/frontend/error-pages/not-found.md#solid-->

It is appended to the route list as the router's catch-all, always last, so it matches
only after every real route has failed to. `app.tsx` wraps it; **no `layout.tsx`
does**. It never appears in the typed `Link` route map, is lazy-loaded on the client
and imported eagerly into the SSR bundle.

The HTTP status differs by mode: SSR answers a real `404`; under CSR the host has
already answered `200` with the SPA fallback before the router decides - if crawlers or
uptime checks need correct codes, enable SSR for the folder or return 404 for unknown
paths at the proxy. There is no `notFound()` helper and no per-route not-found file:
a route that exists but has nothing to show branches in the component, and API 404s
are a backend concern that never renders a page.

## Error handling

### Render errors - a boundary in a layout

When a component throws, Solid's own `<ErrorBoundary>` catches it and swaps in
fallback UI. KosmoJS ships no boundary of its own - place one in a layout, so it
covers that subtree and leaves siblings unaffected. The fallback receives the error
and a `reset` function:

```tsx [pages/dashboard/layout.tsx]
// Solid: pages/dashboard/layout.tsx
import { ErrorBoundary, type ParentProps } from "solid-js";

export default function Layout(props: ParentProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div role="alert">
          <p>Something went wrong: {String(error.message ?? error)}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
}
```

During SSR, Solid is the one frontend that renders the boundary's fallback HTML on the
server for a synchronous shell throw - the fallback arrives in the same server pass.

### Preload errors

A fetch failure in `preload` surfaces through the resource: it reaches the component
when `user()` is read, where a downstream `<ErrorBoundary>` under the `<Suspense>`
boundary catches it. Handle it there, **not** with a `try`/`catch` inside `preload` -
catching inside hides the failure from the boundary designed to render it.

### Event handlers and mutations

A fetch call in a click or submit handler runs outside render, so no boundary can see
it. Handle these with a local `try`/`catch` where the call is made. The fetch client
always **throws on failure** - three kinds reach the `catch`:

```tsx [pages/example/index.tsx]
// Solid: pages/example/index.tsx
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
```

With TanStack Query, a query stores its failure in `query.error` and does not throw
during render by default; set `throwOnError: true` to escalate into the nearest
boundary, and read `mutation.error` for mutation state.

Client-side validation is fast feedback, not security - the server always re-validates
with the same schemas. [Client&nbsp;validation&nbsp;›](/fetch/validation.md)

## Fetch clients on a Solid page

The typed fetch clients are framework-agnostic - typed params, payload and response,
with client-side validation before the request:

```tsx [pages/users/index.tsx]
// Solid: pages/users/index.tsx
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

const user = await GET([123]);
// user is typed from the route's declared response
```

The same call is isomorphic: a same-origin request in the browser, an in-process
dispatch into the bundled API during SSR - preloads run during the render, so they take
the in-process path and the result is reused on hydration rather than refetched.
A fetch in `onMount` or `createEffect` runs after hydration, in the browser, over the
network.
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

<!--@include: @/parts/frontend/server-render/entry-server.md#solid-->

<!--@include: @/parts/frontend/server-render/assets.md-->

### Streaming

Solid supports stream rendering. Every route defaults to `"string"`; opt routes in by
glob - first match wins, so order patterns specific to general:

```ts [kosmo.config.ts]
// Solid: kosmo.config.ts
frontend: {
  stack: "solid",
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
Solid serializes resource errors into the stream and rethrows them during client
hydration, where an `<ErrorBoundary>` catches them - so a streamed page must have a
boundary in place and be able to render something for every state its data can be in.

### Debugging SSR

The loop is `pnpm preview` - dev never server-renders, so there is nothing to debug
there (see [Production preview](#production-preview)).
View source (not the inspector) - a server-rendered page arrives with real markup in
`<div id="app">`; empty means the render was skipped or fell back to CSR. `window` /
`document` access during render is the most common SSR-only crash - move it into
`onMount` or guard with `typeof window !== "undefined"`. If a route misbehaves only
when streamed, drop it back to `"string"` to isolate the bug.

## Static site generation

`ssg: true` renders routes to static HTML at build time - it requires `ssr: true`,
because pages are rendered by the folder's own SSR server. Static routes render
automatically; a dynamic route renders once per parameter set declared through
`staticParams`, and one **without** `staticParams` is skipped entirely:

<!--@include: @/parts/frontend/static-site-generation/static-params.md#solid-->

Each entry is positional in the route's parameter order; a splat takes an array of
segments. The page's `preload` runs once per entry, in-process against the bundled
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
// Solid: kosmo.config.ts
frontend: {
  stack: "solid",
  base: "/",
  ssr: true,
  tanstack: { query: true },
}
```

Enabling it deploys the `_/query` runtime and swaps `_/app` for a provider that
supplies the client - per-request on the server, a singleton in the browser. Nothing
else to wire; what you write is ordinary TanStack Solid Query. **The hooks take a
thunk** - `useQuery(() => ({ ... }))` - so the options track reactively:

<!--@include: @/parts/frontend/tanstack-query/basic-usage.md#solid-->

This fetches on the client after mount - the seamless path, enough for most pages.

### Custom client

`_/query` exports `getQueryClient()` (resolves the active client, no arguments) and
`createQueryClient(options)` (builds one configured client and registers it as the
active one). For custom defaults, create the client in `app.tsx` and hand it to the
provider:

```tsx [app.tsx]
// Solid: app.tsx - pass the configured client to the provider's `client` prop
import { AppProvider } from "_/app";
import { createQueryClient } from "_/query";
import type { ParentComponent } from "solid-js";

const client = createQueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});

const app: ParentComponent = (props) => {
  return <AppProvider client={client}>{props.children}</AppProvider>;
};

export default app;
```

### SSR warmup (advanced)

Solid Query rehydrates through Solid's `generateHydrationScript()`, which the SSR
entry already emits - so there is **no `HydrationBoundary` to place**. Prefetch into
the request-scoped client (from `getQueryClient()`) inside `preload`, and the cache
crosses to the browser automatically; share one query-options helper so the `queryKey`
matches on both sides:

```tsx [pages/users/[id]/index.tsx]
// Solid: pages/users/[id]/index.tsx
import { useQuery } from "@tanstack/solid-query";
import { useParams } from "@solidjs/router";
import { getQueryClient } from "_/query";
import fetchClients from "_/fetch";

const { GET } = fetchClients["users/[id]"];

const queryOptions = (id: string) => ({
  queryKey: ["users", id],
  queryFn: () => GET([id]),
});

export const preload = ({ params }: { params: { id: string } }) =>
  getQueryClient().prefetchQuery(queryOptions(params.id));

export default function Page() {
  // Solid folders read params through Solid Router's own hook
  const params = useParams();
  const query = useQuery(() => queryOptions(params.id));
  return <div>{query.data?.name}</div>;
}
```

### Mutations

Exactly as TanStack documents, with the same thunk form - `mutationFn` calls the fetch
client, and `invalidateQueries` refetches affected queries in place:

<!--@include: @/parts/frontend/tanstack-query/mutations.md#solid-->

## Typed navigation - `Link`

The default `components/Link.tsx` wraps Solid Router's link with compile-time route
validation. `to` takes a tuple of route name then params in path order, plus an
optional `query` prop:

```tsx [components/Menu.tsx]
// Solid: components/Menu.tsx
import Link from "~/components/Link";

export default function Menu() {
  return (
    <nav>
      <Link to={["index"]}>Home</Link>
      <Link to={["users/[id]", 123]}>User Profile</Link>
      <Link to={["posts/[slug]", "hello-world"]} query={{ ref: "sidebar" }}>
        Blog Post
      </Link>
    </nav>
  );
}
```

`to` is typed as a discriminated union derived from the route structure, so renaming a
route directory produces a compile error at every stale `Link` - refactors become an
automated checklist. The 404 page has no route name and cannot be linked to.

## Custom page templates

`frontend.templates` seeds page `index.tsx` files by route-name glob - `*` one level,
`**` any depth, first written match wins, parameters matched literally. Templates fill
**blank files only**; changing one never rewrites existing pages (empty a file to
re-seed it). A template is a string or a function of the route:

```ts [kosmo.config.ts]
// Solid: kosmo.config.ts
const landingTemplate = `
import { useParams } from "@solidjs/router";

export default function Page() {
  const params = useParams();

  return (
    <div>
      <h1>Landing</h1>
      <p>Route params: {JSON.stringify(params)}</p>
    </div>
  );
}
`;

export default defineConfig({
  frontend: {
    stack: "solid",
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
`jsxImportSource: "solid-js"`, the reserved `@/` `~/` `_/` path mappings and strict
settings. Anything you set in `compilerOptions` wins, per folder:

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
- Note `class`, not `className`.
- The data export is **`preload`**, not `loader` - and it pairs with `createAsync`
over one `query()` cache key, or the request runs twice.
- Solid is the only frontend that needs a `<Suspense>` boundary in the common case -
`createAsync` suspends; the other frameworks' loaders resolve before render.
- TanStack Query hooks take a thunk here - `useQuery(() => ({ ... }))`.
- Streaming SSR is available for Solid (React and Vue also stream; Svelte and MDX
render to string only), and Solid is the one frontend that renders an error
boundary's fallback HTML on the server for a synchronous shell throw.
- Mixed segments are not supported on Solid pages - keep page segments plain.
- The default stack plugin is `vite-plugin-solid`. Pass your own through
`stack: { name: "solid", plugin: solid({ ... }) }`, never through `viteConfig.plugins`.
- `_/use` does not resolve in Solid folders - `@solidjs/router` covers that ground.
- Backend idioms live on their own pages: [Hono&nbsp;›](/agents/hono.md) ·
[H3&nbsp;›](/agents/h3.md) · [Koa&nbsp;›](/agents/koa.md)
