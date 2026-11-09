---
title: Env Files
description: Env files loaded the Vite way, per source folder and per side -
    .env, .env.local, .env.[mode], envDir, envPrefix, --mode, and why production loads none.
head:
  - - meta
    - name: keywords
      content: env files, dotenv, .env, .env.local, envDir, envPrefix, import.meta.env,
        process.env, vite mode, --mode, twelve-factor
---

KosmoJS loads env files the way Vite does:
the same files, in the same order, with `envDir` and `envPrefix` working as they do in Vite.

| File | Loaded |
|---|---|
| `.env` | always |
| `.env.local` | always, meant to stay on your machine |
| `.env.[mode]` | in the given [mode](#modes) |
| `.env.[mode].local` | in the given mode, meant to stay on your machine |

Later files win: `.env.[mode].local` over `.env.[mode]`, over `.env.local`, over `.env`.

Keep `.local` files out of git by adding `*.local` to your `.gitignore`.

`$VAR`, `${VAR}` and `${VAR:-default}` expand, even when the key lives in another file.
`$(...)` is not run: an env file is data, not a script.

## Root first, then the folder

Env files are read from two places, in this order:

```txt
my-app/
├── .env              -> every folder
├── .env.local
└── src/
    └── admin/
        ├── .env      -> admin only, wins over the root
        └── kosmo.config.ts
```

A folder's files win over the root's, even over a root `.env.[mode]`.

So the root holds what every folder shares, and a folder holds only what it overrides.

## Frontend, backend and sidecar

Each side of a source folder gets its env files separately, and reads them its own way.

**Frontend** values arrive in `import.meta.env`.
Only keys matching `envPrefix` reach it, `VITE_` by default,
because they end up in the browser bundle:

```ts
const api = import.meta.env.VITE_API_URL;
```

**Backend** and **sidecar** values arrive in `process.env`,
so routes and libraries read them as they would anywhere else.
They get every key, unless you give that side an `envPrefix` of its own:

```ts [kosmo.config.ts]
export default defineConfig({
  backend: {
    stack: "hono",
    base: "/api",
    viteConfig: {
      // only APP_ keys reach the backend
      envPrefix: "APP_",
    },
  },
});
```

The dev server runs every source folder in one process, so they share one `process.env`.
A backend key that two folders set differently ends up with one value.
Keep such keys at the root, or give each folder its own name for them.

## envDir

To read one side's files from somewhere else, set its `envDir`, relative to the source folder:

```ts [src/admin/kosmo.config.ts]
export default defineConfig({
  frontend: {
    stack: "react",
    base: "/admin",
    viteConfig: {
      envDir: "env/client", // [!code hl]
    },
  },
});
```

That side then reads that directory only, neither the root nor the folder.
The other side keeps the default lookup.

`envDir: false` turns env files off for that side.

## The real environment wins

A key that is already in `process.env` when the server starts is never overwritten by a file.

A value set by your shell, a container or CI always wins over any env file.

## Modes

The mode picks which `.env.[mode]` files are loaded:

| Command | Default mode |
|---|---|
| `kosmo serve` (`pnpm dev`) | `development` |
| `kosmo preview` | `production` |
| `kosmo build` | `production` |
| `pnpm test` | `test` |

Pass `--mode` to pick another:

```sh
pnpm dev --mode stage
pnpm build --mode stage
pnpm test --mode stage
```

With `--mode stage`, `.env.stage` and `.env.stage.local` are loaded
on top of `.env` and `.env.local`.

## Changes restart the server

Saving an env file of the current mode, at the root or in a source folder,
restarts the dev server in a fresh process, and `preview` the same way.
Every value is read again from scratch.
[Details&nbsp;›](/cli/serve#restarts-on-config-change)

## Production

A built backend loads no env files.

`dist/run.js` reads `process.env` as it finds it, the twelve-factor way.
Set the values in your host or container, or hand Node a file:

```sh
node --env-file .env.production dist/run.js -p 4556
```

`kosmo preview` loads the env files of its mode before it starts `dist/run.js`,
so a preview runs with the same values the files hold.

The frontend works the other way round: `kosmo build` inlines its values into the bundle.
What `import.meta.env.VITE_API_URL` returns in production is whatever the build saw.
