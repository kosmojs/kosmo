---
title: Custom Templates
description: >-
    Override the seeded route and use.ts boilerplate for specific API routes
    with a directory of template files, matched by glob pattern.
    Seed consistent CRUD endpoints across many routes in Hono, H3 and Koa.
head:
  - - meta
    - name: keywords
      content: api route templates, defineRoute template, crud seeding, route patterns,
        glob matching, hono templates, h3 templates, koa templates, batch route generation
---

Every backend generator accepts a `templates` option.
When you create a new route whose name matches one of your patterns,
**your** boilerplate is written into it instead of the built-in placeholder.

A template is a directory holding two files, one for each file a route folder seeds:

| Template | Seeds |
|---|---|
| `index.tpl` | the route's `index.ts` |
| `use.tpl` | a [use.ts](/backend/cascading-middleware) in the route's folder |

Each file is optional: a file the directory does not hold gets the built-in boilerplate.
A directory with only a `use.tpl`, say, seeds middleware and leaves routes to the default.

## Configuration

Keep the template directories next to the source folder's `kosmo.config.ts`:

```txt
src/app/
  kosmo.config.ts
  templates/
    crud/
      index.tpl
    reports/
      index.tpl
      use.tpl
```

Then point route-name patterns at them from the `backend` block of that `kosmo.config.ts`.
Paths are relative to the `kosmo.config.ts` itself:

```ts [kosmo.config.ts]
import { defineConfig } from "@kosmojs/dev";

export default defineConfig({
  backend: {
    stack: "hono",
    base: "/api",
    templates: {
      "crud/**": "templates/crud",
      "reports/**": "templates/reports",
    },
  },
});
```

Keys match the **route name** - the path relative to `api/`, without the trailing file name.
So `api/crud/users/index.ts` and `api/crud/users/use.ts` are both matched as `crud/users`.

Templates shared by several source folders can live outside `src/`:
`../../templates/crud` reaches `templates/crud` at the project root.

> **Templates only fill blank files.**
Boilerplate is written into a file **only when that file is empty**,
so changing a template does not retroactively rewrite existing routes.
To re-seed one, empty the file and it will be filled again.

## Pattern Syntax

Patterns are [picomatch](https://github.com/micromatch/picomatch) globs matched against the route name.

### Single-depth wildcard (`*`)

```ts
{ "crud/*": "templates/crud" }
```

**Matches:** `crud/users`, `crud/settings`, `crud/[id]`
**Excludes:** `crud/users/roles` (too deep), `crud` (too shallow)

### Multi-depth wildcard (`**`)

```ts
{ "crud/**": "templates/crud" }
```

**Matches:** `crud/users`, `crud/users/roles`, `crud/[id]/audit` - any depth.

### Exact match

```ts
{ "health": "templates/health" }
```

### Parameter segments are literal

Route parameters are escaped before matching, so `[id]`, `{id}` and `{...path}` mean
themselves rather than glob syntax:

```ts
{
  // required parameter
  "users/[id]": "templates/user",
  // optional parameter
  "products/{category}": "templates/product",
  // splat parameter
  "docs/{...path}": "templates/docs",
  // combined
  "shop/[category]/{sub}": "templates/shop",
}
```

## Resolution Priority

The **first matching pattern wins**, in the order the keys are written - so order them most specific first:

```ts
templates: {
  // exact
  "crud/audit": "templates/audit",
  // one level
  "crud/*": "templates/crud",
  // everything else
  "**": "templates/default",
}
```

A route matching nothing gets the built-in placeholder.
Set `"**"` to replace that default everywhere.

::: warning Numeric-looking patterns jump the queue
JavaScript objects order integer-like keys first, regardless of where you wrote them - so
a pattern such as `"2024/**"` is hoisted to the front and matches before anything above
it. Prefix it with `./` to keep your written order: `"./2024/**"`.
The `./` is stripped before matching.

The same applies to [renderMode](/frontend/server-side-render#selecting-the-render-mode), which uses the same resolver.
:::

## Template Files

A template file holds the seeded file as you want it.
It is rendered with Handlebars, with the route entry itself as the context,
so a <code v-pre>{{name}}</code> placeholder interpolates the route name.
That is what keeps the [route-name type argument](/backend/intro#the-route-name-type-argument)
correct in seeded files.

### index.tpl

```ts [templates/crud/index.tpl]
import { defineRoute } from "_/api";

export default defineRoute<"{{name}}">(({ GET, POST, PUT, DELETE }) => [
  GET(async (ctx) => { /* list or read */ }),
  POST(async (ctx) => { /* create */ }),
  PUT(async (ctx) => { /* update */ }),
  DELETE(async (ctx) => { /* delete */ }),
]);
```

Because the context API differs by backend, so does the boilerplate:

:::tabs key:backend variant:code
== Hono
```ts
// Hono: templates/crud/index.tpl
import { defineRoute } from "_/api";

export default defineRoute<"{{name}}">(({ GET }) => [
  GET(async (ctx) => {
    // Always `return` the response
    return ctx.json({ ok: true });
  }),
]);
```

== H3
```ts
// H3: templates/crud/index.tpl
import { defineRoute } from "_/api";

export default defineRoute<"{{name}}">(({ GET }) => [
  GET(async (event) => {
    // return the value directly - objects serialize as JSON
    return { ok: true };
  }),
]);
```

== Koa
```ts
// Koa: templates/crud/index.tpl
import { defineRoute } from "_/api";

export default defineRoute<"{{name}}">(({ GET }) => [
  GET(async (ctx) => {
    ctx.body = { ok: true };
  }),
]);
```
:::

### use.tpl

A `use.tpl` seeds a `use.ts` created in a matching route folder,
so one pattern can seed a route and the middleware around it.

It should keep the `UseT` export, even when empty:
every `use.ts` in an `api/` subfolder is expected to export it.

## Seeding CRUD Endpoints

This is where route templates earn their place. Standing up endpoints for a dozen
database tables means writing the same skeleton a dozen times -
validation targets, method handlers, error shape, all identical apart from the type.

Write it once:

```ts [templates/resource/index.tpl]
import { defineRoute } from "_/api";
import type { Resource, ResourcePayload } from "./types";

export default defineRoute<"{{name}}">(({ GET, POST }) => [
  GET<{
    query: { page?: number; limit?: number },
    response: [200, "json", Array<Resource>],
  }>(async (ctx) => {
    // list
  }),

  POST<{
    json: ResourcePayload,
    response: [201, "json", Resource],
  }>(async (ctx) => {
    // create
  }),
]);
```

```ts [kosmo.config.ts]
export default defineConfig({
  backend: {
    stack: "hono",
    base: "/api",
    templates: { "crud/**": "templates/resource" },
  },
});
```

Then create the route folders. Each new `index.ts` arrives with the right structure - typed handlers, declared `response`
(so the [fetch client is typed](/fetch/type-safety#without-a-response-the-result-is-unknown) and OpenAPI picks it up),
ready to adapt instead of retyped.

Pair it with a colocated `types.ts` per route folder and the skeleton stays honest:
the template references `./types`, and each route defines its own.

## Common Use Cases

```ts
backend: {
  stack: "hono",
  base: "/api",
  templates: {
    // consistent crud endpoints
    "crud/**": "templates/crud",
    // signature verification + 200 fast
    "webhooks/**": "templates/webhook",
    // runtimeValidation: false, trusted callers
    "internal/**": "templates/internal",
  },
}
```
