---
title: OpenAPI Generator
description: Automatically generate OpenAPI 3.1 specifications from KosmoJS API routes.
    Analyzes route structure, TypeScript types, and validation schemas to produce standards-compliant documentation.
head:
  - - meta
    - name: keywords
      content: openapi generator, openapi 3.1, api documentation, swagger,
        openapi spec, typescript to openapi, api schema, rest api docs
---

`KosmoJS` can automatically generate `OpenAPI 3.1` specifications from your API routes.

The generator analyzes your route structure, type definitions, and validation schemas
to produce a complete, standards-compliant `OpenAPI` spec.

Enable `OpenAPI` generator in your source folder's `vite.config.ts`:

```typescript
import { join } from "node:path";

import devPlugin from "@kosmojs/dev";
import {
  koaGenerator,
  fetchGenerator,
  typeboxGenerator,
  openapiGenerator, // [!code ++]
} from "@kosmojs/generators";

import defineConfig from "../../vite.base";
import { apiurl, baseurl } from "./config";

const openapiConfig = { // [!code ++:3]
  // ...
};

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
        openapiGenerator(openapiConfig), // [!code ++]
      ],
    }),
  ],
});
```
