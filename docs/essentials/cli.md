---
title: CLI
description: Every KosmoJS command - creating a project with create kosmo,
    adding source folders with kosmo folder, and running serve, preview, build and typecheck,
    in both interactive and flag-driven CLI mode.
head:
  - - meta
    - name: keywords
      content: kosmo cli, create kosmo, kosmo folder, kosmo serve, kosmo build, kosmo preview,
        kosmo typecheck, cli flags, non-interactive scaffolding, npm create kosmo, scaffolding,
        command line reference
---

KosmoJS ships two binaries.

**create-kosmo** bootstraps a project - you run it once, through `npm create kosmo`.

**kosmo** does everything after that. It comes with `@kosmojs/cli`, a devDependency of every project,
and `package.json` wires it to scripts so you rarely type the binary name:

| Script | Command | What it does |
|---|---|---|
| `npm run dev` | `kosmo serve` | Dev server for every source folder |
| `npm run preview` | `kosmo preview` | Production build, served and rebuilt on change |
| `npm run build` | `kosmo build` | Production build, then exit |
| `npm run typecheck` | `kosmo typecheck` | `tsc --noEmit` per source folder |
| `npm run folder` | `kosmo folder` | Add a source folder to the project |

All five run from the **project root** - the directory holding `package.json`.

They read `distDir`, `devPort` and `previewPort` from it, and refuse to start if any is missing.

`-h` / `--help` prints the full usage for either binary.

## Interactive vs CLI mode

The two scaffolding commands - `npm create kosmo` and `kosmo folder` -
each have an interactive flow and a flag-driven one.

> **Pass any flag and you are in CLI mode.** There is no partial prompting:
whatever you left out must have a default, or the command errors out.
With no flags at all you get the prompts - unless stdout is not a TTY, which forces CLI mode regardless.

The TTY clause is the one that surprises people, and it has nothing to do with how you typed the command.
Pipe the output somewhere (`pnpm folder ... | tee setup.log`), run it from a setup script,
or run it in a container or agent sandbox with no terminal attached, and the prompts are gone -
the same invocation that is interactive in your shell becomes a CLI-mode one with an empty flag set,
failing on the first required value rather than hanging on a question nobody can answer.

That is the intended behaviour: a scaffolder blocked on an invisible prompt is worse than one that tells you which flag is missing.

`-q` / `--quiet` suppresses CLI mode's output. Errors still print.

## Creating a project

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

### The interactive flow

If the target directory has anything in it other than `.git*`, `README*` or `LICENSE*`,
you are asked first what to do with it - remove the existing files, keep them and overwrite as needed, or cancel.

Then a handful of questions, all about the **first source folder**:

1. **Framework** - React, Vue, Solid, Svelte, MDX, or *None (API-only folder)*
2. **Backend Framework** - Hono, H3, Koa, or *None (client-only folder)*
3. **Enable server-side rendering (SSR)?** - skipped for MDX, where SSR is always on
4. **Enable static site generation (SSG)?** - asked only if SSR is enabled
5. **Enable TanStack Query?** - skipped for MDX, which does not support it

You are not asked for the folder's name or base: the first folder is always **`app` at base `/`**.
Pass `--name` / `--base` to choose otherwise, or add differently-shaped folders at any time with [`kosmo folder`](#adding-a-source-folder).

### CLI mode

```sh
# npm needs -- to pass flags through
npm create kosmo demo -- --framework react --backend hono

# pnpm and yarn do not
pnpm create kosmo demo --framework react --backend hono --ssr
```

| Flag | Meaning |
|---|---|
| `--name <name>` | Source folder name. Defaults to `app`. |
| `--base <path>` | The folder's base URL. Defaults to `/`. |
| `--framework <name>` | `react`, `solid`, `vue`, `svelte` or `mdx`. |
| `--no-framework` | API-only folder - no `pages/`, no client entries. |
| `--backend <name>` | `hono`, `h3` or `koa`. |
| `--no-backend` | Client-only folder - no `api/` directory. |
| `--ssr` | Enable [server-side rendering](/frontend/server-side-render). |
| `--ssg` | Enable [static site generation](/frontend/static-site-generation). Implies SSR. |
| `--tsq` | Enable [TanStack Query](/frontend/tanstack-query). Ignored on MDX folders. |
| `--overwrite` | Proceed even though the target directory is not empty. |
| `-q, --quiet` | Suppress output. |
| `-h, --help` | Print usage and exit. |

::: warning The framework and backend choices are never implied
Either `--framework <name>` **or** `--no-framework` is required -
omitting both is an error, and passing them both is an error too (same for backend).
:::

`--name` and `--base` are the only flags with defaults here, which is why
`pnpm create kosmo demo --framework mdx --no-backend` is a complete command:
it produces `src/app` at `/`, MDX, no API.

### What you get

```txt
demo/
├── package.json               # type, distDir, devPort, previewPort, scripts, deps
├── .gitignore
└── src/app/
    ├── kosmo.config.ts        # base + the generators your answers imply
    ├── public/favicon.svg
    ├── api/index/index.ts     # empty stub, if a backend was chosen
    ├── pages/index/index.tsx  # empty stub, extension per framework
    └── entry/client.ts        # empty stub, if a frontend was chosen
```

The stubs are **empty on purpose**. They are filled on the first `npm run dev` - or `npm run build`,
which runs the same generators - along with everything else the folder needs.

Nothing here is overwritten if it already exists, so a stub you have already written into is safe.

`package.json` carries three project-level settings alongside the usual fields -
[distDir, devPort, previewPort](/essentials/config#project-settings-package-json) -
and the dependencies each chosen generator declares.

Then, as the command tells you on the way out:

```sh
cd ./demo
npm install
npm run dev
```

## Adding a source folder

A project is a set of [source folders](/essentials/project-structure), and you can add one at any time.

Each is a self-contained app with its own framework, backend and base -
e.g. a marketing site at `/`, an admin app at `/admin`, an API-only service at `/svc`, etc.

```sh
npm run folder      # interactive
pnpm folder         # same
```

The prompts are the project ones, preceded by the two that were assumed at bootstrap:

1. **Folder Name** - becomes `src/<name>`
2. **Base URL** - defaults to `/`
3. **Framework** and **Backend Framework**, each with a *None* option
4. **SSR**, then **SSG** if SSR is on, then **TanStack Query**

If `src/<name>` already exists, you are offered remove / overwrite / cancel before anything is written.

### CLI mode

The same flags as `create kosmo`, with one difference that matters:

::: warning `--name` and `--base` are required here
They have no defaults on this command. `pnpm folder --framework react --backend hono` errors with
`No folder name provided`.
:::

```sh
pnpm folder --name admin --base /admin --framework solid --backend h3
pnpm folder --name svc   --base /svc   --no-framework    --backend hono
pnpm folder --name docs  --base /docs  --framework mdx   --no-backend --ssg
```

Without `--overwrite`, an existing `src/<name>` is an error rather than a prompt:
`./src/admin already exists. Either remove it or provide --overwrite flag.`

### Install what it added

A new folder usually brings new dependencies - a framework, a backend, their generators.
The command diffs `package.json` before and after and prints only what was added:

```txt
💡 New dependencies added:
solid-js, h3

📦 Install them before continue:
$ npm install
```

Run the install before starting the dev server.

The generators are already listed in the new folder's `kosmo.config.ts`,
but the packages they generate imports for are not on disk yet.

A dev server that was already running does not pick the folder up: folders are collected once, at startup.
Restart it.

::: tip Adding a generator later
`kosmo folder` writes `kosmo.config.ts` once; editing it afterwards is expected and supported.
What it is not is hot - generators are resolved at startup, so restart the dev server after changing the `generators` array.
[Configuration&nbsp;›](/essentials/config#generators)
:::

## Selecting folders

Any of `serve`, `preview`, `build` and `typecheck` operate on **every** source folder by default.
Name one or more to narrow the scope - the names are directory names under `src/`:

```sh
pnpm dev              # all folders
pnpm dev admin        # one
pnpm build admin svc  # several
```

A name that isn't a source folder - no `src/<name>/kosmo.config.ts` - stops the command with
`Some of given names does not contain a valid KosmoJS source folder`.
A project with no folders at all reports `No source folders detected`.

## `dev` - `kosmo serve`

```sh
pnpm dev
pnpm dev admin front
```

One process serves every selected folder: client modules through Vite with HMR,
API routes in the same process with hot reload, dispatched by path.
Listens on **`devPort`** (default `4556`, configured in `package.json`).

`devPort` is the only port you address. Each folder's Vite server and HMR socket get their own,
picked from a free range derived from `devPort` - which is why the command insists on a `devPort` below `64000`,
so that range still fits.

The public port is not negotiated: if something else holds it,
the dev server reports `Failed to start dev server on port 4556` and exits rather than moving.

Dev is **always client-rendered**, whether or not the folder has SSR enabled.
[Development&nbsp;workflow&nbsp;›](/dev-build-run/development-workflow)

## `preview` - `kosmo preview`

```sh
pnpm preview
pnpm preview front
```

Builds the selected folders, then runs
[`dist/run.js`](/dev-build-run/building-for-production#one-entry-point-for-the-whole-project) -
the same entry point production starts - on **`previewPort`** (default `4558`, configured in `package.json`).

It then watches your sources and rebuilds on change, restarting the runner.

The separate port is deliberate: preview and the dev server run side by side,
so you can compare client-rendered and server-rendered output in adjacent tabs.
[Production&nbsp;preview&nbsp;›](/dev-build-run/production-preview)

## `build` - `kosmo build`

```sh
pnpm build
pnpm build front
```

The same build `preview` runs, minus the server and the watcher.
Writes `dist/run.js` plus a `dist/<folder>/` tree per folder.

Building a subset leaves the other folders' output in `dist/` untouched.

Each build writes a small manifest next to the folder's output,
and `dist/run.js` discovers folders by reading those at startup -
so a folder built an hour ago is still served by a runner started after a one-folder rebuild.
[Building&nbsp;for&nbsp;production&nbsp;›](/dev-build-run/building-for-production)

## `typecheck` - `kosmo typecheck`

```sh
pnpm typecheck
pnpm typecheck admin
```

Runs `tsc --project src/<folder>/tsconfig.json --noEmit` for each selected folder,
in sequence, using the `typescript` version installed in the project.

Per folder, not per project: each source folder has [its own tsconfig.json](/essentials/config#typescript-config)
with its own path mappings, and a project-wide `tsc` run would resolve `_/` or `@/` against the wrong folder.

The first folder that fails prints its errors and exits `1` - the remaining folders are not checked.

::: tip Generated types are build artifacts
Typecheck reads the generated `_/*` modules like any other source.
Run it after the dev server or a build has had a chance to generate them -
on a fresh clone, `npm run build` (or one dev start) before the first `typecheck`.
:::

## When a command refuses to run

| Message | Cause |
|---|---|
| package.json does not exist or some of distDir / devPort / previewPort is not set | Not in the project root, or some of listed key(s) are missing. |
| Invalid command, use one of folder, serve, build, preview, typecheck | Typo, or a command from another framework's CLI. |
| No source folders detected | No `src/*/kosmo.config.ts` anywhere. |
| Some of given names does not contain a valid KosmoJS source folder | A named folder doesn't exist or has no config. |
| No folder name provided | `kosmo folder` in CLI mode without `--name` - including the non-TTY case. |
| framework is required: either provide `--framework <name>` or `--no-framework` flag | Neither half of the pair was passed. |
| `--framework` and `--no-framework` are mutually exclusive; use only one | Both halves were. |
| Target dir is not empty. Either remove dir contents or provide `--overwrite` flag | `create kosmo` in CLI mode, non-empty target. |
| `./src/<name>` already exists. Either remove it or provide `--overwrite` flag. | `kosmo folder` in CLI mode, folder taken. |
