# @kosmojs/react-generator

React integration for KosmoJS, on React Router.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Fills the `frontend` slot. Selected with:

```ts
// kosmo.config.ts
frontend: { stack: "react" }
```

## Generates

`app.tsx`, `router.tsx`, `entry/client`, `entry/server`, page and layout samples, and the `_/router`, `_/app` and `_/query` aliases.

## Notes

Router hooks come from `react-router`; there is no `_/use` alias in React folders.
A TanStack Query variant of the app shell ships alongside the default.

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
- [Hooks](https://kosmojs.dev/frontend/hooks.html)

## License

MIT
