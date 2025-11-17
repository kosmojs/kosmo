---
title: Getting Started
description: Get started with KosmoJS in minutes. Create a new Vite project with multiple source folders, set up directory-based routing, and configure your frontend framework of choice.
head:
  - - meta
    - name: keywords
      content: vite setup, typescript project setup, create vite app, multi-folder vite, koa api setup, solidjs setup, react setup, typescript path mapping, vite dev server
---

**Starting your `KosmoJS` journey is a breeze!** ✨

Begin your project with a solid foundation. `KosmoJS` provides a structured
yet flexible starting point designed for real-world applications with multiple concerns.

In just a few commands, you'll have a fully-configured `Vite` project ready to scale with your application's needs.

## 1. Create a new `KosmoJS` project:

::: code-group
```sh [pnpm]
pnpm dlx kosmojs app # or any name for your project
```

```sh [npm]
npx kosmojs app # or any name for your project
```

```sh [yarn]
yarn dlx kosmojs app # or any name for your project
```
:::

After the project is created, navigate to your app directory:

```sh
cd ./app
```

All subsequent operations run from inside this directory.

## 2. Install dependencies

Use your favorite package manager:

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

## 3. Create a source folder

Unlike standard `Vite` templates, `KosmoJS` doesn't create a source folder automatically.
Instead, you create source folders as needed, each organized around a specific concern
(e.g., marketing site, admin panel, customer app).

To create a new source folder, simply run:

```sh
pnpm +folder
# or npm run +folder / yarn +folder
```

You'll be prompted to configure:

- **Folder name** (required) - Name for your source folder (e.g., `@front`, `@admin`)
- **Base URL** - Where this folder serves from (default: `/`)
- **Dev server port** - Port number for development (default: `4000`)
- **Frontend framework** - SolidJS, React, Vue (and Svelte coming soon)
- **Server-side rendering (SSR)** - Enable SSR (disabled by default)

The source folder may have added new dependencies. Run the package manager again:

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

## 4. Start the Dev Server

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

Each source folder runs on its own port with its own base URL.

## 5. Enjoy the Breeze!

Create pages by adding `index.*` files to the `pages/` directory.
Build API routes by adding `index.ts` files to the `api/` directory.

[Learn more about routing →](/routing/intro.html)

`KosmoJS` provides structure, not constraints. Your project, your rules!

## 🏗️ Multiple Source Folders

The power of `KosmoJS`'s structure becomes clear when you need to organize a larger application.
Consider a SaaS product with a marketing site, customer-facing app, and admin dashboard.
Instead of cramming these into a single source directory, create separate source folders:

```bash
pnpm +folder
# folder name: @admin
# baseurl: /admin
# port: 4001
```

```bash
pnpm +folder
# folder name: @marketing
# baseurl: /
# port: 4002
```

Each source folder is independent. It has its own base URL so routes are automatically prefixed correctly.

It runs on its own port during development so you can run multiple folders simultaneously.

It can use a different frontend framework if that makes sense for its specific needs.

It has its own `vite.config.ts` for independent configuration.

Most importantly, each folder's code is completely encapsulated in its own `api` and `pages` directories.

This isn't just organizational convenience. As your application grows,
this structure prevents the tangling of concerns that makes codebases difficult to maintain.

You're not working around limitations of your build tool -
you're working with a structure designed for this pattern from the beginning.

## 📂 Project Structure Example

Here's what a complete `KosmoJS` project looks like with multiple source folders:

```
my-app/
├── @front/
│   ├── config/
│   ├── api/
│   │   ├── index/
│   │   │   └── index.ts
│   │   └── users/
│   │       └── [id]/
│   │           └── index.ts
│   ├── pages/
│   │   ├── index/
│   │   │   └── index.ts
│   │   └── users/
│   │       └── [id]/
│   │           └── index.ts
│   └── vite.config.ts
├── @admin/
│   ├── config/
│   ├── api/
│   ├── pages/
│   └── vite.config.ts
├── lib/
│   ├── @front/
│   └── @admin/
└── package.json
├── tsconfig.json
└── vite.base.ts
```

The `lib` directory contains generated code that `KosmoJS` maintains for you -
type definitions and helpers based on your route structure. You don't edit these files directly.

Your actual code lives in the source folders (`@front`, `@admin`),
and the `TypeScript` path mappings make everything import cleanly.

## 📝 TypeScript Path Mapping

When you create a source folder, `KosmoJS` automatically updates your `tsconfig.json` with path mappings:

```json [tsconfig.json]
{
  "compilerOptions": {
    "paths": {
      "@front/*": ["./@front/*", "./lib/@front/*"],
      "@/*": ["./*", "./lib/*"]
    }
  }
}
```

Each mapping points to two locations. The first is your source folder where you write code.
The second is the `lib` directory where `KosmoJS` places generated `TypeScript` types and helper functions.

This separation keeps your source directories clean -
you focus on writing business logic while generated artifacts live elsewhere.

With these mappings, you can import from both your code and generated types using the same clean syntax:

```ts
// Generated route helper from lib
import { defineRoute } from "@front/{api}/users/[id]";

// Your own utility code
import { validateUser } from "@front/api/utils";
```

