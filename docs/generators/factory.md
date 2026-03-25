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
import { defineGeneratorFactory } from "@kosmojs/lib";
import type { Options } from "./index";

export default defineGeneratorFactory<Options>(async (
  sourceFolder,
  generatorOptions,
) => {

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
});
```

The factory receives two arguments:

**sourceFolder** (`SourceFolder`) - the source folder the generator operates on.

**generatorOptions** - generator-specific options. Can be omitted if generator accepts none.

`SourceFolder` signature:

```ts
export type SourceFolder = {
  /** Source folder name, e.g. "front", "admin", "app" */
  name: string;
  /** Resolved folder configuration */
  config: FolderConfig;
  /** Absolute path to the project root */
  root: string;
  /** Base URL this source folder is served from, e.g. "/" or "/admin" */
  baseurl: string;
  /** Base URL for API routes, e.g. "/api" */
  apiurl: string;
  /** output directory name, configured as `distDir` in package.json */
  distDir: string;
};
```

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
- Called **once** during build
- No `event` parameter - always process all entries
- Should generate complete output, not incremental updates
