# create-kosmo

Creates a KosmoJS project and its first source folder.

## Usage

Run it without flags, and it asks for the project name,
the frontend framework and the backend framework:

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
| `--frontend` | `react`, `vue`, `solid`, `svelte`, `mdx`, or `--no-frontend` for an API-only folder |
| `--backend` | `hono`, `h3`, `koa`, or `--no-backend` for a client-only folder |
| `--overwrite` | overwrite existing files |
| `-h, --help` | print usage |

## What you get

The first source folder is always `app`, with pages at `/` and the API at `/api`.

Its frontend has SSR enabled, while SSG and TanStack Query are off.
Change any of them in the folder's `kosmo.config.ts`.

[`@kosmojs/core`](https://www.npmjs.com/package/@kosmojs/core) goes into `dependencies`,
and [`@kosmojs/cli`](https://www.npmjs.com/package/@kosmojs/cli),
[`@kosmojs/dev`](https://www.npmjs.com/package/@kosmojs/dev)
and [`@kosmojs/vitest`](https://www.npmjs.com/package/@kosmojs/vitest) into `devDependencies`,
so you never add them by hand.

Add more source folders later with `kosmo folder`,
or a standalone process with `kosmo sidecar`.

## Documentation

- [Getting started](https://kosmojs.dev/start.html)
- [Tutorial](https://kosmojs.dev/tutorial.html)

Full documentation at [kosmojs.dev](https://kosmojs.dev).

## License

MIT
