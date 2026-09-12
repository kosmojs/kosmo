# @kosmojs/core

The only KosmoJS package your application code imports at runtime.

## Installation

Added to your project automatically by `npm create kosmo`.

To add it by hand:

```sh
npm install @kosmojs/core
```

## Entry points

| Import | Holds |
|---|---|
| `@kosmojs/core` | shared runtime types and constants |
| `@kosmojs/core/api` | backend primitives shared by the Hono, H3 and Koa integrations |
| `@kosmojs/core/fetch` | the runtime behind generated fetch clients |
| `@kosmojs/core/errors` | `HTTPError`, `ValidationError` |
| `@kosmojs/core/generators` | the generator contract, for building your own |

In day-to-day work you rarely import from here directly.
Routes, middleware and fetch clients are reached through the generated `_/` aliases of the source folder you are in -
`_/api`, `_/fetch`, `_/router` - which are typed against this package.

The exception is errors:

```ts
import { HTTPError } from "@kosmojs/core/errors";

// a single [status, message] tuple, not two arguments
throw new HTTPError([404, "Not found"]);
```

## Documentation

- [Type safety](https://kosmojs.dev/backend/type-safety.html)
- [Error handling](https://kosmojs.dev/backend/error-handling.html)

Full documentation at [kosmojs.dev](https://kosmojs.dev).

## License

MIT
