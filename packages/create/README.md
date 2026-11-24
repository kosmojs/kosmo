# create-kosmo

Creates a KosmoJS project and its first source folder.

## Usage

Run it without flags, and it asks for the project name,
the frontend framework, the backend framework, and whether to add a sidecar:

```sh
npm create kosmo
```

Or create the project in the current folder:

```sh
npm create kosmo .
```

Pass flags to skip the prompts:

```sh
npm create kosmo -- --name my-app --frontend react --backend hono
```

`pnpm` and `yarn` do not need the extra `--`:

```sh
pnpm create kosmo --name my-app --frontend react --backend hono
```

| Flag | Values |
|---|---|
| `--name` | project name, ignored when using `.` |
| `--frontend` | `react`, `vue`, `solid`, `svelte`, `mdx` |
| `--backend` | `hono`, `h3`, `koa` |
| `--sidecar` | add a sidecar, a process of its own beside the web app |
| `--overwrite` | overwrite existing files |
| `-h, --help` | print usage |

`--frontend`, `--backend` and `--sidecar` are each optional, but at least one is required.
Leave one out and you are asked for it, or, with no terminal, the folder goes without it.

## What you get

The first source folder is always `app`, with pages at `/` and the API at `/api`.

Its frontend has SSR enabled, while SSG, TanStack Query and testing are off.
Change any of them in the folder's `kosmo.config.ts`.

[`@kosmojs/core`](https://www.npmjs.com/package/@kosmojs/core) goes into `dependencies`,
and [`@kosmojs/cli`](https://www.npmjs.com/package/@kosmojs/cli),
[`@kosmojs/dev`](https://www.npmjs.com/package/@kosmojs/dev)
and [`@kosmojs/vitest`](https://www.npmjs.com/package/@kosmojs/vitest) into `devDependencies`,
so you never add them by hand.

Add more source folders later with `kosmo folder`,
and a sidecar to an existing folder by adding a `sidecar` block to its `kosmo.config.ts`.

## Documentation

- [Getting started](https://kosmojs.dev/start.html)
- [Tutorial](https://kosmojs.dev/tutorial.html)

Full documentation at [kosmojs.dev](https://kosmojs.dev).

## License

MIT
