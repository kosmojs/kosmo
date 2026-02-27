---
title: Plugin Configuration
description: Configure KosmoJS plugins through vite.base.ts for shared settings
    and per-source-folder vite.config.ts for specific generators, ports, and base URLs.
head:
  - - meta
    - name: keywords
      content: vite configuration, plugin config, vite.base.ts, source folder config,
        generators config, multi-folder setup
---

When you bootstrap an `KosmoJS` project,
it creates a `vite.base.ts` file at the project root.
This file provides shared configuration for all source folders:

```ts [vite.base.ts]
import { basename, resolve } from "node:path";

import { aliasPlugin, definePlugin } from "@kosmojs/dev";
import { loadEnv, mergeConfig, type UserConfig } from "vite";

import pkg from "./package.json" with { type: "json" };

const env = loadEnv("mock", import.meta.dirname);

export default (sourceFolderPath: string, config: UserConfig) => {
  const sourceFolder = basename(sourceFolderPath);
  return mergeConfig(config, {
    build: {
      outDir: resolve(import.meta.dirname, `${pkg.distDir}/${sourceFolder}`),
      emptyOutDir: true,
      sourcemap: true,
    },

    server: {
      host: true,
      allowedHosts: [env.VITE_HOSTNAME],
      fs: {
        strict: false,
      },
      watch: {
        awaitWriteFinish: {
          stabilityThreshold: 800,
          pollInterval: 200,
        },
      },
    },

    cacheDir: resolve(import.meta.dirname, `var/.vite/${sourceFolder}`),

    plugins: [
      aliasPlugin(import.meta.dirname),
      definePlugin([
        {
          // keys extracted from process.env and exposed to client
          keys: ["DEBUG"],
        },
      ]),
    ],
  });
};
```

This base configuration sets up build output directories per source folder,
configures the development server with sensible defaults,
and includes the AliasPlugin and DefinePlugin.

Each source folder extends this base configuration with its own specifics.

## 📁 Source Folder Configuration

A typical `vite.config.ts` in a source folder looks like this:

```ts [vite.config.ts]
import { join } from "node:path";

import devPlugin from "@kosmojs/dev";
import {
  koaGenerator,
  fetchGenerator,
  typeboxGenerator,
} from "@kosmojs/generators";

import defineConfig from "../../vite.base";
import { apiurl, baseurl } from "./config";

export default defineConfig(import.meta.dirname, {
  base: join(baseurl, "/"),
  server: {
    port: 4000,
  },
  plugins: [
    devPlugin(apiurl, {
      generators: [
        koaGenerator(),
        fetchGenerator(),
        typeboxGenerator(),
      ],
    }),
  ],
});
```

The configuration imports the base config from `vite.base.ts`
and extends it with source folder-specific settings.

The `devPlugin` receives the API URL and plugin options,
which include the array of generators to run for this source folder.

## 📂 Multiple Source Folders

When working with multiple source folders,
each folder's `vite.config.ts` can have its own generator configuration.

This allows you to use different frameworks or validation strategies
in different parts of your application:

```ts [src/admin/vite.config.ts]
plugins: [
  devPlugin(apiurl, {
    generators: [
      koaGenerator(),
      fetchGenerator(),
      typeboxGenerator(),
      reactGenerator(), // React framework // [!code hl]
    ],
  }),
]
```

```ts [src/front/vite.config.ts]
plugins: [
  devPlugin(apiurl, {
    generators: [
      koaGenerator(),
      fetchGenerator(),
      typeboxGenerator(),
      solidGenerator(), // SolidJS framework // [!code hl:2]
      ssrGenerator(), // with SSR
    ],
  }),
]
```

Each source folder runs its own DevPlugin instance with its own set of generators,
but they all share the base configuration from `vite.base.ts`
and the AliasPlugin that understands all source folders globally.
