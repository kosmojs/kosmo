---
title: Framework Integration
description: Integrate KosmoJS directory-based routing with React, SolidJS, Vue, Svelte, or MDX.
  Automatic route configuration, type-safe navigation, and optimized lazy loading
  for modern frontend applications.
head:
  - - meta
    - name: keywords
      content: react integration, solidjs generator, vue generator, svelte generator, mdx content,
        automated routing, code splitting, type-safe navigation, lazy loading
---

`KosmoJS` provides dedicated generators for `React`, `SolidJS`, `Vue`, `Svelte` and `MDX` -
each bridging directory-based routing with the framework's native router and
reactive model. Your page components automatically become navigable routes
with full type safety and efficient code-splitting, while generated utilities
integrate naturally with each framework's patterns.

## Enabling the Generator

Framework generators are automatically enabled when creating a source folder
and selecting your framework. To add one to an existing folder, register it
manually in your source folder's `kosmo.config.ts`:

```ts [kosmo.config.ts]
import {
  defineConfig,
  // ...
  reactGenerator, // [!code ++]
} from "@kosmojs/dev";

export default defineConfig({
  // ...
  generators: [
    // ...
    reactGenerator(), // [!code ++]
  ],
});
```

After configuration, the generator deploys essential files to your source
folder, establishing the application foundation.

## Multi-Folder Architecture

Projects spanning multiple source folders give each folder its own generator
instance with independent configuration. Generated types and utilities are
scoped per folder - routes in your main application won't appear in the admin
dashboard's navigation types, and vice versa.

Despite operating in separate namespaces, all source folders share `KosmoJS`'s
foundational conventions, ensuring consistency where it matters.

## TypeScript Configuration

Mixing frameworks across source folders requires per-folder TypeScript
configuration. Each framework has its own JSX import source requirement:

| Framework | `jsxImportSource` |
|-----------|-------------------|
| React | `"react"` |
| SolidJS | `"solid-js"` |
| Vue | `"vue"` *(only when using JSX)* |
| Svelte | n/a *(no JSX - compiled from `.svelte`)* |
| MDX | `"preact"` |

`KosmoJS` delegates JSX transformation to Vite, not TypeScript -
but differing `jsxImportSource` values cause type
conflicts when multiple frameworks coexist in the same project.

Solved by generating a `tsconfig.json` specific to each source folder,
placed in the `lib/` directory for the source folder to extend:

```json [src/front/tsconfig.json]
{ "extends": "../../lib/front/tsconfig.json" }
```

Each config supplies the correct `jsxImportSource`, path mappings, and core settings.

## What Differs Between Frameworks

Routing, layouts, validation and the fetch clients behave identically everywhere.
Data loading, streaming support, SSG, TanStack Query and the exotic routing syntaxes do not -
those differences are collected in one table:

[Framework Support Matrix ›](/essentials/frameworks)
