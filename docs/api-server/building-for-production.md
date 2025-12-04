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
pnpm build @front
```

Replace `@front` with your source folder name (`@admin`, `@marketing`, etc.).

## 📦 What Gets Built

When you run `pnpm build`, `KosmoJS` produces:

**Frontend assets:**
- Optimized, bundled client code
- CSS, images, and other static assets
- Chunked and tree-shaken for minimal size

**API server:**
- Bundled Node.js application at `dist/SOURCE_FOLDER/api/index.js`
- All routes, middleware, and dependencies bundled together
- Ready to run with Node.js

**SSR Bundle:**

When [SSR is enabled](/generators/solid/server-side-render#🛠%EF%B8%8F-enabling-ssr),
the build process also generates a production-ready SSR bundle at
`dist/SOURCE_FOLDER/ssr/index.js`. This standalone Node.js server is ready
to deploy for server-side rendering.

## 📂 Build Output Structure

```txt [# tree -L3 dist]
dist/
└── @src
    ├── api
    │   └── index.js     # Bundled API server
    ├── client
    │   ├── assets/      # Scripts, Styles, Images etc.
    │   └── index.html   # Entry point
    └── ssr
        └── index.js     # SSR Bundle (if enabled)
```

## 🚀 Running the Production Build

Deploy the `dist/SOURCE_FOLDER` directory and run:

```bash
node dist/@front/api/index.js
```

The API server is a standard Node.js ESM module. Deploy it to any Node.js environment -
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

**Important:** The `bundle: true` option is enforced for production builds, ensuring your API is bundled into a single executable file.

## 🌐 Deployment Strategies

### Independent Deployment

Deploy each source folder to its own environment:

```sh
# Deploy customer app
pnpm build @front
deploy dist/@front 🢂 app.example.com

# Deploy admin panel
pnpm build @admin
deploy dist/@admin 🢂 admin.example.com
```

**Benefits:**
- Scale concerns independently
- Deploy updates without rebuilding everything
- Different teams can own different deployments

### Unified Deployment

Deploy all source folders to the same server with different base URLs:

```sh
# Build everything
pnpm build

# Deploy to single server
deploy dist/ 🢂 example.com
```

Configure nginx/caddy to route:
- `/` 🢂 `@front` assets
- `/admin` 🢂 `@admin` assets
- `/api` 🢂 API server

### Deployment Environments

The bundled output works on:

- ✅ **Traditional servers** - VPS, dedicated servers
- ✅ **Containers** - Docker, Kubernetes
- ✅ **Serverless** - AWS Lambda, Google Cloud Functions (with adapter)
- ✅ **Edge runtimes** - Cloudflare Workers, Deno Deploy (with adapter)
- ✅ **PaaS** - Heroku, Railway, Render

The standard Node.js output ensures portability across platforms.

## 💡 Production Best Practices

**Test builds locally** before deploying:

```bash
pnpm build
node dist/SOURCE_FOLDER/api/index.js -p 3000
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
# Check dist/SOURCE_FOLDER/api/index.js size
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

