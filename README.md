## KosmoJS - the composable meta-framework

Multiple source folders. Directory-based routing.
Cascading middleware. Nested layouts.
End-to-end validation. Fetch clients. OpenAPI spec.
Koa, Hono, SolidJS, React, Vue and more.

📘 [Documentation ➜ kosmojs.dev](https://kosmojs.dev)

## 🎯 What is KosmoJS?

A **meta-framework** that gives your `Vite` project a scalable shape:

- Multiple **source folders** for distinct areas (website, admin dashboard, API)
- Each folder splits into **`api/` and `pages/`** - clean boundary between server and client
- **Generators** that produce validation schemas, fetch clients, and `OpenAPI` specs from your types

Named after the Greek "Kosmos" (κόσμος) - "order" or "world".

📘 [Learn more](https://kosmojs.dev/about.html)

## 🚀 Getting Started

### 1. Create a new `KosmoJS` project:

```sh
npm create kosmo
# or `pnpm create kosmo` / `yarn create kosmo`
```

After the project is created, navigate to your app directory:

```sh
cd ./my-app
```

All subsequent operations run from inside this directory.

### 2. Install dependencies

Use your favorite package manager:

```sh
npm install
# or `pnpm install` / `yarn install`
```

### 3. Create a source folder

```sh
npm run +folder
# or `pnpm +folder` / `yarn +folder`
```

The source folder may have added new dependencies. Run the package manager again:

```sh
npm install
# or `pnpm install` / `yarn install`
```

### 4. Start the dev server

```sh
npm run dev
# or `pnpm dev` / `yarn dev`
```

Each source folder runs its own set of frameworks with its own base URL, config etc.

📘 [Learn more](https://kosmojs.dev/start.html)

## ✨ Features

- **🗂️ Multiple Source Folders** - organize distinct concerns (public site, customer app, admin dashboard) as independent source folders within a single Vite project.

- **🛣️ Directory-Based Routing** - folder structure defines routes for both API and pages. Dynamic parameters: `[id]` required · `{id}` optional · `{...path}` splat. Mixed segments supported for backend routes.

- **🪆 Nested Layouts** - frontend pages support nested layout components that wrap child routes, letting you compose shared UI (nav, sidebars, auth shells) at any level of the route hierarchy.

- **⚡ Power Syntax for Params** - use raw [path-to-regexp v8](https://github.com/pillarjs/path-to-regexp) patterns directly in folder names for precise URL control beyond standard named parameters.

- **🛡️ End-to-End Type Safety** - write `TypeScript` types once, get runtime validation automatically. Same definition drives compile-time checking, runtime validation, and API docs.

- **🔗 Generated Fetch Clients + OpenAPI** - fully-typed fetch clients with client-side validation and an OpenAPI 3.1 spec, both derived from the same type definitions.

- **🎛️ Composable Middleware (Slots)** - override global middleware per-route or per-subtree using named slots. Replace only what needs replacing, inherit everything else.

- **🌊 Cascading Middleware** - place a `use.ts` in any folder and its middleware automatically wraps all routes in that folder and its subfolders. No imports or wiring needed.

- **🎨 Multiple Frameworks** - `Koa` or `Hono` for backend, `React`, `Vue`, or `SolidJS` for frontend. Different source folders can use different combinations.

- **🔧 Built on Proven Tools** - `Koa`/`Hono` · `React`/`Vue`/`Solid` · `Vite` · `TypeScript`. No proprietary abstractions.

📘 [Learn more](https://kosmojs.dev/features.html)

---

## 🛠️ Contributing

Contributions are welcome!
Check out the [issues](https://github.com/kosmojs/kosmo/issues) and submit PRs.
Please follow the project's coding style and include tests when possible.

---

## 📄 License

[MIT](https://github.com/kosmojs/kosmo/blob/main/LICENSE)
