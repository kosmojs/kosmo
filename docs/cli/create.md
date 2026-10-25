---
title: create kosmo
description: Bootstrapping a KosmoJS project with npm create kosmo - the interactive flow, the flags, and what the new project contains.
head:
  - - meta
    - name: keywords
      content: create kosmo, npm create kosmo, scaffolding, --frontend, --backend, --overwrite
---

A KosmoJS project starts with the `create kosmo` command:

:::tabs key:pm variant:code
== npm
```sh
npm create kosmo
```

== pnpm
```sh
pnpm create kosmo
```

== yarn
```sh
yarn create kosmo
```
:::

Use `.` to bootstrap in the current directory:

```sh
npm create kosmo .
```

You'll be asked for:

* **Name** - the project name (unless `.` used to bootstrap in current directory)
* **Frontend** - React, Vue, Solid, Svelte, MDX, or *None (API-only folder)*
* **Backend** - Hono, H3, Koa, or *None (client-only folder)*

The first source folder is always **`app`**, with its pages at `/` and its API at `/api`.
<span class="text-nowrap">Add differently-shaped folders</span> at any time with [kosmo folder](/cli/folder).

If the target directory has anything in it other than `.git*`, `README*` or `LICENSE*`,
<span class="text-nowrap">you are asked first what to do with it:</span>

* Remove the existing files
* Keep them and overwrite as needed
* Cancel

## CLI mode

Provide up front the `--name` and `--frontend`/`--backend` (or `--no-frontend`/`--no-backend` counterparts)
and no prompts appear:

:::tabs key:pm variant:code
== npm
```sh
# npm needs an extra -- to pass flags through
npm create kosmo -- --name demo --frontend solid --backend hono
```

== pnpm
```sh
pnpm create kosmo --name demo --frontend solid --backend hono
```

== yarn
```sh
yarn create kosmo --name demo --frontend solid --backend hono
```
:::


| Flag | Meaning |
|---|---|
| `--name <name>` | Project name. Ignored when using `.` to bootstrap in current directory |
| `--frontend <stack>` | `react`, `solid`, `vue`, `svelte`, `mdx`. |
| `--no-frontend` | API-only folder - no `pages/`, no client entries. |
| `--backend <stack>` | `hono`, `h3`, `koa`. |
| `--no-backend` | Client-only folder - no `api/` directory. |
| `--overwrite` | Proceed even though the target directory is not empty. |
| `-h, --help` | Print usage and exit. |

:::info The frontend and backend choices are never implied
Either `--frontend <stack>` **or** `--no-frontend` is required -
omitting both is an error, and passing them both is an error too (same for backend).
:::

## What you get

```txt
demo/
├── .gitignore
├── package.json
├── tsconfig.json
├── var/lib/                   # generated support code, reached through `_/`
└── src/app/
    ├── kosmo.config.ts        # the frontend / backend blocks your answers imply
    ├── tsconfig.json
    ├── index.html
    ├── app.tsx                # root component, extension per framework
    ├── router.ts
    ├── components/Link.tsx    # the typed Link
    ├── pages/404.tsx          # the 404 page
    ├── pages/index/index.tsx  # the default index page
    ├── entry/client.ts        # the client entry
    ├── entry/server.ts        # the server entry, used by SSR builds
    ├── public/favicon.svg
    └── api/                   # if a backend was chosen
        ├── app.ts             # app middleware, the native instance
        ├── use.ts             # global middleware
        ├── errors.ts          # the default error handler
        ├── dev.ts             # dev-only hooks
        ├── server.ts
        ├── index/index.ts     # the default index route
        └── env.d.ts           # global context types
```

Every one of those files comes filled in, including a default index page and,
if a backend was chosen, a default index route.
The routes you add yourself sit alongside them.

---

### After bootstrap

`cd` into freshly created project (unless the project was bootstrapped in the current folder):

```sh
cd ./demo
```

### Install Dependencies

:::tabs key:pm variant:code
== npm
```sh
npm install
```

== pnpm
```sh
pnpm install
```

== yarn
```sh
yarn install
```
:::

### Start the dev server

The dev server watches your routes and recomputes as you work -
and seeds starter code into any route or page file you create empty:

:::tabs key:pm variant:code
== npm
```sh
npm run dev
```

== pnpm
```sh
pnpm dev
```

== yarn
```sh
yarn dev
```
:::

Your app is now running at `http://localhost:4556`, serving the default index page.
