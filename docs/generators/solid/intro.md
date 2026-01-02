---
title: SolidJS Generator
description: Integrate KosmoJS directory-based routing with SolidJS reactive primitives and router.
    Automatic route configuration, type-safe navigation, and optimized lazy loading for SolidJS applications.
head:
  - - meta
    - name: keywords
      content: solidjs generator, solidjs routing, reactive primitives, solidjs router,
        type-safe navigation, lazy loading, solidjs vite, solid-start alternative
---

The `SolidJS` generator integrates `KosmoJS`'s directory-based routing
with SolidJS's reactive primitives and router.

This creates a seamless development experience where your page components
automatically become routes with full type safety and optimized loading patterns.

The generator handles routing configuration, generates type-safe navigation helpers
and provides utilities that work naturally with SolidJS's resource and suspense patterns.

## 🛠️ Enable SolidJS Generator

When creating a source folder, select `SolidJS` as your framework
(or use <code style="white-space: nowrap;">--framework=vue</code> in command-line mode).

For source folders created without a framework (api-only folders) you can manualy enable `SolidJS` generator:
import in and include in generators array:

```ts [vite.config.ts]
import solidPlugin from "vite-plugin-solid";
import devPlugin from "@kosmojs/dev";
import {
  // ...
  solidGenerator, // [!code ++]
} from "@kosmojs/generators";

import defineConfig from "../vite.base";

export default defineConfig(import.meta.dirname, {
  // ...
  plugins: [
    solidPlugin(),
    devPlugin(apiurl, {
      generators: [
        // ...
        solidGenerator(), // [!code ++]
      ],
    }),
  ],
})
```

Once configured, the generator adds several files to the root of your source folder
that form the foundation of your `SolidJS` application.

## 🗂️ Working with Multiple Source Folders

If your application uses multiple source folders,
each folder can have its own `SolidJS` generator configuration
producing its own independent application structure.

One source folder might be your main application
while another is an admin dashboard,
each with its own routing, components, and data fetching patterns.

The generated types and utilities are scoped to each source folder,
so there's no collision or confusion between them.

Your main app's routes don't appear in your admin dashboard's LinkProps type,
and vice versa.

Each application maintains its own namespace
while sharing the underlying `KosmoJS` organizational principles.

## 💡 TypeScript Configuration

While `KosmoJS` offers the flexibility to mix different frameworks across source folders,
this flexibility comes with one important caveat.

When you use different frameworks across source folders, TypeScript encounters JSX typing conflicts.
Each framework requires its own JSX import source:

**SolidJS needs:**
```json
"compilerOptions": { "jsxImportSource": "solid-js" }
```

> React requires `"jsxImportSource": "react"` and Vue requires `"jsxImportSource": "vue"`, if using JSX.

While `compilerOptions.jsx` is set to `"preserve"` for all frameworks
(`KosmoJS` doesn't use TypeScript to transform JSX - that's handled by Vite),
the `jsxImportSource` differs, creating incompatible JSX component types.

**The Solution:**
`KosmoJS` provides framework-specific TypeScript configurations.
Each source folder extends the appropriate framework config:

```json [src/front/tsconfig.json]
{
  "extends": "@kosmojs/config/tsconfig.solid.json"
}
```

The framework config provides the correct `jsxImportSource` as well as path mappings
and any core settings provided by `tsconfig.vite.json` at the root of your app.

> <i>**Important:** The framework configs don't inherit from your root config!</i><br />
If you add custom TypeScript settings to your project's root `tsconfig.json`
and need them in specific source folders, you'll need to manually add those settings to the folder.

This approach ensures TypeScript uses the correct types for JSX components in each folder,
maintaining framework isolation without TypeScript conflicts.
