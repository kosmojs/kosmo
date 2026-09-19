---
title: MDX frontend
description: The complete MDX surface of KosmoJS on one page - configuration, routing,
    no TypeScript in .mdx, hooks inside rendered components, loaders and paramsEntries,
    frontmatter-driven staticParams and head, layouts, string-only SSR, SSG and Link.
head:
  - - meta
    - name: keywords
      content: mdx, kosmojs mdx, no typescript in mdx, frontmatter, useFrontmatter,
        useLoaderData, useParams, paramsEntries, props.children, layout.mdx, app.mdx,
        staticParams frontmatter, preact, MDXProvider, components map, string-only SSR
---

A folder with `frontend: { stack: "mdx" }`. Pages are `.mdx` (or `.md`), layouts are
`layout.mdx`.

This page is the **complete MDX surface** of KosmoJS, written to be read on its own:
every snippet on it is MDX (with Preact for the `.tsx` components it imports), and no
other framework's code appears anywhere on the page. Links go only to
framework-agnostic pages; everything MDX-specific is inlined here.

MDX folders are purpose-built for content - documentation, blogs, marketing pages -
authored in Markdown with JSX, rendered with Preact, and delivered with minimal
client-side JavaScript. Routing conventions, validation and the typed fetch clients
behave the same as every frontend. What this page fixes is the idiom: **no TypeScript
in `.mdx`**, hooks called inside rendered components, `staticParams` and head content
in frontmatter, `.mdx`-only layouts, string-only SSR, and no TanStack Query.

## What the folder contains

Creating a source folder with an MDX frontend seeds a small, fixed set of files.
Each is a real source file you own - written once into a blank file, never re-seeded:

```txt
src/<folder>/
├── kosmo.config.ts       -> the folder's config - the frontend block lives here
├── tsconfig.json         -> { "extends": "../../lib/<folder>/tsconfig.json" }
├── index.html            -> Vite's HTML entry, loads entry/client
├── app.mdx               -> global wrapper around EVERY route, incl. 404
├── router.ts             -> routerFactory: routes + components map -> the matcher
│
├── components/
│   ├── Link.tsx          -> type-safe navigation component
│   └── mdx.ts            -> MDXProvider component overrides
│
├── entry/
│   ├── client.ts         -> mount vs hydrate, in the browser
│   └── server.ts         -> renderToString  (SSR only; string-only here)
│
└── pages/
    ├── 404.mdx           -> rendered for unmatched routes
    ├── index/
    │   └── index.mdx     -> the route  ->  <frontend.base>/
    └── docs/
        ├── layout.mdx    -> wraps everything under /docs
        └── [slug]/
            └── index.mdx -> the route  ->  <frontend.base>/docs/:slug
```

<!--@include: @/parts/agents/lib-derived.md-->

Only `index.mdx` / `index.md` is a route and only `layout.mdx` is a layout -
everything else in a route folder is a colocated helper, never scanned.
[Rationale&nbsp;›](/routing/rationale.md)

An MDX folder ignores other frameworks' files - a stray `.tsx` page is never picked
up as a route (`.tsx` files are components to import, not pages).

## Configuration

The folder's `kosmo.config.ts` declares what the folder is. A typical MDX folder is
content plus static generation:

```ts [kosmo.config.ts]
// MDX: kosmo.config.ts
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "mdx",
    base: "/docs",
    ssr: true,
    ssg: true,
  },
  fetch: true,
  validation: true,
  typecheck: true,
});
```

`defineConfig` from `@kosmojs/dev` is the only import a folder config needs.
The config is read once at startup - **restart the dev server** after changing it.

### frontend.stack - required

`"mdx"`. A bare name runs `@mdx-js/rollup` with a Preact JSX runtime. To configure
the plugin - remark and rehype plugins go here - construct it yourself and pass it
alongside the name:

```ts
// MDX: kosmo.config.ts
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";

frontend: {
  stack: {
    name: "mdx",
    plugin: mdx({ remarkPlugins: [remarkGfm] }),
  },
  base: "/docs",
}
```

**Never also list the MDX plugin in `viteConfig.plugins`** - the stack plugin reaches
Vite through `stack`, and listing it twice runs its transform twice. Every *other*
plugin - Tailwind among them - belongs in `viteConfig.plugins` as usual.

### frontend.base - required

The URL prefix this folder's pages are served from - an absolute path, resolved
independently of any `backend.base`:

```ts
base: "/"          // content at the root
base: "/docs"      // pages under /docs
```

### frontend.ssr / frontend.ssg

- `ssr: true` (the scaffolder's default) enables server rendering in production
builds. **SSR is string-only on MDX** - there is no `renderMode: "stream"` here -
see [Server-side rendering](#server-side-rendering).
- `ssg: true` pre-renders routes to static HTML at build time and **requires SSR
on** - the natural mode for a content folder; see
[Static site generation](#static-site-generation).
- There is no `tanstack` option to reach for - see
[No TanStack Query here](#no-tanstack-query-here).

### frontend.templates

Overrides seeded page boilerplate by route pattern - see
[Custom page templates](#custom-page-templates).

### frontend.viteConfig

Vite's `UserConfig` for the client build - `plugins`, `resolve`, `css`, `define`,
`optimizeDeps`, and the rest:

```ts
// MDX: kosmo.config.ts
frontend: {
  stack: "mdx",
  base: "/docs",
  viteConfig: {
    // the MDX plugin reaches Vite through `stack`; anything else goes here
    plugins: [tailwindcss() as never],
  },
}
```

`as never` on a plugin entry is the fix when typecheck reports `TS2321: Excessive stack
depth` on the `defineConfig(...)` call - plugins that return arrays (Tailwind among
them) push Vite's recursive `PluginOption` past TypeScript's comparison limit. It is
not needed otherwise. A handful of Vite keys are not accepted, because KosmoJS derives
them from the folder layout: `root`, `base`, `cacheDir`, `mode`, `builder`, `future`,
`legacy`.

## Routing on MDX

Folder names become URL segments; only `index.mdx` / `index.md` defines a route:

```txt
pages/blog/post/[slug]/index.mdx   -> /blog/post/:slug
pages/blog/{category}/index.mdx    -> /blog/:category (optional)
```

Parameters: `[id]` required · `{id}` optional · `{...path}` splat - the same syntax as
the API side. Static routes always win over dynamic ones.
[Parameter&nbsp;details&nbsp;›](/routing/params.md)

MDX-specific support:

- **Mixed segments** (`files/[name].[ext]`, `v[major].[minor]`) - **full** support on
MDX pages.
- **Power syntax** (raw `path-to-regexp` patterns) - not supported on any frontend.

MDX has no third-party router, so KosmoJS supplies the matcher and emits its own
`RawRoute` shape rather than a framework route tree - which is also why the hooks
come from `_/use`. All page components are **lazy-loaded** by default, fetched on
demand per navigation.
[How&nbsp;routing&nbsp;derives&nbsp;›](/routing/intro.md) ·
[Frontend&nbsp;routing&nbsp;›](/frontend/routing.md)

## Pages

A page is Markdown with JSX. Frontmatter sits in YAML between `---` fences, and
imported Preact components work inline with the prose:

```mdx [pages/blog/index.mdx]
---
title: Blog
description: Latest posts and updates.
---

{/* MDX: pages/blog/index.mdx */}

import Alert from "./Alert.tsx"

# Welcome to the Blog

Regular markdown works as expected - **bold**, *italic*, `code`,
[links](/about), and everything else.

<Alert type="info">
  JSX components work inline with markdown content.
</Alert>
```

Create the file **empty** and let KosmoJS seed the boilerplate - seeding fills blank
files only and never overwrites content. In containers and CI, where the file watcher
can behave clunky, create the empty files and run the build command - it resolves
routes with the same code, deterministically.

## No TypeScript in `.mdx`

**This is the MDX-specific trap, and it has no workaround.** `.mdx` is parsed as
plain JavaScript with JSX - **no type annotations, no type arguments, no type
imports**:

```mdx [pages/users/[id]/index.mdx]
{/* MDX: pages/users/[id]/index.mdx */}
import { useLoaderData } from "_/use";

export const Profile = () => {
  // no type argument - the result is untyped
  const user = useLoaderData();
  return <p>{user?.name}</p>;
};

<Profile />
```

`useParams<"users/[id]">()` and `import type { X }` are both syntax errors here.
Keep typed code in a `.tsx` component - TypeScript, props, hooks all work there -
and import it into the page; the `.mdx` file stays focused on content.

## Hooks run during render

`_/use` exists in MDX folders with the full set - `useLoaderData`, `useRoute`,
`useParams`, `useParamsEntries`, `useSearchParams` - plus **`useFrontmatter`**.
There is no third-party router to import from.

`export const x = useHook()` at module scope runs on **import**, not during render,
and will fail - always call hooks inside a component function rendered in the body:

```mdx [pages/blog/post/[slug]/index.mdx]
{/* MDX: pages/blog/post/[slug]/index.mdx */}
import { useParams } from "_/use";

export const Post = () => {
  const { slug } = useParams();
  return <p>Reading: {slug}</p>;
};

# Blog post

<Post />
```

Optional parameters come back possibly-undefined, and a splat parameter comes back as
an array of segments or undefined. `useRoute()` provides the full route context -
name, params, frontmatter, loader data. A `loader` cannot use hooks either - see
[Loading data](#loading-data).

## Loading data

A page exports `loader` - a function that runs before the page is rendered, on both
the server and the client - and a component reads the result with `useLoaderData()`.
The simplest form assigns a fetch-client method directly:

```mdx [pages/users/index.mdx]
{/* MDX: pages/users/index.mdx */}
import f from "_/fetch";
import { useLoaderData } from "_/use";

export const loader = f["users"].GET;

export const Message = () => {
  const data = useLoaderData();
  return <p>The message is: {data.msg}</p>;
};

# Welcome

<Message />
```

`loader` fetches through the same client used elsewhere in the project, so a request
made during SSR is captured and replayed on hydration instead of firing twice - no
extra wiring on the page. There is no built-in loader cache and no staleness model,
and no proprietary `beforeLoad`-style hook.

### Loaders with route parameters

`loader` runs before the page tree exists, so it can't use `useParams()` /
`useRoute()` - hooks only work while Preact is rendering a component. Instead,
`loader` receives the resolved route object as its first argument:

```ts
// MDX: the object passed to `loader` - a subset of the route context:
// no frontmatter (loaded with the module by then, but not passed to loaders)
// and no loaderData (not resolved yet at loader time)
type LoaderRoute = {
  name: string;
  params: Record<string, string | Array<string>>;
  paramsEntries: [keys: Array<string>, values: Array<unknown>];
  searchParams: Record<string, unknown>;
};
```

`paramsEntries` is a `[keys, values]` tuple, both in the same order the route
declares its parameters - the same order the client methods expect:

```mdx [pages/blog/[slug]/index.mdx]
{/* MDX: pages/blog/[slug]/index.mdx */}
import f from "_/fetch";
import { useLoaderData } from "_/use";

export const { GET } = f["blog/[slug]"];

export const loader = ({ paramsEntries }) => {
  const [keys, params] = paramsEntries;
  return GET(params);
};

export const Title = () => {
  const data = useLoaderData();
  return <h1>{data.title}</h1>;
};

<Title />
```

**Don't** reach for `Object.keys(route.params)` / `Object.values(route.params)` as a
substitute - JS object key order following insertion order is an implicit contract,
not a guarantee tied to how the route declares its parameters, and it can silently
break for multi-param or splat routes. `paramsEntries` derives its order from the
route's own declared parameter list, so it is correct by construction.

Since `.mdx` takes no type argument, `useLoaderData()` comes back untyped - move
anything that needs the typed result into a `.tsx` component, where the `ResponseT`
map from `_/fetch` (keyed by route name then method) names the response type. An
entry exists there **only when the API handler declares a `response`**.

## Components and the global map

Import Preact components directly into MDX files - TypeScript, props and hooks all
work in the `.tsx` file:

```tsx [pages/blog/Alert.tsx]
// MDX: pages/blog/Alert.tsx
import type { JSX } from "preact";

export default function Alert(props: {
  type: "info" | "warning" | "error";
  children: JSX.Element;
}) {
  return (
    <div class={`alert alert-${props.type}`}>
      {props.children}
    </div>
  );
}
```

Every markdown element (`# heading`, `` `code` ``, `[link](url)`) compiles to a JSX
call. Override any of them globally via the component map in `components/mdx.ts`,
applied to all pages through the `MDXProvider`; individual pages can still import
additional components directly:

```tsx [components/mdx.ts]
// MDX: components/mdx.ts
import Link from "./Link";

export const components = {
  Link,

  // custom heading with anchor links
  h1: (props) => (
    <h1 id={props.children?.toString().toLowerCase().replace(/\s+/g, "-")}>
      {props.children}
    </h1>
  ),

  // syntax-highlighted code blocks
  pre: (props) => <pre class="code-block" {...props} />,
};
```

## The app file and `AppProvider`

`app.mdx` at the folder root is the **global wrapper**, rendered around every route
including the 404 page - site-wide navigation, footer, analytics. It is not a layout:
it has no folder scope, it simply wraps everything. The default shell composes
`AppProvider` from `_/app` around the routed tree:

```mdx [app.mdx]
<!--@include: @/parts/frontend/application/root-component.md#mdx-->
```

## `router.ts`

`routerFactory` follows the same pattern as every other framework - the only
MDX-specific part is the `components` map handed to `createRouters` alongside the
app, so the MDXProvider overrides apply to every page. The default file is rarely
touched:

```ts [router.ts]
<!--@include: @/parts/frontend/application/router.md#mdx-->
```

## `entry/client.ts`

The browser entry, referenced from `index.html`. `renderFactory` reads the
`__KOSMO_HYDRATION_BOOL__` flag the server injects and picks `hydrate()` when SSR
markup is present, `mount()` for a fresh client-only render:

```ts [entry/client.ts]
<!--@include: @/parts/frontend/application/entry-client.md#mdx-->
```

## Layouts

A `layout.mdx` in any folder under `pages/` wraps every route in that folder and its
subfolders; nest layouts by nesting folders. The wrapped content arrives as
`props.children` - everything else (the page's frontmatter, loader data) is read
with hooks:

```mdx [pages/docs/layout.mdx]
<!--@include: @/parts/frontend/layouts/implementation.md#mdx-->
```

Rules that bite:

- **Layouts must be `.mdx`.** A plain `.md` file cannot render `{props.children}`
and will not work as one.
- **Lowercase only.** `Layout.mdx` is a regular file, not a layout.
- **No opt-out.** Child routes always inherit parent layouts; routes that shouldn't
share one belong in a different directory branch.
- **A root-level `pages/layout.mdx` is not the global wrapper.** That role belongs to
`app.mdx`.

For `/docs/guide/setup` the render order is
`app.mdx -> pages/docs/layout.mdx -> pages/docs/guide/layout.mdx -> the page`.

A layout reads the current page's frontmatter with `useFrontmatter()` - dynamic
headers, conditional rendering:

```mdx [pages/layout.mdx]
{/* MDX: pages/layout.mdx */}
import { useFrontmatter } from "_/use";

export const Header = () => {
  const frontmatter = useFrontmatter();
  return frontmatter.title ? (
    <header>
      <h1>{frontmatter.title}</h1>
    </header>
  ) : null;
};

<div class="page-wrapper">
  <Header />
  {props.children}
</div>
```

### Data loading in a layout

A layout loads data the same way a page does - a `loader` export. Vue, Svelte and MDX
share one per-route loader store keyed by route name, which is why a layout passes
its **path-qualified name** to the hook to read its own data, where a page passes
nothing:

```mdx [pages/dashboard/layout.mdx]
<!--@include: @/parts/frontend/layouts/data-loading.md#mdx-->
```

## The 404 page

`pages/404.mdx` renders for unmatched routes:

```mdx [pages/404.mdx]
<!--@include: @/parts/frontend/error-pages/not-found.md#mdx-->
```

It is appended to the route list as the router's catch-all, always last, so it matches
only after every real route has failed to. `app.mdx` wraps it; **no `layout.mdx`
does**. It never appears in the typed `Link` route map, is lazy-loaded on the client
and imported eagerly into the SSR bundle.

The HTTP status differs by mode: SSR answers a real `404`; under CSR the host has
already answered `200` with the SPA fallback before the router decides - if crawlers
or uptime checks need correct codes, enable SSR for the folder or return 404 for
unknown paths at the proxy.

## Frontmatter drives head and static params

The SSR server reads `title`, `description` and the `head` array from frontmatter and
injects them into the HTML template - the same convention VitePress uses, no new
syntax:

```mdx [pages/docs/getting-started/index.mdx]
---
title: Getting Started
description: Set up your first MDX source folder.
head:
  - - meta
    - name: keywords
      content: mdx, kosmojs, getting started
  - - link
    - rel: canonical
      href: https://kosmojs.dev/docs/getting-started
---
```

`staticParams` is declared in frontmatter too, rather than as an export, since a
`.mdx` page has no typed export surface - see
[Static site generation](#static-site-generation).

## Error handling

### Render errors - a Preact boundary in a layout

MDX pages render through Preact, so the boundary is a small `.tsx` component built on
`useErrorBoundary`, wrapped around `{props.children}` in a layout. KosmoJS ships no
boundary of its own:

```tsx [components/Boundary.tsx]
// MDX: components/Boundary.tsx
import { useErrorBoundary } from "preact/hooks";
import type { ComponentChildren } from "preact";

export function Boundary(props: { children: ComponentChildren }) {
  const [error, reset] = useErrorBoundary();
  if (error) {
    return (
      <div role="alert">
        <p>Something went wrong: {error instanceof Error ? error.message : String(error)}</p>
        <button onClick={reset}>Try again</button>
      </div>
    );
  }
  return props.children;
}
```

```mdx [pages/docs/layout.mdx]
{/* MDX: pages/docs/layout.mdx */}
import { Boundary } from "~/components/Boundary";

<Boundary>
  {props.children}
</Boundary>
```

One SSR caveat: for a synchronous throw at the top of a component's render, the throw
escapes the server render call rather than producing the boundary's fallback markup -
string-rendered routes recover by falling back to CSR (see below), and the boundary
works normally once the app hydrates.

### Loader errors

The loader runs before render, and KosmoJS adds no dedicated route-error channel on
top. The general rule still holds: don't `try`/`catch` inside the loader to hide
failures. Keep components guarded - `useLoaderData()` may come back undefined - and
during SSR a failing loader aborts the render to the CSR fallback, where the fetch
retries in the browser.

### Interactive components

A fetch call in a click handler lives in a `.tsx` component and runs outside render,
so no boundary can see it - handle it with a local `try`/`catch` where the call is
made. The fetch client always **throws on failure**: a `ValidationError` from `_/fetch`
means the data failed client-side validation and no request was made (with the same
structured `target`/`errors` detail as the server's); anything else is an HTTP error
status (with response and parsed body) or a transport failure. Client-side validation
is fast feedback, not security - the server always re-validates with the same schemas.
[Client&nbsp;validation&nbsp;›](/fetch/validation.md)

## Fetch clients on an MDX page

The typed fetch clients are framework-agnostic - typed params, payload and response,
with client-side validation before the request - though `.mdx` call sites read them
untyped. The same call is isomorphic: a same-origin request in the browser, an
in-process dispatch into the bundled API during SSR - loaders run during the render,
so they take the in-process path and the result is reused on hydration rather than
refetched.
[Clients&nbsp;›](/fetch/intro.md) · [Usage&nbsp;›](/fetch/start.md) ·
[URL&nbsp;utilities&nbsp;›](/fetch/utilities.md) ·
[Isomorphic&nbsp;transport&nbsp;›](/fetch/isomorphic-clients.md)

## Server-side rendering

`ssr: true` is the scaffolder's default, and **SSR is string-only on MDX** - it is
the one frontend built around static content, implementing `renderToString` and
omitting `renderToStream` entirely (React, SolidJS and Vue can stream). Two facts
frame everything else:

- **Dev is always client-rendered.** `pnpm dev` is Vite + HMR + CSR whatever `ssr`
says; the server entry runs only in production builds. To see, test or debug anything
server-rendered, run `pnpm preview` - see [Production preview](#production-preview)
below.
- **The SSR bundle includes the API** when the folder has a backend -
`dist/<folder>/ssr/server.js` serves pages and API requests from one process, and
render-time fetches dispatch in-process.

### `entry/server.ts`

`renderFactory` returns `renderToString(url, { assets })`, resolving to `{ head, html }`:

```ts [entry/server.ts]
<!--@include: @/parts/frontend/server-render/entry-server.md#mdx-->
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
`document` access during render is the most common SSR-only crash - keep it out of
components that render on the server, or guard with
`typeof window !== "undefined"`.

## Static site generation

`ssg: true` renders routes to static HTML at build time - it requires `ssr: true`,
because pages are rendered by the folder's own SSR server, and it is the natural mode
for a content folder. Static routes render automatically; a dynamic route renders
once per parameter set declared through `staticParams` - **in frontmatter, not as an
export** - and one without `staticParams` is skipped entirely:

```mdx [pages/docs/[slug]/index.mdx]
<!--@include: @/parts/frontend/static-site-generation/static-params.md#mdx-->
```

Each entry is positional in the route's parameter order; a splat takes an array of
segments. The page's `loader` runs once per entry, in-process against the bundled
API - so the build machine needs the access production has (database, CMS), which is
why SSG belongs in CI. The output is **all-or-nothing**: one failed page and nothing
is written, with every broken route named in one summary - a shell page is never
emitted. Output lands in `dist/<folder>/ssg/`, rooted at the folder's `base`; no
`404.html` is emitted, so point the static host's own not-found setting where it
expects.

## Production preview

The dev server never shows production behavior - `pnpm dev` is HMR + CSR, and
server-rendered markup, bundling problems, asset hashing and the production
validation policy do not exist until you build. `preview` builds the project and runs
`dist/run.js` - the same entry point production starts - then watches your sources
and rebuilds on change. Production output, development loop:

```sh
pnpm preview          # all source folders
pnpm preview content  # specific folder
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
confirming behavior after bundling, verifying assets and `base` paths off the root,
or reproducing a bug that only appears in a deployed build. If a page works in
preview, it works when deployed.
[Details&nbsp;›](/dev-build-run/production-preview.md)

## No TanStack Query here

MDX has no client runtime for it, so TanStack Query is **unavailable** in MDX
folders - there is no `tanstack` config option to enable. Fetch with an MDX `loader`
instead; content that genuinely needs client-side query state belongs in a React,
Solid, Vue or Svelte folder beside this one.

## Navigation with `Link`

The default `components/Link.tsx` is available for convenience, and when it is
enabled in `components/mdx.ts` (the default), it can be used in pages **without
import** - a global component provided via the `MDXProvider`. `to` takes the same
tuple as every framework - route name, then params in path order:

```mdx [pages/index/index.mdx]
{/* MDX: pages/index/index.mdx */}
Navigate to the <Link to={["blog/[slug]", "hello-world"]}>first post</Link>
or go <Link to={["index"]}>home</Link>.
```

`Link.tsx` is type-checked, but the call site in an `.mdx` page is **not** - a wrong
route name or a missing parameter surfaces at runtime rather than at build time.
Wrap navigation in a `.tsx` component where that matters. Plain markdown links
(`[Back home](/)`) work as ordinary anchors.

## Custom page templates

`frontend.templates` seeds page `index.mdx` files by route-name glob - `*` one level,
`**` any depth, first written match wins, parameters matched literally. Templates
fill **blank files only**; changing one never rewrites existing pages (empty a file
to re-seed it). A template is a string or a function of the route:

```ts [kosmo.config.ts]
// MDX: kosmo.config.ts
const docsTemplate = `---
title: Untitled
---

import { useParams } from "_/use";

# Untitled

export const Params = () => <p>Route params: {JSON.stringify(useParams())}</p>;

<Params />
`;

export default defineConfig({
  frontend: {
    stack: "mdx",
    base: "/docs",
    templates: {
      "guides/**": docsTemplate,
    },
  },
});
```

Set `"**"` to replace the built-in default everywhere. Integer-like pattern keys
(`"2024/**"`) are hoisted by JavaScript object ordering - prefix with `./` to keep
your written order.

## TypeScript

TypeScript lives in the folder's `.tsx` components, never in `.mdx`. The folder's
`tsconfig.json` extends a derived base in `lib/`, which supplies the Preact JSX
runtime for those components, the reserved `@/` `~/` `_/` path mappings and strict
settings. Anything you set in `compilerOptions` wins, per folder:

```json [src/content/tsconfig.json]
{
  "extends": "../../lib/content/tsconfig.json",
  "compilerOptions": {
    "exactOptionalPropertyTypes": false
  }
}
```

Do not add an `include` casually - it replaces rather than merges with the base,
which is what puts the folder, its `lib/` output and the ambient declarations in
scope. If you must, carry `["./", "../../lib/<folder>/", "../../lib/*.d.ts"]` over
first. Run checks with [kosmo typecheck](/cli/typecheck.md) - neither the dev server
nor the build typechecks for you, and `.mdx` call sites are outside its reach either
way. [Project&nbsp;layout&nbsp;›](/essentials/project-structure.md)

## Worth knowing

- **Create page and layout files empty and let KosmoJS seed them** - seeding writes
the current boilerplate with nothing left to recall wrong. In containers and CI,
where file watchers can behave clunky, create the empty files and run the build - it
resolves routes with the same code, deterministically.
- **No TypeScript in `.mdx`** - no annotations, no type arguments, no type imports.
Keep typed code in `.tsx` components and import them.
- Hooks are called inside component functions rendered in the body -
`export const x = useHook()` at module scope runs on import and fails. A `loader`
cannot use hooks; it receives the resolved route object (`paramsEntries` over
`Object.keys`/`Object.values`).
- `staticParams` is declared in **frontmatter**, not as an export.
- Layouts must be `.mdx` - a plain `.md` cannot render `{props.children}`.
- Vue, Svelte and MDX share one per-route loader store keyed by route name, which is
why a layout passes its own name - `useLoaderData("dashboard/layout")` - where a page
passes nothing.
- **SSR is string-only**, and TanStack Query is unavailable - fetch with a `loader`.
- Curly braces in prose are parsed as JSX - wrap them in backticks:
`` `{...spread}` ``.
- The `Link` component is typed in `Link.tsx`, but `.mdx` call sites are not
type-checked - a wrong route name surfaces at runtime.
- Mixed segments are fully supported on MDX pages.
- The default plugin is `@mdx-js/rollup` with a Preact JSX runtime; remark and rehype
plugins pass through `stack: { name: "mdx", plugin: mdx({ ... }) }`, never through
`viteConfig.plugins`.
- Backend idioms live on their own pages: [Hono&nbsp;›](/agents/hono.md) ·
[H3&nbsp;›](/agents/h3.md) · [Koa&nbsp;›](/agents/koa.md)
