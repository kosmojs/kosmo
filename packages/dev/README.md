# @kosmojs/dev

Wires KosmoJS into Vite and runs the generators that produce `lib/`.

## Installation

Added to your project automatically by `npm create kosmo`.

To add it by hand:

```sh
npm install -D @kosmojs/dev
```

## What it does

Watches each source folder and regenerates its `lib/` directory as routes,
middleware and validation types change - the typed fetch clients, the route tables,
the framework entry points, the `_/` aliases.

It also hosts the generators. Every framework integration ships as a separate
package under [`generators/`](https://github.com/kosmojs/kosmo/tree/main/generators),
and they arrive as dependencies of this package rather than of your project,
so a project's `package.json` stays short no matter how many stacks it uses.

Which generators run is decided by `kosmo.config.ts`:

```ts
export default defineConfig({
  frontend: { stack: "react", base: "/" },
  backend: { stack: "hono", base: "/api" },
});
```

## Notes

`lib/` is generated output. It is gitignored, safe to delete, and rebuilt on the next run -
never edit it or import from it by relative path.

There is no `vite.config.ts` in a KosmoJS project.
Vite's `UserConfig` goes in the `viteConfig` key of the `frontend` and `backend` blocks,
and the stack plugin is supplied by the generator, so adding it yourself to `viteConfig.plugins` runs the transform twice.

## Documentation

- [Configuration](https://kosmojs.dev/essentials/config.html)
- [Why code generation](https://kosmojs.dev/essentials/why-codegen.html)

Full documentation at [kosmojs.dev](https://kosmojs.dev).

## License

MIT
