# @kosmojs/openapi-generator

OpenAPI specification generation for KosmoJS backends.

> **Internal package.** Not published to npm and not installed directly.
> It reaches your project as a dependency of [`@kosmojs/dev`](../../packages/dev),
> which decides at build time which generators to run.

Selected with:

```ts
// kosmo.config.ts
openapi: { /* ... */ }
```

## Generates

a specification derived from route definitions and their declared validation targets. Template-free - it builds the document directly.

## Notes

Resolves types from source (`resolveTypes`). A route contributes a documented response only when its handler declares a `response` target.

## Documentation

- [OpenAPI](https://kosmojs.dev/openapi.html)

## License

MIT
