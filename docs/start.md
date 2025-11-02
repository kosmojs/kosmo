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

In just a few commands, you'll have a fully-configured Vite project ready to scale with your application's needs.

## 1: Create Application

Run the following command to create a new `KosmoJS` application:

```bash
npx kosmojs
```

You'll be asked for an app name (required) and a dist directory (optional, defaults to `.dist`).
This creates a folder with your app name containing a Vite project ready for multiple source folders.

## 2: Create a Source Folder

Unlike standard Vite templates, `KosmoJS` doesn't create a source folder immediately.
Instead, it gives you the tools to create as many source folders as your application needs,
each organized around a specific concern.

Navigate to your application directory and run `npx kosmojs` again:

```bash
cd ./your-app-name
npx kosmojs
```

You'll configure following things:

🔹 The folder name - required and determines what your source folder will be called (use `@` prefix like `@front` for cleaner imports).

🔹 The Frontend Framework - SolidJS / React for now, Vue / Svelte (and perhaps anothers) coming soon

🔹 The base URL - optional and defaults to `/`, determining where this folder's routes will be served.

🔹 The port - optional and defaults to `4000`, setting where the dev server runs for this folder.

## 3: Install Dependencies

Use your favorite package manager:

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

## 4: Start the Dev Server

Use `dev` task with source folder name, for example:

::: code-group

```sh [npm]
npm run dev @front
```

```sh [pnpm]
pnpm dev @front
```

```sh [yarn]
yarn dev @front
```
:::

Each source folder runs on its own port and must be started with a separate command.

## 🏗️ Multiple Source Folders

The power of `KosmoJS`'s structure becomes clear when you need to organize a larger application.
Consider a SaaS product with a marketing site, customer-facing app, and admin dashboard.
Instead of cramming these into a single source directory, create separate source folders:

```bash
npx kosmojs
# folder name: @admin
# baseurl: /admin
# port: 4001
```

```bash
npx kosmojs
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

You're not working around limitations of your build tool —
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

The `lib` directory contains generated code that `KosmoJS` maintains for you
— type definitions and helpers based on your route structure.
You don't edit these files directly.

Your actual code lives in the source folders (`@front`, `@admin`),
and the TypeScript path mappings make everything import cleanly.

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
The second is the `lib` directory where `KosmoJS` places generated TypeScript types and helper functions.

This separation keeps your source directories clean —
you focus on writing business logic while generated artifacts live elsewhere.

With these mappings, you can import from both your code and generated types using the same clean syntax:

```ts
// Generated route helper from lib
import { defineRoute } from "@front/{api}/users/[id]";

// Your own utility code
import { validateUser } from "@front/api/utils";
```

