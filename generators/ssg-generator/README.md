# @kosmojs/ssg-generator

Static site generation for KosmoJS source folders.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Fills the `ssg` slot. Selected with:

```ts
// kosmo.config.ts
frontend: { stack: "react", ssg: true }
```

## Generates

`lib/ssg.ts` and the prerender route table.

## Notes

Implies SSR. Dynamic routes need a `staticParams` export built with `defineStaticParams` from `_/core`.

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

- [SSG](https://kosmojs.dev/frontend/static-site-generation.html)

## License

MIT
