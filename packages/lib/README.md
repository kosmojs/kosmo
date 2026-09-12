# @kosmojs/lib

Internal toolkit shared by the CLI and the generators.

## Scope

Published because [`@kosmojs/cli`](https://www.npmjs.com/package/@kosmojs/cli),
[`@kosmojs/dev`](https://www.npmjs.com/package/@kosmojs/dev) and the generators depend on it - **not** intended for direct use.
It carries no stability guarantee across releases and can change shape in a patch.

It holds the pieces those packages need in common: TypeScript AST helpers for resolving validation types,
the generator base and file-deployment helpers, path and route utilities, the Handlebars render layer, and Vite helpers.

If you are writing a generator, depend on the documented contract in `@kosmojs/core/generators` instead.

## Documentation

- [Why code generation](https://kosmojs.dev/essentials/why-codegen.html)

Full documentation at [kosmojs.dev](https://kosmojs.dev).

## License

MIT
