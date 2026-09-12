# @kosmojs/ssr-generator

Server-side rendering for KosmoJS source folders.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Fills the `ssr` slot. Selected with:

```ts
// kosmo.config.ts
frontend: { stack: "react", ssr: true }
```

## Generates

`lib/ssr.ts`, the SSR route table and the server bundle entry.

## Notes

Added on top of a frontend generator, which supplies the actual render calls.
Streaming is available for React, SolidJS and Vue; Svelte and MDX render to a string.

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

- [SSR](https://kosmojs.dev/frontend/server-side-render.html)
- [Configuration](https://kosmojs.dev/essentials/config.html)

## License

MIT
