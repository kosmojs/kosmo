---
title: Development Workflow
description: Run multiple KosmoJS source folders independently with separate dev servers,
    automatic API hot-reload, custom middleware routing, and resource cleanup with teardown handlers.
head:
  - - meta
    - name: keywords
      content: vite dev server, hot reload, esbuild, rolldown, api development,
        multiple ports, teardown handler, development middleware, file watching
---

Each source folder in `KosmoJS` is a **standalone entity** with its own dev server, port, and configuration.

**Why this model?**

Different concerns in your application often have different needs.
Your public marketing site might need SSR capabilities, your customer app needs authentication flows,
and your admin panel requires different access patterns.
Running them on separate ports with independent configurations means:

- **Focused development** - Work on one concern without loading everything else
- **Independent scaling** - Deploy and scale each concern based on its traffic patterns
- **Team autonomy** - Different teams can own different source folders without conflicts
- **Clear boundaries** - Port separation reinforces the organizational structure - no accidental cross-contamination

The standalone model matches how these concerns will eventually deploy in production -
separate services on different base URLs-making your development environment reflect reality rather than abstract it away.

## 🚀 Starting the Dev Server

Run the dev server for all source folders:

```sh
pnpm dev
```

Run the dev server for a specific source folder:

```sh
pnpm dev @front
```

Replace `@front` with your source folder name (`@admin`, `@marketing`, etc.).

The dev server starts on the port configured in your source folder's `vite.config.ts` (default: 4000).

## 🔀 What Happens During Development

When you start a dev server, `KosmoJS`:

1. **Builds your API** - Uses esbuild to compile `api/app.ts`
2. **Starts Vite's dev server** - Serves your client pages with HMR
3. **Integrates middleware** - Routes requests between `Vite` and your API
4. **Watches for changes** - Rebuilds API code automatically

### API Hot-Reload

When you modify API files, `KosmoJS`:
- Detects the change via file watcher
- Waits for file stability (default: 1 second)
- Rebuilds the API bundle in a background worker thread
- Dynamically imports the new API handler
- Routes subsequent requests to the updated API

The rebuild typically completes in about a second, even on larger projects.
Your `Vite` dev server remains responsive during API rebuilds since they happen in a worker thread.

### Future: Waiting for Rolldown

The current build system uses `esbuild`, which is fast and reliable
but doesn't support HMR for server-side code.

`KosmoJS` is watching the development of [Rolldown](https://rolldown.rs/),
a Rust-based bundler that aims to provide HMR capabilities for server-side builds.

Once Rolldown finalizes its API and reaches a stable release,
`KosmoJS` plans to evaluate it as a replacement for esbuild.

HMR for API code would eliminate full rebuilds, preserve in-memory state across changes,
and further improve the development experience.

Until then, esbuild with full rebuilds provides a solid foundation
that works smoothly for most projects.

## ⚙️ Custom Development Middleware

Your `api/app.ts` file can export two optional functions that customize development behavior.
Both are commented out by default - uncomment and adapt them as needed.

### DevMiddlewareFactory

This function lets you customize how requests are routed between your API handler and Vite's dev server:

```ts
/**
 * In dev mode, determines whether to pass the request to API handler or to Vite.
 */
export const devMiddlewareFactory: import("@kosmojs/api").DevMiddlewareFactory = (
  app,
) => {
  return (req, res, next) => {
    return req.url?.startsWith("...")
      ? app?.callback()(req, res) // send request to api handler
      : next(); // send request to vite dev server
  };
};
```

By default, `KosmoJS` routes requests based on your `apiurl` configuration.
If you need more sophisticated routing logic-perhaps certain paths should bypass the API entirely,
or you want to handle WebSocket connections differently-you can implement custom logic here.

### TeardownHandler

This function runs before the API handler reloads during development:

```ts
/**
 * In dev mode, used to cleanup before reloading api handler.
 */
export const teardownHandler: import("@kosmojs/api").TeardownHandler = () => {
  // close db connections, server sockets etc.
};
```

Use this to clean up resources that shouldn't persist across rebuilds - close database connections,
shut down WebSocket servers, clear timers, or release any other resources that would otherwise leak.

Without proper cleanup, repeated rebuilds during development can leave orphaned connections or processes that consume resources.
The teardown handler ensures a clean slate before each reload.

**Example usage:**

```ts
let dbConnection;

export const teardownHandler = async () => {
  if (dbConnection) {
    await dbConnection.close();
    dbConnection = null;
  }
};
```

This pattern prevents database connection exhaustion during active development with frequent rebuilds.

## 👀 Inspecting Routes

During development, you may want to inspect which routes are being registered,
what middleware applies to them, and which handlers they use.

`KosmoJS` provides debugging information for every route through the `routeStackBuilder`.

### Debug Information

Each route returned by `routeStackBuilder` includes a `debug` property with formatted output:

```ts
export type RouterRoute = {
  name: string;
  path: string;
  file: string;
  methods: Array<string>;
  middleware: Array<RouterMiddleware>;
  debug: { // [!code focus:7]
    headline: string;   // Route name and path
    methods: string;    // HTTP methods
    middleware: string; // Middleware chain
    handler: string;    // Handler function
    full: string;       // Complete route info
  };
};
```

### Inspecting Routes

The `routeStackBuilder` is lightweight and can be called anywhere without adding overhead -
import it wherever you need route information.

**The easiest way** - modify the default `@src/api/router.ts` by adding debugging.

You can add it directly and remember to remove it before production builds,
or read `process.env.DEBUG` to display only when needed:

```ts [api/router.ts]
import { routeStackBuilder } from "@src/{api}";
import createRouter from "@/core/api/router";

const router = createRouter();

const DEBUG = // [!code ++:3]
  process.env.DEBUG?.match(/(?<=\bapi(?:\+[^+]+)*\+)[^+]+/g) ||
  /\bapi\b/i.test(process.env.DEBUG ?? "");

for (const { name, path, methods, middleware, debug } of routeStackBuilder()) {
  if (DEBUG === true) { // [!code ++:7]
    // Debug all routes when DEBUG=api
    console.log(debug.full);
  } else if (Array.isArray(DEBUG) && DEBUG.some((e) => name.includes(e))) {
    // Debug specific route when DEBUG=api+a+b+c
    console.log(debug.full);
  }
  router.register(path, methods, middleware, { name });
}

export default router;
```

This way you can run:
- `DEBUG=api pnpm dev` - to see all routes
- `DEBUG=api+user pnpm dev` - to see only routes containing "user"
- `DEBUG=api+user+blog pnpm dev` - to see only routes containing "user" or "blog"

Or call it from anywhere else in your codebase - a debugging script, test file, or development utility:

```ts
import { routeStackBuilder } from "@src/{api}";

// Inspect routes from anywhere
const routes = routeStackBuilder();
routes.forEach(route => {
  console.log(route.debug.headline);
});
```

The `debug.full` property displays complete route information. Here's example output:

```txt
 /api/users  [ users/index.ts ]
   methods: POST
middleware: slot: params; exec: useParams
            slot: validateParams; exec: useValidateParams
            slot: bodyparser; exec: async (ctx, next) => {
            slot: payload; exec: (ctx, next) => {
   handler: postHandler
```

Named functions like `postHandler` show their function name.
Anonymous functions show their first line only, like `(ctx, next) => {`.

**Tip:** Name your middleware functions to make debug output clearer.
Instead of anonymous functions like `(ctx, next) => {...}`,
use named functions like `validateAuth` or `logRequest` -
they'll show up by name in the debug output, making it easier to trace what's happening.

### Selective Debugging

For terser output, use individual debug properties instead of `full`:

```ts
// Just the route headline
console.log(debug.headline);

// Headline with methods
console.log(debug.headline);
console.log(debug.methods);

// Middleware chain and handler
console.log(debug.middleware);
console.log(debug.handler);
```

This is useful when you only need specific information,
such as verifying middleware ordering or checking which methods a route supports.

## 💡 Development Best Practices

**Use the stability threshold** setting if you're experiencing unnecessary rebuilds from your editor's save behavior:

```ts
// vite.config.ts
export default {
  server: {
    watch: {
      awaitWriteFinish: {
        stabilityThreshold: 1500, // Wait 1.5 seconds
      },
    },
  },
}
```

**Structure API code to minimize rebuild impact.** Keep expensive initialization
(database connections, external service clients) in functions called lazily rather than at module scope.
Use the teardown handler to clean up resources properly.

## ⚠️ Troubleshooting

**Port already in use?**
Check your source folder's `vite.config.ts` and change the port:

```ts
export default {
  server: {
    port: 4005, // Use different port
  },
}
```

**API not rebuilding?**
Check the `Vite` terminal output for build errors. The file watcher might be detecting changes but the build is failing.

**Slow rebuilds?**
Consider whether your API surface can be split across multiple source folders.
Each source folder builds independently, so splitting can reduce rebuild size.
