---
title: Getting Started
description: Get started with KosmoJS in minutes. Create a new Vite project with multiple source folders,
    set up directory-based routing, and configure your frontend framework of choice.
head:
  - - meta
    - name: keywords
      content: vite setup, typescript project setup, create vite app, multi-folder vite,
        koa api, solidjs setup, react setup, vue setup, vite dev server
---

**Starting your KosmoJS journey is a breeze!** ✨

Begin your project with a solid foundation.
`KosmoJS` provides a structured yet flexible starting point designed for real-world applications with multiple concerns.

In just a few commands, you'll have a fully-configured Vite project with:
- **Directory-based routing** - Folders become URLs automatically
- **Type-safe APIs** - Runtime validation from TypeScript types (aka Runtype Validation)
- **Auto-generated fetch clients** - Typed client-side validation before requests
- **OpenAPI documentation** - API specs generated automatically
- **Route-level middleware** - Hierarchical organization without imports
- **Client pages** - React, SolidJS, or Vue with the same routing patterns
- **Nested routes with layouts** - Share UI structure across route groups
- **Server-side rendering** - With critical CSS inlining and static files serving
- **Multiple source folders** - Separate apps in a single monorepo-like project

## 🚀 Create Your Project

::: code-group
```sh [pnpm]
pnpm dlx kosmojs my-app
```

```sh [npm]
npx kosmojs my-app
```

```sh [yarn]
yarn dlx kosmojs my-app
```
:::

Navigate to your project:

```sh
cd my-app
```

All subsequent commands run from here.

## 📦 Install Dependencies

This is absolutely necesarry to continue!

::: code-group
```sh [pnpm]
pnpm install
```

```sh [npm]
npm install
```

```sh [yarn]
yarn install
```
:::


## 📁 Create Your First Source Folder

Unlike standard Vite templates, `KosmoJS` doesn't create a source folder automatically.

Instead, you create source folders as needed - one for your main app,
another for an admin panel, a third for a marketing site, and so on.

Each source folder is completely independent with its own configuration, base URL, and dev server port.

::: code-group
```sh [pnpm]
pnpm +folder
```

```sh [npm]
npm run +folder
```

```sh [yarn]
yarn +folder
```
:::

You'll configure:
- **Folder name** - e.g., `@front` (the `@` is just convention, not required)
- **Base URL** - Where this app serves from (default: `/`)
- **Dev server port** - Port for development (default: `4000`)
- **Frontend framework** - SolidJS, React, Vue, or none for API-only folders
- **SSR** - Enable server-side rendering (more on this later)

**Non-interactive mode:**

For CI/CD or scripting, skip the prompts by providing options directly:

::: code-group
```sh [pnpm]
pnpm +folder --name @front --base / --port 4000 --framework solid --ssr
```

```sh [npm]
npm run +folder -- --name @front --base / --port 4000 --framework solid --ssr
```

```sh [yarn]
yarn +folder --name @front --base / --port 4000 --framework solid --ssr
```
:::

Available options:
- `--name <name>` - Source folder name (required in non-interactive mode)
- `--base <path>` - Base URL (default: `/`)
- `--port <number>` - Development server port (default: `4000`)
- `--framework <framework>` - Frontend framework: `none`, `solid`, `react`, `vue`
- `--ssr` - Enable server-side rendering

The source folder adds dependencies. Install them:

::: code-group
```sh [pnpm]
pnpm install
```

```sh [npm]
npm install
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
    index.ts          🢂 /api
  users/
    index.ts          🢂 /api/users
    [id]/
      index.ts        🢂 /api/users/:id

pages/
  index/
    index.tsx         🢂 /
  users/
    index.tsx         🢂 /users
    [id]/
      index.tsx       🢂 /users/:id
```

**Key benefits:**

- **No routing config files** - The file system IS the routing table
- **API and pages mirror each other** - Easy to see how frontend and backend relate
- **Colocalization** - Each route folder can contain helpers, types, tests
- **Dynamic parameters** - Use `[id]` for required params, `[[id]]` for optional, `[...path]` for rest params

This works identically for both API routes and client pages, so you learn the pattern once.

[Learn more about routing patterns →](/routing/intro)

## ⚙️ Create Your First API Route

In your source folder, create `api/users/[id]/index.ts` file:

```txt
@front/
└── api/
    └── users/
        └── [id]/
            └── index.ts
```

`KosmoJS` detects the new file and generates boilerplate automatically.

> Some editors show it immediately; others need you to briefly refocus the file.

You'll see this structure appear:

```ts [api/users/[id]/index.ts]
import { defineRoute } from "@front/{api}/users/[id]";

export default defineRoute(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = "Automatically generated route: [ users/[id] ]"
  }),
]);
```

Let's make it actually useful. Replace the generated code with:

```ts [api/users/[id]/index.ts]
import { defineRoute } from "@front/{api}/users/[id]";

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

Start the dev server:

::: code-group
```sh [pnpm]
pnpm dev
```

```sh [npm]
npm run dev
```

```sh [yarn]
yarn dev
```
:::

Visit `http://localhost:4000/api/users/123` and you'll see your response.

The route works, but there's no validation yet. Let's fix that.

[More details: API Routes →](/api-server/endpoints)

## 🛡️ Add Runtime Validation

Here's where it gets interesting. Install the `TypeBox` generator:

::: code-group
```sh [pnpm]
pnpm install -D @kosmojs/typebox-generator
pnpm install typebox
```

```sh [npm]
npm install -D @kosmojs/typebox-generator
npm install typebox
```

```sh [yarn]
yarn add -D @kosmojs/typebox-generator
yarn add typebox
```
:::

Add it to your `vite.config.ts`:

```ts [@front/vite.config.ts]
import devPlugin from "@kosmojs/dev";
import typeboxGenerator from "@kosmojs/typebox-generator"; // [!code ++]

export default {
  plugins: [
    devPlugin(apiurl, {
      generators: [
        typeboxGenerator(), // [!code ++]
        // other generators...
      ],
    }),
  ],
}
```

Once configured, you can add validation to your routes through type arguments.
Let's explore each type of validation step by step.

### Parameter Validation

Route parameters come from the URL path itself (like the `[id]` in `/api/users/123`).
By default, they are strings. Let's validate that `id` is actually a number:

```ts [api/users/[id]/index.ts]
import { defineRoute } from "@front/{api}/users/[id]";

type User = {
  id: number;
  name: string;
  email: string;
}

export default defineRoute<[number]>(({ GET }) => [ // [!code hl]
  GET(async (ctx) => {
    const { id } = ctx.typedParams; // Now a validated number! // [!code hl]

    const user: User = {
      id, // No conversion needed - already a number // [!code hl]
      name: "Jane Smith",
      email: "jane@example.com",
    };

    ctx.body = user;
  }),
]);
```

The `<[number]>` type argument to `defineRoute` validates parameters as a tuple.
Each position corresponds to a route parameter in order.

The validated parameter is available through `ctx.typedParams.id` (not `ctx.params.id`).

You can refine parameters further using `TRefine`(globally available, no need to import):

```ts
defineRoute<[TRefine<number, { minimum: 1, multipleOf: 1 }>]>(...)
```

This ensures the ID is not only a number, but a positive integer.

If someone requests `/api/users/abc`, validation fails before your handler runs.

### Payload Validation

Request payloads need validation too. Here's the key concept:
- On GET requests, `ctx.payload` mirrors `ctx.query` (query parameters).
- On POST/PUT/PATCH requests, `ctx.payload` contains the request body.

Let's add a POST endpoint that creates users:

```ts [api/users/index.ts]
import { defineRoute } from "@front/{api}/users";

type CreateUserPayload = {
  name: string;
  email: TRefine<string, { format: "email" }>;
  age?: number;
}

type User = {
  id: string;
  name: string;
  email: string;
  age?: number;
}

export default defineRoute(({ POST }) => [
  POST<CreateUserPayload>(async (ctx) => { // [!code hl]
    // ctx.payload is the validated request body
    const { name, email, age } = ctx.payload;

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      age,
    };

    ctx.body = newUser;
  }),
]);
```

The first type argument to `POST` validates the payload.
For POST/PUT/PATCH, this validates the request body.
For GET, this would validate query parameters.

If the request body doesn't match `CreateUserPayload`,
validation fails with a detailed error before your handler runs.

### Response Validation

You can also validate what your handlers return.
This catches bugs where you accidentally return incomplete or malformed data:

```ts [api/users/index.ts]
export default defineRoute(({ POST }) => [
  POST<CreateUserPayload, User>(async (ctx) => { // [!code hl]
    const { name, email, age } = ctx.payload;

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      age,
    };

    ctx.body = newUser; // Response validated before sending!
  }),
]);
```

The second type argument validates `ctx.body` before sending the response.
If your handler returns data that doesn't match `User`,
validation throws an error instead of sending invalid data to clients.

For our GET endpoint:

```ts [api/users/[id]/index.ts]
export default defineRoute<[number]>(({ GET }) => [
  GET<never, User>(async (ctx) => { // [!code hl]
    const { id } = ctx.typedParams;

    const user: User = {
      id,
      name: "Jane Smith",
      email: "jane@example.com",
    };

    ctx.body = user; // Validated!
  }),
]);
```

We use `never` for the first argument because here GET request don't have a payload we want to validate
(though you could validate query parameters if needed).

[More details: Runtime Validation →](/validation/intro)

## ⇆ Generated Fetch Clients

Here's the continuation of powerful validation pattern:
`KosmoJS` generates fully-typed fetch clients
that validate on the **client side** before sending requests.

Import the generated fetch client for type-safe API calls with built-in validation.

**Method 1: Direct import** (recommended for most cases)

::: code-group

```tsx [SolidJS]
import { useParams } from "@solidjs/router";
import { createAsync } from "@solidjs/router";
import { GET } from "@front/{api}/users/[id]/fetch";

export default function UserPage() {
  const params = useParams();
  const user = createAsync(() => GET([params.id])); // Tuple matches route params
  // ...
}
```

```tsx [React]
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { GET } from "@front/{api}/users/[id]/fetch";

export default function UserPage() {
  const params = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    GET([params.id]).then(setUser);
  }, [params.id]);

  // ...
}
```

```vue [Vue]
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { GET } from "@front/{api}/users/[id]/fetch";

const route = useRoute();
const user = ref(null);

onMounted(async () => {
  user.value = await GET([route.params.id]);
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
import fetchMap from "@front/{fetch}";

// Access routes through the centralized map
const userFetch = fetchMap["users/[id]"];
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

## 📋 Automatic OpenAPI Documentation

Here's a bonus: `KosmoJS` can generate complete OpenAPI 3.1 specifications from your validated routes.

Install the OpenAPI generator:

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

Add it to your `vite.config.ts`:

```ts [@front/vite.config.ts]
import devPlugin from "@kosmojs/dev";
import typeboxGenerator from "@kosmojs/typebox-generator";
import openapiGenerator from "@kosmojs/openapi-generator"; // [!code ++]

export default {
  plugins: [
    devPlugin(apiurl, {
      generators: [
        typeboxGenerator(),
        openapiGenerator({ // [!code ++]
          outfile: "openapi.json", // [!code ++]
          info: { // [!code ++]
            title: "My API", // [!code ++]
            version: "1.0.0", // [!code ++]
          }, // [!code ++]
        }), // [!code ++]
      ],
    }),
  ],
}
```

That's it. The generator analyzes your routes, type definitions, and validation schemas to produce a complete OpenAPI spec.

**What gets generated:**
- All route paths with HTTP methods
- Parameter schemas (from your tuple types)
- Request body schemas (from payload types)
- Response schemas (from response types)

You can use the generated `openapi.json` with tools like Swagger UI, Postman, or any OpenAPI-compatible client generator.

[More details: OpenAPI Generator →](/generators/openapi/intro)

## 🔐 Add Middleware

`KosmoJS` uses `Koa` for its API layer, following Koa's middleware model.

Middleware are functions that execute before your route handlers,
handling cross-cutting concerns like authentication, logging, error handling, etc.

Each middleware receives the request context (`ctx`) and a `next` function.
Call `next()` to pass control to the next middleware or handler in the chain.
Skip `next()` to stop the chain early (useful for rejecting unauthorized requests).

The straightforward approach is to import and wire middleware manually:

```ts [api/users/[id]/index.ts]
import { defineRoute } from "@front/{api}/users/[id]";
import { logRequest } from "@/middleware/logging";

export default defineRoute(({ GET, use }) => [
  use(logRequest), // Wire it manually

  GET(async (ctx) => {
    // Handler logic
  }),
]);
```

This works perfectly for simple APIs with a couple of endpoints.

But as your API grows, this approach becomes tedious. Every new route needs the same imports.
Every middleware change means updating multiple files.
Authentication across 20 routes? That's 20 files to maintain.

**Here's a better way for larger APIs:** Route-level middleware files.

Create `api/users/use.ts`:

```txt
@front/
└── api/
    └── users/
        ├── use.ts          🢀 Wraps all routes under /users
        └── [id]/
            └── index.ts
```

`KosmoJS` generates boilerplate:

```ts [api/users/use.ts]
import { use } from "@kosmojs/api";

export default use([
  async (ctx, next) => {
    // Your middleware logic here
    return next();
  },
]);
```

Add authentication:

```ts [api/users/use.ts]
import { use } from "@kosmojs/api";

export default use([
  async (ctx, next) => {
    const token = ctx.headers.authorization?.replace("Bearer ", ""); // [!code ++]
    ctx.assert(token, 401, "Authentication required"); // [!code ++]

    const user = await verifyToken(token); // [!code ++]
    ctx.assert(user, 401, "Invalid token"); // [!code ++]

    ctx.state.user = user; // Available in all child routes // [!code ++]
    return next();
  },
]);
```

Every route under `/api/users` now requires authentication. No imports, no repetition.

The `use.ts` file creates a middleware hierarchy that mirrors your route structure.
Parent folders wrap child routes automatically.

[More details: Middleware →](/api-server/use-middleware/intro)

## 🎨 Build Client Pages

Now let's create the frontend. Pages live in the `pages/` folder and follow the same directory-based routing as API routes.

Create users page:

```txt
@front/
└── pages/
    └── users/
        └── index.tsx
```

`KosmoJS` detects the new file and generates framework-specific boilerplate.

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
@front/
└── pages/
    └── users/
        ├── layout.tsx      🢀 Wraps all pages under /users
        └── index.tsx
```

All routes under `/users` now render inside this layout. The navigation bar appears on every page automatically.

Layouts can be nested - deeper layouts wrap inner layouts, creating a hierarchy that matches your route structure.

[More details: Nested Routes & Layouts →](/routing/nested-routes)

## ⚡ Enable Server-Side Rendering

Want SEO, faster initial page loads, and critical CSS optimization? Enable SSR.

**Note:** You can enable SSR when creating a source folder with the `--ssr` flag
(or by selecting it in the interactive mode).

If you didn't enable it initially, you can add it manually:

Install the SSR generator:

::: code-group
```sh [pnpm]
pnpm install -D @kosmojs/ssr-generator
```

```sh [npm]
npm install -D @kosmojs/ssr-generator
```

```sh [yarn]
yarn add -D @kosmojs/ssr-generator
```
:::

Update your `vite.config.ts`:

```ts [@front/vite.config.ts]
import solidPlugin from "vite-plugin-solid";
import devPlugin from "@kosmojs/dev";
import ssrGenerator from "@kosmojs/ssr-generator"; // [!code ++]

export default {
  plugins: [
    solidPlugin({ ssr: true }), // [!code ++]
    devPlugin(apiurl, {
      generators: [
        ssrGenerator(), // [!code ++]
        // other generators...
      ],
    }),
  ],
}
```

`KosmoJS` creates `entry/server.ts` based on selected framework:

::: code-group
```ts [SolidJS]
import { renderToString, generateHydrationScript } from "solid-js/web";

import { routeStackBuilder } from "@src/{solid}/server";
import App from "../App";
import createRouter from "../router";

const routes = routeStackBuilder({ withPreload: false });

export default {
  async factory(url) {
    const router = createRouter(App, routes, { url });
    const hydrationScript = generateHydrationScript();
    return {
      async renderToString({ criticalCss }) {
        const head = criticalCss.reduce(
          (head, { text }) => `${head}\n<style>${text}</style>`,
          hydrationScript,
        );

        const html = renderToString(() => router);

        return { head, html };
      },
    };
  },
} satisfies import("@kosmojs/dev").SSRSetup;
```

```ts [React]
import { renderToString } from "react-dom/server";
import { routes } from "@src/{react}/server";
import App from "../App";
import createRouter from "../router";

export default {
  async factory(url) {
    const router = await createRouter(App, routes, { url });
    return {
      renderToString({ criticalCss }) {
        const head = criticalCss
          .map(({ text }) => `<style>${text}</style>`)
          .join("\n");
        const html = renderToString(router);
        return { head, html };
      },
    };
  },
} satisfies import("@kosmojs/dev").SSRSetup;
```

```ts [Vue]
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";

import { routes } from "@src/{vue}/server";
import App from "../App.vue";
import createRouter from "../router";

export default {
  async factory(url) {
    const app = createSSRApp(App);
    await createRouter(app, routes, { url });
    return {
      async renderToString({ criticalCss }) {
        const head = criticalCss
          .map(({ text }) => `<style>${text}</style>`)
          .join("\n");

        const html = await renderToString(app);

        return { head, html };
      },
    };
  },
} satisfies import("@kosmojs/dev").SSRSetup;
```
:::

The critical CSS optimization is automatic:
- Analyzes which CSS your route actually uses
- Extracts only the necessary styles
- Inlines them in the `<head>` for instant rendering
- Loads remaining styles asynchronously

Your pages render instantly with styled content - no flash of unstyled content, no render-blocking CSS.

Build and run:

```sh
pnpm build
node dist/@front/ssr/server.js -p 4001
```

Your app is now server-rendered with optimized CSS delivery.

More details on SSR:
[SolidJS](/generators/solid/server-side-render)
/ [React](/generators/react/server-side-render)
/ [Vue](/generators/vue/server-side-render)

## 🌐 Scale with Multiple Source Folders

As your app grows, add more source folders for different concerns:

::: code-group
```sh [Interactive]
pnpm +folder
# name: @admin
# baseurl: /admin
# port: 4001
# framework: React
```

```sh [Non-interactive]
pnpm +folder --name @admin --base /admin --port 4001 --framework react
```
:::

::: code-group
```sh [Interactive]
pnpm +folder
# name: @marketing
# baseurl: /
# port: 4002
# framework: SolidJS
```

```sh [Non-interactive]
pnpm +folder --name @marketing --base / --port 4002 --framework solid --ssr
```
:::

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
