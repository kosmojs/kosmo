---
title: OpenAPI
description: Deriving an OpenAPI 3.1 specification from KosmoJS routes - what it covers,
    and how to switch it on for a source folder.
head:
  - - meta
    - name: keywords
      content: openapi 3.1, api documentation, swagger, openapi spec, typescript to openapi,
        enable openapi, api schema, rest api docs
---

KosmoJS generates an `OpenAPI 3.1` specification directly from your route definitions.

Route structure, `TypeScript` types, `VRefine` constraints, parameters, responses -
all reflected in the spec automatically. No manual schema authoring, no annotation layers.

---

### Enable OpenAPI

Simply add it to your source folder's `kosmo.config.ts`:

```ts
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  backend: {
    stack: "hono",
    base: "/api",
    openapi: { // [!code ++:6]
      outfile: "openapi.json",
      openapi: "3.1.0",
      info: { title: "My API", version: "1.0.0" },
      servers: [{ url: "https://api.example.com/api" }],
    },
  },
});
```
