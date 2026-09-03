---
title: Static Site Generation
description: Pre-render React, SolidJS, Vue, Svelte and MDX pages to static HTML at build time
  with the KosmoJS SSG generator. Declaring staticParams for dynamic routes per framework,
  building in CI against production data, output layout, and deploying to a static host or CDN.
head:
  - - meta
    - name: keywords
      content: ssg, static site generation, prerender, staticParams, react ssg, vue ssg, svelte ssg,
        solid ssg, mdx ssg, static html, cdn deploy, kosmojs ssg, ci workflow, build environment,
        build time data, prerender fails build
---

SSG renders pages to static HTML at build time,
for deploying to a CDN or any static host without a running server.

## Adding SSG Support

SSG is automatically enabled if selected during source folder creation (or via `--ssg` flag in CLI mode).
To add it to an existing folder, register `ssgGenerator` in your source folder's `kosmo.config.ts`:

```ts [kosmo.config.ts]
import {
  defineConfig,
  // ...other generators
  ssgGenerator, // [!code ++]
} from "@kosmojs/dev";

export default defineConfig({
  generators: [
    // ...other generators
    ssgGenerator(), // [!code ++]
  ],
});
```

It works on source folders with a frontend and [SSR enabled](/frontend/server-side-render):
pages are rendered by the folder's own SSR server.

## Declaring `staticParams`

Static routes (no parameters) render automatically.
A dynamic route renders once per parameter set it declares through `staticParams`;
a dynamic route without `staticParams` is skipped - no file is generated for it.

`staticParams` is a list of variants, each one positional in the route's parameter order.
A splat parameter takes an array of segments.

Where the declaration lives depends on how the framework exposes named exports from a page module:

:::tabs key:frontend variant:code
== React
```tsx
import { defineStaticParams } from "_/core";

export const staticParams = defineStaticParams<"docs/[slug]">([
  ["getting-started"],
  ["routing"],
  ["validation"],
]);

export default function DocsPage() { /* ... */ }
```

== Solid
```tsx
import { defineStaticParams } from "_/core";

export const staticParams = defineStaticParams<"docs/[slug]">([
  ["getting-started"],
  ["routing"],
  ["validation"],
]);

export default function DocsPage() { /* ... */ }
```

== Vue
```vue
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

== Svelte
```svelte
<script module lang="ts">
// pages/docs/[slug]/index.svelte module-level script:
// its exports are the component module's named exports
import { defineStaticParams } from "_/core";

export const staticParams = defineStaticParams<"docs/[slug]">([
  ["getting-started"],
  ["routing"],
]);
</script>

<script lang="ts">
  /* ... */
</script>
```

== MDX
```mdx
---
title: Documentation
staticParams:
  - [getting-started]
  - [routing]
---
```

:::

Values are stringified into the path, so numbers are fine: `[[1], [2], [42]]` renders `items/1`, `items/2`, `items/42`.

Data loading works as usual - the page's `loader` runs once per variant, with that variant's parameters,
against the API bundled into the SSR server.

::: tip React Fast Refresh
A non-component export in a React page file makes Fast Refresh fall back to a full reload for that file during development.
It is a development-only nuisance, the build is unaffected.
:::

## Where to Build

Pre-rendering runs your API.

The build starts a disposable SSR server, requests every declared path from it,
and each page's `loader` reaches the backend [in-process](/fetch/isomorphic-clients#ssg-runs-the-same-path-at-build-time) -
the same handlers, middleware and data sources that would answer a live request.

So the build machine needs the access production has: the database, the CMS, the upstream services your routes read.
This is why SSG belongs in a **CI workflow** rather than on a laptop.
A workflow that ships the sources to the production environment (or to a runner holding the same credentials and network reach),
installs there, and runs `build` there.

Pages are then rendered against exactly the data production would have served,
and the `ssg/` directory it produces is what you publish.

## Error Handling

Pre-rendering has no fallback.

If a page cannot be rendered - its loader's fetch fails, the API returns a non-2xx, a component throws -
the error is recorded and pre-rendering carries on through the remaining paths.

Then, at the end, one of two things happens:
- every page rendered, and the whole set is written.
- or at least one failed, and **nothing is written at all** - the collected errors reported.

Two properties come out of that, and both matter when you are waiting on a build:

- **One run names every broken route.** Aborting on the first failure would hide the other nine
behind it, and finding them one rebuild at a time is how a ten-minute pipeline turns into an afternoon.
- **The output is all-or-nothing.** There is no half-generated site to reason about,
no question of which pages in `dist/` came from the run that failed, and nothing tempting to deploy from a red build.

This is deliberate, and it is the one place where SSG differs from SSR.
A live server that fails to render can [fall back to client rendering](/frontend/server-side-render#fetch-errors-and-recovery):
the visitor still gets a working page, the server logs the failure, and the next request may well succeed.

A static build has none of that. Whatever it writes is what visitors get, for as long as it stays published:

- **A shell page is indistinguishable from a good one.** It returns `200`, carries your layout, and
contains nothing. No monitor flags it, and nobody notices until someone reads the page.
- **There is no server log to check afterwards.** The build was the only moment the failure was observable.
- **Static output gets cached hard** - a CDN, an immutable deploy, a proxy in front of it.
A bad page can outlive the deploy that produced it.

So a broken page is never written - nor is any of its neighbours, until the whole set is good.
**A green build means every declared path rendered with real data**, which is exactly the guarantee
you want before publishing a directory of HTML.

The summary names every page that could not be rendered,
and the renderer's [onError hook](/frontend/server-side-render#onerror-hook) has already fired for each of them if you defined one -
the same hook that reports failures at serving time also reports them during the build.

The usual causes could be environmental rather than code:

- The build machine cannot reach the database or upstream service - see [Where to Build](#where-to-build).
- An environment variable the API needs is missing on the runner.
- A `staticParams` entry points at a record that no longer exists, so its loader gets a `404`.

Fix the causes and rebuild - or drop the stale entries from `staticParams` if those paths should no longer be generated.
Since one run reports all of them, a single pass over the summary is usually enough.

## Output

The build writes a complete static site to `dist/<folder>/ssg/`:

```txt
dist/front/ssg/
├── index.html
├── docs/
│   ├── getting-started/index.html
│   ├── routing/index.html
│   └── validation/index.html
├── assets/              → hashed JS and CSS, the same set the SSR server serves
├── favicon.svg          → public/ files, copied to the root
└── robots.txt
```

The tree is rooted at the folder's `base`, same as a Vite client build:
a folder with `base: "/admin"` produces `ssg/index.html`, `ssg/items/1/index.html` and so on,
and the HTML references `/admin/assets/...` - deploy the `ssg/` directory at `/admin/` on the host.

Nothing in the output depends on the `ssr/` or `client/` directories at serve time.
