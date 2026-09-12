# @kosmojs/koa-generator

Koa backend integration for KosmoJS.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Fills the `backend` slot. Selected with:

```ts
// kosmo.config.ts
backend: { stack: "koa" }
```

## Generates

`api/app.ts`, `api/errors.ts`, `api/dev.ts`, `api/server.ts` and `api/env.d.ts` in the source folder,
plus the `_/api`, `_/api:factory` and `@api/` internals in `lib/`. Also exports `./lib` for its error-handler helpers.

## Notes

The only backend with full support for path-to-regexp power syntax.
Its error handler is middleware wrapping `await next()` in try/catch, unlike the Hono and H3 forms.

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
- [Error handling](https://kosmojs.dev/backend/error-handling.html)

## License

MIT
