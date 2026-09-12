# create-kosmo

Creates a KosmoJS project and its first source folder.

## Usage

```sh
npm create kosmo my-app
npm create kosmo .           # in the current folder
```

Run without arguments for an interactive prompt, or pass flags to skip it:

```sh
npm create kosmo my-app -- --frontend react --backend hono --ssr
```

`pnpm` and `yarn` do not need the extra `--`:

```sh
pnpm create kosmo my-app --frontend react --backend hono
```

| Flag | Values |
|---|---|
| `--frontend` | `react`, `vue`, `solid`, `svelte`, `mdx`, or `--no-frontend` for an API-only folder |
| `--backend` | `hono`, `h3`, `koa`, or `--no-backend` for a client-only folder |
| `--ssr` | enable server-side rendering |
| `--ssg` | enable static site generation (implies `--ssr`) |
| `--tsq` | enable TanStack Query |
| `--overwrite` | overwrite existing files |
| `-q, --quiet` | suppress output, errors still shown |

This installs [`@kosmojs/core`](https://www.npmjs.com/package/@kosmojs/core), [`@kosmojs/cli`](https://www.npmjs.com/package/@kosmojs/cli) and
[`@kosmojs/dev`](https://www.npmjs.com/package/@kosmojs/dev) into the new project, so you never add them by hand.

To add further source folders to an existing project, use `kosmo folder` rather than running the scaffolder again.

## Documentation

- [Getting started](https://kosmojs.dev/start.html)
- [Tutorial](https://kosmojs.dev/tutorial.html)

Full documentation at [kosmojs.dev](https://kosmojs.dev).

## License

MIT
