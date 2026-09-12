# @kosmojs/h3-generator

H3 backend integration for KosmoJS.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Fills the `backend` slot. Selected with:

```ts
// kosmo.config.ts
backend: { stack: "h3" }
```

## Generates

`api/app.ts`, `api/errors.ts`, `api/dev.ts`, `api/server.ts` and `api/env.d.ts` in the source folder,
plus the `_/api`, `_/api:factory` and `@api/` internals in `lib/`.

## Notes

H3 handlers return their response value directly, and raw params live on `event.context.params`.

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

- [Backend intro](https://kosmojs.dev/backend/intro.html)
- [Routing params](https://kosmojs.dev/routing/params.html)

## License

MIT
