---
title: CLI
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

All five run from the **project root** - the directory holding `package.json`.

They read `distDir`, `devPort` and `previewPort` from it, and refuse to start if any is missing.

`-h` / `--help` prints the full usage for either binary.

## The commands

| Scaffolding | |
|---|---|
| [create kosmo](/cli/create) | Bootstrap a new project - run once |
| [kosmo folder](/cli/folder) | Add a source folder to an existing project |

| Running a project | |
|---|---|
| [kosmo serve](/cli/serve) | Dev server on `devPort`, Vite + HMR, always client-rendered |
| [kosmo preview](/cli/preview) | Production build served on `previewPort`, rebuilt on change |
| [kosmo build](/cli/build) | Production build only - `dist/run.js` plus a per-folder tree |
| [kosmo typecheck](/cli/typecheck) | `tsc --noEmit` per source folder, plus an opt-in root run |

## Interactive vs CLI mode

The two scaffolding commands - `npm create kosmo` and `kosmo folder` -
each have an interactive flow and a flag-driven one.

| Invocation | Mode |
|---|---|
| Any flag passed | CLI |
| No flags, stdout is a terminal | Interactive |
| No flags, stdout is **not** a terminal | CLI, with an empty flag set |

There is no partial prompting. Once you are in CLI mode, anything you left out
must have a default, or the command errors out.

`-q` / `--quiet` suppresses CLI mode's output. Errors still print.

### The non-terminal case

This is the one that surprises people, and it has nothing to do with how you
typed the command. The prompts disappear whenever stdout is not a terminal:

- piping the output - `pnpm folder admin | tee setup.log`
- running it from a setup or CI script
- running it in a container or an agent sandbox with no terminal attached

So the same invocation that prompts in your shell becomes a CLI-mode run with
no flags. It fails on the first required value rather than hanging on a question
nobody can answer.

That is deliberate: a scaffolder blocked on an invisible prompt is worse than
one that tells you which flag is missing.

## When a command refuses to run

| Message | Cause |
|---|---|
| package.json does not exist or some of distDir / devPort / previewPort is not set | Not in the project root, or some of listed key(s) are missing. |
| Invalid command, use one of folder, serve, build, preview, typecheck | Typo, or a command from another framework's CLI. |
| No source folders detected | No `src/*/kosmo.config.ts` anywhere. |
| Some of the given names do not contain a valid KosmoJS source folder | A named folder doesn't exist or has no config. |
| No folder name provided | `kosmo folder` in CLI mode with no name positional - including the non-TTY case. |
| frontend is required: either provide `--frontend <name>` or `--no-frontend` flag | Neither half of the pair was passed. |
| `--frontend` and `--no-frontend` are mutually exclusive; use only one | Both halves were. |
| Target dir is not empty. Either remove dir contents or provide `--overwrite` flag | `create kosmo` in CLI mode, non-empty target. |
| `./src/<name>` already exists. Either remove it or provide `--overwrite` flag. | `kosmo folder` in CLI mode, folder taken. |
