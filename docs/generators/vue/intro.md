---
title: Vue Generator
description: Integrate KosmoJS directory-based routing with Vue 3 Single File Components and Vue Router 4.
    Automatic route configuration, type-safe navigation, and optimized lazy loading for Vue applications.
head:
  - - meta
    - name: keywords
      content: vue generator, vue 3, vue router, typed navigation, lazy loading, vite vue, kosmojs vue
---

The `Vue` generator brings `KosmoJS`'s structured routing approach into the `Vue` 3
ecosystem - using Single File Components and `Vue Router` 4 under the hood.

Rather than maintaining manual route definitions, your file system becomes the
source of truth: folders map to URLs, and each component placed inside `pages/`
is automatically exposed as a route. This eliminates configuration overhead and
ensures the navigation structure always reflects your actual project layout.

Along with routing, the generator produces typed navigation helpers and
utilities designed for the Composition API and `<script setup>` style, fitting
naturally into how modern `Vue` applications are built today.

## 🛠 Installation and Setup

When creating a source folder, select `Vue` as framework in interactive mode,
or use <code style="white-space: nowrap;">--framework=vue</code> in command-line mode.

For folders created without a framework, you can enable `Vue` within your `vite.config.ts`.

```ts [vite.config.ts]
import vuePlugin from "@vitejs/plugin-vue";
import devPlugin from "@kosmojs/dev";
import {
  //...
  vueGenerator, // [!code ++]
} from "@kosmojs/generators";

import defineConfig from "../vite.base";

export default defineConfig(import.meta.dirname, {
  // ...other settings
  plugins: [
    vuePlugin(),
    devPlugin(apiurl, {
      generators: [
        // ...
        vueGenerator(), // [!code ++]
      ],
    }),
  ],
});
```

Once wired up, the generator adds a small set of foundation files into the root
of your source folder - these deliver a consistent bootstrapping model for
every Vue-powered area in your workspace.

## 🗂 Working with Multiple Source Folders

`KosmoJS` encourages organizing applications into **independent source folders** -
such as a customer-facing interface, an internal administrative console, or a
marketing site.

Each folder using the `Vue` generator:

- receives its own router instance
- builds its own set of typed navigation helpers
- maintains isolated component and route trees

This avoids the collision and complexity that can arise when unrelated areas of
an app share one giant routing table.

For example, your admin dashboard won't gain access to your public site's
navigation helpers. Each area remains autonomous while still benefiting from
shared conventions across the entire monorepo.

In short: every source folder is a cohesive `Vue` app - aligned to the same
structural principles, but independent where it matters most.

## 💡 TypeScript Configuration

While Vue developers don't always use JSX, Vue fully supports JSX/TSX
for developers who prefer it or need it for specific use cases.

`KosmoJS` provides a Vue-specific TypeScript configuration even when you're not using JSX.
When mixing frameworks, each folder needs isolated TypeScript configuration:

**Vue with JSX:**
```json
"compilerOptions": { "jsxImportSource": "vue" }
```

> React requires `"jsxImportSource": "react"` and SolidJS requires `"jsxImportSource": "solid-js"`.

All frameworks share `jsx: "preserve"` (Vite handles JSX transformation),
but differing `jsxImportSource` values create type conflicts when multiple frameworks coexist.

**The Solution:** Every source folder receives its own TypeScript configuration:

```json [src/admin/tsconfig.json]
{
  "extends": "@kosmojs/config/tsconfig.vue.json"
}
```

Framework-specific config sets proper `jsxImportSource` as well as path mappings
and any core settings provided by `tsconfig.vite.json` at the root of your app.

> <i>**Important:** The framework configs don't inherit from your root config!</i><br />
If you add custom TypeScript settings to your project's root `tsconfig.json`
and need them in specific source folders, you'll need to manually add those settings to the folder.
