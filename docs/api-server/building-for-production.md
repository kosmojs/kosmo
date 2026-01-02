---
title: Building for Production
description: Build and deploy KosmoJS applications to production with independent source folder builds,
    esbuild configuration, deployment strategies for containers, serverless, and edge runtimes.
head:
  - - meta
    - name: keywords
      content: vite build, production deployment, esbuild configuration, docker deployment,
        serverless api, edge runtime, nodejs deployment, api bundling, source maps
---

Each source folder in `KosmoJS` builds independently,
producing deployment-ready output for that specific concern.

## ▶️ Build Command

Build all source folders for production:

```sh
pnpm build
```

Build a specific source folder for production:

```sh
pnpm build front
```

Replace `front` with your source folder name (`admin`, `app`, etc.).

## 📦 What Gets Built

When you run `pnpm build`, `KosmoJS` produces:

**Frontend assets:**
- Optimized, bundled client code
- CSS, images, and other static assets
- Chunked and tree-shaken for minimal size

**API server:**
- Bundled Node.js server at `dist/SOURCE_FOLDER/api/server.js`
- App factory at `dist/SOURCE_FOLDER/api/app.js` - for custom deployments.
- All routes, middleware, and dependencies bundled together
- Ready to run with Node.js

**SSR Bundle:**

When [SSR is enabled](/generators/solid/server-side-render#🛠%EF%B8%8F-enabling-ssr),
the build process also generates a production-ready SSR bundle at
`dist/SOURCE_FOLDER/ssr/server.js`. This standalone Node.js server is ready
to deploy for server-side rendering.

## 📂 Build Output Structure

```txt [# tree -L3 dist]
dist/
└── front
    ├── api
    │   ├── app.js       # App factory
    │   └── server.js    # Bundled API server
    ├── client
    │   ├── assets/      # Scripts, Styles, Images etc.
    │   └── index.html   # Entry point
    └── ssr
        ├── app.js       # App factory (built by Vite for SSR)
        └── server.js    # SSR Bundle
```

## 🚀 Running the Production Build

### Using the Built-in Server

Deploy the `dist/SOURCE_FOLDER` directory and run:

```bash
node dist/front/api/server.js
```

The API server is a standalone Node.js ESM module ready to run immediately.

### Custom Deployment with App Factory

For more control over deployment, use the app factory at `dist/*/api/app.js`:

```js
import createApp from "./dist/front/api/app.js";

const app = createApp();

// Run on any server that supports Koa
app.listen(3000);
```

The app factory returns a Koa application instance, giving you full flexibility:

**Node.js:**
```js
import createApp from "./dist/front/api/app.js";
import http from "node:http";

const app = createApp();
const server = http.createServer(app.callback());
server.listen(3000);
```

**Deno:**
```ts
import createApp from "./dist/front/api/app.js";

const app = createApp();
Deno.serve({ port: 3000 }, app.callback());
```

**Bun:**
```ts
import createApp from "./dist/front/api/app.js";

const app = createApp();
Bun.serve({
  port: 3000,
  fetch: app.callback(),
});
```

This pattern is particularly useful for:
- Custom server initialization logic
- Integration with existing Node.js applications
- Deployment to runtimes with specific server requirements
- Adding middleware at the server level (compression, helmet, etc.)

The bundled output works on any environment that supports Koa -
traditional servers, containers, serverless platforms, or edge runtimes.


## 🏗️ Building Multiple Source Folders

You can build all folders at once by simply omitting the source folder name:

```sh
pnpm build
```

This builds all your source folders in parallel, placing assets in the `dist` directory.

## ⚙️ Build Configuration

API builds use the `esbuild.json` configuration at your project root:

```json
{
  "bundle": true,
  "platform": "node",
  "target": "node22",
  "format": "esm",
  "packages": "external",
  "sourcemap": "linked",
  "logLevel": "info"
}
```

**Customization options:**
- `target` - Node.js version (e.g., `node20`, `node22`)
- `sourcemap` - Source map type (`linked`, `inline`, `false`)
- `logLevel` - Build verbosity (`info`, `warning`, `error`, `silent`)

**Important:** The `bundle: true` option is enforced for production builds,
ensuring your API is bundled into a single executable file.

## 💡 Best Practices

**Test builds locally** before deploying:

```bash
pnpm build
node dist/SOURCE_FOLDER/api/server.js -p 3000
# Test at localhost:3000
```

**Use environment variables** for configuration:
- Database connection strings
- API keys and secrets
- Feature flags
- Service endpoints

Never hardcode credentials in your source code.

**Enable source maps for debugging** in production:

```json
{
  "sourcemap": "linked"
}
```

Source maps help debug production errors but increase bundle size slightly. Consider the tradeoff for your use case.

**Review bundle size** periodically:

```sh
pnpm build
# Check dist/SOURCE_FOLDER/api/server.js size
```

If the bundle grows significantly, review dependencies and consider marking some as external.

## ⚠️ Troubleshooting

**Build fails?**
- Check `esbuild.json` syntax
- Verify all imports are resolvable
- Review build terminal output for errors

**API crashes on startup?**
- Verify environment variables are set
- Check Node.js version matches `target` in `esbuild.json`
- Test database/service connections
