---
title: Dev Plugin
description: DevPlugin coordinates code generation with configurable generators for API routes,
    fetch clients, validation, and framework integration, plus formatters for code style consistency.
head:
  - - meta
    - name: keywords
      content: dev plugin, code generators, api generator, fetch generator,
        typebox generator, biome formatter, code formatting, vite generators
---

### The DevPlugin

The DevPlugin is the default export from `@kosmojs/dev` and accepts two arguments:

The first argument is the API URL (typically imported from your `config/index.ts`),
which tells the plugin where API routes should be mounted.

The second argument is a `PluginOptions` object:

```ts
export type PluginOptions = {
  generators?: Array<GeneratorConstructor>;
  formatters?: Array<FormatterConstructor>;
};
```

**Generators** are functions that produce code based on your route structure and types.
Common generators include:

- `apiGenerator()` - Generates route helpers and type definitions for API endpoints
- `fetchGenerator()` - Generates typed fetch clients for consuming your API
- `typeboxGenerator()` - Generates runtime validation schemas from `TypeScript` types

You configure generators by adding them to the `generators` array:

```ts [vite.config.ts]
import devPlugin from "@kosmojs/dev";
import {
  apiGenerator,
  fetchGenerator,
  typeboxGenerator,
} from "@kosmojs/generators";

import defineConfig from "../../vite.base";

export default defineConfig(import.meta.dirname, {
  plugins: [
    devPlugin(apiurl, {
      generators: [
        apiGenerator(),
        fetchGenerator(),
        typeboxGenerator(),
      ],
    }),
  ],
});
```

The order doesn't typically matter -
each generator watches for its relevant files and runs independently.

**Formatters** ensure that generated code matches your project's formatting conventions.
This is important because generated code should pass your linters
without manual intervention.

The most common formatter is the Biome formatter:

```ts [vite.config.ts]
import biomeFormatter from "@kosmojs/biome-formatter";

const biomeConfig = {
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2
  },
};

export default defineConfig(import.meta.dirname, {
  base: join(baseurl, "/"),
  server: {
    port: 4000,
  },
  plugins: [
    devPlugin(apiurl, {
      generators: [apiGenerator(), fetchGenerator()],
      formatters: [
        // add your formatter(s) here // [!code hl:2]
        biomeFormatter(biomeConfig),
      ],
    }),
  ],
});
```

The formatter receives your Biome configuration
and applies it to all generated code before writing files.

You can use other formatters like Prettier by implementing the formatter interface.
Formatters are optional - if you don't provide any,
code is generated with default formatting.
