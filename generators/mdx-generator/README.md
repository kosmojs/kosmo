# @kosmojs/mdx-generator

MDX content-page integration for KosmoJS.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Fills the `frontend` slot. Selected with:

```ts
// kosmo.config.ts
frontend: { stack: "mdx" }
```

## Generates

`app.mdx`, `router.ts`, `components/mdx.ts`, `components/Link.tsx`, `entry/client`,
page samples, and the `_/router`, `_/app` and `_/use` aliases.

## Notes

`router.ts` passes a `components` map to `createRouters` alongside the app,
so MDXProvider overrides apply to every page. Renders to string only - no streaming SSR.

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

- [MDX](https://kosmojs.dev/frontend/mdx.html)
- [Frontend intro](https://kosmojs.dev/frontend/intro.html)

## License

MIT
