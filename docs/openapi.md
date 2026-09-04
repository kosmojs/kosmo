---
title: OpenAPI
description: Automatically derive OpenAPI 3.1 specifications from KosmoJS API routes.
    Analyzes route structure, TypeScript types, and validation schemas to produce standards-compliant documentation.
head:
  - - meta
    - name: keywords
      content: openapi 3.1, api documentation, swagger, openapi spec, typescript to openapi, api schema, rest api docs, openapi servers
---

`KosmoJS` derives an `OpenAPI 3.1` specification directly from your route definitions.
Route structure, `TypeScript` types, `VRefine` constraints, parameters, responses -
all reflected in the spec automatically. No manual schema authoring, no annotation layers.

## Enable OpenAPI

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

## Configuration

`openapiGenerator` is the only generator whose options are mandatory.
For how it sits alongside the other generators, see the [configuration reference](/essentials/config#generators-1).

### Required Options

**`outfile`** - Path where the spec is written, relative to your `kosmo.config.ts`.

**`openapi`** - OpenAPI version. Use `"3.1.0"` or any `3.1.x` version.

**`info`** - API metadata:
- `title` (required) - Name of your API
- `version` (required) - API version, use semantic versioning

**`servers`** - Array of server objects:
- `url` (required) - URL the API is served from, including the `base` + `apiBase` prefix.
Paths in the spec are relative to this, so getting it wrong is the usual cause of a spec whose endpoints 404 -
see [Server URLs and Route Paths](#server-urls-and-route-paths)
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
  // this folder has base "/" and apiBase "/api", so the dev server carries
  // the "/api" prefix - in production the API is deployed at the root of its
  // own host and carries none
  servers: [
    { url: "http://localhost:4556/api", description: "Development server" },
    { url: "https://staging-api.myapp.com", description: "Staging environment" },
    { url: "https://api.myapp.com", description: "Production server" },
  ],
};
```

### Server URLs and Route Paths

Paths in the spec are route names, exactly as they appear under `api/`.
A route at `api/users/[id]/index.ts` becomes `/users/{id}`,
and the `index` route becomes `/` - neither carries the source folder's
[`base`](/essentials/config#base-required) or
[`apiBase`](/essentials/config#apibase).

That is deliberate, not an omission. In `OpenAPI`, paths are relative to `servers`,
and the prefix an API answers on is a deployment decision rather than a property of the route.

The same backend may sit behind `/api` in development,
at the root of a dedicated host in production, and under `/v2/api` behind a gateway -
so the prefix belongs to the server entry, and the paths stay the same in all three.

This is why `servers` is mandatory: it is the only place the prefix is recorded.
Give each entry the full prefix, origin plus `base` plus `apiBase`:

```ts
// folder with base "/" and apiBase "/api"
servers: [
  { url: "http://localhost:4556/api", description: "Development server" },
  // deployed at the root of its own host - no prefix to add
  { url: "https://api.myapp.com", description: "Production server" },
];
```

```ts
// folder with base "/admin" and apiBase "/api"
servers: [
  { url: "http://localhost:4556/admin/api", description: "Development server" },
  { url: "https://myapp.com/admin/api", description: "Production server" },
];
```

A client built from the spec resolves `/users/{id}` against whichever server
it is pointed at, requesting `http://localhost:4556/api/users/42` in development
and `https://api.myapp.com/users/42` in production - one spec, no per-environment
rebuilds.

::: tip
If **Try it out** in `Swagger UI` returns `404`, check the server URL first.
A missing `base` + `apiBase` prefix is the usual cause.
:::

## Derived Specification

The output is a complete `OpenAPI 3.1` document covering:

- **Paths** - all routes with HTTP methods, parameters, request bodies, and responses
- **Schemas** - type definitions extracted from your `TypeScript` types and validation schemas
- **Parameters** - path, query, and header parameters with types and constraints
- **Request Bodies** - payload schemas for POST, PUT, and PATCH endpoints
- **Responses** - response schemas with status codes and content types
- **Validation Rules** - `VRefine` constraints appear as JSON Schema keywords

### Path Variations for Optional Parameters

OpenAPI requires all path parameters to be mandatory,
so routes with optional parameters produce multiple paths.

For a route at `users/[id]/posts/{postId}/index.ts`, the spec contains:
- `/users/{id}/posts/{postId}` - full path with optional parameter present
- `/users/{id}/posts` - path without optional parameter

Both reference the same handlers and schemas.

### Live Updates

The spec is recomputed automatically whenever you modify route definitions, types, or validation schemas.
This happens in the background alongside validation and fetch derivation -
no manual rebuild step required.

Serve the spec with any standard tooling:
[Swagger UI](https://swagger.io/tools/swagger-ui/),
[Redoc](https://github.com/Redocly/redoc),
or [Stoplight Elements](https://stoplight.io/open-source/elements).
