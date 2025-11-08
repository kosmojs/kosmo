# @kosmojs/ssr-generator

Adds Server-Side Rendering capabilities to `KosmoJS` applications,
generating server entry points and production-ready SSR bundles for any SSR-capable framework.

## Installation

```sh
npm install -D @kosmojs/ssr-generator
```

```sh
pnpm install -D @kosmojs/ssr-generator
```

```sh
yarn add -D @kosmojs/ssr-generator
```

## Usage

Add to your source folder's `vite.config.ts`:

**SolidJS Example:**

```ts [vite.config.ts]
import solidPlugin from "vite-plugin-solid";
import devPlugin from "@kosmojs/dev";
import solidGenerator from "@kosmojs/solid-generator";
import ssrGenerator from "@kosmojs/ssr-generator";

export default {
  plugins: [
    solidPlugin({ ssr: true }), // Enable SSR
    devPlugin(apiurl, {
      generators: [
        solidGenerator(),
        ssrGenerator(),
        // other generators...
      ],
    }),
  ],
}
```

Works with any SSR-capable framework supported by Vite.

## What It Generates

- **Server entry point** (`entry/server.ts`) - Factory function for SSR rendering
- **SSR bundle** - Production-ready Node.js server in `dist/ssr/`
- **Hydration flag** (`shouldHydrate`) - Automatic CSR/SSR switching

## Features

- 🎯 String rendering (`renderToString`) - Simple, synchronous SSR
- 🌊 Stream rendering (`renderToStream`) - Progressive HTML delivery
- ⚡ Development unchanged - CSR during dev, SSR in production
- 🚀 Production ready - Standalone Node.js server
- 🔧 Flexible deployment - Port or Unix socket support
- 🌐 Framework agnostic - Works with any SSR-capable framework

## Running SSR Build

```sh
# Build for production
pnpm build @front

# Test locally
node dist/@front/ssr -p 4000
```

## Documentation

- [SolidJS SSR](https://kosmojs.dev/generators/solid/server-side-render.html)
- [React SSR](https://kosmojs.dev/generators/react/server-side-render.html)

## License

MIT

