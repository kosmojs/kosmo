---
title: OpenAPI config
description: Every key of the backend.openapi block - outfile, info, servers and the rest -
    and what happens when a required one is missing.
head:
  - - meta
    - name: keywords
      content: openapi config, outfile, openapi info, openapi servers, backend.openapi,
        kosmo.config.ts, openapi 3.1.0
---

`backend.openapi` is the one block whose options are mandatory.
For how it sits alongside the rest of the folder config, see the [configuration reference](/essentials/config#backend-openapi).

---

### Required Options

**`outfile`** - Path where the spec is written, relative to your `kosmo.config.ts`.

**`openapi`** - OpenAPI version. Use `"3.1.0"` or any `3.1.x` version.

**`info`** - API metadata:
- `title` (required) - Name of your API
- `version` (required) - API version, use semantic versioning

**`servers`** - Array of server objects:
- `url` (required) - URL the API is served from, including the `backend.base` prefix.
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
  // this folder has backend.base "/api", so the dev server carries that prefix -
  // in production the API is deployed at the root of its own host and carries none.
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
and the `index` route becomes `/` - neither carries the folder's
[backend.base](/essentials/config#backend-base-required).

That is deliberate, not an omission. In `OpenAPI`, paths are relative to `servers`,
and the prefix an API answers on is a deployment decision rather than a property of the route.

The same backend may sit behind `/api` in development,
at the root of a dedicated host in production, and under `/v2/api` behind a gateway -
so the prefix belongs to the server entry, and the paths stay the same in all three.

This is why `servers` is mandatory: it is the only place the prefix is recorded.
Give each entry the full prefix, origin plus `backend.base`:

```ts
// folder with backend.base "/api"
servers: [
  { url: "http://localhost:4556/api", description: "Development server" },
  // deployed at the root of its own host - no prefix to add
  { url: "https://api.myapp.com", description: "Production server" },
];
```

```ts
// folder with backend.base "/admin/api"
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
A missing `backend.base` prefix is the usual cause.
:::
