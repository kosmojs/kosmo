---
title: Framework Integration
description: Integrate KosmoJS directory-based routing with React, SolidJS, or Vue 3.
  Automatic route configuration, type-safe navigation, and optimized lazy loading
  for modern frontend applications.
head:
  - - meta
    - name: keywords
      content: react integration, solidjs generator, vue generator, react router setup,
        solidjs router, vue router 4, automated routing, code splitting, type-safe
        navigation, lazy loading, vite plugin, kosmojs framework
---

`KosmoJS` provides dedicated generators for `React`, `SolidJS`, and `Vue` -
each bridging directory-based routing with the framework's native router and
reactive model. Your page components automatically become navigable routes
with full type safety and efficient code-splitting, while generated utilities
integrate naturally with each framework's patterns.

## 🛠️ Enabling the Generator

Framework generators are automatically enabled when creating a source folder
and selecting your framework. To add one to an existing folder, register it
manually in your source folder's `kosmo.config.ts`:

```ts [kosmo.config.ts]
import reactPlugin from "@vitejs/plugin-react"; // [!code ++]
import {
  defineConfig,
  // ...
  reactGenerator, // [!code ++]
} from "@kosmojs/dev";

export default defineConfig({
  // ...
  plugins: [
    reactPlugin(), // [!code ++]
  ],
  generators: [
    // ...
    reactGenerator(), // [!code ++]
  ],
});
```

After configuration, the generator deploys essential files to your source
folder, establishing the application foundation.

## 🗂️ Multi-Folder Architecture

Projects spanning multiple source folders give each folder its own generator
instance with independent configuration. Generated types and utilities are
scoped per folder - routes in your main application won't appear in the admin
dashboard's navigation types, and vice versa.

Despite operating in separate namespaces, all source folders share `KosmoJS`'s
foundational conventions, ensuring consistency where it matters.

## 💡 TypeScript Configuration

Mixing frameworks across source folders requires per-folder TypeScript
configuration. Each framework has its own JSX import source requirement:

| Framework | `jsxImportSource` |
|-----------|-------------------|
| React | `"react"` |
| SolidJS | `"solid-js"` |
| Vue | `"vue"` *(only when using JSX)* |

All frameworks use `jsx: "preserve"` - `KosmoJS` delegates JSX transformation
to Vite, not TypeScript - but differing `jsxImportSource` values cause type
conflicts when multiple frameworks coexist in the same project.

`KosmoJS` provides framework-specific TypeScript configurations to solve this.
Each source folder extends the appropriate config:

::: code-group

```json [React · tsconfig.json]
{
  "extends": "@kosmojs/config/tsconfig.react.json"
}
```

```json [SolidJS · tsconfig.json]
{
  "extends": "@kosmojs/config/tsconfig.solid.json"
}
```

```json [Vue · tsconfig.json]
{
  "extends": "@kosmojs/config/tsconfig.vue.json"
}
```

:::

Each config supplies the correct `jsxImportSource`, path mappings, and core
settings from `tsconfig.vite.json` at your project root.

> **Important:** Framework configs don't inherit from your root `tsconfig.json`.
> Custom TypeScript settings added at the project root must be manually
> replicated into any source folder that needs them.
