# @kosmojs/vue-generator

Vue integration for KosmoJS, on Vue Router.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Fills the `frontend` slot. Selected with:

```ts
// kosmo.config.ts
frontend: { stack: "vue" }
```

## Generates

`app.vue`, `router.ts`, `entry/client`, `entry/server`, page and layout samples,
and the `_/router`, `_/app`, `_/use` and `_/query` aliases.

## Notes

The `loader` export must sit in a plain `<script>` block; `<script setup>` cannot hold it.
`useLoaderData` comes from `_/use`.

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
