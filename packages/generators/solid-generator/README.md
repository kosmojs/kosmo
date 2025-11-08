# @kosmojs/solid-generator

Integrates KosmoJS directory-based routing with SolidJS, automatically generating routing configuration,
type-safe navigation helpers, and data fetching utilities.

## Installation

```sh
npm install -D @kosmojs/solid-generator
```

```sh
pnpm install -D @kosmojs/solid-generator
```

```sh
yarn add -D @kosmojs/solid-generator
```

## Usage

Add to your source folder's `vite.config.ts`:

```ts
import solidPlugin from "vite-plugin-solid";
import devPlugin from "@kosmojs/dev";
import solidGenerator from "@kosmojs/solid-generator";

export default {
  plugins: [
    solidPlugin(),
    devPlugin(apiurl, {
      generators: [
        solidGenerator(),
        // other generators...
      ],
    }),
  ],
}
```

## What It Generates

- **Router configuration** - Lazy-loaded routes from your `pages` directory
- **Type-safe Link component** - Navigation with autocomplete and parameter validation
- **useResource hook** - Typed data fetching with automatic refetching
- **Preload utilities** - Route data prefetching integration
- **Application structure** - App.tsx, router.tsx, and entry points

## Features

- 🔄 Automatic route generation from filesystem
- 🎯 Full TypeScript type safety
- ⚡ Lazy-loaded components by default
- 🔗 Type-safe navigation with Link component
- 📦 Integration with SolidJS Router
- 🎨 Custom template support for specific routes

## Documentation

Complete documentation: [kosmojs.dev](https://kosmojs.dev/generators/solid/intro.html)

## License

MIT
