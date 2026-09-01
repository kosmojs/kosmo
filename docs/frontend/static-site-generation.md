---
title: Static Site Generation
description: Pre-render React, SolidJS, Vue, Svelte and MDX pages to static HTML at build time
  with the KosmoJS SSG generator. Declaring staticParams for dynamic routes per framework,
  output layout, and deploying to a static host or CDN.
head:
  - - meta
    - name: keywords
      content: ssg, static site generation, prerender, staticParams, react ssg, vue ssg, svelte ssg,
        solid ssg, mdx ssg, static html, cdn deploy, kosmojs ssg
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
