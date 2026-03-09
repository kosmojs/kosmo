# KosmoJS

### A Vite-based full‑stack meta‑framework for type‑safe apps

Multiple source folders. Directory-based nested routing. Runtime end-to-end validation.
Generated fetch clients, OpenAPI spec. Koa, Hono, SolidJS, React, Vue and more.

📘 [Documentation ➜ kosmojs.dev](https://kosmojs.dev)

## 🎯 What is KosmoJS?

It's a **meta-framework** that gives your `Vite` project a scalable shape:

* Multiple **source folders** for distinct areas (website, admin dashboard, API).
* Each folder splits into **`api/` and `pages/`**, creating a clean boundary between server and client.
* **Generators** that produce validation schemas, fetch clients, and `OpenAPI` specs from your types.

`KosmoJS` is named after the Greek "Kosmos" (κόσμος), meaning "order" or "world",
reflecting the focus on organized, structured project architecture.

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

Each source folder runs on its own port with its own base URL.

📘 [Learn more](https://kosmojs.dev/start.html)

## ✨ Features

* **🗂️ Multiple Source Folders**<br>
    Organize distinct concerns - public site, customer app, admin dashboard - all connected in one Vite project.

* **🛣️ Directory-Based Nested Routing**<br>
    Your folder structure defines your routes. Works identically for both API endpoints and client pages.

* **🛡️ End-to-End Type Safety**<br>
    Write `TypeScript` types once, get runtime validation automatically. No separate schemas to maintain.

* **🔗 Generated Fetch Clients + OpenAPI spec**<br>
    Fully-typed fetch clients with client-side validation. Invalid requests never reach your server.

* **🎨 Multiple Frameworks**<br>
    Currently supports `Koa` / `Hono` for backend, `SolidJS` / `React` / `Vue` for frontend.
    Additional frameworks may be added based on community interest.

* **🔧 Built on Proven Tools**<br>
    No proprietary abstractions, just the tools you already know (or easy to learn).

📘 [Learn more](https://kosmojs.dev/features.html)

## 🧭 Example Use Cases

* Monorepo-like projects where frontend and API must live side by side.
* Teams needing **strong typing and runtime validation** without duplicating schemas.
* Developers who want **framework freedom** while keeping consistent structure.
* Projects that must scale from prototype to production with a deterministic structure.

## 🛠️ Contributing

Contributions are welcome!
Check out the [issues](https://github.com/kosmojs/kosmo/issues) and submit PRs.
Please follow the project's coding style and include tests when possible.

---

## 📄 License

[MIT](https://github.com/kosmojs/kosmo/blob/main/LICENSE)
