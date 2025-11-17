# @kosmojs/vue-generator

Integrates KosmoJS directory-based routing with Vue,
automatically generating routing configuration,
type-safe navigation helpers, and data fetching utilities.

## Installation

```sh
pnpm install -D @kosmojs/vue-generator
```

## Usage

Add to your source folder's `vite.config.ts`:

```ts
import vuePlugin from "@vitejs/plugin-vue";
import devPlugin from "@kosmojs/dev";
import vueGenerator from "@kosmojs/vue-generator";

export default {
  plugins: [
    vuePlugin(),
    devPlugin(apiurl, {
      generators: [
        vueGenerator(),
        // other generators...
      ],
    }),
  ],
}
```

## What It Generates

- **Router configuration** - Lazy-loaded routes from your `pages` directory
- **Type-safe Link component** - Navigation with autocomplete and parameter validation
- **Application structure** - App.vue, router.ts, and entry points

## Features

- 🔄 Automatic route generation from filesystem
- 🎯 Full TypeScript type safety
- ⚡ Lazy-loaded components by default
- 🔗 Type-safe navigation with Link component
- 📦 Integration with Vue Router
- 🎨 Custom template support for specific routes

## Documentation

Complete documentation: [kosmojs.dev](https://kosmojs.dev/generators/vue/intro.html)

## License

MIT
