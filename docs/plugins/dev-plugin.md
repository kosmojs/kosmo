---
title: Dev Plugin
description: DevPlugin coordinates code generation with configurable generators for API routes,
    fetch clients, validation, and framework integration
head:
  - - meta
    - name: keywords
      content: dev plugin, code generators, api generator, fetch generator,
        typebox generator
---

### The DevPlugin

The DevPlugin is the default export from `@kosmojs/dev` and accepts two arguments:

The first argument is the API URL (typically imported from your `config/index.ts`),
which tells the plugin where API routes should be mounted.

The second argument is a `PluginOptions` object:

```ts
export type PluginOptions = {
  generators?: Array<GeneratorConstructor>;
};
```

**Generators** are functions that produce code based on your route structure and types.
Common generators include:

- `koaGenerator()` - Generates route helpers and type definitions for API endpoints
- `fetchGenerator()` - Generates typed fetch clients for consuming your API
- `typeboxGenerator()` - Generates runtime validation schemas from `TypeScript` types

You configure generators by adding them to the `generators` array:

```ts [vite.config.ts]
import devPlugin from "@kosmojs/dev";
import {
  koaGenerator,
  fetchGenerator,
  typeboxGenerator,
} from "@kosmojs/generators";

import defineConfig from "../../vite.base";

export default defineConfig(import.meta.dirname, {
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

The order doesn't typically matter - each generator watches for its relevant files and runs independently.
