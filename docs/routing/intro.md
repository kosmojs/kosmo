---
title: Directory-Based Routing
description: KosmoJS uses directory-based routing to map file system structure directly to URL paths.
    Folder names become path segments with index files defining endpoints and components.
head:
  - - meta
    - name: keywords
      content: directory-based routing, url mapping, api routes, page routes, route organization
---

`KosmoJS` uses directory-based routing to map your file system structure to URL paths.

This approach eliminates the need for separate routing configuration files
and ensures that your routes are always in sync with your actual code structure.

When you create a folder and file, you've created a route - no additional steps required.

## 🛣️ How Directory-Based Routing Works

The fundamental principle is simple: folder names become path segments in your URLs,
and each route requires an `index` file that serves as the actual endpoint or component.

This pattern applies consistently to both API routes (in your `api` directory)
and client pages (in your `pages` directory).

Every route must live inside a folder, even the base route. For the root path,
you create a folder named `index`, which maps to the base URL.

This consistency means you never have to remember special cases -
every single route follows the same pattern of folder-contains-index-file.

Here's how a typical structure maps to actual URLs:

```
api/
  index/
    index.ts          🢂 /api
  users/
    index.ts          🢂 /api/users
    [id]/
      index.ts        🢂 /api/users/:id

pages/
  index/
    index.tsx          🢂 /
  users/
    index.tsx          🢂 /users
    [id]/
      index.tsx        🢂 /users/:id
```

Notice how the structure mirrors itself between API and pages.

If you have a `/users/:id` page, you'll likely have a corresponding `/api/users/:id` endpoint to fetch that user's data.

The parallel structure makes it easy to understand how your frontend and backend relate to each other.

## 📄 Route File Requirements

Every route in `KosmoJS` is defined by an `index` file within a folder.
This file must export a default value - the specific format of that export
depends on whether you're creating an API route or a client page.

For API routes, you export a route definition that specifies which HTTP methods you handle
and provides handler functions for each method.

For client pages, you export a component function that renders your UI.

The auto-generation feature (covered in the next section) creates these exports
for you with appropriate boilerplate, so you rarely need to write them from scratch.

The folder-contains-index pattern might seem verbose at first,
especially if you're used to frameworks where a single file can be a route.

However, this pattern provides important benefits. Each route gets its own folder,
giving you a natural place to colocate related files - utility functions, type definitions, test files,
or any other code specific to that route.

As your application grows, this colocalization keeps related code together
and prevents utility files from cluttering your route directories.

## 🏗️ Nested Routes and Layouts

The directory-based routing structure naturally supports nested routes.

If you create `api/users/[id]/posts/index.ts`, you get an endpoint at `/api/users/:id/posts`.
This nesting can go as deep as your application needs.

For client pages, nested routes often benefit from layout components
that wrap child routes and provide common UI elements like navigation or headers.

`KosmoJS` supports nested routes naturally, featuring same consistent pattern across all frameworks.
[( Details 🢂 )](/routing/nested-routes)
