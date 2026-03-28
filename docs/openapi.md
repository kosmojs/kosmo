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

`KosmoJS` generates an `OpenAPI 3.1` specification directly from your route definitions.
Route structure, `TypeScript` types, `VRefine` constraints, parameters, responses -
all reflected in the spec automatically. No manual schema authoring, no annotation layers.

## 🔧 Enable the generator

Simply add it to your source folder's `kosmo.config.ts`:

```ts
import {
  defineConfig,
  // ...other generators
  openapiGenerator, // [!code ++]
} from "@kosmojs/dev";

const openapiConfig = { // [!code ++:3]
  // ...
};

export default defineConfig({
  generators: [
    // ...other generators
    openapiGenerator(openapiConfig), // [!code ++]
  ],
});
```

## ⚙️ Configuration

### Required Options

**`outfile`** - Path where the spec is written, relative to your `kosmo.config.ts`.

**`openapi`** - OpenAPI version. Use `"3.1.0"` or any `3.1.x` version.

**`info`** - API metadata:
- `title` (required) - Name of your API
- `version` (required) - API version, use semantic versioning

**`servers`** - Array of server objects:
- `url` (required) - Base URL where the API is served
- `description` (optional) - Human-readable label

### Optional Info Properties

**`summary`** - One-line summary

**`description`** - Detailed description, supports markdown

**`termsOfService`** - URL to terms of service

**`contact`** - `name`, `url`, `email`

**`license`** - `name` (required), `identifier` (SPDX), `url`

### Complete Example

```typescript
const openapiConfig = {
  outfile: "openapi.json",
  openapi: "3.1.0",
  info: {
    title: "My SaaS API",
    version: "2.1.0",
    summary: "RESTful API for My SaaS Platform",
    description: `
# API Documentation
This API provides access to all platform features including
user management, billing, and analytics.`,
    termsOfService: "https://myapp.com/terms",
    contact: {
      name: "API Support",
      url: "https://myapp.com/support",
      email: "api@myapp.com",
    },
    license: {
      name: "Apache 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
  },
  servers: [
    { url: "http://localhost:4554", description: "Development server" },
    { url: "https://staging-api.myapp.com", description: "Staging environment" },
    { url: "https://api.myapp.com", description: "Production server" },
  ],
};
```

## 📄 Generated Specification

The output is a complete `OpenAPI 3.1` document covering:

- **Paths** - all routes with HTTP methods, parameters, request bodies, and responses
- **Schemas** - type definitions extracted from your `TypeScript` types and validation schemas
- **Parameters** - path, query, and header parameters with types and constraints
- **Request Bodies** - payload schemas for POST, PUT, and PATCH endpoints
- **Responses** - response schemas with status codes and content types
- **Validation Rules** - `VRefine` constraints appear as JSON Schema keywords

### Path Variations for Optional Parameters

OpenAPI requires all path parameters to be mandatory,
so routes with optional parameters generate multiple paths.

For a route at `users/[id]/posts/{postId}/index.ts`, the generator produces:
- `/users/{id}/posts/{postId}` - full path with optional parameter present
- `/users/{id}/posts` - path without optional parameter

Both reference the same handlers and schemas.

### Live Regeneration

The spec regenerates automatically whenever you modify route definitions, types, or validation schemas.
The generator runs in the background alongside the validation and fetch generators -
no manual rebuild step required.

Serve the generated spec with any standard tooling:
[Swagger UI](https://swagger.io/tools/swagger-ui/),
[Redoc](https://github.com/Redocly/redoc),
or [Stoplight Elements](https://stoplight.io/open-source/elements).
