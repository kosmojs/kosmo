---
title: Derived specification
description: What lands in the generated document - paths, schemas, parameters, request bodies,
    responses and VRefine constraints, including path variations for optional parameters.
head:
  - - meta
    - name: keywords
      content: openapi paths, openapi schemas, openapi parameters, request bodies, responses,
        vrefine constraints, json schema, optional parameters
---

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
