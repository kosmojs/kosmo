---
title: Directory-Based Routing
description: KosmoJS uses directory-based routing to map file system structure directly to URL paths.
    Folder names become path segments with index files defining endpoints and components.
head:
  - - meta
    - name: keywords
      content: directory-based routing, url mapping, api routes, page routes, route organization
---

`KosmoJS` uses directory-based routing: folder names become URL path segments,
and `index` files define the actual endpoints or components.

No separate routing configuration - your file structure is your route definition.

## 🛣️ How It Works

The same pattern applies to both API routes and client pages:

```
api/
  index/
    index.ts          ➜ /api
  users/
    index.ts          ➜ /api/users
    [id]/
      index.ts        ➜ /api/users/:id

pages/
  index/
    index.tsx         ➜ /
  users/
    index.tsx         ➜ /users
    [id]/
      index.tsx       ➜ /users/:id
```

The parallel structure between `api/` and `pages/` is intentional -
if you have a `/users/[id]` page, the corresponding `/api/users/[id]` endpoint is easy to find.

Every route lives in a folder, including the root - the base route uses a folder named `index`.
This consistency means no special cases: every route is a folder with an `index` file inside.

## 📄 Route File Requirements

API routes export a route definition (HTTP methods + handlers).
Client pages export a component function.

The [auto-generation feature](/routing/generated-content) produces the correct boilerplate
when you create a new file, so you rarely write it from scratch.

The folder-per-route pattern gives each route its own namespace for colocating related files -
utilities, types, tests - without cluttering parent directories.

## 🏗️ Nested Routes

Nesting works by nesting folders. `api/users/[id]/posts/index.ts` maps to `/api/users/:id/posts`,
and can go as deep as your domain requires. Each level can colocate its own helpers,
types, and tests without affecting siblings.

For client pages, nested routes support layout components that wrap child routes
with shared UI like navigation or headers.
([Details ➜ ](/frontend/routing))
