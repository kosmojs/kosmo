---
title: Configuration
description: Complete reference for kosmo.config.ts - source folder options, the full generator
    list with their options, generator ordering, and the project-level settings in package.json.
head:
  - - meta
    - name: keywords
      content: kosmo.config.ts, defineConfig, generators, apiBase, base url, devPort, distDir,
        vite config, reactGenerator, ssrGenerator, openapiGenerator, typeboxGenerator, refineTypeName
---

Every source folder owns a `kosmo.config.ts`. It is the one file that decides what that folder *is* -
which frameworks it runs, where it is served from, and what gets generated for it.

```txt
my-app/
├── package.json                    ← project-level settings
└── src/
    ├── front/
    │   └── kosmo.config.ts         ← this folder's config
    └── admin/
        └── kosmo.config.ts         ← independent of front's
```

There is no project-wide `kosmo.config.ts`, and no `vite.config.ts`:
**`kosmo.config.ts` is your Vite config for that folder** (see [Vite options](#vite-options)).

## The Shape

```ts [src/front/kosmo.config.ts]
import { defineConfig, reactGenerator, ssrGenerator } from "@kosmojs/dev";

export default defineConfig({
  base: "/",
  generators: [reactGenerator(), ssrGenerator()],
});
```

`base` is the only required option. Everything else has a default.

## Folder Options

### `base` - required

The URL this source folder is served from.

```ts
base: "/"          // front-end app at the root
base: "/admin"     // admin dashboard under /admin
```

It also accepts a per-environment map, resolved against `NODE_ENV` at config load:

```ts
base: {
  development: "/",
  production: "/app",
}
```

Recognized keys are `development`, `test`, `stage` and `production`,
plus any custom `NODE_ENV` value you use.
A missing base for the active environment is a startup error, not a silent fallback.

### `apiBase`

Prefix for this folder's API routes. **Default: `"/api"`.**

A route's final URL is `base` + `apiBase` + route name:

```
base "/"       apiBase "/api"   route "users/[id]"  ➜  /api/users/:id
base "/admin"  apiBase "/api"   route "users/[id]"  ➜  /admin/api/users/:id
base "/"       apiBase "/v1"    route "users/[id]"  ➜  /v1/users/:id
```

The `api/` directory name never appears in the URL - it separates server routes from `pages/` on disk, nothing more.

### `generators`

The list of generators to run for this folder.
**Default: `[]`** - a folder with no generators has no backend, no frontend, and produces nothing.

See [Generators](#generators-1) below for the full list and their options.

### `refineTypeName`

The identifier used for runtime refinements. **Default: `"VRefine"`.**

Rename it if `VRefine` collides with something in your codebase:

```ts
refineTypeName: "Refine",   // then write Refine<string, { format: "email" }>
```

The name is global and import-free either way.
[Details&nbsp;›](/validation/refine)

### Vite options

`kosmo.config.ts` accepts **everything Vite's `UserConfig` accepts** -
`plugins`, `resolve`, `css`, `server`, `define`, `optimizeDeps`, and the rest - and passes them through:

```ts
export default defineConfig({
  base: "/",
  generators: [reactGenerator()],

  plugins: [tailwindcss()],
  resolve: {
    alias: { "#shared": "/src/shared" },
  },
  css: {
    preprocessorOptions: { scss: { api: "modern" } },
  },
});
```

A handful of Vite keys are **not** accepted, because `KosmoJS` derives them from the source-folder layout:
`root`, `base` (replaced by the folder `base` above), `cacheDir`, `mode`, `builder`, `future`, `legacy`.

::: warning Don't add your framework's Vite plugin yourself
Each framework generator inserts its own Vite plugin, already configured.
Adding it to `plugins` as well runs the transform twice.
Pass plugin options through the generator instead - `reactGenerator({ jsxRuntime: "classic" })` -
since every framework generator's options extend its Vite plugin's options.
:::

## Generators

A generator is one unit of "what this folder gets": a backend, a frontend, validators,
fetch clients, an OpenAPI spec, SSR, SSG. All are imported from `@kosmojs/dev`.

| Generator | Slot | Options | What it adds |
|---|---|---|---|
| `honoGenerator()` | backend | optional | Hono API - `api/` routes, middleware, `api/app.ts` |
| `h3Generator()` | backend | optional | H3 API |
| `koaGenerator()` | backend | optional | Koa API |
| `fetchGenerator()` | fetch | – | Typed fetch clients in `_/fetch` |
| `typeboxGenerator()` | – | optional | Runtime validators from your types |
| `reactGenerator()` | frontend | optional | React pages, router, entries |
| `solidGenerator()` | frontend | optional | SolidJS pages, router, entries |
| `vueGenerator()` | frontend | optional | Vue pages, router, entries |
| `svelteGenerator()` | frontend | optional | Svelte pages, router, entries |
| `mdxGenerator()` | frontend | optional | MDX content pages (Preact) |
| `openapiGenerator(cfg)` | – | **required** | OpenAPI 3.1 spec |
| `ssrGenerator()` | ssr | optional | `entry/server.ts`, SSR build |
| `ssgGenerator()` | ssg | – | Static HTML at build time (MDX folders) |

`coreGenerator()` is exported too, but you never list it - the chassis always runs it first.

### Ordering doesn't depend on array order

Generators are sorted by **slot** before they run, so you cannot break a folder by listing them in the "wrong" order:

```txt
core  →  backend  →  fetch  →  frontend  →  (slotless, in array order)  →  ssr  →  ssg
```

Two consequences:

- `fetchGenerator()` only runs **if a backend generator is present**.
In a frontend-only folder it is a no-op - there are no routes to generate clients for.
- Slotless generators (`typeboxGenerator`, `openapiGenerator`) *do* respect the order you write them in, relative to each other.

### What the scaffolder writes

Rather than assembling this by hand, `pnpm folder` writes the right set for your answers.
For reference, these are the configs it produces:

:::tabs variant:code
== React + Hono
```ts
import {
  defineConfig,
  reactGenerator,
  honoGenerator,
  fetchGenerator,
  typeboxGenerator,
} from "@kosmojs/dev";

export default defineConfig({
  base: "/",
  generators: [
    reactGenerator(),
    honoGenerator(),
    fetchGenerator(),
    typeboxGenerator(),
  ],
});
```

== Frontend only
```ts
import { defineConfig, reactGenerator } from "@kosmojs/dev";

export default defineConfig({
  base: "/",
  generators: [reactGenerator()],
});
```

== Backend only
```ts
import {
  defineConfig,
  koaGenerator,
  fetchGenerator,
  typeboxGenerator,
} from "@kosmojs/dev";

export default defineConfig({
  base: "/",
  generators: [koaGenerator(), fetchGenerator(), typeboxGenerator()],
});
```

== MDX docs
```ts
import {
  defineConfig,
  mdxGenerator,
  ssgGenerator,
  ssrGenerator,
} from "@kosmojs/dev";

import frontmatterPlugin from "remark-frontmatter";
import mdxFrontmatterPlugin from "remark-mdx-frontmatter";

export default defineConfig({
  base: "/docs",
  generators: [
    mdxGenerator({ remarkPlugins: [frontmatterPlugin, mdxFrontmatterPlugin] }),
    ssgGenerator(),
    ssrGenerator(),
  ],
});
```
:::

> Adding a generator to an existing folder requires a **dev server restart** -
generators are resolved once at startup.

## Generator Options

### Frontend generators

`reactGenerator` · `solidGenerator` · `vueGenerator` · `svelteGenerator`

Options extend the framework's own Vite plugin options, plus:

```ts
reactGenerator({
  // any @vitejs/plugin-react option, passed straight through
  jsxRuntime: "automatic",

  // wire TanStack Query for this folder
  tanstack: { query: true },

  // override generated page boilerplate by route pattern
  templates: {
    "admin/**": adminPageTemplate,
  },
})
```

- **`tanstack.query`** - deploys the `_/query` runtime,
swaps `_/app` for a provider that supplies the query client, and gives each SSR request its own client.
[Details&nbsp;›](/frontend/tanstack-query)
- **`templates`** - [Custom Page Templates ›](/frontend/custom-templates)

### `mdxGenerator`

```ts
mdxGenerator({
  remarkPlugins: [frontmatterPlugin, mdxFrontmatterPlugin],
  rehypePlugins: [rehypeSlug],
  templates: { "blog/**": postTemplate },
})
```

`remarkPlugins`/`rehypePlugins` are passed to the MDX processor.
Frontmatter support comes from plugins, which is why the scaffolder adds `remark-frontmatter`
and `remark-mdx-frontmatter` for you. [Details&nbsp;›](/frontend/mdx)

### Backend generators

`honoGenerator` · `h3Generator` · `koaGenerator`

Options extend Vite's `UserConfig` (applied to the API build), plus:

```ts
honoGenerator({
  // serve extra URLs from an existing route
  alias: {
    "/feed.xml": "rss",              // /feed.xml handled by the "rss" route
    "/members/[id]": "users/[id]",  // param names must match exactly
  },

  templates: {
    "admin/**": adminRouteTemplate,
  },
})
```

**`alias`** maps a public URL to an existing named route.
The key is absolute and is *not* prefixed by the router's base.
If it carries dynamic segments, their names must match the target route's parameters exactly, or the request 404s.

**`templates`** overrides the generated route boilerplate by route-name pattern -
the route file (`defineRoute(...)`), not a page component.
This is what makes it useful for scaffolding CRUD endpoints across many tables at once.
[Custom Route Templates&nbsp;›](/backend/custom-templates)

### `typeboxGenerator`

Controls how validators are generated and how validation errors read.

```ts
typeboxGenerator({
  // override validation messages - node:util.format placeholders
  validationMessages: {
    STRING_MIN_LENGTH: "must be at least %d character%s long",
    NUMBER_MULTIPLE_OF: "must be a multiple of %s",
  },

  // file whose default export maps custom TypeBox types
  customTypesImport: "@/validation/types.ts",

  settings: {
    maxErrors: 8,                     // cap buffered diagnostics (DoS guard)
    useEval: true,                    // disable where unsafe-eval is blocked by CSP
    exactOptionalPropertyTypes: false,
    immutableTypes: false,
  },
})
```

- **`validationMessages`** is the place for i18n or project wording -
it changes every message globally, unlike the per-field [custom error messages](/validation/error-handling#custom-error-messages) you set on a handler.
- **`settings.useEval: false`** is the option to reach for when a strict Content Security Policy forbids `unsafe-eval`;
validation falls back to dynamic checking.
- **`settings.exactOptionalPropertyTypes: true`** aligns runtime check semantics with the TypeScript flag of the same name.

### `ssrGenerator`

```ts
ssrGenerator({
  renderMode: {
    "docs/**": "stream",
  },
})
```

**`renderMode`** - `"string"` (default), `"stream"`, or a glob map for per-route selection.
First match wins, so order patterns specific → general.
[Details&nbsp;›](/frontend/server-side-render#selecting-the-render-mode)

::: warning Numeric-looking patterns get hoisted
JavaScript objects order integer-like keys first, regardless of where you wrote them.
A pattern such as `"2024/**"` jumps to the front and matches before anything above it.
Prefix it with `./` to keep the order you wrote - `"./2024/**"`.
The `./` is stripped when matching.
:::

### `openapiGenerator` - options required

The only generator whose options are mandatory.
[Full reference&nbsp;›](/openapi#configuration)

```ts
openapiGenerator({
  outfile: "openapi.json",
  openapi: "3.1.0",
  info: { title: "My API", version: "1.0.0" },
  servers: [{ url: "https://api.example.com" }],
})
```

### `ssgGenerator` and `fetchGenerator`

Take no options.

`ssgGenerator()` renders every route to a static HTML file at build time and is meaningful on **MDX folders** -
the scaffolder adds it there by default.
Remove it to stop emitting static routes.
[Details&nbsp;›](/frontend/mdx#static-site-generation)

`fetchGenerator()` produces the typed clients in `_/fetch`,
and runs only when a backend generator is present. [Details&nbsp;›](/fetch/intro)

## Project Settings - `package.json`

A few settings are project-wide rather than per-folder, and live in the root `package.json`:

```json [package.json]
{
  "type": "module",
  "distDir": "dist", // [!code hl:2]
  "devPort": 4556,
  "scripts": {
    "dev": "kosmo serve",
    "build": "kosmo build",
    "typecheck": "kosmo typecheck",
    "folder": "kosmo folder"
  }
}
```

| Field | Default | Meaning |
|---|---|---|
| `distDir` | `"dist"` | Build output directory for every folder |
| `devPort` | `4556` | Port the dev server listens on |

> Changing `distDir` also means updating `.gitignore`, which the scaffolder points at the default `/dist/`.

Three scripts taking optional folder names - `pnpm dev front`, `pnpm build admin`,
`pnpm typecheck admin front` - and act on every source folder when given none.

## TypeScript Config

Each source folder has its own `tsconfig.json` extending a generated base:

```json [src/front/tsconfig.json]
{ "extends": "../../lib/front/tsconfig.json" }
```

The generated base supplies the framework's `jsxImportSource`,
the reserved path mappings, and strict compiler settings.
Anything you add in your own `compilerOptions` wins, and applies to that folder only:

```json [src/front/tsconfig.json]
{
  "extends": "../../lib/front/tsconfig.json",
  "compilerOptions": {
    "exactOptionalPropertyTypes": false
  }
}
```

[Details&nbsp;›](/essentials/project-structure)
