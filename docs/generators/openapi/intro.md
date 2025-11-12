---
title: OpenAPI Generator
description: Automatically generate OpenAPI 3.1 specifications from KosmoJS API routes. Analyzes route structure, TypeScript types, and validation schemas to produce standards-compliant documentation.
head:
  - - meta
    - name: keywords
      content: openapi generator, openapi 3.1, api documentation, swagger, openapi spec, typescript to openapi, api schema, rest api docs
---

`KosmoJS` can automatically generate OpenAPI 3.1 specifications from your API routes.

The generator analyzes your route structure, type definitions, and validation schemas
to produce a complete, standards-compliant OpenAPI spec.

### Installation

::: code-group

```sh [pnpm]
pnpm install -D @kosmojs/openapi-generator
```

```sh [npm]
npm install -D @kosmojs/openapi-generator
```

```sh [yarn]
yarn add -D @kosmojs/openapi-generator
```
:::

Add the OpenAPI generator to your source folder's `vite.config.ts`:

```typescript
import devPlugin from "@kosmojs/dev";
import openapiGenerator from "@kosmojs/openapi-generator";

export default {
  plugins: [
    devPlugin(apiurl, {
      generators: [
        openapiGenerator({
          outfile: "openapi.json",
          openapi: "3.1.0",
          info: {
            title: "My API",
            version: "1.0.0",
            description: "API documentation for My App",
          },
          servers: [
            {
              url: "http://localhost:4000",
              description: "Development server"
            }
          ],
        }),
        // other generators
      ],
    }),
  ],
}
```

