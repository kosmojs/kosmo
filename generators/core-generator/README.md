# @kosmojs/core-generator

Baseline file generation shared by every KosmoJS generator.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Always active - every build runs it first.

## Generates

`lib/core/` (config, types, route mapper, SSR helpers), `env.d.ts`, `global.d.ts`, `index.html` and the `lib/.gitignore`.

## Notes

Also emits stubs for files other generators own, so cross-generator imports stay resolvable when a specialised generator is not part of the build.

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

- [Project structure](https://kosmojs.dev/essentials/project-structure.html)

## License

MIT
