---
title: create kosmo
description: Bootstrapping a KosmoJS project with npm create kosmo - the interactive flow, the flags, and what the new project contains.
head:
  - - meta
    - name: keywords
      content: create kosmo, npm create kosmo, scaffolding, --frontend, --backend, --ssr, --ssg, --tsq
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
pnpm create kosmo demo --frontend react --backend hono --ssr
```

| Flag | Meaning |
|---|---|
| `--frontend <name>` | `react`, `solid`, `vue`, `svelte`, `mdx`. |
| `--no-frontend` | API-only folder - no `pages/`, no client entries. |
| `--backend <name>` | `hono`, `h3`, `koa`. |
| `--no-backend` | Client-only folder - no `api/` directory. |
| `--ssr` | Enable [server-side rendering](/frontend/server-side-render). |
| `--ssg` | Enable [static site generation](/frontend/static-site-generation). Implies SSR. |
| `--tsq` | Enable [TanStack Query](/frontend/tanstack-query). Ignored on MDX folders. |
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
├── package.json               # type, distDir, devPort, previewPort, scripts, deps
├── .gitignore
└── src/app/
    ├── kosmo.config.ts        # the frontend / backend blocks your answers imply
    ├── public/favicon.svg
    ├── api/index/index.ts     # empty stub, if a backend was chosen
    ├── pages/index/index.tsx  # empty stub, extension per framework
    └── entry/client.ts        # empty stub, if a frontend was chosen
```

The stubs are **empty on purpose**. They are filled on the first `pnpm dev` or `pnpm build`,
along with everything else the folder needs.

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

The dev server completes the setup: it seeds the remaining project files and wires everything together.
From then on it watches your routes and recomputes as you work:

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
