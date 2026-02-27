---
title: Getting Started
description: Get started with KosmoJS in minutes. Create a new Vite project with multiple source folders,
    set up directory-based routing, and configure your frontend framework of choice.
head:
  - - meta
    - name: keywords
      content: vite setup, typescript project setup, create vite app, multi-folder vite,
        hono api, koa api, solidjs setup, react setup, vue setup, vite dev server
---

**Starting your KosmoJS journey is a breeze!** ✨

Begin your project with a solid foundation.
`KosmoJS` provides a structured yet flexible starting point designed for real-world applications with multiple concerns.

In just a few commands, you'll have a fully-configured `Vite` project with:
- **Directory-based routing** - Folders become URLs automatically
- **Type-safe APIs** - Runtime validation from TypeScript types
- **Auto-generated fetch clients** - Typed client-side validation before requests
- **OpenAPI documentation** - API specs generated automatically
- **Route-level middleware** - Hierarchical organization without imports
- **Client pages** - React, SolidJS, or Vue with the same routing patterns
- **Nested routes with layouts** - Share UI structure across route groups
- **Server-side rendering** - With critical CSS inlining and static files serving
- **Multiple source folders** - Separate apps in a single monorepo-like project

## 🚀 Create Your Project

::: code-group
```sh [npm]
npm create kosmo
# non-interactive mode: npm create kosmo --name my-app
```

```sh [pnpm]
pnpm create kosmo
# non-interactive mode: pnpm create kosmo --name my-app
```

```sh [yarn]
yarn create kosmo
# non-interactive mode: yarn create kosmo --name my-app
```
:::

Navigate to your project:

```sh
cd ./my-app
```

All subsequent commands run from here.

## 📦 Install Dependencies

This is absolutely necesarry to continue!

::: code-group
```sh [npm]
npm install
```

```sh [pnpm]
pnpm install
```

```sh [yarn]
yarn install
```
:::

## 📁 Create a Source Folder

Unlike standard Vite templates, `KosmoJS` doesn't create a source folder automatically.

Instead, you create source folders as needed - one for your main app,
another for an admin panel, a third for a marketing site, and so on.

Each source folder is completely independent with its own configuration, base URL, and dev server port.

::: code-group
```sh [npm]
npm run +folder
```

```sh [pnpm]
pnpm +folder
```

```sh [yarn]
yarn +folder
```
:::

You'll configure:
- **Folder name** - e.g., `front`
- **Base URL** - Where this app serves from (default: `/`)
- **Dev server port** - Port for development (default: `4000`)
- **Framework** - SolidJS, React, Vue or none for API-only folders
- **Backend** - Koa, Hono or none for client-only folders
- **SSR** - Enable server-side rendering (more on this later)

For non-interactive mode, skip the prompts by providing options directly:

::: code-group
```sh [npm]
npm run +folder -- \
    --name front \
    --base / \
    --port 4000 \
    --framework solid \
    --backend koa \
    --ssr
```

```sh [pnpm]
pnpm +folder \
    --name front \
    --base / \
    --port 4000 \
    --framework solid \
    --backend koa \
    --ssr
```

```sh [yarn]
yarn +folder \
    --name front \
    --base / \
    --port 4000 \
    --framework solid \
    --backend koa \
    --ssr
```
:::

Available options:
- `--name <name>` - Source folder name (required in non-interactive mode)
- `--base <path>` - Base URL (default: `/`)
- `--port <number>` - Development server port (default: `4000`)
- `--framework <framework>` - `solid`, `react`, `vue` <span class="text-nowrap">(omit for API-only folders)</span>
- `--backend <framework>` - `koa`, `hono` <span class="text-nowrap">(omit for client-only folders)</span>
- `--ssr` - Enable server-side rendering

The source folder adds dependencies. Install them:

::: code-group
```sh [npm]
npm install
```

```sh [pnpm]
pnpm install
```

```sh [yarn]
yarn install
```
:::

## 🛣️ About Directory-Based Routing

Before we create routes, let's understand how `KosmoJS` maps folders to URLs.

**The core principle:**
- Folder names become URL path segments
- Each route requires an `index` file.

```txt
api/
  index/
    index.ts          ➜ /api
  users/
    index.ts          ➜ /api/users
    :id/
      index.ts        ➜ /api/users/:id

pages/
  index/
    index.tsx         ➜ /
  users/
    index.tsx         ➜ /users
    :id/
      index.tsx       ➜ /users/:id
```

**Key benefits:**

- **No routing config files** - The file system IS the routing table
- **API and pages mirror each other** - Easy to see how frontend and backend relate
- **Colocalization** - Each route folder can contain helpers, types, tests
- **Dynamic parameters** - Use `:id` for required params, `{:id}` for optional, `{...path}` for splat params

This works identically for both API routes and client pages, so you learn the pattern once.

[Learn more about routing patterns →](/routing/intro)

## 💡 Essential Path Mappings

Your project starts with a minimal `tsconfig.json`:

```json [tsconfig.json]
{
  "extends": "@kosmojs/config/tsconfig.vite.json"
}
```

The extended `tsconfig.vite.json` contains essential path mappings that enable your application to work properly.

You can add additional paths, but these prefixes are reserved and must not be overridden:

- `~/*` - Root-level imports
- `@/*` - Source folder imports
- `_/*` - Generated code imports

Overriding these prefixes will break your application.

Each prefix maps to a specific part of your project:

**`~/*` - Root-level imports**

Access files at your project root:

```ts
import { tzDate } from "~/helpers/datetime";
```

**`@/*` - Source folder imports**

Import from your `src/` directory without the `src/` prefix.
The `src/` directory contains your source folders (`src/admin/`, `src/front/`, `src/app/`, etc.):

```ts
import LoginForm from "@/front/components/LoginForm";
import config from "@/admin/config";
```

**`_/*` - Generated code imports**

Access generated files from `lib/src/`, which mirrors your `src/` directory structure:

```ts
import fetchMap from "_/front/fetch";            // All fetch clients
import { GET } from "_/front/fetch/users/:id";  // Specific fetch client
```

All generated files - api routes, validators, fetch clients -
live in `lib/src/` and are accessible via the `_/` prefix.

## ⚙️ Create Your First API Route

In your source folder, create `api/users/:id/index.ts` file:

```txt
src/front/
└── api/
    └── users/
        └── :id/
            └── index.ts
```

`KosmoJS` detects the new file and generates boilerplate automatically.

> Some editors show it immediately; others need you to briefly refocus the editor.

You'll see this structure appear:

::: code-group
```ts [Koa]
import { defineRoute } from "_/front/api/users/:id";

export default defineRoute(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = "Automatically generated route: [ users/:id ]"
  }),
]);
```

```ts [Hono]
import { defineRoute } from "_/front/api/users/:id";

export default defineRoute(({ GET }) => [
  GET(async (ctx) => {
    ctx.text("Automatically generated route: [ users/:id ]");
  }),
]);
```
:::

Let's make it actually useful. Replace the generated code with:

::: code-group
```ts [Koa]
import { defineRoute } from "_/front/api/users/:id";

type User = {
  id: number;
  name: string;
  email: string;
}

export default defineRoute(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.params;

    // In a real app, this would query your database
    const user: User = {
      id: Number(id),
      name: "Jane Smith",
      email: "jane@example.com",
    };

    ctx.body = user;
  }),
]);
```

```ts [Hono]
import { defineRoute } from "_/front/api/users/:id";

type User = {
  id: number;
  name: string;
  email: string;
}

export default defineRoute(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.req.param();

    // In a real app, this would query your database
    const user: User = {
      id: Number(id),
      name: "Jane Smith",
      email: "jane@example.com",
    };

    ctx.json(user);
  }),
]);
```
:::

Start the dev server:

::: code-group
```sh [npm]
npm run dev
```

```sh [pnpm]
pnpm dev
```

```sh [yarn]
yarn dev
```
:::

Visit `http://localhost:4000/api/users/123` and you'll see your response.

The route works, but there's no validation yet. Let's fix that.

[More details: API Routes →](/api-server/endpoints)

## 🛡️ Add Runtype Validation

Here's where it gets interesting - `KosmoJS` automatically converts your `TypeScript` types
into high-performance runtime validators.

It uses the state-of-the-art [TypeBox](https://github.com/sinclairzx81/typebox)
library to convert your types into high-performance JSON Schema validators.

### Parameter Validation

Route parameters come from URL paths.
For example, the URL `/api/users/123` is matched by the `api/users/:id` route,
where `:id` captures `123`. Since URLs are text, parameters arrive as strings.

You can instruct `KosmoJS` to cast `:id` into a number at runtime:

::: code-group
```ts [Koa]
import { defineRoute } from "_/front/api/users/:id";

type User = {
  id: number;
  name: string;
  email: string;
}

export default defineRoute<[
  number // validate id as number // [!code hl]
]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params; // id is a validated number! // [!code hl]

    const user: User = {
      id, // No conversion needed - already a number // [!code hl]
      name: "Jane Smith",
      email: "jane@example.com",
    };

    ctx.body = user;
  }),
]);
```

```ts [Hono]
import { defineRoute } from "_/front/api/users/:id";

type User = {
  id: number;
  name: string;
  email: string;
}

export default defineRoute<[
  number // validate id as number // [!code hl]
]>(({ GET }) => [
  GET(async (ctx) => {
    const { id } = ctx.validated.params; // id is a validated number! // [!code hl]

    const user: User = {
      id, // No conversion needed - already a number // [!code hl]
      name: "Jane Smith",
      email: "jane@example.com",
    };

    ctx.json(user);
  }),
]);
```
:::

The `<[number]>` type argument to `defineRoute` validates parameters as a tuple.
Each position corresponds to a route parameter in order.

The validated params are available through `ctx.validated.params`.
While `ctx.params`/`ctx.req.param()` still exists, it is not typed and all params are strings.

You can refine parameters further by using `TRefine` (globally available, no need to import):

```ts
defineRoute<[
  TRefine<number, { minimum: 1, multipleOf: 1 }>
]>(...)
```

This ensures the `id` is not only a number, but a positive integer.

If someone requests `/api/users/abc`, validation fails before your handler runs.

### Payload Validation

`KosmoJS` uses explicit validation targets to define what data should be validated.

**Request Metadata Targets** - Can be validated on any HTTP method:
- `query`: URL query parameters
- `headers`: HTTP request headers
- `cookies`: HTTP cookies

**Request Body Targets** - Mutually exclusive, choose one per handler:
- `json`: JSON request body
- `form`: URL-encoded form data
- `multipart`: Multipart form data
- `raw`: Raw body format (string/Buffer/ArrayBuffer/Blob)

Body targets are only suitable for methods that accept request bodies (POST, PUT, PATCH, DELETE?).
Using body targets with GET or HEAD will trigger a development warning and disable validation for that handler.

Let's add a POST endpoint that creates users:

::: code-group
```ts [Koa]
import { defineRoute } from "_/front/api/users";

type CreateUserPayload = {
  name: string;
  email: TRefine<string, { format: "email" }>;
  age?: number;
}

type User = {
  id: number;
  name: string;
  email: string;
  age?: number;
}

export default defineRoute(({ POST }) => [
  POST<{
    json: CreateUserPayload // payload schema // [!code hl]
  }>(async (ctx) => {
    // ctx.validated.json is the validated request body
    const { name, email, age } = ctx.validated.json;

    const newUser: User = {
      id: 1,
      name,
      email,
      age,
    };

    ctx.body = newUser;
  }),
]);
```

```ts [Hono]
import { defineRoute } from "_/front/api/users";

type CreateUserPayload = {
  name: string;
  email: TRefine<string, { format: "email" }>;
  age?: number;
}

type User = {
  id: number;
  name: string;
  email: string;
  age?: number;
}

export default defineRoute(({ POST }) => [
  POST<{
    json: CreateUserPayload // payload schema // [!code hl]
  }>(async (ctx) => {
    // ctx.validated.json is the validated request body
    const { name, email, age } = ctx.validated.json;

    const newUser: User = {
      id: 1,
      name,
      email,
      age,
    };

    ctx.json(newUser);
  }),
]);
```
:::

The first type argument to `POST` specifies validation targets.
The `json` property instructs the runtime to:
1. Parse the incoming request body as JSON
2. Validate the parsed data against the `CreateUserPayload` schema

If validation fails, a detailed error is returned before your handler executes.

### Response Validation

You can also validate what your handlers return.
This catches bugs where you accidentally return incomplete or malformed data:

::: code-group
```ts [Koa]
export default defineRoute(({ POST }) => [
  POST<{
    json: CreateUserPayload, // payload schema
    response: [200, "json", User] // response schema // [!code hl]
  }>(async (ctx) => {
    const { name, email, age } = ctx.validated.json;

    const newUser: User = {
      id: 1,
      name,
      email,
      age,
    };

    ctx.body = newUser; // Response validated before sending! // [!code hl]
  }),
]);
```

```ts [Hono]
export default defineRoute(({ POST }) => [
  POST<{
    json: CreateUserPayload, // payload schema
    response: [200, "json", User] // response schema // [!code hl]
  }>(async (ctx) => {
    const { name, email, age } = ctx.validated.json;

    const newUser: User = {
      id: 1,
      name,
      email,
      age,
    };

    ctx.json(newUser); // Response validated before sending! // [!code hl]
  }),
]);
```
:::

The `response` property instructs runtime to validate the status/type/body before sending the response.
If your handler returns data that doesn't match `User`,
validation throws an error instead of sending invalid data to clients.

[More details: Runtype Validation →](/validation/intro)

## ⏩ Add Middleware

Middleware are functions that execute before your route handlers,
handling cross-cutting concerns like authentication, logging, error handling, etc.

Both `Koa` and `Hono` middleware receives the request context and the `next` function.

Call `next()` to pass control to the next middleware or handler in the chain.
Skip `next()` to stop the chain early (useful for rejecting unauthorized requests).

The straightforward approach is to import and wire middleware manually:

```ts [Koa / Hono]
import { logRequest } from "~/middleware/logging";
import { defineRoute } from "_/front/api/users/:id";

export default defineRoute(({ use, GET }) => [
  use(logRequest), // Wire it manually

  GET(async (ctx) => {
    // Handler logic
  }),
]);
```

This works perfectly for simple APIs with a couple of endpoints.

But as your API grows, this approach becomes tedious.
Every new route needs the same imports.
Every middleware change means updating multiple files.
Authentication across 20 routes? That's 20 files to maintain.

**Here's a better way for production-grade APIs:** Route-level middleware files.

Create `api/users/use.ts`:

```txt
src/front/
└── api/
    └── users/
        ├── use.ts          🢀 Wraps all routes under /users
        └── :id/
            └── index.ts
```

`KosmoJS` generates boilerplate:

```ts [api/users/use.ts]
import { use } from "_/front/api";

export default [
  use((ctx, next) => {
    // Your middleware logic here
    return next();
  })
];
```

Every route under `/api/users` will now run middleware defined in `api/users/use.ts` - no imports, no repetition.

The `use.ts` file creates a middleware hierarchy that mirrors your route structure.
Parent folders wrap child routes automatically.

[More details: Middleware →](/api-server/use-middleware/intro)

## 📋 OpenAPI Generator

`OpenAPI` (formerly Swagger) is the industry standard for documenting REST APIs.
It provides machine-readable API specifications that power interactive documentation,
client code generators, and testing tools.

`KosmoJS` can automatically generate complete `OpenAPI 3.1` specifications for your API.

Enable `OpenAPI` generator in your `vite.config.ts`:

```ts [src/front/vite.config.ts]
import devPlugin from "@kosmojs/dev";
import {
  koaGenerator,
  fetchGenerator,
  typeboxGenerator,
  openapiGenerator, // [!code ++]
} from "@kosmojs/generators";

export default {
  plugins: [
    devPlugin(apiurl, {
      generators: [
        koaGenerator(),
        fetchGenerator(),
        typeboxGenerator(),
        openapiGenerator({ // [!code ++:7]
          outfile: "openapi.json",
          info: {
            title: "My API",
            version: "1.0.0",
          },
        }),
      ],
    }),
  ],
}
```

> The dev server should restart automatically, but after adding new generators
it's recommended to manually stop and restart it with `pnpm dev`

That's it. The generator analyzes your routes, type definitions,
and validation schemas to produce a complete OpenAPI spec.

**What gets generated:**
- All route paths with HTTP methods
- Parameter schemas (from your tuple types)
- Request body schemas (from payload types)
- Response schemas (from response types)

You can use the generated `openapi.json` with tools like Swagger UI, Postman,
or any OpenAPI-compatible client generator.

[More details: OpenAPI Generator →](/generators/openapi/intro)

## 📥 Fetch Clients

Here's the continuation of powerful validation pattern:
`KosmoJS` generates fully-typed fetch clients
that validate on the **client side** before sending requests.

Fetch clients use the exact same high-performance validation schemas as your server.
No shifts, no drifts - client-side validation produces identical results to server-side validation.

Import the generated fetch client for type-safe API calls with built-in validation.

**Method 1: Direct import** (recommended for most cases)

::: code-group
```tsx [SolidJS]
import { useParams, createAsync } from "@solidjs/router";
import { GET } from "_/front/fetch/users/:id"; // [!code hl]

export default function UserPage() {
  const params = useParams();
  const user = createAsync(() => GET([params.id])); // [!code hl]
  // ...
}
```

```tsx [React]
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { GET } from "_/front/fetch/users/:id"; // [!code hl]

export default function UserPage() {
  const params = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    GET([params.id]).then(setUser); // [!code hl]
  }, [params.id]);

  // ...
}
```

```vue [Vue]
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { GET } from "_/front/fetch/users/:id"; // [!code hl]

const route = useRoute();
const user = ref(null);

onMounted(async () => {
  user.value = await GET([route.params.id]); // [!code hl]
});
</script>

<template>
  <div>
    <h1>{{ user?.name }}</h1>
    <p>{{ user?.email }}</p>
  </div>
</template>
```
:::

**Method 2: Via fetch map** (useful for dynamic routing)

```tsx
import fetchMap from "_/front/fetch";

// Access routes through the centralized map
const userFetch = fetchMap["users/:id"];
const response = await userFetch.GET([123]); // Tuple matches route params
```

The fetch map exports all your API routes in one place, which is handy when you need to:
- Dynamically select which endpoint to call
- Iterate over multiple routes
- Build tools that work with your entire API surface

The fetch client:
- Is fully typed - autocomplete shows exact parameters/payload structure
- Validates data client-side before making requests
- Automatically infers response types

Invalid requests never reach your server, saving bandwidth and giving instant feedback.

[More details: Fetch Clients →](/fetch/intro)

## 🎨 Create Client Pages

Now let's create the frontend.
Pages live in the `pages/` folder and follow the same directory-based routing as API routes.

The `pages/` folder is where your client-side UI lives.
Each `index.tsx` (React/SolidJS) or `index.vue` (Vue) file contains a page component
written in whichever framework you selected during source folder creation.

`KosmoJS` enforces strict architectural boundaries:
client code never runs on your API server, and API code never runs in the browser.

> Even in SSR mode, your client code runs on a separate server
(different process, different port, potentially different machine) -
your API server stays lean and focused.

Create users page - `pages/users/index.tsx` (or `.vue`):

```txt
src/front/
└── pages/
    └── users/
        └── index.tsx
```

`KosmoJS` detects the new file and generates framework-specific boilerplate.

> Some editors show it immediately; others need you to briefly refocus the file.

**Key points:**

- Pages use `index.tsx` (React/SolidJS) or `index.vue` (Vue)
- Parameters work identically to API routes
- Auto-generated boilerplate adapts to your chosen framework

### Add Layouts for Shared UI

As your application grows, you'll need to share UI elements across multiple pages -
navigation bars, sidebars, headers, footers. Without layouts, you'd duplicate these in every page component.

Layouts solve this by wrapping groups of related pages with common UI structure.
A layout renders once and your page components render inside it.

For example, all pages under `/users` might share the same navigation sidebar.
Instead of copying that sidebar code into every user-related page, you create one layout that wraps them all.

Now that you have pages, let's organize them with layouts.

Create `pages/users/layout.tsx`:

```txt
src/front/
└── pages/
    └── users/
        ├── layout.tsx      🢀 Wraps all pages under /users
        └── index.tsx
```

All routes under `/users` now render inside this layout. The navigation bar appears on every page automatically.

Layouts can be nested - deeper layouts wrap inner layouts, creating a hierarchy that matches your route structure.

[More details: Nested Routes & Layouts →](/routing/nested-routes)

## ⚡ Server-Side Rendering

Want SEO, faster initial page loads, and critical CSS optimization? Enable SSR.

**Note:** You can enable SSR when creating a source folder with the `--ssr` flag
(or by selecting it in the interactive mode).

If you didn't enable it initially, enable it in your `vite.config.ts`:

```ts [src/front/vite.config.ts]
import devPlugin from "@kosmojs/dev";
import {
  koaGenerator,
  fetchGenerator,
  typeboxGenerator,
  ssrGenerator, // [!code ++]
} from "@kosmojs/generators";

export default {
  plugins: [
    devPlugin(apiurl, {
      generators: [
        koaGenerator(),
        fetchGenerator(),
        typeboxGenerator(),
        ssrGenerator(), // [!code ++]
      ],
    }),
  ],
}
```

> The dev server should restart automatically, but after adding new generators
it's recommended to manually stop and restart it with `pnpm dev`

`KosmoJS` creates `entry/server.ts` - your SSR orchestration file.

This is where you control the server-side rendering process.
By default, it uses `renderToString` which renders the entire page before sending it.

For more advanced scenarios, you can switch to `renderToStream` to enable streaming SSR,
where the browser receives and displays content progressively as it's rendered.

::: code-group
```ts [SolidJS]
export default renderFactory(() => {
  const hydrationScript = generateHydrationScript();
  return {
    async renderToString(url, { criticalCss }) {
      const router = await createRouter(App, routes, { url });
      const head = criticalCss.reduce(
        (head, { text }) => `${head}\n<style>${text}</style>`,
        hydrationScript,
      );
      const html = renderToString(() => router);
      return { head, html };
    },
  };
});
```

```ts [React]
export default renderFactory(() => {
  return {
    async renderToString(url, { criticalCss }) {
      const router = await createRouter(App, routes, { url });
      const head = criticalCss
        .map(({ text }) => `<style>${text}</style>`)
        .join("\n");
      const html = renderToString(router);
      return { head, html };
    },
  };
});
```

```ts [Vue]
export default renderFactory(() => {
  return {
    async renderToString(url, { criticalCss }) {
      const app = createSSRApp(App);
      await createRouter(app, routes, { url });
      const head = criticalCss
        .map(({ text }) => `<style>${text}</style>`)
        .join("\n");
      const html = await renderToString(app);
      return { head, html };
    },
  };
});
```
:::

The critical CSS optimization is automatic:
- Analyzes which CSS your route actually uses
- Extracts only the necessary styles
- Inlines them in the `<head>` for instant rendering
- Loads remaining styles asynchronously

Your pages render instantly with styled content - no flash of unstyled content, no render-blocking CSS.

### Build and run:

```sh
pnpm build
node dist/front/ssr/server.js -p 4001
```

Your app is now server-rendered with optimized CSS delivery.

**Worth Noting:** During build, `KosmoJS` bundles two separate servers:
- API server for handling API requests
- SSR server for rendering your UI

You can deploy them separately, to different machines, scale them independently,
or run them side-by-side.

Your API server stays clean and dedicated to handling API requests,
while the SSR server is dedicated entirely to rendering your app.

More details on SSR:
[SolidJS](/generators/solid/server-side-render)
 · [React](/generators/react/server-side-render)
 · [Vue](/generators/vue/server-side-render)

## 🌐 Scale with Multiple Source Folders

As your app grows, add more source folders for different concerns:

Each source folder is completely independent:
- Different framework if needed (SolidJS for marketing, Vue for admin)
- Different base URL (routes auto-prefix correctly)
- Different dev server port (run all simultaneously)
- Independent `vite.config.ts` (customize per folder)
- Separate `api/` and `pages/` directories

Run everything with a single command:

```sh
pnpm dev
```

All source folders run in parallel. One command, entire application running.

## 🏗️ What You've Built

In less than 30 minutes, you have:

✅ **Type-safe APIs** with compile-time and runtime validation

✅ **Generated fetch clients** that validate before sending requests

✅ **Directory-based routing** that maps folders to URLs naturally

✅ **Hierarchical middleware** that wraps routes without imports

✅ **Nested layouts** that compose automatically

✅ **Server-side rendering** with critical CSS optimization

✅ **Multi-app architecture** with independent source folders

And here's the key: you defined your types *once*. `KosmoJS` generated:
- Runtime validators for parameters, payloads, and responses
- Typed fetch clients with client-side validation
- OpenAPI schemas for documentation
- Type definitions for perfect autocomplete

Your development workflow stays clean and fast:
- Hot Module Replacement for instant updates
- No build step during development
- TypeScript errors in your editor immediately
- Generated code lives in `lib/`, not cluttering your source

## ➡ Next Steps

**Learn the patterns:**
- [Directory-Based Routing](/routing/intro) - How folders become URLs
- [Runtime Validation](/validation/intro) - Type definitions as validators
- [Middleware Composition](/api-server/use-middleware/intro) - Hierarchical middleware organization
- [Nested Layouts](/routing/nested-routes) - Shared UI across route groups
- [Generated Fetch Clients](/fetch/start) - Type-safe API consumption

**Explore advanced features:**
- [Custom Validation](/validation/refine) - Refine types with custom rules
- [OpenAPI Generation](/generators/openapi/intro) - Automatic API documentation
- [Production Builds](/api-server/building-for-production) - Deployment strategies

---

`KosmoJS` provides structure, not constraints. Your project, your rules.

Start building with better organization from day one.
