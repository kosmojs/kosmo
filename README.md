<p align="center">
  <img src="https://kosmojs.dev/kosmo-mark.png" width="96" alt="KosmoJS">
</p>
<h1 align="center">KosmoJS</h1>
<h3 align="center">the composable meta-framework</h3>

---

**KosmoJS composes several apps in a scalable codebase, offering both consistency and flexibility.**

### Notable Features

- [Multiple source folders](https://kosmojs.dev/about.html)
- [Directory-based routing](https://kosmojs.dev/routing/rationale.html)
- [Cascading middleware](https://kosmojs.dev/backend/cascading-middleware.html)
- [Nested layouts](https://kosmojs.dev/frontend/layouts.html)
- [End-to-end validation](https://kosmojs.dev/validation/intro.html)
- [Typed, isomorphic fetch clients](https://kosmojs.dev/fetch/intro.html)
- [Streaming SSR](https://kosmojs.dev/frontend/server-side-render.html)
- [OpenAPI spec](https://kosmojs.dev/openapi.html)

### Supported frameworks
- Hono
- H3
- Koa
- React
- Vue
- SolidJS
- Svelte
- MDX

...more to come

📘 [Documentation: kosmojs.dev](https://kosmojs.dev)

## 🎯 What is KosmoJS?

A **meta-framework** that gives your `Vite` project a scalable shape:

- Multiple **source folders** for distinct areas (website, admin dashboard, API)
- Each folder splits into **`api/` and `pages/`** - clean boundary between server and client
- Unified routing patterns that work equally on backend and frontend
- End-to-end validation from TypeScript types alone - no schema language to learn

📘 [Learn more](https://kosmojs.dev/about.html)

## 🚀 Getting Started

### 1. Create a new `KosmoJS` project:

```sh
npm create kosmo my-app
# or `pnpm create kosmo my-app` / `yarn create kosmo my-app`
```

A short interactive setup asks for the frontend framework and the backend,
then creates the project **together with its first source folder** (named `app` at base `/` by default).

Use `.` as the name to bootstrap into the current folder:

```sh
npm create kosmo .
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

### 3. Start the dev server

```sh
npm run dev
# or `pnpm dev` / `yarn dev`
```

The dev server completes the setup - it generates the remaining project files,
wires everything together, and then watches your routes.

Your app is now running at `http://localhost:4556`.

### 4. Add more source folders as the project grows

```sh
npm run folder
# or `pnpm folder` / `yarn folder`
```

Each source folder runs its own set of frameworks with its own base URL, config etc.

A new source folder pulls in framework-specific dependencies, so run the package manager again:

```sh
npm install
# or `pnpm install` / `yarn install`
```

📘 [Learn more](https://kosmojs.dev/start.html)

## ✨ Features

- **Multiple Source Folders** - organize distinct concerns (public site, customer app, admin dashboard) as independent source folders within a single Vite project. Each has its own frameworks, base URL, dev workflow, and build.

- **Directory-Based Routing** - folder structure defines routes for both API and pages. Dynamic parameters: `[id]` required · `{id}` optional · `{...path}` splat. Mixed segments supported for backend routes.

- **End-to-End Type Safety** - write `TypeScript` types once, get runtime validation automatically. The same definition drives compile-time checking, runtime validation, type-safe fetch clients, and API docs.

- **Typed Fetch Clients + OpenAPI** - fully-typed fetch clients with client-side validation and an OpenAPI 3.1 spec, both derived from the same type definitions.

- **Isomorphic Fetch** - the same fetch client runs on server and client. During SSR the call dispatches to the API route in-process - no network hop - and the result is reused on hydration, not refetched.

- **Streaming SSR** - opt into streamed rendering per route to flush the shell early and improve Time-to-First-Byte. Each framework streams through its own native renderer; no rendering layer of KosmoJS's own.

- **Nested Layouts** - frontend pages support nested layout components that wrap child routes, letting you compose shared UI (nav, sidebars, auth shells) at any level of the route hierarchy.

- **Composable Middleware (Slots)** - override global middleware per-route or per-subtree using named slots. Replace only what needs replacing, inherit everything else.

- **Cascading Middleware** - place a `use.ts` in any folder and its middleware automatically wraps all routes in that folder and its subfolders. No imports or wiring needed.

- **TanStack Query Integration** - opt in per source folder and KosmoJS wires the query client for you (per-request on the server, singleton in the browser). Enabling it is one option; using it is just importing `useQuery`. Works across React, SolidJS, Vue, and Svelte.

- **Multiple Frameworks** - `Hono`, `H3`, `Koa` for backend; `React`, `Vue`, `SolidJS`, `Svelte`, `MDX` for frontend. Different source folders can use different combinations.

- **Built on Proven Tools** - no proprietary runtime, no custom bundler, no framework lock-in.

📘 [Learn more](https://kosmojs.dev/features.html)

---

## 🛠️ Contributing

Contributions are welcome!
Check out the [issues](https://github.com/kosmojs/kosmo/issues) and submit PRs.
Please follow the project's coding style and include tests when possible.

---

## 📄 License

[MIT](https://github.com/kosmojs/kosmo/blob/main/LICENSE)
