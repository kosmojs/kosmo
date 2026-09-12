# @kosmojs/cli

Provides the `kosmo` binary that drives a KosmoJS project.

## Installation

Added to your project automatically by `npm create kosmo`.

To add it by hand:

```sh
npm install -D @kosmojs/cli
```

## Commands

| Command | Does |
|---|---|
| `kosmo serve` | start the dev server (Vite, HMR, client-side rendering) |
| `kosmo build` | build every source folder for production |
| `kosmo preview` | serve the production build, including SSR |
| `kosmo typecheck` | typecheck the project and its generated code |
| `kosmo folder` | add a source folder to an existing project |

A scaffolded project wires these into `package.json`:

```sh
pnpm dev          # kosmo serve
pnpm build        # kosmo build
pnpm preview      # kosmo preview
pnpm typecheck    # kosmo typecheck
pnpm folder       # kosmo folder
```

Pass `--help` to any command for its flags.

Development always runs client-side with HMR; SSR runs in production builds,
which is what `kosmo preview` exists to show you.

## Documentation

- [CLI reference](https://kosmojs.dev/essentials/cli.html)
- [Development workflow](https://kosmojs.dev/dev-build-run/development-workflow.html)

Full documentation at [kosmojs.dev](https://kosmojs.dev).

## License

MIT
