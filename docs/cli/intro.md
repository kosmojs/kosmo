---
title: CLI Overview
description: Every KosmoJS command - create kosmo and kosmo folder for scaffolding,
    serve, preview, build and typecheck for everything after, plus the interactive
    and flag-driven modes and every message a command exits with.
head:
  - - meta
    - name: keywords
      content: kosmo cli, create kosmo, kosmo folder, kosmo serve, kosmo build, kosmo preview,
        kosmo typecheck, cli flags, interactive scaffolding, non-interactive scaffolding, TTY,
        command line reference, kosmo cli errors
---

KosmoJS ships two binaries.

**create-kosmo** bootstraps a project - you run it once, through `npm create kosmo`.

**kosmo** does everything after that. It comes with `@kosmojs/cli`, a devDependency of every project,
and `package.json` wires it to scripts so you rarely type the binary name:

| Script | Command | What it does |
|---|---|---|
| `pnpm dev` | `kosmo serve` | Dev server for every source folder |
| `pnpm preview` | `kosmo preview` | Production build, served and rebuilt on change |
| `pnpm build` | `kosmo build` | Production build |
| `pnpm typecheck` | `kosmo typecheck` | `tsc --noEmit` per source folder, plus the project root |
| `pnpm folder` | `kosmo folder` | Add a source folder to the project |
| `pnpm sidecar` | `kosmo sidecar` | Add a sidecar folder - builds, serves no HTTP |

All five run from the **project root** - the directory holding `package.json`.

`-h` / `--help` prints the full usage for either binary.

## The commands

| Scaffolding | |
|---|---|
| [create kosmo](/cli/create) | Bootstrap a new project - run once |
| [kosmo folder](/cli/folder) | Add a source folder to an existing project |
| [kosmo sidecar](/cli/sidecar) | Add a [sidecar](/sidecar/intro) folder - entry points, no HTTP |

| Running a project | |
|---|---|
| [kosmo serve](/cli/serve) | Dev server on [kosmo.devHost](/essentials/config#project-settings-package-json), Vite + HMR, always client-rendered |
| [kosmo preview](/cli/preview) | Production build served on [kosmo.previewHost](/essentials/config#project-settings-package-json), rebuilt on change |
| [kosmo build](/cli/build) | Production build only - `dist/run.js` plus a per-folder tree |
| [kosmo typecheck](/cli/typecheck) | `tsc --noEmit` per source folder, plus the project root |

## Flags and prompts

`npm create kosmo` and `kosmo folder` take their answers as flags.
Pass them all and the command just runs - no questions asked:

```sh
pnpm folder --name admin --frontend react --backend hono
```

Leave a flag out and the command asks for it instead:

- **In a terminal**, you get a prompt, and the command carries on with your answer.
- **Without a terminal** - piped output (`pnpm folder | tee setup.log`),
a CI script, a container, an agent sandbox - there is nobody to answer,
so the command stops with an error. See [the messages below](#when-a-command-refuses-to-run).

So in scripts and CI, pass every flag up front.
No terminal means nobody can answer, so a run that is missing a flag fails right away instead of waiting on a question.

## When a command refuses to run

| Message | Cause |
|---|---|
| Unknown command; use one of folder, sidecar, serve, build, preview, typecheck | Typo, or a command from another framework's CLI. |
| No source folders detected | No `src/*/kosmo.config.ts` anywhere. |
| Some of the given names do not contain a valid KosmoJS source folder | A named folder doesn't exist or has no config. |
| No folder name provided | `kosmo folder` in CLI mode with no name positional - including the non-TTY case. |
| frontend is required: either provide `--frontend <name>` or `--no-frontend` flag | Neither half of the pair was passed. |
| `--frontend` and `--no-frontend` are mutually exclusive; use only one | Both halves were. |
| Target dir is not empty. Either remove dir contents or provide `--overwrite` flag | `create kosmo` in CLI mode, non-empty target. |
| `./src/<name>` already exists. Either remove it or provide `--overwrite` flag. | `kosmo folder` in CLI mode, folder taken. |
