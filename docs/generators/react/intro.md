---
title: React Integration for KosmoJS
description: Bridge KosmoJS directory-based routing with React Router through
  automated configuration. Type-safe navigation, code splitting, and Suspense
  integration for modern React development workflows.
head:
  - - meta
    - name: keywords
      content: react integration, react router setup, automated routing config,
        code splitting react, type-safe links, suspense integration, vite react
        plugin, react navigation
---

`React` generator establishes a bridge between directory-based routing
and React Router, transforming your page components into navigable routes
automatically. This integration delivers type safety across navigation points
while implementing efficient code-splitting strategies.

The generator handles route configuration behind the scenes, produces
navigation utilities with compile-time type checking, and provides helpers
designed around React's Suspense mechanism and modern data loading approaches.

## 🛠️ Enable React Generator

The `React` generator is automatically enabled when you create a source folder
and select `React` as your framework.

If you created your source folder without `React` (or want to add it to an existing folder),
you can enable it manually by importing it and adding it to the generators list
in your source folder's `vite.config.ts`:


```ts [vite.config.ts]
import reactPlugin from "@vitejs/plugin-react";
import devPlugin from "@kosmojs/dev";
import {
  // ...
  reactGenerator, // [!code ++]
} from "@kosmojs/generators";

import defineConfig from "../vite.base";

export default defineConfig(import.meta.dirname, {
  // ...
  plugins: [
    reactPlugin(),
    devPlugin(apiurl, {
      generators: [
        // ...
        reactGenerator(), // [!code ++]
      ],
    }),
  ],
})
```

After configuration completes, the generator deploys essential files to your
source folder, establishing your `React` application's foundation.

## 🗂️ Multi-Folder Project Architecture

When projects span multiple source directories, each folder receives its own
`React` generator instance with independent configuration capabilities. This
architectural pattern enables different application areas to coexist with
distinct approaches.

Your primary application might occupy one directory while administrative
tooling resides in another, each maintaining separate routing hierarchies,
component libraries, and data management strategies.

Generated type definitions and utility functions remain isolated per source
folder, preventing cross-contamination between application domains. Routes
defined in your main application won't pollute the admin interface's
navigation types, preserving architectural boundaries.

Despite operating in separate namespaces, all applications share `KosmoJS`'s
foundational organizational patterns, ensuring consistency where it matters.

## 💡 TypeScript Configuration

Mixing frameworks across source folders is powerful, but requires careful TypeScript configuration.
Reason - different frameworks have different JSX type requirements:

**React requires:**
```json
"compilerOptions": { "jsxImportSource": "react" }
```

> SolidJS requires `"jsxImportSource": "solid-js"` and Vue requires `"jsxImportSource": "vue"`, if using JSX.

All frameworks use `jsx: "preserve"`
(`KosmoJS` doesn't use TypeScript to transform JSX - that's handled by Vite),
but the `jsxImportSource` setting varies, causing JSX component type conflicts.

**The Solution:** Each source folder uses the appropriate framework config:

```json [src/admin/tsconfig.json]
{
  "extends": "@kosmojs/config/tsconfig.react.json"
}
```

Framework configs supply the correct `jsxImportSource` as well as path mappings
and any core settings provided by `tsconfig.vite.json` at the root of your app.

> <i>**Important:** The framework configs don't inherit from your root config!</i><br />
If you add custom TypeScript settings to your project's root `tsconfig.json`
and need them in specific source folders, you'll need to manually add those settings to the folder.

Per-folder TypeScript configuration guarantees correct JSX typing for each framework.
This keeps frameworks isolated - no type conflicts, no cross-contamination.
