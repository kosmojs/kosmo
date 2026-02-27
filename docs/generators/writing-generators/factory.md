---
title: Generator Factory Function
description: Initialize generators with the factory function that receives plugin options
    and returns a watch handler for processing route entries and generating files.
head:
  - - meta
    - name: keywords
      content: generator factory, plugin options, watch handler, code generation,
        generator initialization, route processing
---

The factory function initializes your generator and returns `watch` and `build` handlers:

```ts
import type { GeneratorFactory } from "@kosmojs/dev";
import type { Options } from "./index";

export const factory: GeneratorFactory<Options> = async (
  pluginOptions,
  generatorOptions
) => {
  const { appRoot, sourceFolder } = pluginOptions;

  // Perform initialization
  // Set up paths, prepare templates, etc.

  return {
    // running at initialization and when related files created/updated/deleted
    async watch(entries, event) {
      // Process route entries and generate files
    },
    // running once - at build
    async build(entries, event) {
      // Process route entries and generate files
    },
  };
};
```

The factory receives two arguments:

**pluginOptions** (`PluginOptionsResolved`) - Options passed to the dev plugin,
shared across all generators:
- `baseurl` - Base URL for this source folder
- `apiurl` - API URL prefix
- `appRoot` - Absolute path to project root
- `sourceFolder` - Name of the source folder being processed
- `outDir` - Build output directory
- `refineTypeName` - Name used for type refinements (default: "TRefine")
- `watcher` - File watcher configuration

**generatorOptions** - Your generator's specific options (second generic parameter).
Can be `undefined` if your generator doesn't accept options.

## Watch Handler

The watch handler is called whenever route files change.
It receives route entries and generates files accordingly:

```ts
async watch(entries, event) {
  // entries: Array<RouteResolverEntry>
  // event: WatcherEvent | undefined

  for (const entry of entries) {
    if (entry.kind === "api") {
      // Process API routes
      const route = entry.route; // ApiRoute
    } else {
      // Process page routes
      const route = entry.route; // PageRoute
    }
  }
}
```

**On initial call** (when the dev server starts), `event` is `undefined`
and `entries` contains all routes. This is when you should generate all files from scratch.

**On subsequent calls**, `event` contains information about what changed:

```ts
type WatcherEvent = {
  kind: "create" | "update" | "delete";
  file: string; // Absolute path to changed file
};
```

You can use this to perform incremental updates,
regenerating only affected files rather than everything.

## Build Handler

The build handler is called once during production builds.
It receives all route entries and should generate all required files in full.

**Key differences from watch handler:**
- Called **once** during `vite build`
- No `event` parameter - always process all entries
- Should generate complete output, not incremental updates

**Use `renderToFile` for efficiency:**

The `renderToFile` function intelligently skips file writes when content hasn't changed, using CRC hash comparison.
This prevents unnecessary file system operations and preserves timestamps.

This optimization is particularly valuable during builds when you're regenerating many files -
unchanged files won't trigger unnecessary downstream processes like TypeScript compilation or bundling.
