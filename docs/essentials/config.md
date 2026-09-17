---
title: Configuration
description: Complete reference for kosmo.config.ts - the frontend, backend and validation
    blocks, base URLs, stack plugins and vite options, and the project-level settings in package.json.
head:
  - - meta
    - name: keywords
      content: kosmo.config.ts, defineConfig, frontend stack, backend stack, base url, devPort,
        previewPort, distDir, stack plugin, viteConfig, validation, openapi, ssr, ssg, tanstack query
---

Every source folder owns a `kosmo.config.ts`. It is the one file that decides what that folder *is* -
which frameworks it runs, where it is served from, and what gets built for it.

```txt
my-app/
├── package.json                    <- project-level settings
└── src/
    ├── front/
    │   └── kosmo.config.ts         <- this folder's config
    └── admin/
        └── kosmo.config.ts         <- independent of front's
```

There is no project-wide `kosmo.config.ts`, and no `vite.config.ts`:
each side of the folder carries its own `viteConfig`.

## The Shape

The config is declarative - you describe what the folder has:

```ts [src/app/kosmo.config.ts]
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "react", // or solid, vue, svelte, mdx
    base: "/",
    ssr: true,
    ssg: false,
    tanstack: { query: false },
  },
  backend: {
    stack: "hono", // or h3, koa
    base: "/api",
  },
  fetch: true,
  validation: true,
  typecheck: true,
});
```

A folder can have both web sides, or just one, or neither -
a folder with only [sidecar](/sidecar/intro) builds an entry point and KosmoJS routes nothing to it.

Every feature key follows the same pattern: a plain value turns it on with defaults,
or an object turns it on and hands KosmoJS the instance to use -
`stack` takes a `plugin`, `ssr` / `ssg` / `fetch` / `validation` take a `generator`.

`defineConfig` turns that description into the right set of generators, in the right order,
and is the only import a folder config needs.

## frontend

### frontend.stack - required

`"react"` · `"solid"` · `"vue"` · `"svelte"` · `"mdx"`

A bare name runs that stack's Vite plugin with defaults:

```ts
stack: "react"
```

To configure it, construct the plugin yourself and pass it alongside the name:

```ts
import react from "@vitejs/plugin-react";

stack: {
  name: "react",
  plugin: react({ jsxRuntime: "automatic" }),
}
```

`name` is what KosmoJS routes on - which stack runs, which page extensions it watches,
the `jsxImportSource` it writes into your tsconfig.
`plugin` is handed to Vite as you built it, alongside anything KosmoJS adds for that stack.

The default plugin each stack resolves to:

| stack | default plugin |
|---|---|
| react | `@vitejs/plugin-react` |
| solid | `vite-plugin-solid` |
| vue | `@vitejs/plugin-vue` |
| svelte | `@sveltejs/vite-plugin-svelte` |
| mdx   | `@mdx-js/rollup`, with a basic set of `remarkPlugins` |

Bring your own plugin instance:

```ts
import mdx from "@mdx-js/rollup";

stack: {
  name: "mdx",
  plugin: mdx({
    remarkPlugins: [frontmatterPlugin, mdxFrontmatterPlugin],
    rehypePlugins: [rehypeSlug],
  }),
}
```

::: warning Don't also list the **stack** plugin in `viteConfig.plugins`
Whichever form you use above, the stack plugin reaches Vite through `stack`.
Listing it in `viteConfig.plugins` as well runs its transform twice.

This applies to the stack plugin alone. Every other plugin - Tailwind, SVGR, whatever else -
belongs in [viteConfig.plugins](#frontend-viteconfig) as usual.
:::

### frontend.base - required

The URL prefix this folder's pages are served from. Must be absolute:

```ts
base: "/"          // app at the root
base: "/admin"     // admin dashboard under /admin
```

Duplicate slashes are collapsed and a trailing slash is stripped,
so `"/admin/"` and `"//admin"` both resolve to `"/admin"`.
Path traversal segments (`../`, `/./`) are rejected at startup.

### frontend.ssr

[Server-side rendering](/frontend/server-side-render).
Accepts `true`, or an options object:

```ts
ssr: true

ssr: {
  renderMode: {
    "docs/**": "stream",
  },
}
```

**`renderMode`** - `"string"` (default), `"stream"`, or a glob map for per-route selection.
[Details&nbsp;›](/frontend/server-side-render#selecting-the-render-mode)

### frontend.ssg

[Static site generation](/frontend/static-site-generation).

```ts
ssg: true
```

Renders routes to static HTML at build time. Requires `ssr: true` -
the scaffolder turns SSR on for you when you ask for SSG.
Dynamic routes declare their variants with `staticParams`.

### frontend.tanstack

```ts
tanstack: { query: true }
```

Deploys the `_/query` runtime, swaps `_/app` for a provider that supplies the query client,
and gives each SSR request its own client. [Details&nbsp;›](/frontend/tanstack-query)

### frontend.templates

Overrides seeded page boilerplate by route pattern:

```ts
templates: {
  "landing/*": landingTemplate,
  "marketing/**": landingTemplate,
}
```

[Custom Page Templates&nbsp;›](/frontend/custom-templates)

### frontend.viteConfig

Vite's `UserConfig` for the client build - `plugins`, `resolve`, `css`, `server`, `define`, `optimizeDeps`, and the rest:

```ts
frontend: {
  stack: "react",
  base: "/",
  viteConfig: {
    // the React plugin reaches Vite through `stack`; anything else goes here // [!code hl]
    plugins: [tailwindcss() as never],
    resolve: {
      alias: { "#shared": "/src/shared" },
    },
    css: {
      preprocessorOptions: { scss: { api: "modern" } },
    },
  },
}
```

::: tip `as never` on plugins
Vite's `PluginOption` is deeply recursive, and plugins that return an array -
Tailwind among them - nest one level further as `Plugin[][]`.
That is enough to push the comparison past TypeScript's limit:

```txt
error TS2321: Excessive stack depth comparing types
  '{ frontend: { ... viteConfig: { plugins: Plugin<any>[][]; }; }; ... }'
  and 'FolderConfig'.
```

The error is reported on `defineConfig(...)`, not on the plugin line,
because what fails is the whole config object being compared against `FolderConfig` -
the plugin is just what made the comparison too deep.
The fix still goes on the plugin entry:

```ts
plugins: [tailwindcss() as never]
```

`never` is assignable to every type, so the recursion stops there without widening anything.
Reach for it when [typecheck](/cli/typecheck) reports TS2321 on a `defineConfig` call; it is not needed otherwise.
:::

A handful of Vite keys are **not** accepted, because KosmoJS derives them from the source-folder layout:
`root`, `base` (the folder's prefixes come from `frontend.base` / `backend.base`),
`cacheDir`, `mode`, `builder`, `future`, `legacy`.

## backend

### backend.stack - required

`"hono"` · `"h3"` · `"koa"`

A bare name, or the same object form the frontend takes.
The backend stacks have no Vite plugin, so the object carries only `name` today and the bare name is the usual form.
Vite settings for the API build go in [viteConfig](#backend-viteconfig).

### backend.base - required

The URL prefix this folder's API routes are served from - a **full path**,
resolved on its own rather than against `frontend.base`:

```ts
frontend: { base: "/vue" },
backend:  { base: "/vue/api" },   // routes at /vue/api/<route name>
```

Nesting it under the frontend base is the convention the scaffolder follows,
but nothing requires it - the two prefixes are independent:

```ts
frontend: { base: "/admin" },
backend:  { base: "/api/v2" },    // routes at /api/v2/<route name>
```

A route's final URL is `backend.base` + route name:

```
base "/api"        route "users/[id]"  ->  /api/users/:id
base "/admin/api"  route "users/[id]"  ->  /admin/api/users/:id
base "/v1"         route "users/[id]"  ->  /v1/users/:id
```

The `api/` directory name never appears in the URL - it separates server routes from `pages/` on disk, nothing more.

### backend.openapi

Derives an [OpenAPI 3.1 spec](/openapi) from this folder's routes. Options are required:

```ts
backend: {
  stack: "hono",
  base: "/api",
  openapi: {
    outfile: "openapi.json",
    openapi: "3.1.0",
    info: { title: "My API", version: "1.0.0" },
    servers: [{ url: "https://api.example.com/api" }],
  },
}
```

[Details&nbsp;›](/openapi#configuration)

### backend.alias

Maps a public URL to an existing named route:

```ts
alias: {
  "/feed.xml": "rss",             // /feed.xml handled by the "rss" route
  "/members/[id]": "users/[id]",  // param names must match exactly
}
```

The key is absolute and is *not* prefixed by the router's base.
If it carries dynamic segments, their names must match the target route's parameters exactly, or the request 404s.

[Details&nbsp;›](/backend/aliases)

### backend.templates

Overrides the seeded route boilerplate by route-name pattern -
the route file (`defineRoute(...)`), not a page component.
This is what makes it useful for seeding CRUD endpoints across many tables at once.

```ts
templates: {
  "admin/**": adminRouteTemplate,
}
```

[Details&nbsp;›](/backend/custom-templates)

### backend.viteConfig

Vite's `UserConfig` for the API build, with the same exclusions as the frontend's:

```ts
backend: {
  stack: "hono",
  base: "/api",
  viteConfig: {
    define: { __API_BUILD__: true },
  },
}
```

The two sides are built separately, so `frontend.viteConfig` and `backend.viteConfig` are independent.

## sidecar

Makes this folder a **sidecar**: a process to build, and nothing KosmoJS routes to -
a queue consumer, a mail sender, a listener speaking another protocol.

```ts [kosmo.config.ts]
defineConfig({
  // ...
  sidecar: {
    entry: "./entry.ts",
    run: "./run.ts",
    serve: false,
  },
});
```

| Option | |
|---|---|
| `entry` | **required** - the service; default-exports [defineService](/sidecar/entry#the-entry) |
| `run` | the [runner](/sidecar/entry#the-runner) that starts it in production |
| `serve` | import and run it under `kosmo serve` - development only |
| `viteConfig` | Vite's `UserConfig` for this build, same exclusions as above |

Both paths are relative to the source folder, and `kosmo sidecar` seeds both files.
The entry says what the service is; the runner says how it is supervised -
which is why the dev server needs only the entry, and replaces the runner with itself.

One sidecar per folder; a second process is a second folder.

The build writes into `dist/<folder>/sidecar/`, clear of the `api/`, `client/` and `ssr/` trees a web build owns.

A sidecar is built the way the backend side is - a Node bundle, no client assets -
so `viteConfig` here carries the same shape and the same exclusions as [backend.viteConfig](#backend-viteconfig):

```ts [kosmo.config.ts]
defineConfig({
  // ...
  sidecar: {
    entry: "./entry.ts",
    serve: false,
    viteConfig: {
      define: { __WORKER_BUILD__: true },
    },
  },
});
```

## fetch

Typed [fetch clients](/fetch/intro) in `_/fetch`.

```ts
fetch: true
```

Clients are derived from the backend's routes, so this only produces anything
when the folder also has a `backend`.

## typecheck

Whether [kosmo typecheck](/cli/typecheck) covers this folder. On by default:

```ts
defineConfig({
  // ...
  typecheck: true,
});
```

Set it to `false` for a folder you do not want checked - a sidecar wrapping third-party JavaScript,
a folder mid-migration, anything where a red `tsc` is noise rather than signal.

The folder still builds and still runs; it is only left out of typecheck runs.

## validation

Runtime [validators derived from your types](/validation/intro).
Only meaningful alongside a `backend` - it validates incoming requests.

```ts
validation: true
```

For anything beyond on/off, pass an options object instead:

```ts
validation: {
  // override validation messages - node:util.format placeholders
  validationMessages: {
    STRING_MIN_LENGTH: "must be at least %d character%s long",
    NUMBER_MULTIPLE_OF: "must be a multiple of %s",
  },

  // file whose default export maps custom TypeBox types
  customTypesImport: "@/validation/types.ts",

  // identifier used for runtime refinements, default "VRefine"
  refineTypeName: "Refine",

  settings: {
    maxErrors: 8,                     // cap buffered diagnostics (DoS guard)
    useEval: true,                    // disable where unsafe-eval is blocked by CSP
    exactOptionalPropertyTypes: false,
    immutableTypes: false,
  },
}
```

- **`validationMessages`** is the place for i18n or project wording -
it changes every message globally, unlike the per-field [custom error messages](/validation/error-handling#custom-error-messages) you set on a handler.
- **`refineTypeName`** renames `VRefine` if it collides with something in your codebase.
The name is global and import-free either way. [Details&nbsp;›](/validation/refine)
- **`settings.useEval: false`** is the option to reach for when a strict Content Security Policy forbids `unsafe-eval`;
validation falls back to dynamic checking.
- **`settings.exactOptionalPropertyTypes: true`** aligns runtime check semantics with the TypeScript flag of the same name.

## What the scaffolder writes

Rather than assembling this by hand, let [kosmo folder](/cli/folder) write the right config for your answers - interactively, or from flags.
It names the bases after the folder: `/<folder>` for the frontend, `/<folder>/api` for the backend.

For reference, these are the configs it produces for a folder named `front`:

:::tabs variant:code
== React + Hono
```ts
// React + Hono
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "react",
    base: "/front",
    ssr: true,
    ssg: false,
    tanstack: { query: false },
  },
  backend: {
    stack: "hono",
    base: "/front/api",
  },
  fetch: true,
  validation: true,
  typecheck: true,
});
```

== Frontend only
```ts
// Frontend only
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "react",
    base: "/front",
    fetch: true,
    ssr: true,
    ssg: false,
    tanstack: { query: false },
  },
  fetch: false,
  validation: false,
  typecheck: true,
});
```

== Backend only
```ts
// Backend only
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  backend: {
    stack: "koa",
    base: "/front/api",
  },
  fetch: false,
  validation: true,
  typecheck: true,
});
```

== MDX docs
```ts
// MDX docs
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  frontend: {
    stack: "mdx",
    base: "/docs",
    ssr: true,
    ssg: false,
  },
  fetch: false,
  validation: false,
  typecheck: true,
});
```
:::

> Changing what a folder has - adding `ssr`, a `backend`, `validation` - requires a
**dev server restart**. The config is read once at startup.

## Bringing your own generator

Each block accepts a `generator` key that replaces the built-in one for that slot.
This is the escape hatch for a framework or a validator KosmoJS does not ship:

```ts
frontend: {
  stack: "react",
  base: "/",
  generator: myReactGenerator(),
  fetch: { generator: myFetchGenerator() },
  ssr: { generator: mySSRGenerator() },
},
backend: {
  stack: "hono",
  base: "/api",
  generator: myHonoGenerator(),
  openapi: { generator: myOpenapiGenerator() },
},
validation: { generator: myValidationGenerator() },
```

The order generators run in is fixed and does not depend on how you write the config:

```txt
core  ->  backend  ->  validation  ->  openapi  ->  fetch  ->  frontend  ->  ssr  ->  ssg
```

`coreGenerator` always runs first and is never listed.

## Project Settings - `package.json`

A few settings are project-wide rather than per-folder, and live in the root `package.json`:

```json [package.json]
{
  "type": "module",
  "distDir": "dist", // [!code hl:3]
  "devPort": 4556,
  "previewPort": 4558,
  "scripts": {
    "dev": "kosmo serve",
    "build": "kosmo build",
    "preview": "kosmo preview",
    "typecheck": "kosmo typecheck",
    "folder": "kosmo folder"
  }
}
```

| Field | Default | Meaning |
|---|---|---|
| `distDir` | `"dist"` | Build output directory for every folder |
| `devPort` | `4556` | Port the dev server listens on |
| `previewPort` | `4558` | Port [kosmo preview](/dev-build-run/production-preview) listens on |

> Changing `distDir` also means updating `.gitignore`, which the scaffolder points at the default `/dist/`.

Four scripts take optional folder names -
`pnpm dev front`, `pnpm build admin`, `pnpm preview front`, `pnpm typecheck admin front` -
and act on every source folder when given none.

`previewPort` is separate from `devPort` so preview and the dev server can run at the same time.

## TypeScript Config

### Root tsconfig.json

The project root has a `tsconfig.json` covering anything you keep outside `src/`.

It starts with only the ambient declarations in scope, so add the paths you want [typechecked](/cli/typecheck):

```json [tsconfig.json]
{
  "extends": "./lib/tsconfig.json",
  "include": ["./lib/*.d.ts"]
}
```

The root `include` is for code nothing imports - a migration script, a worker,
a standalone config, a helper you only ever run by hand.
Those have no importer to pull them in, so they are checked only if you list them here.

Shared code is the other way round. Anything a source folder imports is checked along with that folder,
so it does not need listing - adding it here only means it is checked on a root run too,
rather than only when its importer is.

When you add such a path, add to the list rather than replacing it.
This is **essential**: `include` replaces rather than merges with the config it extends,
so `./lib/*.d.ts` has to stay in it.

> Merging extended arrays has been [requested since 2017](https://github.com/microsoft/TypeScript/issues/20110)
and is still open, so carrying the entries over by hand is the only option.

---

::: warning Never add `lib/` itself
`./lib/*.d.ts` matches only the ambient declarations at the top of `lib/` - that entry is meant to be there.
The rest is derived code, generated against each folder's own path mappings and already checked by that folder's run.
In the root program `_/` resolves against the wrong folder, so you get errors in files you cannot fix -
they are rewritten on the next run.
:::

### Per-folder tsconfig.json

Each source folder has its own `tsconfig.json` extending a derived base in lib dir:

```json [src/front/tsconfig.json]
{ "extends": "../../lib/front/tsconfig.json" }
```

The base `tsconfig.json` supplies the framework's `jsxImportSource`, the reserved path mappings,
and strict compiler settings. Anything you add in your own `compilerOptions` wins, and applies to that folder only:

```json [src/front/tsconfig.json]
{
  "extends": "../../lib/front/tsconfig.json",
  "compilerOptions": {
    "exactOptionalPropertyTypes": false
  }
}
```

Note there is no `include` in a source folder's `tsconfig.json`.
The base `tsconfig.json` already has everything a source folder normally needs.

But if you really need to include more, carry these base entries over first:

```json
["./", "../../lib/<folder>/", "../../lib/*.d.ts"]
```

So your file should look like this:

```json [src/front/tsconfig.json]
{
  "extends": "../../lib/front/tsconfig.json",
  "include": ["./", "../../lib/front/", "../../lib/*.d.ts", "../../shared"]
}
```

::: tip You do not need `include` to *use* shared code
Anything you import is typechecked along with the file importing it.
`import { formatUser } from "@/shared/user"` pulls `shared/user.ts` into that
folder's program whatever `include` says - the `@/` prefix resolves it,
and there is nothing to add to any `tsconfig.json`.
:::
