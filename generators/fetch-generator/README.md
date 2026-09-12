# @kosmojs/fetch-generator

Typed isomorphic fetch clients for KosmoJS backends.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Fills the `fetch` slot. Added automatically to any source folder that has a backend.

## Generates

the `_/fetch` alias - one client per API route, plus `path`/`href` URL builders and the SSR transport.

## Notes

The same client works in both directions: in-process during SSR, over the network in the browser.
`ResponseT` entries exist only for handlers that declare a `response` target.

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

- [Fetch intro](https://kosmojs.dev/fetch/intro.html)
- [Isomorphic clients](https://kosmojs.dev/fetch/isomorphic-clients.html)

## License

MIT
