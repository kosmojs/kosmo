---
title: kosmo folder
description: Adding a source folder to an existing project, interactively or from flags, and installing the dependencies a new folder needs.
head:
  - - meta
    - name: keywords
      content: kosmo folder, add source folder, --frontend, --backend, --overwrite, install dependencies
---

A project is a set of [source folders](/essentials/project-structure), and you can add one at any time.

Each is a self-contained app with its own stack and its own URL prefixes -
e.g. a marketing site at `/`, an admin app at `/admin`, an API-only service at `/svc`, etc.

:::tabs key:pm variant:code
== npm
```sh
npm run folder
```

== pnpm
```sh
pnpm folder
```

== yarn
```sh
yarn folder
```
:::

You'll be prompted for the folder name, frontend and backend.

Folder name becomes `src/<name>`, and gives the folder its prefixes:
- pages at `/<name>`
- API at `/<name>/api`.

Edit `base` in [kosmo.config.ts](/essentials/config) afterwards if you want different prefixes.

If `src/<name>` already exists, you are offered to remove / overwrite before proceed, or cancel.

## CLI mode

Provide flags up front and no prompts appears:

```sh
pnpm folder --name admin --frontend solid --backend h3
pnpm folder --name svc   --no-frontend    --backend hono
pnpm folder --name docs  --frontend mdx   --no-backend
```

> Folder name is required, omit it and you get an error: `No folder name provided`.

That gives `admin` its pages at `/admin` and its API at `/admin/api`,
`svc` an API at `/svc/api` and no pages, `docs` pages at `/docs` and no API.

Without `--overwrite`, an existing `src/<name>` is an error rather than a prompt:

```txt
./src/admin already exists. Either remove it or provide --overwrite flag.
```

## Install new dependencies

A new folder usually brings new dependencies.
The command diffs `package.json` before and after and prints only what was added:

```txt
💡 New dependencies added:
solid-js, h3

📦 Install them before continue:
$ npm install
```

Run the install before starting the dev server.

The new folder's `kosmo.config.ts` already declares the stack,
but the packages it writes imports for are not on disk yet.

A dev server that was already running does not pick the folder up: folders are collected once, at startup.
Restart it.

::: tip Changing the folder later
`kosmo folder` writes `kosmo.config.ts` once; editing it afterwards is expected and supported.
The config is read at startup, so restart the dev server after turning `ssr` on, adding a `backend`, or changing a `base`.
[Configuration&nbsp;›](/essentials/config#the-shape)
:::
