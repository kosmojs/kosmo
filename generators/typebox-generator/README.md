# @kosmojs/typebox-generator

Runtime validation schemas for KosmoJS, built on TypeBox.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Runs whenever a route declares validation targets; there is nothing to enable.

## Generates

TypeBox schemas derived from the TypeScript types declared on each route, plus validation error handling.

## Notes

Resolves types from source (`resolveTypes`), so the tuple brackets in a params or response declaration must be written literally -
hiding them behind a named alias produces no schema at all.

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

- [Validation intro](https://kosmojs.dev/validation/intro.html)
- [Gotchas](https://kosmojs.dev/validation/gotchas.html)

## License

MIT
