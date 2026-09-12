# @kosmojs/svelte-generator

Svelte integration for KosmoJS.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Fills the `frontend` slot. Selected with:

```ts
// kosmo.config.ts
frontend: { stack: "svelte" }
```

## Generates

`app.svelte`, `Layouts.svelte`, `router.ts`, `entry/client`, `entry/server`, page and layout samples,
and the `_/router`, `_/app`, `_/use` and `_/query` aliases.

## Notes

Named exports such as `loader` and `staticParams` need a `<script module>` block.
Svelte renders to string only - no streaming SSR. TanStack Query uses `createQuery` with a thunk.

## Layout

```
src/
├── index.ts       generator definition (meta, dependencies, factory)
├── factory.ts     decides which files to deploy for a given project
└── templates/     the files it writes
```

Templates are Handlebars (`.hbs`) when they interpolate, plain source files otherwise.
Files written into a source folder are seeded only when blank, so editing one is never undone by a rebuild;
files under `lib/` are regenerated on every run.

## Documentation

- [Frontend intro](https://kosmojs.dev/frontend/intro.html)
- [SSR](https://kosmojs.dev/frontend/server-side-render.html)

## License

MIT
