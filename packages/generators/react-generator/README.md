# @kosmojs/react-generator

Bridges KosmoJS directory-based routing with React Router, automatically generating route configurations,
type-safe navigation components, and loader integration.

## Installation

```sh
npm install -D @kosmojs/react-generator
```

```sh
pnpm install -D @kosmojs/react-generator
```

```sh
yarn add -D @kosmojs/react-generator
```

## Usage

Add to your source folder's `vite.config.ts`:

```ts
import reactPlugin from "@vitejs/plugin-react";
import devPlugin from "@kosmojs/dev";
import reactGenerator from "@kosmojs/react-generator";

export default {
  plugins: [
    reactPlugin(),
    devPlugin(apiurl, {
      generators: [
        reactGenerator(),
        // other generators...
      ],
    }),
  ],
}
```

## What It Generates

- **Router configuration** - React Router setup with lazy-loaded routes
- **Type-safe Link component** - Navigation with autocomplete and compile-time checks
- **Loader integration** - Automatic loader function detection and execution
- **Application structure** - App.tsx, router.tsx, and entry points with Suspense
- **Route definitions** - Complete route mapping from `pages` directory

## Features

- 🔄 Watch-based route generation
- 🎯 End-to-end type safety
- ⚡ Code splitting with lazy loading
- 🔗 Type-safe Link with parameter validation
- 📦 React Router v6+ integration
- 🎨 Custom template support via glob patterns

## Documentation

Complete documentation: [kosmojs.dev](https://kosmojs.dev/generators/react/intro.html)

## License

MIT
