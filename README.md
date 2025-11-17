# KosmoJS

### Structured Vite template for type-safe full-stack apps

Multiple source folders. Directory-based routing. Runtime validation.
Generated fetch clients. Any framework.

📘 [Documentation → kosmojs.dev](https://kosmojs.dev)

---

## 🎯 What is `KosmoJS`?

It's a **structured Vite template** that gives your `Vite` project a scalable shape:

* Multiple **source folders** for distinct areas (website, admin dashboard, API).
* Each folder splits into **`api/` and `pages/`**, creating a clean boundary between server and client.
* **Generators** that produce validation schemas, fetch clients, and OpenAPI specs from your `TypeScript` types.
* **Framework freedom** - works with `SolidJS`, `React`, `Vue`, `Svelte`, or anything `Vite` supports.

📘 [Learn more](https://kosmojs.dev/about)

---

## 🚀 Getting Started

### 1. Create a new `KosmoJS` project:

```sh
pnpm dlx kosmojs app # or any name for your project
# or `npx kosmojs app` / `yarn dlx kosmojs app`
```

After the project is created, navigate to your app directory:

```sh
cd ./app
```

All subsequent operations run from inside this directory.

### 2. Install dependencies

Use your favorite package manager:

```sh
pnpm install
# or `npm install` / `yarn install`
```

### 3. Create a source folder

```sh
pnpm +folder
# or `npm run +folder` / `yarn +folder`
```

The source folder may have added new dependencies. Run the package manager again:

```sh
pnpm install
# or `npm install` / `yarn install`
```

### 4. Start the dev server

```sh
pnpm dev
# or `npm run dev` / `yarn dev`
```

Each source folder runs on its own port with its own base URL.

📘 [Learn more](https://kosmojs.dev/start)

---

## ✨ Features

* **🗂️ Multiple Source Folders**<br>
    Organize distinct concerns - public site, customer app, admin dashboard - all connected in one Vite project.

* **🛣️ Directory-Based Routing**<br>
    Your folder structure defines your routes. Works identically for both API endpoints and client pages

* **🛡️ End-to-End Type Safety**<br>
    Write `TypeScript` types once, get runtime validation automatically. No separate schemas to maintain.

* **🔗 Generated Fetch Clients + OpenAPI spec**<br>
    Fully-typed fetch clients with client-side validation. Invalid requests never reach your server.

* **🎨 Framework Freedom**<br>
    Use any frontend framework - `SolidJS`, `React`, `Vue`, `Svelte`, or none.

* **🔧 Built on Proven Tools**<br>
    `Koa` for APIs, `Vite` for frontend, `TypeScript` for safety. No proprietary abstractions.

📘 [Learn more](https://kosmojs.dev/features)

---

## 🧭 Example Use Cases

* Monorepo-like projects where frontend and API must live side by side.
* Teams needing **strong typing and runtime validation** without duplicating schemas.
* Developers who want **framework freedom** while keeping consistent structure.
* Projects that must scale from prototype → production with a deterministic structure.

---

## 🛠️ Contributing

Contributions are welcome!
Check out the [issues](https://github.com/kosmojs/kosmo/issues) and submit PRs.
Please follow the project's coding style and include tests when possible.

---

## 📄 License

MIT © [Slee Woo](https://github.com/kosmojs/kosmo/blob/main/LICENSE)

