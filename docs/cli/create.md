---
title: create kosmo
description: Bootstrapping a KosmoJS project with npm create kosmo - the interactive flow, the flags, and what the new project contains.
head:
  - - meta
    - name: keywords
      content: create kosmo, npm create kosmo, scaffolding, --frontend, --backend, --overwrite
---

:::tabs key:pm variant:code
== npm
```sh
npm create kosmo demo
```

== pnpm
```sh
pnpm create kosmo demo
```

== yarn
```sh
yarn create kosmo demo
```
:::

The positional argument is the target directory, created if missing. Use `.` to bootstrap in the
current directory:

```sh
npm create kosmo .
```

A project name may contain alphanumerics and any of `. - + $ @`,
may not start with a dash, and may not contain path traversal.

## The interactive flow

If the target directory has anything in it other than `.git*`, `README*` or `LICENSE*`,
you are asked first what to do with it - remove the existing files, keep them and overwrite as needed, or cancel.

Then a handful of questions, all about the **first source folder**:

1. **Framework** - React, Vue, Solid, Svelte, MDX, or *None (API-only folder)*
2. **Backend Framework** - Hono, H3, Koa, or *None (client-only folder)*
3. **Enable server-side rendering (SSR)?** - skipped for MDX, where SSR is always on
4. **Enable static site generation (SSG)?** - asked only if SSR is enabled
5. **Enable TanStack Query?** - skipped for MDX, which does not support it

You are not asked for the folder's name or base: the first folder is always **`app`**, with its pages at `/` and its API at `/api`.
Add differently-shaped folders at any time with [kosmo folder](/cli/folder).

## CLI mode

```sh
# npm needs -- to pass flags through
npm create kosmo demo -- --frontend react --backend hono

# pnpm and yarn do not
pnpm create kosmo demo --frontend react --backend hono
```

| Flag | Meaning |
|---|---|
| `--frontend <name>` | `react`, `solid`, `vue`, `svelte`, `mdx`. |
| `--no-frontend` | API-only folder - no `pages/`, no client entries. |
| `--backend <name>` | `hono`, `h3`, `koa`. |
| `--no-backend` | Client-only folder - no `api/` directory. |
| `--overwrite` | Proceed even though the target directory is not empty. |
| `-q, --quiet` | Suppress output. |
| `-h, --help` | Print usage and exit. |

::: warning The frontend and backend choices are never implied
Either `--frontend <name>` **or** `--no-frontend` is required -
omitting both is an error, and passing them both is an error too (same for backend).
:::

## What you get

```txt
demo/
├── .gitignore
├── package.json               # type, distDir, devPort, previewPort, scripts, deps
├── tsconfig.json
├── lib/                       # generated support code, reached through `_/`
└── src/app/
    ├── kosmo.config.ts        # the frontend / backend blocks your answers imply
    ├── tsconfig.json
    ├── index.html
    ├── app.tsx                # root component, extension per framework
    ├── router.ts
    ├── components/Link.tsx    # the typed Link
    ├── pages/404.tsx          # the 404 page
    ├── entry/client.ts        # the client entry
    ├── entry/server.ts        # the server entry, used by SSR builds
    ├── public/favicon.svg
    └── api/                   # if a backend was chosen
        ├── app.ts             # app middleware, the native instance
        ├── use.ts             # global middleware
        ├── errors.ts          # the default error handler
        ├── dev.ts             # dev-only hooks
        ├── server.ts
        └── env.d.ts           # global context types
```

Every one of those files comes filled in. What the scaffold does not write is routes -
`api/` has no endpoints and `pages/` no index page yet.

`package.json` carries three project-level settings alongside the usual fields -
[distDir, devPort, previewPort](/essentials/config#project-settings-package-json) -
and the dependencies each chosen generator declares.

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

Your app is now running at `http://localhost:4556`.
