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

React generator establishes a bridge between directory-based routing
and React Router, transforming your page components into navigable routes
automatically. This integration delivers type safety across navigation points
while implementing efficient code-splitting strategies.

The generator handles route configuration behind the scenes, produces
navigation utilities with compile-time type checking, and provides helpers
designed around React's Suspense mechanism and modern data loading approaches.

## 🛠️ Package Installation

Add the React generator to your project's development dependencies. The `-D`
flag ensures this tooling stays out of production bundles:

::: code-group

```sh [pnpm]
pnpm install -D @kosmojs/react-generator
```

```sh [npm]
npm install -D @kosmojs/react-generator
```

```sh [yarn]
yarn add -D @kosmojs/react-generator
```
:::

Configure the generator within your source folder's `vite.config.ts`:

```ts [vite.config.ts]
import reactPlugin from "@vitejs/plugin-react";
import devPlugin from "@kosmojs/dev";
import reactGenerator from "@kosmojs/react-generator";
import defineConfig from "../vite.base";

export default defineConfig(import.meta.dirname, {
  // ...
  plugins: [
    reactPlugin(),
    devPlugin(apiurl, {
      generators: [
        reactGenerator(),
        // other generators ...
      ],
    }),
  ],
})
```

After configuration completes, the generator deploys essential files to your
source folder, establishing your React application's foundation.

## 🗂️ Multi-Folder Project Architecture

When projects span multiple source directories, each folder receives its own
React generator instance with independent configuration capabilities. This
architectural pattern enables different application areas to coexist with
distinct approaches.

Your primary application might occupy one directory while administrative
tooling resides in another, each maintaining separate routing hierarchies,
component libraries, and data management strategies.

Generated type definitions and utility functions remain isolated per source
folder, preventing cross-contamination between application domains. Routes
defined in your main application won't pollute the admin interface's
navigation types, preserving architectural boundaries.

Despite operating in separate namespaces, all applications share KosmoJS's
foundational organizational patterns, ensuring consistency where it matters.
